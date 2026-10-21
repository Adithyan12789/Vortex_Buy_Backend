const fs = require('fs');
const path = require('path');

const dirs = ['config', 'models', 'controllers', 'routes', 'middleware'];
dirs.forEach(d => fs.mkdirSync(path.join(__dirname, d), { recursive: true }));

const files = {
  'config/db.js': `
const mongoose = require('mongoose');
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb+srv://adithiruthiparambil12:root@ecommercesite.og6j8.mongodb.net/");
        console.log("MongoDB Connected...");
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};
module.exports = connectDB;
  `,
  'models/User.js': `
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    otp: { type: String },
    otpExpires: { type: Date },
    isVerified: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
  `,
  'models/Product.js': `
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
  `,
  'models/Category.js': `
const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    media: { mainMedia: { image: { url: String } } }
}, { timestamps: true });

module.exports = mongoose.model('Category', CategorySchema);
  `,
  'models/Order.js': `
const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lineItems: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: Number,
        price: Number
    }],
    totalAmount: Number,
    paymentStatus: { type: String, default: 'Pending' },
    razorpayOrderId: String,
    razorpayPaymentId: String
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
  `,
  'models/Cart.js': `
const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lineItems: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number, default: 1 }
    }],
    subtotal: { amount: { type: Number, default: 0 } }
}, { timestamps: true });

module.exports = mongoose.model('Cart', CartSchema);
  `,
  'middleware/authMiddleware.js': `
const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
  `,
  'controllers/authController.js': `
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

exports.register = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        user = new User({ username, email, password });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        const otp = crypto.randomInt(100000, 999999).toString();
        user.otp = otp;
        user.otpExpires = Date.now() + 10 * 60 * 1000;
        await user.save();
        
        console.log(\`OTP for \${email} is: \${otp}\`); // For debugging until true email integrated
        res.status(200).json({ msg: 'Registered successfully. Please verify OTP. (Check console)' });
    } catch (err) {
        res.status(500).send('Server error');
    }
};

exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;
    try {
        let user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid credentials' });
        
        if (user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ msg: 'Invalid or expired OTP' });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: 360000 }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        res.status(500).send('Server error');
    }
}

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });
        
        if (!user.isVerified) return res.status(400).json({ msg: 'Please verify your email via OTP first' });

        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: 360000 }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        res.status(500).send('Server error');
    }
};

exports.profile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).send('Server error');
    }
};
  `,
  'controllers/productController.js': `
const Product = require('../models/Product');
const Category = require('../models/Category');

exports.getProducts = async (req, res) => {
    try {
        const filter = {};
        if (req.query.categoryId) filter.categorySlug = req.query.categoryId;
        
        const limit = parseInt(req.query.limit) || 10;
        const products = await Product.find(filter).limit(limit);
        res.json({ items: products });
    } catch (err) {
        res.status(500).send('Server error');
    }
};

exports.getProductBySlug = async (req, res) => {
    try {
        const product = await Product.findOne({ slug: req.params.slug });
        res.json(product);
    } catch (err) {
        res.status(500).send('Server error');
    }
};

exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        res.json({ items: categories });
    } catch (err) {
        res.status(500).send('Server error');
    }
}

exports.getCategoryBySlug = async (req, res) => {
    try {
        const category = await Category.findOne({ slug: req.params.slug });
        res.json({ collection: category });
    } catch (err) {
        res.status(500).send('Server error');
    }
}
  `,
  'controllers/cartController.js': `
const Cart = require('../models/Cart');

exports.getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user.id }).populate('lineItems.productId');
        if (!cart) {
            cart = new Cart({ user: req.user.id, lineItems: [] });
            await cart.save();
        }
        res.json(cart);
    } catch (err) {
        res.status(500).send('Server error');
    }
};

exports.addToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        let cart = await Cart.findOne({ user: req.user.id });
        if (!cart) cart = new Cart({ user: req.user.id, lineItems: [] });
        
        const itemIndex = cart.lineItems.findIndex(p => p.productId == productId);
        if (itemIndex > -1) {
            cart.lineItems[itemIndex].quantity += quantity;
        } else {
            cart.lineItems.push({ productId, quantity });
        }
        await cart.save();
        res.json({ cart });
    } catch (err) {
        res.status(500).send('Server error');
    }
};

exports.removeFromCart = async (req, res) => {
    try {
        const { itemId } = req.body; // Actually productId inside lineItems
        let cart = await Cart.findOne({ user: req.user.id });
        cart.lineItems = cart.lineItems.filter(item => item.productId != itemId);
        await cart.save();
        res.json({ cart });
    } catch (err) {
        res.status(500).send('Server error');
    }
}
  `,
  'controllers/paymentController.js': `
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const crypto = require('crypto');

const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

exports.createOrder = async (req, res) => {
    try {
        const { amount, lineItems } = req.body; // Amount should be passed from frontend
        
        const options = {
            amount: amount * 100, // format in smallest currency unit
            currency: "INR",
            receipt: "receipt_order_" + Date.now()
        };
        
        const order = await instance.orders.create(options);
        
        const newOrderObj = new Order({
            user: req.user.id,
            lineItems: lineItems,
            totalAmount: amount,
            razorpayOrderId: order.id
        });
        await newOrderObj.save();
        
        res.json(order);
    } catch (error) {
        res.status(500).send(error);
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        
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
        res.status(500).send(error);
    }
};
  `,
  'routes/authRoutes.js': `
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/verify-otp', authController.verifyOtp);
router.post('/login', authController.login);
router.get('/profile', authMiddleware, authController.profile);

module.exports = router;
  `,
  'routes/productRoutes.js': `
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/products', productController.getProducts);
router.get('/product/:slug', productController.getProductBySlug);
router.get('/categories', productController.getCategories);
router.get('/categories/:slug', productController.getCategoryBySlug);

module.exports = router;
  `,
  'routes/cartRoutes.js': `
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/cart', authMiddleware, cartController.getCart);
router.post('/cart/add', authMiddleware, cartController.addToCart);
router.post('/cart/remove', authMiddleware, cartController.removeFromCart);

module.exports = router;
  `,
  'routes/paymentRoutes.js': `
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/payment/create-order', authMiddleware, paymentController.createOrder);
router.post('/payment/verify', authMiddleware, paymentController.verifyPayment);

module.exports = router;
  `,
  'server.js': `
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');

const app = express();

// Connect Database
connectDB();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', require('./routes/authRoutes'));
app.use('/api', require('./routes/productRoutes'));
app.use('/api', require('./routes/cartRoutes'));
app.use('/api', require('./routes/paymentRoutes'));

// Seed Mock Data route for testing UI fast locally
app.get('/api/seed', async (req, res) => {
    const Product = require('./models/Product');
    const Category = require('./models/Category');
    
    await Product.deleteMany();
    await Category.deleteMany();
    
    await Product.create({
        name: "Classic T-Shirt",
        slug: "classic-t-shirt",
        description: "A very classic t-shirt.",
        price: { price: 29.99, discountedPrice: 19.99 },
        media: { 
        items: [{ image: { url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&auto=format&fit=crop" } }],
        mainMedia: { image: { url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&auto=format&fit=crop" } }
        },
        additionalInfoSections: [{ title: "shortDesc", description: "Soft cotton tee." }],
        stock: { quantity: 100 },
        categorySlug: "clothing"
    });
    
    await Category.create({
        name: "Clothing",
        slug: "clothing",
        media: { mainMedia: { image: { url: "https://images.unsplash.com/photo-1489987707023-afc82718117c?w=500&auto=format&fit=crop" } } }
    });
    
    res.json({ msg: "Database Seeded successfully for testing UI!" });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(\`Express server running on port \${PORT}\`));
  `
};

for (const [filepath, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(__dirname, filepath), content.trim());
}
console.log('Backend Scaffolding executed flawlessly!');
