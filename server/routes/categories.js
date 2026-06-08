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

router.get('/', (req, res) => {
  try { res.json(getCategories()); } 
  catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id', (req, res) => {
  try {
    const cat = getCategoryById(req.params.id);
    if (!cat) return res.status(404).json({ message: 'Category not found.' });
    res.json(cat);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', verifyToken, upload.single('image'), (req, res) => {
  try {
    const cat = createCategory({
      ...req.body,
      image: req.file ? `/uploads/${req.file.filename}` : '',
    });
    res.status(201).json(cat);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/:id', verifyToken, upload.single('image'), (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.image = `/uploads/${req.file.filename}`;
    const cat = updateCategory(req.params.id, data);
    if (!cat) return res.status(404).json({ message: 'Category not found.' });
    res.json(cat);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/:id', verifyToken, (req, res) => {
  try {
    const { id } = req.params;
    console.log('Delete category request for id:', id);
    const deleted = deleteCategory(id);
    console.log('Deleted category result:', deleted);
    if (!deleted) return res.status(404).json({ message: 'Category not found.' });
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
    res.json({ message: 'Category deleted.' });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ message: err.message });
  }
});

export default router;