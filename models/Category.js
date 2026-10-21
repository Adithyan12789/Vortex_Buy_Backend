const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    media: { mainMedia: { image: { url: String } } }
}, { timestamps: true });

module.exports = mongoose.model('Category', CategorySchema);