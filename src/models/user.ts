import { UserProperty, UserSchema, UserTransaction } from '../types';
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
    properties: [
      new Schema<UserProperty>(
        {
          address: {
            type: String,
            trim: true,
            required: [true, 'Please provide property address'],
          },
          city: {
            type: String,
            trim: true,
            required: [true, 'Please provide property city'],
          },
          state: {
            type: String,
            trim: true,
            required: [true, 'Please provide property state'],
          },
          price: {
            type: Number,
            required: [true, 'Please provide property price'],
          },
          isFeatured: {
            type: Boolean,
            required: [true, 'Please provide isFeatured'],
          },
          images: [
            {
              type: String,
              trim: true,
              required: [true, 'Please provide property images'],
            },
          ],
          description: {
            type: String,
            trim: true,
            required: [true, 'Please provide property image'],
          },
        },
        { timestamps: true }
      ),
    ],
    transactions: [
      new Schema<UserTransaction>({
        address: {
          type: String,
          trim: true,
          required: [true, 'Please provide transaction address'],
        },
        type: {
          type: String,
          enum: ['sold', 'available'],
          required: [true, 'Please provide transaction address'],
        },
      }),
    ],
  },
  {
    timestamps: true,
  }
);

export default model('User', userSchema);
