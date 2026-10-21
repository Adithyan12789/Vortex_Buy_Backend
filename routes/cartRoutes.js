const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/cart', authMiddleware, cartController.getCart);
router.post('/cart/add', authMiddleware, cartController.addToCart);
router.post('/cart/remove', authMiddleware, cartController.removeFromCart);
router.post('/cart/update-quantity', authMiddleware, cartController.updateQuantity);

module.exports = router;