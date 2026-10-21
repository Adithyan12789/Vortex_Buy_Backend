const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');

const app = express();

// Connect Database
connectDB();

const path = require('path');

const allowedOrigins = [
    'https://vortex-buy.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(o => o.trim()) : [])
];

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    allowedHeaders: ['Content-Type', 'x-auth-token', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    optionsSuccessStatus: 200
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api', require('./routes/authRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api', require('./routes/productRoutes'));
app.use('/api', require('./routes/cartRoutes'));
app.use('/api', require('./routes/paymentRoutes'));
app.use('/api', require('./routes/reviewRoutes'));

// Seed Mock Data route for testing UI fast locally
app.get('/api/seed', async (req, res) => {
    const Product  = require('./models/Product');
    const Category = require('./models/Category');

    await Product.deleteMany();
    await Category.deleteMany();

    /* ── Image helpers (Stable Pexels ID strategy) ── */
    const px = (id) => {
        const url = `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=600`;
        return {
            items: [{ image: { url } }, { image: { url: url.replace('&w=600', '&w=600&sat=-30') } }],
            mainMedia: { image: { url } }
        };
    };
    const localImg = (filename) => {
        const url = `http://localhost:5000/uploads/products/${filename}`;
        return {
            items: [{ image: { url } }, { image: { url } }],
            mainMedia: { image: { url } }
        };
    };
    const d = (text) => [{ title: 'shortDesc', description: text }];

    /* ── Categories ── */
    await Category.insertMany([
        { name: 'Clothing',      slug: 'clothing',     media: { mainMedia: { image: { url: 'https://images.pexels.com/photos/2983464/pexels-photo-2983464.jpeg?auto=compress&cs=tinysrgb&w=600' } } } },
        { name: 'Electronics',   slug: 'electronics',  media: { mainMedia: { image: { url: 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?auto=compress&cs=tinysrgb&w=600' } } } },
        { name: 'Footwear',      slug: 'footwear',     media: { mainMedia: { image: { url: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=600' } } } },
        { name: 'Accessories',   slug: 'accessories',  media: { mainMedia: { image: { url: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=600' } } } },
        { name: 'Home & Kitchen',slug: 'home-kitchen', media: { mainMedia: { image: { url: 'https://images.pexels.com/photos/4107122/pexels-photo-4107122.jpeg?auto=compress&cs=tinysrgb&w=600' } } } },
        { name: 'Sports',        slug: 'sports',       media: { mainMedia: { image: { url: 'https://images.pexels.com/photos/703012/pexels-photo-703012.jpeg?auto=compress&cs=tinysrgb&w=600' } } } },
    ]);

    /* ── Products (60 total — 10 per category) ── */
    await Product.insertMany([

        // ══════════════════════════════
        //  CLOTHING  (10)
        // ══════════════════════════════
        { name: 'Classic White T-Shirt',       slug: 'classic-white-t-shirt',       categorySlug: 'clothing',     price: { price: 699,  discountedPrice: 499  }, stock: { quantity: 200 }, media: px(4066506),  additionalInfoSections: d('100% premium cotton, relaxed fit for everyday wear.') },
        { name: 'Slim Fit Chinos',             slug: 'slim-fit-chinos',             categorySlug: 'clothing',     price: { price: 1799, discountedPrice: 1299 }, stock: { quantity: 80  }, media: px(1598507),  additionalInfoSections: d('Tailored slim-fit chinos for casual or smart-casual looks.') },
        { name: 'Hoodie Sweatshirt',           slug: 'hoodie-sweatshirt',           categorySlug: 'clothing',     price: { price: 1499, discountedPrice: 999  }, stock: { quantity: 120 }, media: px(6311392),  additionalInfoSections: d('Cosy fleece-lined hoodie with kangaroo pocket.') },
        { name: 'Floral Summer Dress',         slug: 'floral-summer-dress',         categorySlug: 'clothing',     price: { price: 1299, discountedPrice: 899  }, stock: { quantity: 60  }, media: px(1755428),  additionalInfoSections: d('Lightweight floral dress, perfect for warm days.') },
        { name: 'Denim Jacket',                slug: 'denim-jacket',                categorySlug: 'clothing',     price: { price: 2499, discountedPrice: 1999 }, stock: { quantity: 45  }, media: px(1040945),  additionalInfoSections: d('Classic washed denim jacket with button closure.') },
        { name: 'Oversized Graphic Tee',       slug: 'oversized-graphic-tee',       categorySlug: 'clothing',     price: { price: 849,  discountedPrice: 649  }, stock: { quantity: 150 }, media: px(2220316),  additionalInfoSections: d('Trendy oversized fit with bold graphic print.') },
        { name: 'Formal Blazer',               slug: 'formal-blazer',               categorySlug: 'clothing',     price: { price: 3999, discountedPrice: 2999 }, stock: { quantity: 30  }, media: px(1036622),  additionalInfoSections: d('Sharp single-breasted blazer for meetings and events.') },
        { name: 'Linen Shirt',                 slug: 'linen-shirt',                 categorySlug: 'clothing',     price: { price: 1199, discountedPrice: 899  }, stock: { quantity: 90  }, media: px(3622608),  additionalInfoSections: d('Breathable linen shirt, ideal for summer days.') },
        { name: 'Cargo Joggers',               slug: 'cargo-joggers',               categorySlug: 'clothing',     price: { price: 1399, discountedPrice: 999  }, stock: { quantity: 110 }, media: px(3785279),  additionalInfoSections: d('Relaxed joggers with side cargo pockets.') },
        { name: 'Turtleneck Sweater',          slug: 'turtleneck-sweater',          categorySlug: 'clothing',     price: { price: 1999, discountedPrice: 1599 }, stock: { quantity: 50  }, media: px(1021693),  additionalInfoSections: d('Soft merino-blend turtleneck for cold weather layering.') },

        // ══════════════════════════════
        //  ELECTRONICS  (10)
        // ══════════════════════════════
        { name: 'Wireless Earbuds Pro',        slug: 'wireless-earbuds-pro',        categorySlug: 'electronics',  price: { price: 3999, discountedPrice: 2999 }, stock: { quantity: 100 }, media: px(3825586),  additionalInfoSections: d('ANC, 30-hour battery life with wireless charging case.') },
        { name: 'Smart Watch Series X',        slug: 'smart-watch-series-x',        categorySlug: 'electronics',  price: { price: 8999, discountedPrice: 7499 }, stock: { quantity: 50  }, media: localImg('smart-watch.png'), additionalInfoSections: d('Heart-rate, SpO2, GPS, AMOLED display, 7-day battery.') },
        { name: 'Portable Bluetooth Speaker',  slug: 'portable-bluetooth-speaker',  categorySlug: 'electronics',  price: { price: 2499, discountedPrice: 1799 }, stock: { quantity: 70  }, media: px(1706694),  additionalInfoSections: d('360° surround sound, IPX7 waterproof, 12-hr playtime.') },
        { name: 'USB-C Fast Charger 65W',      slug: 'usb-c-fast-charger-65w',      categorySlug: 'electronics',  price: { price: 999,  discountedPrice: 699  }, stock: { quantity: 200 }, media: px(4526383),  additionalInfoSections: d('GaN with dual ports — charges phone + laptop simultaneously.') },
        { name: 'Mechanical Keyboard RGB',     slug: 'mechanical-keyboard-rgb',     categorySlug: 'electronics',  price: { price: 5499, discountedPrice: 4299 }, stock: { quantity: 40  }, media: px(2115257),  additionalInfoSections: d('TKL layout, full RGB per-key backlight, tactile blue switches.') },
        { name: 'HD Webcam 1080p',             slug: 'hd-webcam-1080p',             categorySlug: 'electronics',  price: { price: 2999, discountedPrice: 2199 }, stock: { quantity: 55  }, media: px(3646172),  additionalInfoSections: d('Crisp 1080p/60fps video with built-in noise-cancelling mic.') },
        { name: 'Wireless Ergonomic Mouse',    slug: 'wireless-ergonomic-mouse',    categorySlug: 'electronics',  price: { price: 1299, discountedPrice: 999  }, stock: { quantity: 90  }, media: px(5082579),  additionalInfoSections: d('Sculpted ergonomic shape, silent scroll, 12-month battery.') },
        { name: 'Noise-Cancelling Headphones', slug: 'noise-cancelling-headphones', categorySlug: 'electronics',  price: { price: 6999, discountedPrice: 5499 }, stock: { quantity: 35  }, media: px(577769),   additionalInfoSections: d('Industry-leading ANC, 40h battery, foldable design.') },
        { name: '4K Action Camera',            slug: '4k-action-camera',            categorySlug: 'electronics',  price: { price: 12999,discountedPrice: 9999 }, stock: { quantity: 25  }, media: px(1422408),  additionalInfoSections: d('4K/60fps, waterproof to 10m, 2-inch touch screen.') },
        { name: 'Smart LED Desk Lamp',         slug: 'smart-led-desk-lamp',         categorySlug: 'electronics',  price: { price: 1899, discountedPrice: 1399 }, stock: { quantity: 60  }, media: px(1112598),  additionalInfoSections: d('Touch dimmer, USB charging port, 5 colour temperatures.') },

        // ══════════════════════════════
        //  FOOTWEAR  (10)
        // ══════════════════════════════
        { name: 'Running Sneakers',            slug: 'running-sneakers',            categorySlug: 'footwear',     price: { price: 3499, discountedPrice: 2599 }, stock: { quantity: 80  }, media: px(2529148),  additionalInfoSections: d('Breathable mesh upper with React foam sole for long runs.') },
        { name: 'Leather Oxford Shoes',        slug: 'leather-oxford-shoes',        categorySlug: 'footwear',     price: { price: 4999, discountedPrice: 3999 }, stock: { quantity: 35  }, media: px(1598508),  additionalInfoSections: d('Full-grain leather upper, Goodyear welt, leather sole.') },
        { name: 'Casual Canvas Sneakers',      slug: 'casual-canvas-sneakers',      categorySlug: 'footwear',     price: { price: 1299, discountedPrice: 999  }, stock: { quantity: 120 }, media: px(1464625),  additionalInfoSections: d('Lightweight canvas upper, vulcanised rubber outsole.') },
        { name: 'Suede Chelsea Boots',         slug: 'suede-chelsea-boots',         categorySlug: 'footwear',     price: { price: 5999, discountedPrice: 4499 }, stock: { quantity: 25  }, media: px(267301),   additionalInfoSections: d('Premium suede, elastic side gusset, stacked leather heel.') },
        { name: 'Slip-On Loafers',             slug: 'slip-on-loafers',             categorySlug: 'footwear',     price: { price: 2499, discountedPrice: 1899 }, stock: { quantity: 60  }, media: px(1706694),  additionalInfoSections: d('Supple leather loafer with cushioned footbed.') },
        { name: 'High-Top Basketball Shoes',   slug: 'high-top-basketball-shoes',   categorySlug: 'footwear',     price: { price: 4499, discountedPrice: 3499 }, stock: { quantity: 40  }, media: px(1598505),  additionalInfoSections: d('Ankle support, air cushion sole, non-slip rubber.') },
        { name: 'Hiking Trail Boots',          slug: 'hiking-trail-boots',          categorySlug: 'footwear',     price: { price: 6499, discountedPrice: 4999 }, stock: { quantity: 30  }, media: px(3622609),  additionalInfoSections: d('Waterproof Gore-Tex, Vibram outsole, ankle support.') },
        { name: 'Platform Chunky Sandals',     slug: 'platform-chunky-sandals',     categorySlug: 'footwear',     price: { price: 1799, discountedPrice: 1299 }, stock: { quantity: 70  }, media: px(1046749),  additionalInfoSections: d('Chunky platform sole, adjustable buckle straps.') },
        { name: 'Flip Flops Premium',          slug: 'flip-flops-premium',          categorySlug: 'footwear',     price: { price: 699,  discountedPrice: 499  }, stock: { quantity: 180 }, media: px(1484807),  additionalInfoSections: d('Contoured footbed with arch support, anti-slip sole.') },
        { name: 'Ankle Strap Heels',           slug: 'ankle-strap-heels',           categorySlug: 'footwear',     price: { price: 3299, discountedPrice: 2499 }, stock: { quantity: 45  }, media: px(1478442),  additionalInfoSections: d('3-inch block heel with padded insole and adjustable strap.') },

        // ══════════════════════════════
        //  ACCESSORIES  (10)
        // ══════════════════════════════
        { name: 'Minimalist Leather Wallet',   slug: 'minimalist-leather-wallet',   categorySlug: 'accessories',  price: { price: 1499, discountedPrice: 999  }, stock: { quantity: 100 }, media: px(1152077),  additionalInfoSections: d('Slim bifold, genuine leather, 8-card capacity.') },
        { name: 'Aviator Sunglasses',          slug: 'aviator-sunglasses',          categorySlug: 'accessories',  price: { price: 1999, discountedPrice: 1299 }, stock: { quantity: 60  }, media: px(701877),   additionalInfoSections: d('UV400 polarised lenses, gold stainless steel frame.') },
        { name: 'Canvas Backpack 30L',         slug: 'canvas-backpack-30l',         categorySlug: 'accessories',  price: { price: 1799, discountedPrice: 1399 }, stock: { quantity: 75  }, media: px(2905204),  additionalInfoSections: d('15" laptop compartment, water-resistant canvas.') },
        { name: 'Analog Wrist Watch',          slug: 'analog-wrist-watch',          categorySlug: 'accessories',  price: { price: 2999, discountedPrice: 2299 }, stock: { quantity: 40  }, media: px(125779),   additionalInfoSections: d('Japanese quartz, 40mm case, stainless mesh strap.') },
        { name: 'Leather Belt',                slug: 'leather-belt',                categorySlug: 'accessories',  price: { price: 899,  discountedPrice: 699  }, stock: { quantity: 120 }, media: px(45055),    additionalInfoSections: d('Full-grain leather with brushed silver buckle.') },
        { name: 'Silk Scarf',                  slug: 'silk-scarf',                  categorySlug: 'accessories',  price: { price: 799,  discountedPrice: 599  }, stock: { quantity: 80  }, media: px(1031023),  additionalInfoSections: d('100% mulberry silk, hand-rolled edges, versatile styling.') },
        { name: 'Sports Cap',                  slug: 'sports-cap',                  categorySlug: 'accessories',  price: { price: 599,  discountedPrice: 449  }, stock: { quantity: 150 }, media: px(1321909),  additionalInfoSections: d('Moisture-wicking, adjustable snapback, embroidered logo.') },
        { name: 'Tote Bag Canvas',             slug: 'tote-bag-canvas',             categorySlug: 'accessories',  price: { price: 699,  discountedPrice: 549  }, stock: { quantity: 130 }, media: px(9213454),  additionalInfoSections: d('Extra-large heavy-duty canvas with inner zip pocket.') },
        { name: 'Beaded Bracelet Set',         slug: 'beaded-bracelet-set',         categorySlug: 'accessories',  price: { price: 499,  discountedPrice: 349  }, stock: { quantity: 200 }, media: px(1191515),  additionalInfoSections: d('Set of 4 natural stone beaded bracelets — stackable.') },
        { name: 'Leather Card Holder',         slug: 'leather-card-holder',         categorySlug: 'accessories',  price: { price: 799,  discountedPrice: 599  }, stock: { quantity: 90  }, media: px(1152078),  additionalInfoSections: d('Ultra-slim genuine leather, holds up to 6 cards.') },

        // ══════════════════════════════
        //  HOME & KITCHEN  (10)
        // ══════════════════════════════
        { name: 'Pour-Over Coffee Set',        slug: 'pour-over-coffee-set',        categorySlug: 'home-kitchen', price: { price: 1899, discountedPrice: 1499 }, stock: { quantity: 50  }, media: px(3735200),  additionalInfoSections: d('Borosilicate glass dripper with reusable steel filter.') },
        { name: 'Ceramic Dinner Set 16pc',     slug: 'ceramic-dinner-set-16pc',     categorySlug: 'home-kitchen', price: { price: 2499, discountedPrice: 1999 }, stock: { quantity: 30  }, media: px(242492),   additionalInfoSections: d('16-piece hand-glazed ceramic, microwave & dishwasher safe.') },
        { name: 'Bamboo Cutting Board',        slug: 'bamboo-cutting-board',        categorySlug: 'home-kitchen', price: { price: 799,  discountedPrice: 599  }, stock: { quantity: 90  }, media: px(1267320),  additionalInfoSections: d('Eco-friendly bamboo with juice groove and side handle.') },
        { name: 'Scented Soy Candle Set',      slug: 'scented-soy-candle-set',      categorySlug: 'home-kitchen', price: { price: 1299, discountedPrice: 999  }, stock: { quantity: 80  }, media: px(3951745),  additionalInfoSections: d('Set of 3 — lavender, vanilla, sandalwood, 40-hr burn.') },
        { name: 'Cast Iron Skillet 10"',       slug: 'cast-iron-skillet-10',        categorySlug: 'home-kitchen', price: { price: 2999, discountedPrice: 2299 }, stock: { quantity: 40  }, media: px(1618911),  additionalInfoSections: d('Pre-seasoned cast iron, oven-safe up to 500°F.') },
        { name: 'Electric Kettle 1.7L',        slug: 'electric-kettle-1-7l',        categorySlug: 'home-kitchen', price: { price: 1499, discountedPrice: 1099 }, stock: { quantity: 65  }, media: localImg('electric-kettle.png'), additionalInfoSections: d('Rapid boil, keep-warm function, concealed element.') },
        { name: 'Non-Stick Cookware Set 5pc',  slug: 'non-stick-cookware-set-5pc',  categorySlug: 'home-kitchen', price: { price: 3999, discountedPrice: 2999 }, stock: { quantity: 25  }, media: px(1618914),  additionalInfoSections: d('PFOA-free granite coating, induction compatible.') },
        { name: 'Vacuum Food Container Set',   slug: 'vacuum-food-container-set',   categorySlug: 'home-kitchen', price: { price: 1199, discountedPrice: 899  }, stock: { quantity: 70  }, media: px(3692887),  additionalInfoSections: d('Set of 5 airtight vacuum-seal containers with pump.') },
        { name: 'Wooden Serving Board',        slug: 'wooden-serving-board',        categorySlug: 'home-kitchen', price: { price: 1099, discountedPrice: 849  }, stock: { quantity: 55  }, media: localImg('wooden-board.png'), additionalInfoSections: d('Acacia wood charcuterie & serving board with handles.') },
        { name: 'French Press Coffee Maker',   slug: 'french-press-coffee-maker',   categorySlug: 'home-kitchen', price: { price: 999,  discountedPrice: 749  }, stock: { quantity: 85  }, media: px(2860601),  additionalInfoSections: d('800ml borosilicate glass press with stainless steel filter.') },

        // ══════════════════════════════
        //  SPORTS  (10)
        // ══════════════════════════════
        { name: 'Yoga Mat Premium 6mm',        slug: 'yoga-mat-premium-6mm',        categorySlug: 'sports',       price: { price: 999,  discountedPrice: 799  }, stock: { quantity: 100 }, media: px(1812964),  additionalInfoSections: d('6mm non-slip mat with alignment lines and carry strap.') },
        { name: 'Resistance Band Set 5pc',     slug: 'resistance-band-set-5pc',     categorySlug: 'sports',       price: { price: 699,  discountedPrice: 499  }, stock: { quantity: 150 }, media: px(703012),   additionalInfoSections: d('5 resistance levels 10–50 lbs, door anchor included.') },
        { name: 'Insulated Water Bottle 1L',   slug: 'insulated-water-bottle-1l',   categorySlug: 'sports',       price: { price: 1299, discountedPrice: 999  }, stock: { quantity: 200 }, media: px(1230157),  additionalInfoSections: d('Double-wall stainless — cold 24h, hot 12h, leakproof.') },
        { name: 'Adjustable Dumbbell Set',     slug: 'adjustable-dumbbell-set',     categorySlug: 'sports',       price: { price: 7999, discountedPrice: 6499 }, stock: { quantity: 20  }, media: px(1552252),  additionalInfoSections: d('5–52.5 lbs per dumbbell with quick-lock dial.') },
        { name: 'Jump Rope Speed',             slug: 'jump-rope-speed',             categorySlug: 'sports',       price: { price: 499,  discountedPrice: 349  }, stock: { quantity: 180 }, media: px(3775566),  additionalInfoSections: d('Ball-bearing handles, adjustable PVC cable.') },
        { name: 'Pull-Up Bar Doorway',         slug: 'pull-up-bar-doorway',         categorySlug: 'sports',       price: { price: 1299, discountedPrice: 999  }, stock: { quantity: 60  }, media: px(1954524),  additionalInfoSections: d('No-screw doorway mount, foam grips, 150kg max.') },
        { name: 'Foam Roller Deep Tissue',     slug: 'foam-roller-deep-tissue',     categorySlug: 'sports',       price: { price: 799,  discountedPrice: 599  }, stock: { quantity: 90  }, media: px(4498166),  additionalInfoSections: d('High-density EPE foam, textured surface for deep massage.') },
        { name: 'Gym Gloves Padded',           slug: 'gym-gloves-padded',           categorySlug: 'sports',       price: { price: 599,  discountedPrice: 449  }, stock: { quantity: 120 }, media: px(3253501),  additionalInfoSections: d('Anti-slip palm pad, breathable mesh back, wrist wrap.') },
        { name: 'Ab Wheel Roller',             slug: 'ab-wheel-roller',             categorySlug: 'sports',       price: { price: 699,  discountedPrice: 499  }, stock: { quantity: 100 }, media: px(3289711),  additionalInfoSections: d('Dual-wheel stability, non-slip treads, knee pad included.') },
        { name: 'Sports Gym Bag 45L',          slug: 'sports-gym-bag-45l',          categorySlug: 'sports',       price: { price: 1599, discountedPrice: 1199 }, stock: { quantity: 70  }, media: px(1105666),  additionalInfoSections: d('Wet/dry separation, shoe compartment, water-resistant base.') },
    ]);

});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Express server running on port ${PORT}`));