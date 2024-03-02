import User from '../models/user';
import { Request, Response, NextFunction } from 'express';
import { invalidCredentials } from '../lib/messages';

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

  const id = authHeader.replace('Bearer ', '');
  if (!id) {
    console.log(invalidCredentials);
    res.status(401);
    throw new Error(invalidCredentials);
  }

  try {
    const user = await User.findById(id)
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
