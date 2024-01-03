import { Schema, model } from 'mongoose';
import { PropertySchema } from '../types';

const propertySchema = new Schema<PropertySchema>(
  {
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
    isFeatured: {
      type: Boolean,
    },
    description: {
      type: String,
      trim: true,
      required: [true, 'Please provide  description'],
    },
    image: {
      type: String,
      trim: true,
      required: [true, 'Please provide  an image'],
    },
  },
  {
    timestamps: true,
  }
);

export default model('Property', propertySchema);
