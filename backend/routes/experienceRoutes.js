const express = require('express');
const router = express.Router();
const {
    getExperiences,
    getExperienceById,
    createExperience,
    updateExperience,
    deleteExperience,
    getMyExperiences,
    getAvailability,
} = require('../controllers/experienceController');
const { protect, vendor, protectOptional } = require('../middleware/authMiddleware');

router.route('/').get(getExperiences).post(protect, vendor, createExperience);
router.route('/my').get(protect, vendor, getMyExperiences);
router.get('/:id/availability', getAvailability); // Check availability
router
    .route('/:id')
    .get(protectOptional, getExperienceById)
    .put(protect, vendor, updateExperience)
    .delete(protect, vendor, deleteExperience);

module.exports = router;
