const User = require('../models/User');

// @desc    Get user wishlist
// @route   GET /api/users/wishlist
// @access  Private
const getWishlist = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('wishlist');

        // Filter out nulls (deleted experiences)
        const activeWishlist = user.wishlist.filter(item => item !== null);

        // If we found nulls, meaning some experiences were deleted, let's update the user
        if (activeWishlist.length !== user.wishlist.length) {
            user.wishlist = activeWishlist;
            await user.save();
        }

        res.json(activeWishlist);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add to wishlist
// @route   POST /api/users/wishlist/:id
// @access  Private
const addToWishlist = async (req, res) => {
    try {
        const experienceId = req.params.id;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $addToSet: { wishlist: experienceId } },
            { new: true }
        ).populate('wishlist');

        const activeWishlist = user.wishlist.filter(item => item !== null);

        if (activeWishlist.length !== user.wishlist.length) {
            user.wishlist = activeWishlist;
            await user.save();
        }

        res.json(activeWishlist);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Remove from wishlist
// @route   DELETE /api/users/wishlist/:id
// @access  Private
const removeFromWishlist = async (req, res) => {
    try {
        const experienceId = req.params.id;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $pull: { wishlist: experienceId } },
            { new: true }
        ).populate('wishlist');

        const activeWishlist = user.wishlist.filter(item => item !== null);

        if (activeWishlist.length !== user.wishlist.length) {
            user.wishlist = activeWishlist;
            await user.save();
        }

        res.json(activeWishlist);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update vendor profile (specific to vendors, e.g., bank details)
// @route   PUT /api/users/vendor/profile
// @access  Private
const updateVendorProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'vendor' && user.role !== 'admin') {
            return res.status(403).json({ message: 'Only vendors or admins can update this profile section' });
        }

        const { vendorDetails } = req.body;

        // If vendor details are provided, update them
        if (vendorDetails) {
            user.vendorDetails = {
                ...user.vendorDetails,
                ...vendorDetails
            };
        }

        const updatedUser = await user.save();
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            vendorDetails: updatedUser.vendorDetails,
            isVerified: updatedUser.isVerified,
            isActive: updatedUser.isActive,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user profile (name, email, phone)
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const { name, email, phone } = req.body;

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (name) user.name = name;
        if (email) user.email = email;
        if (phone !== undefined) user.phone = phone;

        await user.save();

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Please provide current and new password' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    updateVendorProfile,
    getProfile,
    updateProfile,
    changePassword,
};
