import { Router } from 'express';
import { requiredFields } from '../lib/messages';
import {
  deleteFields,
  fetchHostawayData,
  getISODate,
  upload,
} from '../lib/utils';
import { uploadImage } from '../config/s3';
import Property from '../models/property';
import { gateway } from '../config/braintree';
import { HostawayCalendar } from '../types';

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
router.post('/:id/book', upload.none(), async (req, res) => {
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
    state,
    country,
    numberOfGuests,
    arrivalDate,
    departureDate,
  } = req.body;

  if (
    !firstName ||
    !lastName ||
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
    const calendar: HostawayCalendar = await fetchHostawayData(
      `/listings/${property.hostawayId}/calendar`
    );

    // All dates between check in and checkout
    const dates: { [key: string]: boolean } = {};
    const currDate = new Date(arrivalDate);
    while (currDate <= new Date(departureDate)) {
      dates[getISODate(currDate)] = true;
      currDate.setDate(currDate.getDate() + 1);
    }
    const bookingDates = calendar.filter((el) => dates[el.date]);

    // Check if all booking dates are available
    if (!bookingDates.every((el) => el.status === 'available')) {
      console.log('Invalid booking dates');
      res.status(400);
      throw new Error('Invalid booking dates');
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

      // // Where do we get these from?
      // isManuallyChecked: 0,
      // isInitial: 0,
      // guestRecommendations: 0,
      // guestTrips: 0,
      // guestWork: null,
      // isGuestIdentityVerified: 0,
      // isGuestVerifiedByEmail: 0,
      // isGuestVerifiedByWorkEmail: 0,
      // isGuestVerifiedByFacebook: 0,
      // isGuestVerifiedByGovernmentId: 0,
      // isGuestVerifiedByPhone: 0,
      // isGuestVerifiedByReviews: 0,
      // channelCommissionAmount: 0,
      // securityDepositFee: 0,
      // isPaid: null,
      // hostNote: null,
      // guestNote: null,
      // doorCode: null,
      // doorCodeVendor: null,
      // doorCodeInstruction: null,
      // comment: null,
      // customerUserId: null,
      // customFieldValues: [],

      // // Where do we get airbnb details from?
      // // Do we provide 0 or null to these values?
      // airbnbExpectedPayoutAmount: null,
      // airbnbListingBasePrice: null,
      // airbnbListingCancellationHostFee: null,
      // airbnbListingCancellationPayout: null,
      // airbnbListingCleaningFee: null,
      // airbnbListingHostFee: null,
      // airbnbListingSecurityPrice: null,
      // airbnbOccupancyTaxAmountPaidToHost: null,
      // airbnbTotalPaidAmount: null,
      // airbnbTransientOccupancyTaxPaidAmount: null,
      // airbnbCancellationPolicy: null,
    };

    console.log(totalPrice);

    // Create Hostaway reservation
    const reservationResponse = await fetchHostawayData(
      `/reservations?forceOverbooking=1`,
      {
        body: JSON.stringify(data),
      }
    );

    console.log(reservationResponse);

    // Save user data to database

    res.status(200).json({ status: 'success' });
  } catch (err) {
    console.log(err);
    throw err;
  }
});

export default router;
