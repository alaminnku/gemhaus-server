import User from '../models/user';
import { Request, Response, NextFunction } from 'express';
import { invalidCredentials } from '../lib/messages';
import { verify, JwtPayload } from 'jsonwebtoken';

export default async function handler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log(invalidCredentials);
    res.status(401);
    throw new Error(invalidCredentials);
  }

  const accessToken = authHeader.replace('Bearer ', '');
  if (!accessToken) {
    console.log(invalidCredentials);
    res.status(401);
    throw new Error(invalidCredentials);
  }

  const decoded = verify(
    accessToken,
    process.env.JWT_SECRET as string
  ) as JwtPayload;

  try {
    const user = await User.findOne({ email: decoded.email })
      .select('-__v -password -updatedAt -createdAt')
      .lean();

    if (!user) {
      console.log(invalidCredentials);
      res.status(401);
      throw new Error(invalidCredentials);
    }

    req.user = user;
    next();
  } catch (err) {
    console.log(err);
    throw err;
  }
}
