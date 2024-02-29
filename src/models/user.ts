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
    image: {
      type: String,
      default: null,
      required: false,
    },
    role: {
      type: String,
      enum: ['ADMIN', 'USER'],
      required: [true, 'Please provide a role'],
    },
    password: {
      type: String,
      trim: true,
      required: [true, 'Please provide a password'],
    },
  },
  {
    timestamps: true,
  }
);

export default model('User', userSchema);
