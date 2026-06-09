import express from 'express';
import multer from 'multer';
import { uploadToCloudinary } from '../uploads.js';
import { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(file.originalname.toLowerCase().split('.').pop());
    const mime = allowed.test(file.mimetype.replace('image/', '').split('+')[0]);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only image files are allowed.'));
  },
});

router.get('/', async (req, res) => {
  try {
    const products = await getAllProducts(req.query);
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

router.post('/', verifyToken, upload.single('image'), async (req, res) => {
  try {
    let imageUrl = req.body.image || '';
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer, 'products');
    }
    const product = await createProduct({
      ...req.body,
      price: Number(req.body.price),
      stock: Number(req.body.stock) || 0,
      inStock: req.body.inStock === 'true' || req.body.inStock === true,
      featured: req.body.featured === 'true' || req.body.featured === true,
      image: imageUrl,
    });
    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(400).json({ message: 'Error creating product.', error: error.message });
  }
});

router.put('/:id', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.price !== undefined) data.price = Number(data.price);
    if (data.stock !== undefined) data.stock = Number(data.stock) || 0;
    if (data.inStock !== undefined) data.inStock = data.inStock === 'true' || data.inStock === true;
    if (data.featured !== undefined) data.featured = data.featured === 'true' || data.featured === true;
    if (req.file) {
      data.image = await uploadToCloudinary(req.file.buffer, 'products');
    }

    const product = await updateProduct(req.params.id, data);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    res.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(400).json({ message: 'Error updating product.', error: error.message });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteProduct(id);
    if (!deleted) return res.status(404).json({ message: 'Product not found.' });
    res.json({ message: 'Product deleted successfully.' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

export default router;