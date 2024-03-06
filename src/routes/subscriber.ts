import { Router } from 'express';
import { upload } from '../lib/utils';
import Subscriber from '../models/subscriber';
import { MongooseError } from 'mongoose';

const router = Router();

router.post('/', upload.none(), async (req, res) => {
  const { email } = req.body;

  try {
    await Subscriber.create({ email });
    res.status(200).json({ message: 'Successfully subscribed' });
  } catch (err) {
    console.log(err);
    if ((err as MongooseError).name !== 'MongoServerError') throw err;

    res.status(400);
    throw new Error('Already subscribed');
  }
});

export default router;
