import { Router } from 'express';
import { requiredFields } from '../lib/messages';
import { deleteFields, upload } from '../lib/utils';
import { uploadImage } from '../config/s3';
import Property from '../models/property';
import { gateway } from '../config/braintree';

const router = Router();

// Create a property
router.post('/', upload.array('files'), async (req, res) => {
  const files = req.files as Express.Multer.File[];
  const {
    hostawayId,
    name,
    price,
    beds,
    baths,
    guests,
    rating,
    isFeatured,
    insuranceFee,
    cleaningFee,
    description,
    serviceFeePercent,
    salesTaxPercent,
    lodgingTaxPercent,
  } = req.body;

  // Validate data
  if (
    !hostawayId ||
    !name ||
    !price ||
    !beds ||
    !baths ||
    !guests ||
    !rating ||
    !description ||
    files.length === 0 ||
    !insuranceFee ||
    !cleaningFee ||
    !serviceFeePercent ||
    !salesTaxPercent ||
    !lodgingTaxPercent
  ) {
    console.log(requiredFields);
    res.status(400);
    throw new Error(requiredFields);
  }

  // Upload images to S3
  let images = [];
  for (let i = 0; i < files.length; i++) {
    const { buffer, mimetype } = files[i];
    const image = await uploadImage(res, buffer, mimetype);
    images.push(image);
  }

  // Create property
  try {
    const response = await Property.create({
      hostawayId,
      name,
      price,
      beds,
      baths,
      guests,
      rating,
      images,
      description,
      insuranceFee,
      cleaningFee,
      serviceFeePercent,
      salesTaxPercent,
      lodgingTaxPercent,
      isFeatured: isFeatured ? true : false,
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
router.get('/', async (req, res) => {
  try {
    const properties = await Property.find().lean().orFail();
    res.status(200).json(properties);
  } catch (err) {
    console.log(err);
    throw err;
  }
});

// Get a single property
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const property = await Property.findById(id)
      .select('-updatedAt -createdAt -__v')
      .lean()
      .orFail();
    res.status(200).json(property);
  } catch (err) {
    console.log(err);
    throw err;
  }
});

// Book a property
router.post('/:id/reserve', upload.none(), async (req, res) => {
  const { id } = req.params;
  const { nonce, firstName, lastName, email, phone } = req.body;

  try {
    const payment = await gateway.transaction.sale({
      amount: '10.00',
      paymentMethodNonce: nonce,
      options: {
        submitForSettlement: true,
      },
    });

    res.status(200).json({ id, firstName });
  } catch (err) {
    console.log(err);
    throw err;
  }
});

export default router;
