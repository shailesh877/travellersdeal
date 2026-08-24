const User = require('../models/User');
const Experience = require('../models/Experience');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Testimonial = require('../models/Testimonial');
const AppSettings = require('../models/AppSettings');
const sendEmail = require('../utils/sendEmail');

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

        const experiencesWithStats = experiences.map(exp => {
            const expBookings = bookings.filter(b => b.experience.toString() === exp._id.toString());
            const expRevenue = expBookings
                .filter(b => b.paymentStatus === 'paid')
                .reduce((acc, b) => acc + b.totalPrice, 0);
            
            return {
                ...exp.toObject(),
                totalBookings: expBookings.length,
                totalRevenue: expRevenue
            };
        });

        res.json({
            vendor,
            stats: {
                totalExperiences: experiences.length,
                totalBookings,
                totalRevenue,
                totalCustomers: uniqueCustomers
            },
            experiences: experiencesWithStats
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
                select: 'title images location pricingCategories category vendor',
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
        const experience = await Experience.findById(req.params.id).populate('vendor', 'isVerified');

        if (!experience) {
            return res.status(404).json({ message: 'Experience not found' });
        }

        if (status === 'approved' && !experience.vendor?.isVerified) {
            return res.status(400).json({ message: 'Please verify the vendor first before approving their experience.' });
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

// @desc    Update Experience details (admin) - e.g., for rating
// @route   PUT /api/admin/experiences/:id
// @access  Private/Admin
const updateExperience = async (req, res) => {
    try {
        const { rating, numReviews } = req.body;
        
        let updateData = {};
        if (rating !== undefined && !isNaN(rating)) {
            updateData.rating = rating;
            updateData.averageRating = rating;
        }
        if (numReviews !== undefined && !isNaN(numReviews)) {
            updateData.numReviews = numReviews;
            updateData.reviewsCount = numReviews;
        }

        const experience = await Experience.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        );

        if (!experience) {
            return res.status(404).json({ message: 'Experience not found' });
        }

        res.json(experience);
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

// ─── App Settings (Store Links) ─────────────────────────────────────────────

// @desc    Get app settings (public — store links)
// @route   GET /api/admin/settings
// @access  Public
const getAppSettings = async (req, res) => {
    try {
        let settings = await AppSettings.findOne({ key: 'global' });
        if (!settings) {
            settings = await AppSettings.create({ key: 'global' });
        }
        res.json(settings);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// @desc    Update app settings (admin)
// @route   PUT /api/admin/settings
// @access  Private/Admin
const updateAppSettings = async (req, res) => {
    try {
        const { playStoreUrl, appStoreUrl, feedbackUrl } = req.body;
        const settings = await AppSettings.findOneAndUpdate(
            { key: 'global' },
            { playStoreUrl, appStoreUrl, feedbackUrl },
            { new: true, upsert: true }
        );
        res.json(settings);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// @desc    Get all admins
// @route   GET /api/admin/admins
// @access  Private/SuperAdmin
const getAdmins = async (req, res) => {
    try {
        const admins = await User.find({ role: 'admin' }).select('-password');
        res.json(admins);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new admin
// @route   POST /api/admin/admins
// @access  Private/SuperAdmin
const createAdmin = async (req, res) => {
    try {
        const { name, email, password, adminPermissions } = req.body;

        let adminUser = await User.findOne({ email });
        let isNewUser = false;
        
        if (adminUser) {
            if (adminUser.role === 'admin') {
                return res.status(400).json({ message: 'Email ID is already registered as an Admin. Use Edit to change permissions.' });
            }
            // User exists, upgrade them to admin
            adminUser.name = name;
            adminUser.role = 'admin';
            adminUser.isSuperAdmin = false;
            adminUser.adminPermissions = adminPermissions || [];
            adminUser.isActive = true;
            if (password) adminUser.password = password; // pre-save will hash
        } else {
            // Create a new user instance (but don't save yet)
            isNewUser = true;
            adminUser = new User({
                name,
                email,
                password,
                role: 'admin',
                isSuperAdmin: false,
                adminPermissions: adminPermissions || [],
                isVerified: true,
                isActive: true
            });
        }

        // Map permission IDs to readable labels for the email
        const PERMISSIONS_LABELS = {
            'stats': 'Dashboard',
            'users': 'Users Management',
            'bookings': 'Booking Ledger',
            'content': 'Pending Experiences',
            'rejected': 'Rejected Experiences',
            'active-experiences': 'Active Experiences',
            'pending': 'Pending Vendors',
            'verified': 'Active Vendors',
            'homepage': 'Homepage Sections',
            'applinks': 'App Store Links',
            'testimonials': 'Testimonials'
        };

        const readablePermissions = (adminPermissions || []).map(p => PERMISSIONS_LABELS[p] || p).join('\n- ');
        
        const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/login`;

        const message = `Welcome to Travellers Deal Admin Panel!

You have been added as an administrator by the Super Admin.
Here are your login details:

Name: ${name}
Email: ${email}
Password: ${password || '(Your existing password or one provided by Super Admin)'}

You have been granted access to the following sections:
- ${readablePermissions || 'No specific sections (Read-only or restricted)'}

Please log in at: ${loginUrl}

Note: For security reasons, please consider changing your password after your first login.`;

        try {
            await sendEmail({
                email: adminUser.email,
                subject: 'Welcome to Travellers Deal - Admin Access Granted',
                message,
            });
        } catch (emailError) {
            console.error('Failed to send welcome email to admin:', emailError);
            return res.status(400).json({ message: 'Invalid email address or failed to send email. Admin was NOT registered.' });
        }

        // If email sent successfully, save the user to the database
        await adminUser.save();

        res.status(isNewUser ? 201 : 200).json({
            _id: adminUser._id,
            name: adminUser.name,
            email: adminUser.email,
            role: adminUser.role,
            isSuperAdmin: adminUser.isSuperAdmin,
            adminPermissions: adminUser.adminPermissions
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update an admin's permissions
// @route   PUT /api/admin/admins/:id
// @access  Private/SuperAdmin
const updateAdmin = async (req, res) => {
    try {
        const { adminPermissions, password, name, email, isActive } = req.body;
        const adminUser = await User.findById(req.params.id);

        if (!adminUser || adminUser.role !== 'admin') {
            return res.status(404).json({ message: 'Admin not found' });
        }

        if (adminUser.isSuperAdmin && req.user._id.toString() !== adminUser._id.toString()) {
            return res.status(403).json({ message: 'You cannot edit another Super Admin' });
        }

        if (name) adminUser.name = name;
        if (email) adminUser.email = email;
        if (adminPermissions) adminUser.adminPermissions = adminPermissions;
        if (isActive !== undefined) adminUser.isActive = isActive;
        if (password) adminUser.password = password; // Will be hashed by pre-save middleware

        await adminUser.save();

        res.json({
            _id: adminUser._id,
            name: adminUser.name,
            email: adminUser.email,
            role: adminUser.role,
            isSuperAdmin: adminUser.isSuperAdmin,
            adminPermissions: adminUser.adminPermissions,
            isActive: adminUser.isActive
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
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
    updateExperience,
    getAllBookings,
    createAdminReview,
    updateAdminReview,
    deleteAdminReview,
    getTestimonials,
    createTestimonial,
    updateTestimonial,
    deleteTestimonial,
    getAppSettings,
    updateAppSettings,
    getAdmins,
    createAdmin,
    updateAdmin
};
