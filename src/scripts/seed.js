import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

dotenv.config();

const categories = [
  {
    name: 'All Products',
    slug: 'all-products',
    description: 'Browse all our products',
    image: { url: '/category.png', alt: 'All Products' }
  },
  {
    name: 'New Arrivals',
    slug: 'new-arrivals',
    description: 'Check out our latest products',
    image: { url: '/category.png', alt: 'New Arrivals' }
  },
  {
    name: 'Electronics',
    slug: 'electronics',
    description: 'Latest gadgets and electronics',
    image: { url: '/category.png', alt: 'Electronics' }
  },
  {
    name: 'Fashion',
    slug: 'fashion',
    description: 'Trendy clothing and accessories',
    image: { url: '/category.png', alt: 'Fashion' }
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Product.deleteMany({});
    await Category.deleteMany({});
    console.log('Cleared existing data');

    // Insert categories
    const createdCategories = await Category.insertMany(categories);
    console.log('Categories created');

    // Create sample products
    const products = [
      {
        name: 'Wireless Headphones',
        slug: 'wireless-headphones',
        description: 'High-quality wireless headphones with noise cancellation',
        price: 99.99,
        discountedPrice: 79.99,
        images: [
          { url: '/product.png', alt: 'Wireless Headphones' }
        ],
        category: createdCategories[2]._id,
        stock: 50,
        productType: 'physical',
        additionalInfo: [
          { title: 'Features', description: 'Bluetooth 5.0, 30-hour battery life' },
          { title: 'shortDesc', description: 'Premium wireless audio experience' }
        ]
      },
      {
        name: 'Smart Watch',
        slug: 'smart-watch',
        description: 'Feature-rich smartwatch with fitness tracking',
        price: 199.99,
        images: [
          { url: '/product.png', alt: 'Smart Watch' }
        ],
        category: createdCategories[2]._id,
        stock: 30,
        productType: 'physical',
        additionalInfo: [
          { title: 'Features', description: 'Heart rate monitor, GPS, waterproof' },
          { title: 'shortDesc', description: 'Track your fitness goals' }
        ]
      },
      {
        name: 'Designer T-Shirt',
        slug: 'designer-t-shirt',
        description: 'Premium cotton t-shirt with modern design',
        price: 29.99,
        discountedPrice: 24.99,
        images: [
          { url: '/product.png', alt: 'Designer T-Shirt' }
        ],
        category: createdCategories[3]._id,
        stock: 100,
        productType: 'physical',
        variants: [
          { name: 'Size', options: ['S', 'M', 'L', 'XL'] },
          { name: 'Color', options: ['Black', 'White', 'Blue'] }
        ],
        additionalInfo: [
          { title: 'Material', description: '100% organic cotton' },
          { title: 'shortDesc', description: 'Comfortable and stylish' }
        ]
      },
      {
        name: 'Running Shoes',
        slug: 'running-shoes',
        description: 'Lightweight running shoes for maximum performance',
        price: 89.99,
        images: [
          { url: '/product.png', alt: 'Running Shoes' }
        ],
        category: createdCategories[3]._id,
        stock: 75,
        productType: 'physical',
        variants: [
          { name: 'Size', options: ['7', '8', '9', '10', '11'] }
        ],
        additionalInfo: [
          { title: 'Features', description: 'Breathable mesh, cushioned sole' },
          { title: 'shortDesc', description: 'Perfect for your daily run' }
        ]
      }
    ];

    await Product.insertMany(products);
    console.log('Products created');

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
