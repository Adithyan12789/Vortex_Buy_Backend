const Razorpay = require('razorpay');
const Order = require('../models/Order');
const User = require('../models/User');
const crypto = require('crypto');

const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_Oks5Gpac00wL72',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

exports.createOrder = async (req, res) => {
    try {
        const { amount, lineItems, guestId, paymentMethod, shippingInfo } = req.body;
        const userId = req.user ? req.user.id : null;
        
        let order;
        if (paymentMethod === 'COD') {
            order = { id: "ord_cod_" + Date.now() };
        } else {
            // Check if we should use demo mode (dummy keys)
            const isDummy = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'dummy_key' || process.env.RAZORPAY_KEY_SECRET === 'secret_string_from_razorpay';
            
            if (isDummy) {
                // Return a mock order object for demo purposes
                order = {
                    id: "order_demo_" + Date.now(),
                    amount: Math.round(amount * 100),
                    currency: "INR",
                    notes: { isDemo: true }
                };
            } else {
                const options = {
                    amount: Math.round(amount * 100),
                    currency: "INR",
                    receipt: "receipt_order_" + Date.now()
                };
                order = await instance.orders.create(options);
            }
        }
        
        // Format line items cleanly
        const formattedLineItems = (lineItems || []).map(item => ({
            productId: item.productId?._id || item.productId,
            quantity: item.quantity || 1,
            price: item.productId?.price?.price || item.price || 0
        })).filter(item => item.productId != null);

        const newOrderObj = new Order({
            user: userId,
            guestId: userId ? null : guestId,
            lineItems: formattedLineItems,
            totalAmount: amount,
            paymentMethod: paymentMethod || 'Razorpay',
            shippingInfo: shippingInfo,
            razorpayOrderId: order.id,
            paymentStatus: paymentMethod === 'COD' ? 'Paid (On Delivery)' : 'Pending'
        });
        await newOrderObj.save();
        
        res.json(order);
    } catch (error) {
        console.error("Order creation error:", error);
        res.status(500).json({ error: "Failed to create payment order", details: error.message });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        
        // Handle demo mode verification
        const isDemo = razorpay_order_id && razorpay_order_id.startsWith('order_demo_');
        if (isDemo) {
            await Order.findOneAndUpdate({ razorpayOrderId: razorpay_order_id }, { 
                paymentStatus: 'Paid',
                razorpayPaymentId: razorpay_payment_id || 'demo_payment_' + Date.now()
            });
            return res.json({ success: true, message: "Payment verified successfully (Demo Mode)" });
        }

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy_secret')
                                        .update(body.toString())
                                        .digest('hex');
                                        
        if (expectedSignature === razorpay_signature) {
            await Order.findOneAndUpdate({ razorpayOrderId: razorpay_order_id }, { 
                paymentStatus: 'Paid',
                razorpayPaymentId: razorpay_payment_id
            });
            res.json({ success: true, message: "Payment verified successfully" });
        } else {
            res.status(400).json({ success: false, message: "Invalid signature" });
        }
    } catch (error) {
        console.error("Verification error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getOrders = async (req, res) => {
    try {
        const guestId = req.query.guestId;
        const userId = req.user ? req.user.id : null;
        
        let query = {};
        if (userId) {
            // Find logged in user's profile to claim any orders by email
            const user = await User.findById(userId);
            const userEmail = user?.email;

            if (userEmail) {
                // Retroactively associate any unassigned orders made with this email
                await Order.updateMany(
                    { user: null, 'shippingInfo.email': userEmail.toLowerCase() },
                    { $set: { user: userId } }
                );
            }

            if (guestId) {
                // Also associate any guest orders made from this device session
                await Order.updateMany(
                    { user: null, guestId },
                    { $set: { user: userId } }
                );
            }

            // Return all orders strictly belonging to this authenticated user
            query = { user: userId };
        } else if (guestId) {
            // Fallback for non-logged in guest viewing
            query = { guestId, user: null };
        } else {
            return res.json([]);
        }

        const orders = await Order.find(query).populate('lineItems.productId').sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error('getOrders error:', error);
        res.status(500).send(error);
    }
};

exports.clearOrders = async (req, res) => {
    try {
        const guestId = req.query.guestId || req.body?.guestId;
        const userId = req.user ? req.user.id : null;

        if (!userId && !guestId) {
            return res.status(400).json({ msg: "Authentication required to clear orders" });
        }

        let deleteFilter = {};
        if (userId) {
            const user = await User.findById(userId);
            const userEmail = user?.email;

            if (userEmail) {
                deleteFilter = {
                    $or: [
                        { user: userId },
                        { 'shippingInfo.email': userEmail.toLowerCase() }
                    ]
                };
            } else {
                deleteFilter = { user: userId };
            }
        } else if (guestId) {
            deleteFilter = { guestId, user: null };
        }

        const result = await Order.deleteMany(deleteFilter);
        console.log(`[Orders] Cleared ${result.deletedCount} orders for ${userId || guestId}`);
        res.json({
            success: true,
            msg: "Order history cleared successfully",
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error("clearOrders error:", error);
        res.status(500).json({ msg: "Failed to clear order history" });
    }
};

exports.cancelOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        const userId = req.user ? req.user.id : null;
        const guestId = req.query.guestId || req.body?.guestId;

        const order = await Order.findById(orderId).populate('lineItems.productId');
        if (!order) {
            return res.status(404).json({ msg: 'Order not found' });
        }

        // Verify authorization: check user ID or matching email or guestId
        if (userId) {
            const user = await User.findById(userId);
            const userEmail = user?.email?.toLowerCase();
            const orderEmail = order.shippingInfo?.email?.toLowerCase();

            const isOwner = (order.user && order.user.toString() === userId.toString()) ||
                            (userEmail && orderEmail && userEmail === orderEmail);

            if (!isOwner) {
                return res.status(403).json({ msg: 'You are not authorized to cancel this order' });
            }
        } else if (guestId) {
            if (order.guestId !== guestId) {
                return res.status(403).json({ msg: 'You are not authorized to cancel this order' });
            }
        } else {
            return res.status(401).json({ msg: 'Authentication required to cancel order' });
        }

        // Check if already cancelled
        if (order.orderStatus === 'Cancelled') {
            return res.status(400).json({ msg: 'This order is already cancelled' });
        }

        // Calculate 20% cancellation fee and 80% refund
        const total = order.totalAmount || 0;
        const cancellationFee = Math.round(total * 0.20);
        const refundAmount = Math.max(0, total - cancellationFee);

        order.orderStatus = 'Cancelled';
        order.cancellationFee = cancellationFee;
        order.refundAmount = refundAmount;
        order.cancelledAt = new Date();
        order.refundStatus = order.paymentMethod === 'COD' && order.paymentStatus !== 'Paid'
            ? 'No Refund Needed (Cash On Delivery)'
            : 'Refund Processing (80% remaining)';

        await order.save();

        console.log(`[Order Cancelled] Order ${order._id}: Total=₹${total}, 20% Fee=₹${cancellationFee}, 80% Refund=₹${refundAmount}`);

        res.json({
            success: true,
            msg: `Order cancelled. 20% fee (₹${cancellationFee}) was deducted. Refund of ₹${refundAmount} has been initiated.`,
            order
        });
    } catch (error) {
        console.error('cancelOrder error:', error);
        res.status(500).json({ msg: 'Failed to cancel order: ' + error.message });
    }
};