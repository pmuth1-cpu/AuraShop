import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory } from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

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
    if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed.'));
  },
});

router.get('/', async (req, res) => {
  try {
    const categories = await getCategories();
    res.json(categories);
  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const cat = await getCategoryById(req.params.id);
    if (!cat) return res.status(404).json({ message: 'Category not found.' });
    res.json(cat);
  } catch (err) {
    console.error('Get category error:', err);
    res.status(500).json({ message: err.message });
  }
});

router.post('/', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const cat = await createCategory({
      name: req.body.name,
      image: req.file ? `/uploads/${req.file.filename}` : (req.body.image || ''),
    });
    res.status(201).json(cat);
  } catch (err) {
    console.error('Create category error:', err);
    res.status(400).json({ message: 'Error creating category.', error: err.message });
  }
});

router.put('/:id', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const data = { name: req.body.name };
    if (req.file) data.image = `/uploads/${req.file.filename}`;
    const cat = await updateCategory(req.params.id, data);
    if (!cat) return res.status(404).json({ message: 'Category not found.' });
    res.json(cat);
  } catch (err) {
    console.error('Update category error:', err);
    res.status(400).json({ message: 'Error updating category.', error: err.message });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const deleted = await deleteCategory(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Category not found.' });
    if (deleted.image) {
      const imagePath = path.join(__dirname, '..', deleted.image);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }
    res.json({ message: 'Category deleted.' });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
