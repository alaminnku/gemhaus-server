import dotenv from 'dotenv';
import { Response } from 'express';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { generateRandomString } from '../lib/utils';

// Config
dotenv.config();

// Configure s3 client
const s3Client = new S3Client({
  region: process.env.AWS_BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY as string,
    secretAccessKey: process.env.AWS_SECRET_KEY as string,
  },
});

// Upload image to S3
export async function uploadImage(
  res: Response,
  buffer: Buffer,
  mimetype: string
) {
  const name = generateRandomString();
  const params = {
    Key: name,
    Body: buffer,
    ContentType: mimetype,
    Bucket: process.env.AWS_BUCKET_NAME,
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
    return `${process.env.CLOUDFRONT_DOMAIN}/${name}`;
  } catch (err) {
    console.log('Failed to upload image');
    res.status(500);
    throw new Error('Failed to upload image');
  }
}

// Delete image from S3
export async function deleteImage(res: Response, name: string) {
  const params = {
    Key: name,
    Bucket: process.env.AWS_BUCKET_NAME,
  };

  try {
    await s3Client.send(new DeleteObjectCommand(params));
  } catch (err) {
    console.log('Failed to delete image');
    res.status(500);
    throw new Error('Failed to delete image');
  }
}
