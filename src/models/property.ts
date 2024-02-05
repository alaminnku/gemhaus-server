import { Schema, model } from 'mongoose';
import { PropertySchema } from '../types';

const propertySchema = new Schema<PropertySchema>(
  {
    hostawayId: {
      type: Number,
      required: [true, 'Please provide Hostaway id'],
    },
    name: {
      type: String,
      trim: true,
      required: [true, 'Please provide a name'],
    },
    price: {
      type: Number,
      required: [true, 'Please provide a price'],
    },
    bedrooms: {
      type: Number,
      required: [true, 'Please provide number of bedrooms'],
    },
    bathrooms: {
      type: Number,
      required: [true, 'Please provide number of bathrooms'],
    },
    guests: {
      type: Number,
      required: [true, 'Please provide number of guests'],
    },
    rating: {
      type: Number,
      required: [true, 'Please provide a rating'],
    },
    serviceFeePercent: {
      type: Number,
      required: [true, 'Please provide service fee'],
    },
    salesTaxPercent: {
      type: Number,
      required: [true, 'Please provide sales tax'],
    },
    lodgingTaxPercent: {
      type: Number,
      required: [true, 'Please provide lodging tax'],
    },
    insuranceFee: {
      type: Number,
      required: [true, 'Please provide insurance fee'],
    },
    cleaningFee: {
      type: Number,
      required: [true, 'Please provide cleaning fee'],
    },
    isFeatured: {
      type: Boolean,
    },
    description: {
      type: String,
      trim: true,
      required: [true, 'Please provide  description'],
    },
    images: [
      {
        type: String,
        trim: true,
        required: [true, 'Please provide property images'],
      },
    ],
    offerings: [
      {
        name: {
          type: String,
          trim: true,
          required: [true, 'Please provide offering name'],
        },
        icon: {
          type: String,
          trim: true,
          required: [true, 'Please provide offering icon'],
        },
      },
    ],
    availableDates: [],
  },
  {
    timestamps: true,
  }
);

export default model('Property', propertySchema);
