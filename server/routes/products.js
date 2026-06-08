import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only image files are allowed.'));
  },
});

// ===== PUBLIC =====

router.get('/', (req, res) => {
  try {
    const products = getAllProducts(req.query);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const product = getProductById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// ===== ADMIN (Protected) =====

router.post('/', verifyToken, upload.single('image'), (req, res) => {
  try {
    const product = createProduct({
      ...req.body,
      image: req.file ? `/uploads/${req.file.filename}` : '',
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: 'Error creating product.', error: error.message });
  }
});

router.put('/:id', verifyToken, upload.single('image'), (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.image = `/uploads/${req.file.filename}`;

    const product = updateProduct(req.params.id, data);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: 'Error updating product.', error: error.message });
  }
});

router.delete('/:id', verifyToken, (req, res) => {
  try {
    const { id } = req.params;
    console.log('Delete product request for id:', id);
    const deleted = deleteProduct(id);
    console.log('Deleted product result:', deleted);
    if (!deleted) return res.status(404).json({ message: 'Product not found.' });

    if (deleted.image) {
      const imagePath = path.join(__dirname, '..', deleted.image);
      console.log('Attempting to delete image at:', imagePath);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log('Image deleted successfully');
      } else {
        console.log('Image file not found, skipping');
      }
    }

    res.json({ message: 'Product deleted successfully.' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

export default router;