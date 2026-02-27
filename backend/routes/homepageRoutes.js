const express = require('express');
const router = express.Router();
const { getSection, updateSection } = require('../controllers/homepageController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public: fetch destinations or attractions
router.get('/:type', getSection);

// Admin only: update destinations or attractions
router.put('/:type', protect, admin, updateSection);

module.exports = router;