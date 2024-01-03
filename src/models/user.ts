import { UserSchema } from '../types';
import { Schema, model } from 'mongoose';

const userSchema = new Schema<UserSchema>(
  {
    firstName: {
      type: String,
      trim: true,
      required: [true, 'Please provide first name'],
    },
    lastName: {
      type: String,
      trim: true,
      required: [true, 'Please provide last name'],
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
      enum: ['ADMIN'],
      required: [true, 'Please provide a role'],
    },
    password: {
      type: String,
      trim: true,
      required: [true, 'Please provide a password'],
    },
    status: {
      type: String,
      enum: ['ARCHIVED', 'ACTIVE'],
      required: [true, 'Please provide a status'],
    },
  },
  {
    timestamps: true,
  }
);

export default model('User', userSchema);
