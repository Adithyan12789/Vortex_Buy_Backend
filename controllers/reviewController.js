
const Review = require('../models/Review');

exports.addReview = async (req, res) => {
    try {
        const { productId, guestId, userName, rating, comment } = req.body;
        const newReview = new Review({
            productId,
            guestId,
            userName,
            rating,
            comment
        });
        await newReview.save();
        res.json(newReview);
    } catch (err) {
        res.status(500).send('Server error');
    }
};

exports.getReviews = async (req, res) => {
    try {
        const { productId } = req.query;
        const reviews = await Review.find({ productId }).sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        res.status(500).send('Server error');
    }
};
