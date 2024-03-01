import User from '../models/user';
import { JWT, decode } from 'next-auth/jwt';
import { Request, Response, NextFunction } from 'express';

export default async function handler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.headers.cookie) {
    console.log('Not authorized');
    res.status(401);
    throw new Error('Not authorized');
  }

  const token = req.headers.cookie.split('next-auth.session-token=')[1];
  if (!token) {
    console.log('Not authorized');
    res.status(401);
    throw new Error('Not authorized');
  }

  try {
    const decoded = (await decode({
      token,
      secret: process.env.NEXTAUTH_SECRET as string,
    })) as JWT;

    const user = await User.findById(decoded.id)
      .select('-__v -password -updatedAt -createdAt')
      .lean()
      .orFail();

    req.user = user;
    next();
  } catch (err) {
    console.log(err);
    throw err;
  }
}
