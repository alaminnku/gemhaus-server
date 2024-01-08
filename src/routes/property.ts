import { Router } from 'express';
import { uploadMultiple } from '../config/multer';
import { requiredFields } from '../lib/messages';
import { deleteFields, resizeImage } from '../lib/utils';
import { uploadImage } from '../config/s3';
import Property from '../models/property';

const router = Router();

// Create a property
router.post('/', uploadMultiple, async (req, res) => {
  const { name, price, beds, baths, guests, rating, isFeatured, description } =
    req.body;

  // Validate data
  if (
    !name ||
    !price ||
    !beds ||
    !baths ||
    !guests ||
    !rating ||
    !isFeatured ||
    !description
  ) {
    console.log(requiredFields);
    res.status(400);
    throw new Error(requiredFields);
  }

  // Upload images to S3
  let images = [];
  if (req.files) {
    const files = req.files as Express.Multer.File[];
    for (let i = 0; i < files.length; i++) {
      const { buffer, mimetype } = files[i];
      const modifiedBuffer = await resizeImage(res, buffer, 800, 500);
      const image = await uploadImage(res, modifiedBuffer, mimetype);
      images.push(image);
    }
  }

  // Create property
  try {
    const response = await Property.create({
      name,
      price,
      beds,
      baths,
      guests,
      rating,
      images,
      isFeatured,
      description,
    });
    const property = response.toObject();
    deleteFields(property, ['createdAt']);
    res.status(201).json(property);
  } catch (err) {
    console.log(err);
    throw err;
  }
});

// Get all properties
router.get('/', async (req, res) => {});

export default router;
