import { Router } from 'express';
import { gateway } from '../config/braintree';

const router = Router();

router.get('/client-token', async (req, res) => {
  try {
    const response = await gateway.clientToken.generate({});
    res.status(200).json(response.clientToken);
  } catch (err) {
    console.log(err);
    throw err;
  }
});

export default router;
