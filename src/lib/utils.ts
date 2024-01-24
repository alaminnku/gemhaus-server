import { randomBytes } from 'crypto';
import multer, { MulterError } from 'multer';
import axios from 'axios';

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

  const response = await axios.post(
    `${process.env.HOSTAWAY_API_URL}/accessTokens`,
    data,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );
  return response.data.access_token;
}

// Get ISO date
export const getISODate = (input: Date | string) =>
  new Date(input).toISOString().split('T')[0];
