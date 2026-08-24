const mongoose = require('mongoose');

const appSettingsSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        default: 'global'
    },
    playStoreUrl: {
        type: String,
        default: ''
    },
    appStoreUrl: {
        type: String,
        default: ''
    },
    feedbackUrl: {
        type: String,
        default: ''
    },
    allowedCurrencies: {
        type: [String],
        default: ['USD', 'EUR', 'GBP', 'AED', 'INR', 'AUD', 'CAD']
    }
}, { timestamps: true });

module.exports = mongoose.model('AppSettings', appSettingsSchema);
