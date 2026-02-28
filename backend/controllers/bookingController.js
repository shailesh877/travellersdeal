const Booking = require('../models/Booking');
const Experience = require('../models/Experience');

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
    const { experienceId, date, slots, timeSlot, paymentStatus, paymentId } = req.body;

    try {
        const experience = await Experience.findById(experienceId);

        if (!experience) {
            return res.status(404).json({ message: 'Experience not found' });
        }

        const totalPrice = experience.price * slots;

        const booking = new Booking({
            user: req.user._id,
            experience: experienceId,
            date,
            timeSlot,
            slots,
            totalPrice,
            status: 'pending',
            paymentStatus: paymentStatus || 'pending',
            paymentId: paymentId || null,
        });

        const createdBooking = await booking.save();
        res.status(201).json(createdBooking);
    } catch (error) {
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
            'title price images itinerary location duration'
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

        // Find bookings for these experiences
        const bookings = await Booking.find({
            experience: { $in: experienceIds },
        })
            .populate('user', 'name email')
            .populate('experience', 'title');

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

        // Verify that the logged-in user is the vendor of this experience
        if (booking.experience.vendor.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to update this booking' });
        }

        booking.status = status;
        const updatedBooking = await booking.save();

        res.json(updatedBooking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createBooking, getMyBookings, getVendorBookings, updateBookingStatus, cancelMyBooking };
