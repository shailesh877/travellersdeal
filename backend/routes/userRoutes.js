const express = require('express');
const router = express.Router();
const {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    updateVendorProfile,
} = require('../controllers/userController');
const { protect, vendor } = require('../middleware/authMiddleware');

router.get('/wishlist', protect, getWishlist);
router.post('/wishlist/:id', protect, addToWishlist);
router.delete('/wishlist/:id', protect, removeFromWishlist);
router.put('/vendor/profile', protect, vendor, updateVendorProfile);

module.exports = router;
