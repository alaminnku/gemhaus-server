import { Router, response } from 'express';
import { requiredFields } from '../lib/messages';
import {
  deleteFields,
  getHostawayAccessToken,
  getISODate,
  upload,
} from '../lib/utils';
import { uploadImage } from '../config/s3';
import Property from '../models/property';
import { gateway } from '../config/braintree';
import axios from 'axios';
import { HostawayDate } from '../types';

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
  const {
    nonce,
    firstName,
    lastName,
    email,
    phone,
    zipCode,
    address,
    city,
    country,
    numberOfGuests,
    arrivalDate,
    departureDate,
  } = req.body;

  try {
    const property = await Property.findById(id).lean().orFail();
    const accessToken = await getHostawayAccessToken();
    const calendarResponse = await axios.get(
      `${process.env.HOSTAWAY_API_URL}/listings/${property.hostawayId}/calendar`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const calendar: HostawayDate[] = calendarResponse.data.result;

    // All dates between check in and checkout
    const dates: { [key: string]: boolean } = {};
    const currDate = new Date(arrivalDate);
    while (currDate <= new Date(departureDate)) {
      dates[getISODate(currDate)] = true;
      currDate.setDate(currDate.getDate() + 1);
    }
    const bookingDates = calendar.filter((el) => dates[el.date]);

    if (!bookingDates.every((el) => el.status === 'available')) {
      console.log('Invalid booking dates');
      res.status(400);
      throw new Error('Invalid booking dates');
    }

    // Nights' total
    const price = bookingDates.reduce((acc, curr) => acc + curr.price, 0);
    const totalPrice =
      price +
      property.cleaningFee +
      property.insuranceFee +
      (price * property.serviceFeePercent) / 100 +
      (price * property.lodgingTaxPercent) / 100 +
      (price * property.salesTaxPercent) / 100;

    // Make payment
    const payment = await gateway.transaction.sale({
      amount: totalPrice.toString(),
      paymentMethodNonce: nonce,
      options: {
        submitForSettlement: true,
      },
    });

    const data = {
      channelId: 2000,
      listingMapId: property.hostawayId,
      guestName: `${firstName} ${lastName}`,
      guestFirstName: firstName,
      guestLastName: lastName,
      guestZipCode: zipCode,
      guestAddress: address,
      guestCity: city,
      guestCountry: country,
      guestEmail: email,
      numberOfGuests,
      arrivalDate,
      departureDate,
      checkInTime: 16,
      checkOutTime: 11,
      phone,
      totalPrice,
      cleaningFee: property.cleaningFee,

      // Update later
      adults: numberOfGuests,
      children: null,
      infants: null,
      pets: null,
      taxAmount: null,
      currency: 'USD',
      guestLocale: 'en',

      // What are these
      isManuallyChecked: 0,
      isInitial: 0,
      guestRecommendations: 0,
      guestTrips: 0,
      guestWork: null,
      isGuestIdentityVerified: 0,
      isGuestVerifiedByEmail: 0,
      isGuestVerifiedByWorkEmail: 0,
      isGuestVerifiedByFacebook: 0,
      isGuestVerifiedByGovernmentId: 0,
      isGuestVerifiedByPhone: 0,
      isGuestVerifiedByReviews: 0,
      channelCommissionAmount: 0,
      securityDepositFee: 0,
      isPaid: null,
      hostNote: null,
      guestNote: null,
      doorCode: null,
      doorCodeVendor: null,
      doorCodeInstruction: null,
      comment: null,
      airbnbExpectedPayoutAmount: 111.12,
      airbnbListingBasePrice: 110,
      airbnbListingCancellationHostFee: 12.02,
      airbnbListingCancellationPayout: 122,
      airbnbListingCleaningFee: 1,
      airbnbListingHostFee: 43,
      airbnbListingSecurityPrice: 12,
      airbnbOccupancyTaxAmountPaidToHost: 332,
      airbnbTotalPaidAmount: 12,
      airbnbTransientOccupancyTaxPaidAmount: 0,
      airbnbCancellationPolicy: 'moderate',
      customerUserId: null,
      customFieldValues: [],
    };

    // Create Hostaway reservation
    // const reservationResponse = await axios.post(
    //   `${process.env.HOSTAWAY_API_URL}/reservations?forceOverbooking=1`,
    //   data,
    //   { headers: { Authorization: `Bearer ${accessToken}` } }
    // );

    // Save reservation data to database

    res.status(200).json({ status: 'success' });
  } catch (err) {
    console.log(err);
    throw err;
  }
});

export default router;
