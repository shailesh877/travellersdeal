const Cart = require('../models/Cart');
const Experience = require('../models/Experience');

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user._id }).populate({
            path: 'items.experience',
            populate: { path: 'vendor', select: 'isVerified' }
        });

        if (!cart) {
            // Create empty cart if doesn't exist
            cart = await Cart.create({ user: req.user._id, items: [] });
        }

        // Filter for display (only approved, active, and verified vendor)
        const validItems = cart.items.filter(item => {
            const exp = item.experience;
            return exp && exp.status === 'approved' && exp.isActive && exp.vendor?.isVerified;
        });

        res.json({
            items: validItems,
            total: cart.getTotal(),
            itemCount: cart.getItemCount()
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
const addToCart = async (req, res) => {
    try {
        const { experienceId, quantity = 1, date, timeSlot, priceAtAdd, currency } = req.body;

        // Validate experience exists
        const experience = await Experience.findById(experienceId);
        if (!experience) {
            return res.status(404).json({ message: 'Experience not found' });
        }

        // Calculate fallback price if not provided
        let calculatedPrice = priceAtAdd || 0;
        if (!priceAtAdd && experience.bookingOptions && experience.bookingOptions.length > 0) {
            const opt = experience.bookingOptions[0];
            calculatedPrice = opt.availabilityAndPricing?.pricingTiers?.length > 0 
                ? opt.availabilityAndPricing.pricingTiers[0].price 
                : (opt.availabilityAndPricing?.price || 0);
        }

        // Replace entire cart using findOneAndUpdate to guarantee atomic update
        const updatedCart = await Cart.findOneAndUpdate(
            { user: req.user._id },
            {
                $set: {
                    items: [{
                        experience: experienceId,
                        quantity,
                        date: date || new Date(),
                        timeSlot: timeSlot || '10:00 AM',
                        priceAtAdd: calculatedPrice,
                        currency: currency || experience.currency || 'USD'
                    }]
                }
            },
            { upsert: true, new: true }
        ).populate('items.experience');

        res.json({
            items: updatedCart.items,
            total: updatedCart.getTotal(),
            itemCount: updatedCart.getItemCount()
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:itemId
// @access  Private
const updateCartItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { quantity } = req.body;

        if (quantity < 1) {
            return res.status(400).json({ message: 'Quantity must be at least 1' });
        }

        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const item = cart.items.id(itemId);
        if (!item) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        item.quantity = quantity;
        await cart.save();
        await cart.populate('items.experience');

        res.json({
            items: cart.items,
            total: cart.getTotal(),
            itemCount: cart.getItemCount()
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
// @access  Private
const removeFromCart = async (req, res) => {
    try {
        const { itemId } = req.params;

        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        cart.items = cart.items.filter(item => item._id.toString() !== itemId);
        await cart.save();
        await cart.populate('items.experience');

        res.json({
            items: cart.items,
            total: cart.getTotal(),
            itemCount: cart.getItemCount()
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        cart.items = [];
        await cart.save();

        res.json({
            items: [],
            total: 0,
            itemCount: 0,
            message: 'Cart cleared successfully'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
};
