const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    experience: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Experience',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 1,
        min: 1
    },
    date: {
        type: Date,
        required: true
    },
    timeSlot: {
        type: String,
        default: '10:00 AM'
    },
    priceAtAdd: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'USD'
    }
}, { _id: true });

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    items: [cartItemSchema],
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Update the updatedAt timestamp before saving
cartSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Calculate total cart value
cartSchema.methods.getTotal = function () {
    return this.items.reduce((total, item) => {
        return total + (item.priceAtAdd * item.quantity);
    }, 0);
};

// Get total number of items
cartSchema.methods.getItemCount = function () {
    return this.items.reduce((count, item) => count + item.quantity, 0);
};

module.exports = mongoose.model('Cart', cartSchema);
