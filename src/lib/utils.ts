import { randomBytes } from 'crypto';
import multer, { MulterError } from 'multer';
import { updateAvailableDates } from './jobs';
import { sign } from 'jsonwebtoken';
import { s3Client } from '../config/s3';
import { Response } from 'express';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

type FetchHostawayDataOptions = {
  body?: string;
  method?: 'POST';
};

// Delete unnecessary mongodb fields
export const deleteFields = (data: object, moreFields?: string[]): void => {
  let fields = ['__v', 'updatedAt'];
  if (moreFields) {
    fields = [...fields, ...moreFields];
  }
  fields.forEach((field) => delete data[field as keyof object]);
};

// Generate random string
export const generateRandomString = () => randomBytes(16).toString('hex');

// Upload function
export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/jpeg'
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      cb(new MulterError('LIMIT_UNEXPECTED_FILE'));
    }
  },
});

// Get Hostaway access token
export async function getHostawayAccessToken() {
  const data = new URLSearchParams({
    scope: 'general',
    grant_type: 'client_credentials',
    client_id: process.env.HOSTAWAY_ACCOUNT_ID as string,
    client_secret: process.env.HOSTAWAY_API_KEY as string,
  });

  const response = await fetch(`${process.env.HOSTAWAY_API_URL}/accessTokens`, {
    method: 'POST',
    body: data,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  const result = await response.json();
  if (response.ok) return result.access_token;
  throw new Error('Error getting Hostaway access key');
}

// Fetch Hostaway data
export async function fetchHostawayData(
  path: string,
  options?: FetchHostawayDataOptions
) {
  const accessToken = await getHostawayAccessToken();
  const response = await fetch(`${process.env.HOSTAWAY_API_URL}${path}`, {
    ...options,
    cache: 'no-cache',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const data = await response.json();
  if (response.ok) return data.result;
  throw new Error('Error fetching Hostaway data');
}

// Scheduler function
export function scheduler() {
  setInterval(async () => {
    await updateAvailableDates();
  }, 1000 * 60 * 5);
}

// Convert date to milliseconds
export const dateToMS = (input: Date | string) => new Date(input).getTime();

// Format date 2024-02-11
export function formatDate(input: string | Date) {
  const date = new Date(input);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export const isValidEmail = (email: string) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const createAccessToken = (email: string) =>
  sign({ email }, process.env.JWT_SECRET as string, { expiresIn: '20s' });

export const createRefreshToken = (email: string) =>
  sign({ email }, process.env.JWT_SECRET as string, { expiresIn: '30d' });

export const createTokenExpiry = () => new Date().setTime(Date.now() + 20000);

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

export const createImageId = (url: string) =>
  url.split('/')[url.split('/').length - 1];
