import { Response } from 'express';
import sharp from 'sharp';
import { randomBytes } from 'crypto';

// Delete unnecessary mongodb fields
export const deleteFields = (data: object, moreFields?: string[]): void => {
  let fields = ['__v', 'updatedAt'];

  if (moreFields) {
    fields = [...fields, ...moreFields];
  }

  fields.forEach((field) => delete data[field as keyof object]);
};

// Resize image
export async function resizeImage(
  res: Response,
  buffer: Buffer,
  width: number,
  height: number
) {
  try {
    return await sharp(buffer)
      .resize({
        width,
        height,
        fit: 'contain',
        background: { r: 255, g: 255, b: 255 },
      })
      .toBuffer();
  } catch (err) {
    console.log('Failed to resize image');
    res.status(500);
    throw new Error('Failed to resize image');
  }
}

// Generate random string
export const generateRandomString = () => randomBytes(16).toString('hex');
