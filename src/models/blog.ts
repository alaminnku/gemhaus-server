import { Schema, model } from 'mongoose';
import { BlogSchema } from '../types';

const blogSchema = new Schema<BlogSchema>(
  {
    title: {
      type: String,
      trim: true,
      required: [true, 'Please provide a title'],
    },
    slug: {
      type: String,
      trim: true,
      required: [true, 'Please provide a slug'],
    },
    content: {
      type: String,
      trim: true,
      required: [true, 'Please provide content'],
    },
    image: {
      type: String,
      trim: true,
      required: [true, 'Please provide an image'],
    },
  },
  {
    timestamps: true,
  }
);

export default model('Blog', blogSchema);
