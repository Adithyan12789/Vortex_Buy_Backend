import express from 'express';
import Product from '../models/Product.js';

const router = express.Router();

// Get all products with filters
router.get('/', async (req, res) => {
  try {
    const {
      category,
      name,
      type,
      minPrice,
      maxPrice,
      sort,
      page = 1,
      limit = 8
    } = req.query;

    const query = { isActive: true };

    if (category) query.category = category;
    if (name) query.$text = { $search: name };
    if (type) query.productType = type;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortOption = {};
    if (sort) {
      const [sortType, sortBy] = sort.split(' ');
      sortOption[sortBy] = sortType === 'asc' ? 1 : -1;
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sortOption)
      .limit(Number(limit))
      .skip(skip);

    const total = await Product.countDocuments(query);
    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      products,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalProducts: total,
        hasNext: Number(page) < totalPages,
        hasPrev: Number(page) > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single product by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const product = await Product.findOne({ 
      slug: req.params.slug,
      isActive: true 
    }).populate('category', 'name slug');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
