const User = require('../models/User');
const Experience = require('../models/Experience');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Testimonial = require('../models/Testimonial');

// @desc    Get Admin Dashboard Stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getAdminStats = async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const experienceCount = await Experience.countDocuments();
        const bookingCount = await Booking.countDocuments();

        // Calculate Total Revenue from confirmed bookings
        const bookings = await Booking.find({ paymentStatus: 'paid' });
        const totalRevenue = bookings.reduce((acc, item) => acc + item.totalPrice, 0);

        res.json({
            userCount,
            experienceCount,
            bookingCount,
            totalRevenue,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all vendors (filtered by verification status)
// @route   GET /api/admin/vendors
// @access  Private/Admin
const getAllVendors = async (req, res) => {
    try {
        const { status } = req.query; // 'pending' or 'verified'

        let query = { role: 'vendor' };

        if (status === 'pending') {
            query.isVerified = false;
        } else if (status === 'verified') {
            query.isVerified = true;
        }

        const vendors = await User.find(query).select('-password');
        res.json(vendors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get vendor details with stats
// @route   GET /api/admin/vendors/:id
// @access  Private/Admin
const getVendorDetails = async (req, res) => {
    try {
        const vendor = await User.findById(req.params.id).select('-password');

        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        // Get Experience Stats
        const experiences = await Experience.find({ vendor: req.params.id });

        // Get Booking Stats
        // Find all bookings for experiences owned by this vendor
        const experienceIds = experiences.map(exp => exp._id);
        const bookings = await Booking.find({ experience: { $in: experienceIds } });

        const totalRevenue = bookings
            .filter(b => b.paymentStatus === 'paid')
            .reduce((acc, b) => acc + b.totalPrice, 0);

        const totalBookings = bookings.length;
        // Total users served (unique users who booked)
        const uniqueCustomers = new Set(bookings.map(b => b.user.toString())).size;

        res.json({
            vendor,
            stats: {
                totalExperiences: experiences.length,
                totalBookings,
                totalRevenue,
                totalCustomers: uniqueCustomers
            },
            experiences
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all users (travelers, vendors, admins)
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user verification or activation status
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
const updateUserStatus = async (req, res) => {
    try {
        const { isVerified, isActive } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (typeof isVerified !== 'undefined') {
            user.isVerified = isVerified;
        }

        if (typeof isActive !== 'undefined') {
            user.isActive = isActive;
        }

        const updatedUser = await user.save();
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update vendor verification or activation status
// @route   PUT /api/admin/vendors/:id/status
// @access  Private/Admin
const updateVendorStatus = updateUserStatus; // Alias for backward compatibility




// @desc    Get user details and all their bookings (360 view)
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUserDetails = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const bookings = await Booking.find({ user: req.params.id })
            .populate({
                path: 'experience',
                select: 'title images location price category vendor',
                populate: { path: 'vendor', select: 'name email vendorDetails' }
            })
            .sort({ createdAt: -1 });

        const reviews = await Review.find({ user: req.params.id })
            .populate('experience', 'title images category')
            .sort({ createdAt: -1 });

        // Calculate user specific stats
        const totalSpent = bookings.reduce((acc, b) => acc + (b.paymentStatus === 'paid' ? b.totalPrice : 0), 0);
        const activeBookings = bookings.filter(b => b.status !== 'cancelled' && b.status !== 'completed').length;
        const totalBookings = bookings.length;

        res.json({
            user,
            bookings,
            reviews,
            stats: {
                totalSpent,
                activeBookings,
                totalBookings,
                totalReviews: reviews.length
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all experiences (with status filter)
// @route   GET /api/admin/experiences
// @access  Private/Admin
const getAllExperiences = async (req, res) => {
    try {
        const { status } = req.query;

        let query = {};
        if (status) {
            query.status = status;
        }

        const experiences = await Experience.find(query)
            .populate('vendor', 'name email')
            .sort({ createdAt: -1 });

        res.json(experiences);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify/Reject Experience
// @route   PUT /api/admin/experiences/:id/verify
// @access  Private/Admin
const verifyExperience = async (req, res) => {
    try {
        const { status } = req.body; // 'approved' or 'rejected'
        const experience = await Experience.findById(req.params.id);

        if (!experience) {
            return res.status(404).json({ message: 'Experience not found' });
        }

        if (status) {
            experience.status = status;
            experience.isActive = status === 'approved'; // Auto-activate if approved

            if (status === 'approved') {
                experience.lastApprovedSnapshot = null;
            }
        }

        const updatedExperience = await experience.save();
        res.json(updatedExperience);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



// @desc    Get all bookings (Global Oversight)
// @route   GET /api/admin/bookings
// @access  Private/Admin
const getAllBookings = async (req, res) => {
    try {
        const { status, paymentStatus } = req.query;

        let query = {};
        if (status) {
            query.status = status;
        }
        if (paymentStatus) {
            query.paymentStatus = paymentStatus;
        }

        const bookings = await Booking.find(query)
            .populate('user', 'name email')
            .populate({
                path: 'experience',
                select: 'title vendor',
                populate: { path: 'vendor', select: 'name email' }
            })
            .sort({ createdAt: -1 });

        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// @desc    Admin: Create a review on behalf of a user
// @route   POST /api/admin/reviews
// @access  Private/Admin
const createAdminReview = async (req, res) => {
    try {
        const { userId, experienceId, rating, comment } = req.body;
        if (!userId || !experienceId || !rating || !comment) {
            return res.status(400).json({ message: 'All fields (userId, experienceId, rating, comment) are required' });
        }
        const existing = await Review.findOne({ user: userId, experience: experienceId });
        if (existing) {
            return res.status(400).json({ message: 'A review for this experience already exists for the user' });
        }
        const review = await Review.create({ user: userId, experience: experienceId, rating, comment });
        const populated = await review.populate('experience', 'title images category');
        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin: Edit an existing review
// @route   PUT /api/admin/reviews/:id
// @access  Private/Admin
const updateAdminReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ message: 'Review not found' });
        const { rating, comment } = req.body;
        if (rating) review.rating = rating;
        if (comment) review.comment = comment;
        const updated = await review.save();
        const populated = await updated.populate('experience', 'title images category');
        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin: Delete a review
// @route   DELETE /api/admin/reviews/:id
// @access  Private/Admin
const deleteAdminReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ message: 'Review not found' });
        await review.deleteOne();
        res.json({ message: 'Review deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// ─── Testimonials (Admin-Curated, Public Display) ───────────────────────────

// @desc    Get all testimonials
// @route   GET /api/admin/testimonials  (admin) | GET /api/testimonials (public)
// @access  Public / Admin
const getTestimonials = async (req, res) => {
    try {
        const filter = req.user?.role === 'admin' ? {} : { isActive: true };
        const testimonials = await Testimonial.find(filter).sort({ displayOrder: 1, createdAt: -1 });
        res.json(testimonials);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// @desc    Create a testimonial
// @route   POST /api/admin/testimonials
// @access  Private/Admin
const createTestimonial = async (req, res) => {
    try {
        const t = await Testimonial.create(req.body);
        res.status(201).json(t);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// @desc    Update a testimonial
// @route   PUT /api/admin/testimonials/:id
// @access  Private/Admin
const updateTestimonial = async (req, res) => {
    try {
        const t = await Testimonial.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!t) return res.status(404).json({ message: 'Testimonial not found' });
        res.json(t);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// @desc    Delete a testimonial
// @route   DELETE /api/admin/testimonials/:id
// @access  Private/Admin
const deleteTestimonial = async (req, res) => {
    try {
        const t = await Testimonial.findByIdAndDelete(req.params.id);
        if (!t) return res.status(404).json({ message: 'Testimonial not found' });
        res.json({ message: 'Testimonial deleted' });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = {
    getAdminStats,
    getAllVendors,
    getVendorDetails,
    updateVendorStatus,
    getAllUsers,
    getUserDetails,
    updateUserStatus,
    getAllExperiences,
    verifyExperience,
    getAllBookings,
    createAdminReview,
    updateAdminReview,
    deleteAdminReview,
    getTestimonials,
    createTestimonial,
    updateTestimonial,
    deleteTestimonial
};
