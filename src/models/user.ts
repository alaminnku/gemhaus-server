import { UserSchema } from '../types';
import { Schema, model } from 'mongoose';

const userSchema = new Schema<UserSchema>(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'Please provide a name'],
    },
    email: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
      required: [true, 'Please provide an email'],
    },
    role: {
      type: String,
      enum: ['ADMIN', 'USER', 'AGENT'],
      required: [true, 'Please provide a role'],
    },
    password: {
      type: String,
      trim: true,
      required: false,
    },
    image: {
      type: String,
      trim: true,
      required: false,
    },
    phone: {
      type: String,
      trim: true,
      required: false,
    },
    address: {
      type: String,
      trim: true,
      required: false,
    },
    bio: {
      type: String,
      trim: true,
      required: false,
    },
    qrCodeLink: {
      type: String,
      trim: true,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export default model('User', userSchema);
