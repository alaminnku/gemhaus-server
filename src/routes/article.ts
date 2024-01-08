import { Router } from 'express';
import Article from '../models/article';
import { deleteFields, resizeImage } from '../lib/utils';
import { upload } from '../config/multer';
import { uploadImage } from '../config/s3';

const router = Router();

// Create an article
router.post('/', upload, async (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    console.log('Please provide all fields');
    res.status(400);
    throw new Error('Please provide all fields');
  }

  let image;
  if (req.file) {
    const { buffer, mimetype } = req.file;
    const modifiedBuffer = await resizeImage(res, buffer, 800, 500);
    image = await uploadImage(res, modifiedBuffer, mimetype);
  }

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
