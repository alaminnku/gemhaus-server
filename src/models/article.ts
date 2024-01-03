import { Schema, model } from 'mongoose';
import { ArticleSchema } from '../types';

const articleSchema = new Schema<ArticleSchema>(
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
      // trim: true,
      // required: [true, 'Please provide an image'],
    },
  },
  {
    timestamps: true,
  }
);

export default model('Article', articleSchema);
