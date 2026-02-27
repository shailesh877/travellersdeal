const mongoose = require('mongoose');

// Admin-curated testimonials for homepage display.
// Completely separate from user reviews — not linked to any user account.
const testimonialSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        default: ''
    },
    avatar: {
        type: String,
        default: '' // URL or empty (UI will show initials)
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
        default: 5
    },
    comment: {
        type: String,
        required: true
    },
    experience: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Experience',
        default: null
    },
    experienceTitle: {
        type: String,
        default: '' // Stored separately so it shows even if experience is deleted
    },
    isVerified: {
        type: Boolean,
        default: true // Show "Verified booking" badge
    },
    isActive: {
        type: Boolean,
        default: true
    },
    displayOrder: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('Testimonial', testimonialSchema);
