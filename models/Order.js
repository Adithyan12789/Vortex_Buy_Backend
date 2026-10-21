const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    guestId: String,
    lineItems: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: Number,
        price: Number
    }],
    totalAmount: Number,
    paymentMethod: { type: String, default: 'Razorpay' },
    shippingInfo: {
        name: String,
        email: String,
        address: String
    },
    paymentStatus: { type: String, default: 'Pending' },
    orderStatus: { type: String, default: 'Confirmed', enum: ['Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] },
    cancellationFee: { type: Number, default: 0 },
    refundAmount: { type: Number, default: 0 },
    cancelledAt: Date,
    refundStatus: { type: String, default: 'None' },
    razorpayOrderId: String,
    razorpayPaymentId: String
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);