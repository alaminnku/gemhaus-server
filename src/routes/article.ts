import { Router } from 'express';
import Article from '../models/article';
import { deleteFields, upload } from '../lib/utils';
import { uploadImage } from '../config/s3';
import { requiredFields, unauthorized } from '../lib/messages';
import auth from '../middleware/auth';

const router = Router();

// Create an article
router.post('/', auth, upload.single('file'), async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    console.log(unauthorized);
    res.status(403);
    throw new Error(unauthorized);
  }

  const file = req.file;
  const { title, content } = req.body;

  // Validate data
  if (!title || !content || !file) {
    console.log(requiredFields);
    res.status(400);
    throw new Error(requiredFields);
  }

  // Upload image to S3
  const { buffer, mimetype } = file;
  const image = await uploadImage(res, buffer, mimetype);

  // Create article
  try {
    const response = await Article.create({ title, content, image });
    const article = response.toObject();
    deleteFields(article, ['createdAt']);
    res.status(201).json(article);
  } catch (err) {
    console.log(err);
    throw err;
  }
});

// Update an article
router.patch('/:id/update', auth, upload.none(), async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    console.log(unauthorized);
    res.status(403);
    throw new Error(unauthorized);
  }
  const { id } = req.params;
  const { title, content } = req.body;

  // Validate data
  if (!title || !content) {
    console.log(requiredFields);
    res.status(400);
    throw new Error(requiredFields);
  }

  // Update article
  try {
    await Article.findByIdAndUpdate(id, { title, content });
    res.status(201).json({ message: 'Article updated' });
  } catch (err) {
    console.log(err);
    throw err;
  }
});

// Get all articles
router.get('/', async (req, res) => {
  try {
    const articles = await Article.find().lean().orFail();
    res.status(200).json(articles);
  } catch (err) {
    console.log(err);
    throw err;
  }
});

// Get a single article
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const article = await Article.findById(id)
      .select('-updatedAt')
      .lean()
      .orFail();
    res.status(200).json(article);
  } catch (err) {
    console.log(err);
    throw err;
  }
});

export default router;
