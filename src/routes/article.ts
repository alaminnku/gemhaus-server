import { Router } from 'express';
import Article from '../models/article';
import { deleteFields, resizeImage } from '../lib/utils';
import { uploadSingle } from '../config/multer';
import { uploadImage } from '../config/s3';
import { requiredFields } from '../lib/messages';

const router = Router();

// Create an article
router.post('/', uploadSingle, async (req, res) => {
  const { title, content } = req.body;

  // Validate data
  if (!title || !content) {
    console.log(requiredFields);
    res.status(400);
    throw new Error(requiredFields);
  }

  // Upload image to S3
  let image;
  if (req.file) {
    const { buffer, mimetype } = req.file;
    const modifiedBuffer = await resizeImage(res, buffer, 800, 500);
    image = await uploadImage(res, modifiedBuffer, mimetype);
  }

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
    const article = await Article.findById({ _id: id })
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
