const Review = require('../models/Review');
const Experience = require('../models/Experience');
const Booking = require('../models/Booking');

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Private (Traveler only)
const createReview = async (req, res) => {
    const { rating, comment, experienceId } = req.body;

    try {
        const experience = await Experience.findById(experienceId);

        if (!experience) {
            return res.status(404).json({ message: 'Experience not found' });
        }

        // Check if user has already reviewed this experience
        const alreadyReviewed = await Review.findOne({
            user: req.user._id,
            experience: experienceId
        });

        if (alreadyReviewed) {
            return res.status(400).json({ message: 'You have already reviewed this experience' });
        }

        // Check if user has a *completed* booking for this experience
        // For testing purposes, we might allow 'confirmed' bookings too if 'completed' status isn't auto-updated yet.
        // Ideally: status: 'completed'
        const hasBooking = await Booking.findOne({
            user: req.user._id,
            experience: experienceId,
            status: { $in: ['confirmed', 'completed'] }
        });

        if (!hasBooking) {
            return res.status(403).json({ message: 'You can only review experiences you have booked.' });
        }

        const review = await Review.create({
            user: req.user._id,
            experience: experienceId,
            rating: Number(rating),
            comment,
        });

        // Update Experience rating
        const reviews = await Review.find({ experience: experienceId });
        
        const count = reviews.length;
        const avgRating = count > 0 ? (reviews.reduce((acc, item) => item.rating + acc, 0) / count) : 0;
        
        experience.numReviews = count;
        experience.reviewsCount = count;
        experience.averageRating = avgRating;
        experience.rating = avgRating;

        await experience.save();

        res.status(201).json(review);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get reviews for an experience
// @route   GET /api/reviews/:experienceId
// @access  Public
const getReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ experience: req.params.experienceId })
            .populate('user', 'name')
            .sort({ createdAt: -1 });

        res.json(reviews);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { createReview, getReviews };
