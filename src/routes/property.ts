import { Router } from 'express';
import { requiredFields, unauthorized } from '../lib/messages';
import {
  createImageId,
  deleteFields,
  deleteImage,
  fetchHostawayData,
  upload,
} from '../lib/utils';
import { uploadImage } from '../lib/utils';
import Property from '../models/property';
import { gateway } from '../config/braintree';
import { HostawayCalendar } from '../types';
import { propertyOfferings } from '../data/offerings';
import auth from '../middleware/auth';

const router = Router();

// Create a property
router.post('/', auth, upload.array('files'), async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    console.log(unauthorized);
    res.status(403);
    throw new Error(unauthorized);
  }

  const files = req.files as Express.Multer.File[];
  const {
    hostawayId,
    name,
    price,
    guests,
    rating,
    bedrooms,
    bathrooms,
    offerings,
    latitude,
    longitude,
    cleaningFee,
    description,
    isFeatured,
    insuranceFee,
    serviceFeePercent,
    salesTaxPercent,
    lodgingTaxPercent,
  } = req.body;

  // Validate data
  if (
    !hostawayId ||
    !name ||
    !price ||
    !guests ||
    !rating ||
    !bedrooms ||
    !latitude ||
    !longitude ||
    !bathrooms ||
    !cleaningFee ||
    !description ||
    !insuranceFee ||
    !serviceFeePercent ||
    !salesTaxPercent ||
    !lodgingTaxPercent ||
    offerings.length === 0
  ) {
    console.log(requiredFields);
    res.status(400);
    throw new Error(requiredFields);
  }
  if (files.length < 5) {
    console.log('At least five images are required');
    res.status(400);
    throw new Error('At least five images are required');
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
      guests,
      rating,
      images,
      bedrooms,
      bathrooms,
      latitude,
      longitude,
      cleaningFee,
      description,
      insuranceFee,
      salesTaxPercent,
      lodgingTaxPercent,
      serviceFeePercent,
      isFeatured: isFeatured ? true : false,
      offerings: propertyOfferings.filter((offering) =>
        offerings.includes(offering.name)
      ),
    });
    const property = response.toObject();
    deleteFields(property, ['createdAt']);
    res.status(201).json(property);
  } catch (err) {
    console.log(err);
    throw err;
  }
});

