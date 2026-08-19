const Booking = require('../models/Booking');
const Experience = require('../models/Experience');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Cart = require('../models/Cart');
let Expo;
let expo;

async function getExpo() {
    // Polyfill for Node 18 where global File might not be defined but undici requires it
    if (typeof File === 'undefined') {
        global.File = require('buffer').File;
    }

    // Polyfill for String.prototype.toWellFormed missing in some Node 18 versions (used by undici/fetch)
    if (!String.prototype.toWellFormed) {
        String.prototype.toWellFormed = function () {
            return String(this);
        };
    }

    if (!expo) {
        const expoModule = await import('expo-server-sdk');
        Expo = expoModule.Expo;
        expo = new Expo();
    }
    return { Expo, expo };
}

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
    const { experienceId, date, slots, timeSlot, paymentStatus, paymentId, totalPrice: clientTotalPrice, tierBreakdown, travellerInfo, currency: clientCurrency } = req.body;

    try {
        // Guard against missing user (should be caught by auth middleware, but safety net)
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const experience = await Experience.findById(experienceId);

        if (!experience) {
            return res.status(404).json({ message: 'Experience not found' });
        }

        // Use totalPrice sent by client (accounts for adultCount); fallback to calculation
        const basePrice = experience.pricingCategories && experience.pricingCategories.length > 0 ? experience.pricingCategories[0].price : 0;
        const totalPrice = (clientTotalPrice != null) ? clientTotalPrice : (basePrice * (slots || 1));

        const booking = new Booking({
            user: req.user._id,
            experience: experienceId,
            date,
            timeSlot,
            slots: slots || 1,
            tierBreakdown: tierBreakdown || [],
            travellerInfo: travellerInfo || {},
            totalPrice,
            currency: clientCurrency || experience.bookingOptions?.[0]?.availabilityAndPricing?.currency || experience.currency || 'USD',
            status: 'pending',
            paymentStatus: paymentStatus || 'pending',
            paymentId: paymentId || null,
        });

        const createdBooking = await booking.save();

        // Create In-App Notification for the user
        try {
            await Notification.create({
                user: req.user._id,
                title: 'Booking Created',
                message: `Your booking for ${experience.title} has been received.`,
                type: 'booking_update',
                data: {
                    bookingId: createdBooking._id,
                    status: createdBooking.status
                }
            });
        } catch (dbErr) {
            console.error('Error saving notification to DB:', dbErr);
        }

        // Send Push Notification for the user
        try {
            if (req.user.expoPushToken) {
                const { Expo, expo } = await getExpo();

                if (Expo.isExpoPushToken(req.user.expoPushToken)) {
                    const messages = [{
                        to: req.user.expoPushToken,
                        sound: 'default',
                        title: 'Booking Successful \ud83c\udf89',
                        body: `Your booking for ${experience.title} has been placed successfully.`,
                        data: {
                            bookingId: createdBooking._id.toString(),
                            status: createdBooking.status
                        }
                    }];

                    const chunks = expo.chunkPushNotifications(messages);
                    for (const chunk of chunks) {
                        await expo.sendPushNotificationsAsync(chunk);
                    }
                }
            }
        } catch (pushError) {
            console.error('Error sending push notification:', pushError);
        }
        res.status(201).json(createdBooking);
    } catch (error) {
        console.error('createBooking error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Checkout entire cart
// @route   POST /api/bookings/cart
// @access  Private
const checkoutCart = async (req, res) => {
    const { paymentId, paymentStatus, travellerInfo, items, currency: clientCurrency } = req.body;

    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        const createdBookings = [];

        // Iterate and create bookings
        for (const item of items) {
            const experience = await Experience.findById(item.experienceId);
            if (!experience) continue;

            const booking = new Booking({
                user: req.user._id,
                experience: item.experienceId,
                date: item.date,
                timeSlot: item.timeSlot || '10:00 AM',
                slots: item.slots || 1,
                tierBreakdown: item.tierBreakdown || [],
                travellerInfo: travellerInfo || {},
                totalPrice: item.totalPrice,
                currency: item.currency || clientCurrency || experience.bookingOptions?.[0]?.availabilityAndPricing?.currency || experience.currency || 'USD',
                status: 'pending',
                paymentStatus: paymentStatus || 'pending',
                paymentId: paymentId || null,
            });

            const savedBooking = await booking.save();
            createdBookings.push(savedBooking);
        }

        // Clear the user's cart in DB
        const cart = await Cart.findOne({ user: req.user._id });
        if (cart) {
            cart.items = [];
            await cart.save();
        }

        // Send Single Push Notification for Bulk Booking
        if (createdBookings.length > 0) {
            try {
                await Notification.create({
                    user: req.user._id,
                    title: 'Cart Booking Successful',
                    message: `Your booking for ${createdBookings.length} experiences has been received.`,
                    type: 'booking_update',
                    data: { paymentId }
                });

                if (req.user.expoPushToken) {
                    const { Expo, expo } = await getExpo();
                    if (Expo.isExpoPushToken(req.user.expoPushToken)) {
                        const messages = [{
                            to: req.user.expoPushToken,
                            sound: 'default',
                            title: 'Cart Booking Successful 🎉',
                            body: `Your booking for ${createdBookings.length} experiences has been placed successfully.`,
                            data: { paymentId }
                        }];
                        const chunks = expo.chunkPushNotifications(messages);
                        for (const chunk of chunks) {
                            await expo.sendPushNotificationsAsync(chunk);
                        }
                    }
                }
            } catch (notifyError) {
                console.error('Error sending push notification for cart checkout:', notifyError);
            }
        }

        res.status(201).json({ message: 'Cart checked out successfully', bookings: createdBookings });
    } catch (error) {
        console.error('checkoutCart error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get logged in user bookings
// @route   GET /api/bookings/mybookings
// @access  Private
const getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id }).populate(
            'experience',
            'title pricingCategories images itinerary location duration currency bookingOptions'
        );
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Cancel a booking (User only)
// @route   PUT /api/bookings/:id/cancel
// @access  Private
const cancelMyBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Make sure user owns the booking
        if (booking.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'User not authorized to cancel this booking' });
        }

        // Check if booking is already cancelled
        if (booking.status === 'cancelled') {
            return res.status(400).json({ message: 'Booking is already cancelled' });
        }

        // Optionally, restrict cancellation to specific statuses
        if (booking.status !== 'pending' && booking.status !== 'confirmed') {
            return res.status(400).json({ message: 'Cannot cancel a booking that is completed or already processed' });
        }

        booking.status = 'cancelled';
        const updatedBooking = await booking.save();

        // Create In-App Notification
        try {
            await Notification.create({
                user: req.user._id,
                title: 'Booking Cancelled',
                message: `Your booking has been cancelled successfully.`,
                type: 'booking_update',
                data: {
                    bookingId: updatedBooking._id,
                    status: updatedBooking.status
                }
            });
        } catch (dbErr) {
            console.error('Error saving notification to DB:', dbErr);
        }

        // Send Push Notification
        try {
            if (req.user.expoPushToken) {
                const { Expo, expo } = await getExpo();

                if (Expo.isExpoPushToken(req.user.expoPushToken)) {
                    const messages = [{
                        to: req.user.expoPushToken,
                        sound: 'default',
                        title: 'Booking Cancelled \u274c',
                        body: `Your booking has been cancelled successfully.`,
                        data: {
                            bookingId: updatedBooking._id.toString(),
                            status: updatedBooking.status
                        }
                    }];

                    const chunks = expo.chunkPushNotifications(messages);
                    for (const chunk of chunks) {
                        await expo.sendPushNotificationsAsync(chunk);
                    }
                }
            }
        } catch (pushError) {
            console.error('Error sending push notification:', pushError);
        }

        res.json({ message: 'Booking cancelled successfully', booking: updatedBooking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get bookings for vendor experiences
// @route   GET /api/bookings/vendor
// @access  Private/Vendor
const getVendorBookings = async (req, res) => {
    try {
        // Find experiences by this vendor
        const experiences = await Experience.find({ vendor: req.user._id });
        const experienceIds = experiences.map((exp) => exp._id);

        const bookings = await Booking.find({
            experience: { $in: experienceIds },
        })
            .populate('user', 'name email')
            .populate('experience', 'title currency bookingOptions');

        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update booking status (Vendor only)
// @route   PUT /api/bookings/:id/status
// @access  Private/Vendor
const updateBookingStatus = async (req, res) => {
    const { status } = req.body;

    try {
        const booking = await Booking.findById(req.params.id).populate('experience');

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Verify vendor or admin authorization
        if (req.user.role !== 'admin' && booking.experience.vendor.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                message: 'Not authorized to update this booking'
            });
        }

        // Update booking status
        booking.status = status;
        const updatedBooking = await booking.save();

        // Create In-App Notification
        try {
            const notificationTitle = status === 'confirmed' ? 'Booking Confirmed \u2705' : (status === 'cancelled' ? 'Booking Cancelled \u274c' : 'Booking Update');
            const notificationMessage = status === 'confirmed' ? `Great news! Your booking for ${booking.experience.title} has been confirmed.` : `Your booking for ${booking.experience.title} is now ${status}.`;

            await Notification.create({
                user: booking.user,
                title: notificationTitle,
                message: notificationMessage,
                type: 'booking_update',
                data: {
                    bookingId: booking._id,
                    status: status
                }
            });
        } catch (dbErr) {
            console.error('Error saving notification to DB:', dbErr);
        }

        // Send Push Notification
        try {
            const bookingUser = await User.findById(booking.user);

            if (bookingUser && bookingUser.expoPushToken) {
                const { Expo, expo } = await getExpo();

                if (Expo.isExpoPushToken(bookingUser.expoPushToken)) {
                    const notificationTitle = status === 'confirmed' ? 'Booking Confirmed \u2705' : (status === 'cancelled' ? 'Booking Cancelled \u274c' : 'Booking Update');
                    const notificationMessage = status === 'confirmed' ? `Great news! Your booking for ${booking.experience.title} has been confirmed.` : `Your booking for ${booking.experience.title} is now ${status}.`;

                    const messages = [{
                        to: bookingUser.expoPushToken,
                        sound: 'default',
                        title: notificationTitle,
                        body: notificationMessage,
                        data: {
                            bookingId: booking._id.toString(),
                            status: status
                        }
                    }];

                    const chunks = expo.chunkPushNotifications(messages);

                    console.log('Sending push notification to:', bookingUser.expoPushToken);
                    for (const chunk of chunks) {
                        const ticket = await expo.sendPushNotificationsAsync(chunk);
                        console.log('Push notification ticket:', ticket);
                    }
                } else {
                    console.log('Invalid Expo push token:', bookingUser.expoPushToken);
                }
            } else {
                console.log('No expoPushToken found for user:', bookingUser ? bookingUser.email : 'Unknown');
            }
        } catch (pushError) {
            console.error('Error sending push notification:', pushError);
        }

        res.json(updatedBooking);

    } catch (error) {
        console.error('updateBookingStatus error:', error);
        res.status(500).json({
            message: error.message
        });
    }
};

module.exports = { createBooking, checkoutCart, getMyBookings, getVendorBookings, updateBookingStatus, cancelMyBooking };
