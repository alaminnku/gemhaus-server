import { Router } from 'express';
import { gateway } from '../config/braintree';

const router = Router();

router.post('/', async (req, res) => {
  const { nonce } = req.body;

  try {
    const payment = await gateway.transaction.sale({
      amount: '10.00',
      paymentMethodNonce: nonce,
      options: {
        submitForSettlement: true,
      },
    });
  } catch (err) {
    console.log(err);
    throw err;
  }
});

export default router;
