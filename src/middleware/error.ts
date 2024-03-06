import { MulterError } from 'multer';
import { ErrorRequestHandler } from 'express';

const handler: ErrorRequestHandler = (err, req, res, next) => {
  // Multer error
  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res
        .status(400)
        .json({ message: 'Only .png, .jpg and .jpeg formats are allowed' });
    }
  }

  // Populate error
  if (err.name === 'StrictPopulateError') {
    return res.status(500).json({
      message: 'Failed to populate provided path',
    });
  }

  // Cast error
  if (err.name === 'CastError') {
    const path = err.path;
    return res.status(500).json({
      message: `Please provide a valid ${path}`,
    });
  }

  // Validation error
  if (err.name === 'ValidationError') {
    const key = err.message.split(':')[1].trim();
    return res.status(500).json({
      message: `Please provide a valid ${key}`,
    });
  }

  // Mongoose error
  if (err.name === 'DocumentNotFoundError') {
    const model = err.message
      .split(' ')
      [err.message.split(' ').length - 1].replaceAll('"', '')
      .toLowerCase();
    return res.status(500).json({
      message: `No ${model} found`,
    });
  }

  // Duplicate key error
  if (err.name === 'MongoServerError' && err.code === 11000) {
    const key = Object.keys(err.keyValue)[0];
    return res.status(500).json({
      message: `Please provide a unique ${key}`,
    });
  }

  // Invalid salt
  if (err.message.includes('Invalid salt')) {
    return res.status(500).json({ message: 'Please provide a valid salt' });
  }

  // No password in db user
  if (err.message.includes('hash arguments required')) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Error thrown by throw new Error
  res.status(res.statusCode || 500).json({
    message: err.message,
  });
};

export default handler;