// Update a property
router.patch('/:id/update', auth, upload.array('files'), async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    console.log(unauthorized);
    res.status(403);
    throw new Error(unauthorized);
  }
  const { id } = req.params;
  const files = req.files as Express.Multer.File[];

  const {
    hostawayId,
    name,
    price,
    guests,
    rating,
    images,
    bedrooms,
    bathrooms,
    offerings,
    latitude,
    longitude,
    cleaningFee,
    description,
    isFeatured,
    insuranceFee,
    deletedImages,
    serviceFeePercent,
    salesTaxPercent,
    lodgingTaxPercent,
  } = req.body;

  // Validate data
  if (
    !hostawayId ||
    !name ||
    !price ||
    !guests ||
    !rating ||
    !bedrooms ||
    !latitude ||
    !longitude ||
    !bathrooms ||
    !cleaningFee ||
    !description ||
    !insuranceFee ||
    !serviceFeePercent ||
    !salesTaxPercent ||
    !lodgingTaxPercent ||
    offerings.length === 0
  ) {
    console.log(requiredFields);
    res.status(400);
    throw new Error(requiredFields);
  }
  const prevImages = JSON.parse(images);
  if (prevImages.length + files.length < 5) {
    console.log('At least five images are required');
    res.status(400);
    throw new Error('At least five images are required');
  }

  // Upload new images to S3
  let updatedImages = prevImages;
  for (let i = 0; i < files.length; i++) {
    const { buffer, mimetype } = files[i];
    const image = await uploadImage(res, buffer, mimetype);
    updatedImages.push(image);
  }

  // Update property
  try {
    await Property.findByIdAndUpdate(id, {
      hostawayId,
      name,
      price,
      guests,
      rating,
      bedrooms,
      bathrooms,
      latitude,
      longitude,
      cleaningFee,
      description,
      insuranceFee,
      salesTaxPercent,
      lodgingTaxPercent,
      serviceFeePercent,
      images: updatedImages,
      isFeatured: isFeatured ? true : false,
      offerings: propertyOfferings.filter((offering) =>
        offerings.includes(offering.name)
      ),
    });

    // Delete images from S3
    const deletedUrls = JSON.parse(deletedImages);
    for (const deletedUrl of deletedUrls) {
      const id = createImageId(deletedUrl);
      await deleteImage(res, id);
    }
    res.status(200).json({ message: 'Property updated' });
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

// Get offerings
router.get('/offerings', async (req, res) => {
  res.status(200).json(propertyOfferings);
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
router.post('/:id/book', upload.none(), async (req, res) => {
  const { id } = req.params;
  const {
    nonce,
    name,
    email,
    phone,
    zipCode,
    address,
    city,
    state,
    country,
    numberOfGuests,
    arrivalDate,
    departureDate,
  } = req.body;

  if (
    !nonce ||
    !name ||
    !email ||
    !phone ||
    !address ||
    !city ||
    !state ||
    !zipCode ||
    !country ||
    !numberOfGuests ||
    !arrivalDate ||
    !departureDate
  ) {
    console.log(requiredFields);
    res.status(400);
    throw new Error(requiredFields);
  }

  try {
    const property = await Property.findById(id).lean().orFail();
    if (numberOfGuests > property.guests) {
      console.log(`Maximum ${property.guests} guests allowed`);
      res.status(400);
      throw new Error(`Maximum ${property.guests} guests allowed`);
    }

    const calendar: HostawayCalendar = await fetchHostawayData(
      `/listings/${property.hostawayId}/calendar`
    );

    // All dates between check in and checkout
    const datesMap: { [key: string]: boolean } = {};
    const currDate = new Date(arrivalDate);
    while (currDate < new Date(departureDate)) {
      datesMap[currDate.toISOString().split('T')[0]] = true;
      currDate.setDate(currDate.getDate() + 1);
    }
    const bookingDates = calendar.filter((el) => datesMap[el.date]);

    // Check if all booking dates are available
    if (!bookingDates.every((el) => el.status === 'available')) {
      console.log('Invalid booking dates');
      res.status(400);
      throw new Error('Invalid booking dates');
    }
    // Check for minimum stays
    const minimumStay = calendar[0].minimumStay;
    if (bookingDates.length < minimumStay) {
      console.log(`Minimum stay is ${minimumStay} nights`);
      res.status(400);
      throw new Error(`Minimum stay is ${minimumStay} nights`);
    }

    // Nights' total
    const price = bookingDates.reduce((acc, curr) => acc + curr.price, 0);

    // Taxes and total price
    const lodgingTax = (price * property.lodgingTaxPercent) / 100;
    const salesTax = (price * property.salesTaxPercent) / 100;
    const totalPrice =
      price +
      salesTax +
      lodgingTax +
      property.cleaningFee +
      property.insuranceFee +
      (price * property.serviceFeePercent) / 100;

    // Make payment
    const payment = await gateway.transaction.sale({
      amount: totalPrice.toFixed(2),
      paymentMethodNonce: nonce,
      options: {
        submitForSettlement: true,
      },
      customer: {
        email,
      },
    });

    if (!payment.success) {
      console.log('Payment failed');
      res.status(500);
      throw new Error('Payment failed');
    }

    // Hostaway reservation data
    const data = {
      channelId: 2000,
      listingMapId: property.hostawayId,
      guestName: name,
      guestFirstName: name,
      guestLastName: name,
      guestZipCode: zipCode,
      guestAddress: address,
      guestCity: city,
      guestCountry: country,
      guestEmail: email,
      numberOfGuests,
      arrivalDate,
      departureDate,
      phone,
      totalPrice,
      cleaningFee: property.cleaningFee,
      adults: numberOfGuests,
      children: null,
      infants: null,
      pets: null,
      currency: 'USD',
      guestLocale: 'en',
      checkInTime: 16,
      checkOutTime: 11,
      guestPicture: null,
      taxAmount: lodgingTax + salesTax,
    };

    // Create Hostaway reservation
    await fetchHostawayData(`/reservations?forceOverbooking=1`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Save user data to database

    res.status(200).json({ message: 'Property booked' });
  } catch (err) {
    console.log(err);
    throw err;
  }
});

export default router;
