const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync('uploads')) {
        fs.mkdirSync('uploads');
    }
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

router.get('/products', productController.getProducts);
router.post('/products', upload.array('images', 10), productController.createProduct);
router.get('/product/:slug', productController.getProductBySlug);
router.get('/categories', productController.getCategories);
router.get('/categories/:slug', productController.getCategoryBySlug);

module.exports = router;