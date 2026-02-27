const mongoose = require('mongoose');

const homepageSectionSchema = new mongoose.Schema({
    type: { type: String, required: true },
    items: []
}, { timestamps: true });

// Do NOT call ensureIndexes automatically - avoids buffering timeouts
module.exports = mongoose.model('HomepageSection', homepageSectionSchema);
