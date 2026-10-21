const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    price: { 
        price: { type: Number, required: true }, 
        discountedPrice: { type: Number } 
    },
    media: { 
        items: [{ image: { url: String } }],
        mainMedia: { image: { url: String } }
    },
    additionalInfoSections: [{ title: String, description: String }],
    stock: { quantity: { type: Number, default: 0 } },
    categorySlug: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);