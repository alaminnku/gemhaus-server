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
    beds: {
      type: Number,
      required: [true, 'Please provide number of beds'],
    },
    baths: {
      type: Number,
      required: [true, 'Please provide number of baths'],
    },
    guests: {
      type: Number,
      required: [true, 'Please provide number of guests'],
    },
    rating: {
      type: Number,
      required: [true, 'Please provide a rating'],
    },
    serviceFee: {
      type: Number,
      required: [true, 'Please provide service fee'],
    },
    salesTax: {
      type: Number,
      required: [true, 'Please provide sales tax'],
    },
    lodgingTax: {
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
  },
  {
    timestamps: true,
  }
);

export default model('Property', propertySchema);
