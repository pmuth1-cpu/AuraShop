import express from 'express';
import multer from 'multer';
import { uploadToCloudinary } from '../uploads.js';
import { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory } from '../db.js';
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
    let imageUrl = req.body.image || '';
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer, 'categories');
    }
    const cat = await createCategory({
      name: req.body.name,
      image: imageUrl,
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
    if (req.file) {
      data.image = await uploadToCloudinary(req.file.buffer, 'categories');
    }
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
    res.json({ message: 'Category deleted.' });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ message: err.message });
  }
});

export default router;