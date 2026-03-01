const express = require('express');
const router = express.Router();
const {
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
    deleteTestimonial,
    getAppSettings,
    updateAppSettings,
} = require('../controllers/adminController');

const { protect, admin } = require('../middleware/authMiddleware');

router.get('/stats', protect, admin, getAdminStats);
router.get('/users', protect, admin, getAllUsers);
router.get('/users/:id', protect, admin, getUserDetails);
router.put('/users/:id/status', protect, admin, updateUserStatus);
router.get('/vendors', protect, admin, getAllVendors);
router.get('/vendors/:id', protect, admin, getVendorDetails);
router.put('/vendors/:id/status', protect, admin, updateVendorStatus);
router.get('/experiences', protect, admin, getAllExperiences);
router.put('/experiences/:id/verify', protect, admin, verifyExperience);
router.get('/bookings', protect, admin, getAllBookings);
router.post('/reviews', protect, admin, createAdminReview);
router.put('/reviews/:id', protect, admin, updateAdminReview);
router.delete('/reviews/:id', protect, admin, deleteAdminReview);

// Testimonials — admin full CRUD + public read
router.get('/testimonials', getTestimonials);          // public (also works for admin)
router.post('/testimonials', protect, admin, createTestimonial);
router.put('/testimonials/:id', protect, admin, updateTestimonial);
router.delete('/testimonials/:id', protect, admin, deleteTestimonial);

// App Settings (Store Links) — public GET, admin PUT
router.get('/settings', getAppSettings);               // public — app & website can call this
router.put('/settings', protect, admin, updateAppSettings);

module.exports = router;
