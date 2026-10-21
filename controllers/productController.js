const Product = require('../models/Product');
const Category = require('../models/Category');

exports.getProducts = async (req, res) => {
    try {
        const filter = {};

        // Category filter
        if (req.query.categoryId) filter.categorySlug = req.query.categoryId;
        if (req.query.cat)        filter.categorySlug = req.query.cat;

        // Full-text name search
        if (req.query.search) {
            filter.name = { $regex: req.query.search, $options: 'i' };
        }

        // Price range
        if (req.query.min || req.query.max) {
            filter['price.price'] = {};
            if (req.query.min) filter['price.price'].$gte = parseFloat(req.query.min);
            if (req.query.max) filter['price.price'].$lte = parseFloat(req.query.max);
        }

        // Exclude product
        if (req.query.exclude) {
            filter._id = { $ne: req.query.exclude };
        }

        // Deal products (discounted items)
        if (req.query.isDeals === 'true') {
            filter.$expr = { $lt: ["$price.discountedPrice", "$price.price"] };
        }

        // Sort
        let sort = {};
        switch (req.query.sort) {
            case 'price_asc':  sort = { 'price.price':  1 }; break;
            case 'price_desc': sort = { 'price.price': -1 }; break;
            case 'oldest':     sort = { createdAt:  1 };     break;
            case 'newest':
            default:           sort = { createdAt: -1 };
        }

        // Pagination
        const limit = Math.min(parseInt(req.query.limit) || 12, 50);
        const page  = Math.max(parseInt(req.query.page)  || 1,  1);
        const skip  = (page - 1) * limit;

        const [products, totalCount] = await Promise.all([
            Product.find(filter).sort(sort).skip(skip).limit(limit),
            Product.countDocuments(filter),
        ]);

        const totalPages = Math.ceil(totalCount / limit);

        res.json({
            items: products,
            totalCount,
            totalPages,
            currentPage: page,
            hasPrev: page > 1,
            hasNext: page < totalPages,
        });
    } catch (err) {
        console.error('getProducts error:', err);
        res.status(500).send('Server error');
    }
};

exports.createProduct = async (req, res) => {
    try {
        const { name, description, price, categorySlug, stock } = req.body;
        if (!name) return res.status(400).json({ msg: "Product name is required" });
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 10000);

        // Build media from uploaded files (req.files is an array with upload.array)
        const files = req.files || [];
        const fallbackUrl = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab';
        
        // Dynamic base URL for uploads
        const baseUrl = req.protocol + '://' + req.get('host');
        
        const imageUrls = files.length > 0
            ? files.map(f => `${baseUrl}/uploads/${f.filename}`)
            : [fallbackUrl];

        const product = new Product({
            name,
            slug,
            description,
            price: { price, discountedPrice: req.body.discountedPrice || price },
            categorySlug,
            stock: { quantity: stock || 0 },
            media: {
                items: imageUrls.map(url => ({ image: { url } })),
                mainMedia: { image: { url: imageUrls[0] } }
            }
        });
        await product.save();
        res.status(201).json(product);
    } catch (err) {
        console.error("Create Product Error:", err);
        res.status(500).json({ error: err.message, status: "Server error" });
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
};

exports.getCategoryBySlug = async (req, res) => {
    try {
        const category = await Category.findOne({ slug: req.params.slug });
        res.json({ collection: category });
    } catch (err) {
        res.status(500).send('Server error');
    }
};