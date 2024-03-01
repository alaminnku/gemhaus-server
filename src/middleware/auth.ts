import User from '../models/user';
import { JWT, decode } from 'next-auth/jwt';
import { Request, Response, NextFunction } from 'express';
import { invalidCredentials } from '../lib/messages';

export default async function handler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.log(req.headers);
  if (!req.headers.cookie) {
    console.log(invalidCredentials);
    res.status(401);
    throw new Error(invalidCredentials);
  }

  const token = req.headers.cookie.split('next-auth.session-token=')[1];
  console.log(token);
  if (!token) {
    console.log(invalidCredentials);
    res.status(401);
    throw new Error(invalidCredentials);
  }

  try {
    const decoded = (await decode({
      token,
      secret: process.env.NEXTAUTH_SECRET as string,
    })) as JWT;
    console.log(decoded);

    const user = await User.findById(decoded.id)
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
