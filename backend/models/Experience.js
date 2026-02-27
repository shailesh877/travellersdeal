const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema({
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        required: true,
        default: 'USD',
    },
    duration: {
        type: String,
        required: true,
    },
    images: [{
        type: String,
    }],
    location: {
        city: { type: String, required: true },
        country: { type: String, required: true },
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    rating: {
        type: Number,
        required: true,
        default: 0,
    },
    reviewsCount: {
        type: Number,
        required: true,
        default: 0,
    },
    availability: [{
        date: Date,
        slots: Number
    }],
    highlights: [String],
    itinerary: [{ title: String, description: String }],
    itineraryMap: { type: String, required: false },
    includes: [String],
    privateGroup: { type: Boolean, default: false },
    dietaryOptions: [String], // e.g. ['Vegetarian', 'Vegan', 'Gluten-free']
    knowBeforeYouGo: [String],
    meetingPoint: { type: String, required: false }, // Use Google Maps link style
    whatToBring: [String],
    notSuitableFor: [String],
    languages: [String], // e.g., ['English', 'German']
    timeSlots: [String], // e.g. ["10:00 AM", "02:00 PM"]
    capacity: {
        type: Number,
        default: 20, // Default max guests per slot
        required: true
    },

    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    lastApprovedSnapshot: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    isActive: {
        type: Boolean,
        default: false
    },
    averageRating: {
        type: Number,
        default: 0
    },
    numReviews: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Reverse populate with virtuals
experienceSchema.virtual('reviews', {
    ref: 'Review',
    localField: '_id',
    foreignField: 'experience',
    justOne: false
});

const Experience = mongoose.model('Experience', experienceSchema);

module.exports = Experience;
