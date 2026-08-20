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
    },
    category: {
        type: String,
        required: true,
    },

    currency: {
        type: String,
        default: 'USD',
    },
    duration: {
        type: String,
    },
    images: [{
        type: String,
    }],
    location: {
        city: { type: String },
        country: { type: String },
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    locations: [{
        type: String
    }],
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
    itinerary: [{ title: String, description: String, location: { lat: Number, lng: Number } }],
    itineraryMap: { type: String, required: false },
    includes: [String],
    privateGroup: { type: Boolean, default: false },
    dietaryOptions: [String], // e.g. ['Vegetarian', 'Vegan', 'Gluten-free']
    knowBeforeYouGo: [String],
    meetingPoint: { type: String, required: false }, // Use Google Maps link style

    languages: [String], // e.g., ['English', 'German']
    timeSlots: [String], // e.g. ["10:00 AM", "02:00 PM"]
    capacity: {
        type: Number,
        default: 20, // Default max guests per slot
        required: true
    },

    referenceCode: { type: String },
    shortDescription: { type: String, maxLength: 500 },
    keywords: [String],
    isFoodIncluded: { type: Boolean, default: false },
    meals: [{
        type: { type: String }, // e.g. Buffet
        format: { type: String }, // e.g. Set menu
        isDrinksIncluded: { type: Boolean, default: false },
        dietaryOptions: [String],
        showDietary: { type: Boolean, default: false }
    }],
    isTransportationUsed: { type: Boolean, default: false },
    transports: [String],
    isDifferentCityTravel: { type: Boolean, default: false },
    guideType: { type: String, required: false },
    extraInformation: {
        notSuitableFor: [String],
        notAllowed: [String],
        petFriendly: { type: Boolean, default: false },
        petPolicy: String,
        whatToBring: [String],
        knowBeforeYouGo: [String],
        emergencyContact: {
            countryCode: { type: String, required: false },
            number: { type: String, required: false }
        },
        voucherInfo: { type: String, required: false }
    },
    bookingOptions: [{
        optionSetup: {
            title: { type: String, required: true },
            referenceCode: { type: String },
            description: { type: String },
            maxGroupSize: { type: Number },
            languages: [String],
            audioGuide: {
                hasAudioGuide: { type: Boolean, default: false },
                languages: [String]
            },
            informationBooklets: {
                hasBooklets: { type: Boolean, default: false },
                languages: [String]
            },
            isPrivateActivity: { type: Boolean, default: false },
            skipTheLine: {
                isSkip: { type: Boolean, default: false },
                lineDetails: { type: String }
            },
            wheelchairAccessible: { type: Boolean, default: false },
            durationOrValidity: {
                type: { type: String, enum: ['duration', 'validity'] },
                value: { type: String }
            }
        },
        meetingPointOrPickup: {
            meetingType: { type: String, enum: ['meeting', 'pickup', 'both'], default: 'meeting' },
            meetingAddress: { type: String },
            meetingDescription: { type: String },
            meetingImages: [{ type: String }],
            arrivalTime: { type: String },
            dropOffType: { type: String },
            dropOffAddress: { type: String },
            pickupType: { type: String },
            pickupTimeType: { type: String },
            pickupConfirmationType: { type: String },
            pickupTimeSlots: { type: String },
            pickupDescription: { type: String },
            transportationType: { type: String }
        },
        connectivitySettings: {
            useReservationSystem: { type: Boolean, default: false },
            reservationSystem: { type: String },
            externalProductId: { type: String }
        },
        availabilityAndPricing: {
            capacity: { type: Number },
            pricingType: { type: String, enum: ['person', 'group'], default: 'person' },
            pricingPersonDependency: { type: String, enum: ['everyone', 'exact', 'range', 'category'], default: 'everyone' },
            pricingTiers: [{
                title: String,
                minAge: Number,
                maxAge: Number,
                minCount: Number,
                maxCount: Number,
                price: Number
            }],
            addons: [{
                title: String,
                price: Number,
                description: String
            }],
            currency: { type: String, default: 'USD' }
        },
        cutOff: {
            cutoffHours: { type: Number, default: 24 },
            cancellationPolicy: { type: String, enum: ['free_24h', 'free_48h', 'non_refundable'], default: 'free_24h' }
        }
    }],

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
