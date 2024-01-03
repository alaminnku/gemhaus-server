import User from '../models/user';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export default async function handler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.cookies) {
    console.log('Not authorized');
    res.status(401);
    throw new Error('Not authorized');
  }

  const { token } = req.cookies;
  if (!token) {
    console.log('Not authorized');
    res.status(401);
    throw new Error('Not authorized');
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    const user = await User.findById(decoded._id)
      .select('-__v -password -updatedAt -createdAt')
      .lean();

    if (user) {
      req.user = user;
      next();
    }
  } catch (err) {
    console.log(err);
    throw err;
  }
}
