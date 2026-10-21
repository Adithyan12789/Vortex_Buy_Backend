const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/payment/create-order', authMiddleware, paymentController.createOrder);
router.post('/payment/verify', authMiddleware, paymentController.verifyPayment);
router.get('/payment/orders', authMiddleware, paymentController.getOrders);
router.delete('/payment/orders/clear', authMiddleware, paymentController.clearOrders);
router.put('/payment/orders/:id/cancel', authMiddleware, paymentController.cancelOrder);
router.post('/payment/orders/:id/cancel', authMiddleware, paymentController.cancelOrder);

module.exports = router;