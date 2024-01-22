import { Router } from 'express';
import { gateway } from '../config/braintree';

const router = Router();

router.get('/', async (req, res) => {
  const { nonce } = req.body;
  console.log(req.body);

  try {
    const payment = await gateway.transaction.sale({
      amount: '10.00',
      paymentMethodNonce: nonce,
      options: {
        submitForSettlement: true,
      },
    });

    res.status(200).json(payment);
  } catch (err) {
    console.log(err);
    throw err;
  }
});

export default router;
