import { Schema, model } from 'mongoose';

const subscriberSchema = new Schema(
  {
    email: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
      required: [true, 'Please provide an email'],
    },
  },
  {
    timestamps: true,
  }
);

export default model('Subscriber', subscriberSchema);
