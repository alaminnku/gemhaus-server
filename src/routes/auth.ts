import { Router } from 'express';
import { unauthorized } from '../lib/messages';
import auth from '../middleware/auth';
import {
  createAccessToken,
  createRefreshToken,
  createTokenExpiry,
} from '../lib/utils';

const router = Router();

router.post('/refresh-token', auth, async (req, res) => {
  if (!req.user) {
    console.log(unauthorized);
    res.status(403);
    throw new Error(unauthorized);
  }
  const { email } = req.user;

  res.status(200).json({
    accessToken: createAccessToken(email),
    refreshToken: createRefreshToken(email),
    expiresIn: createTokenExpiry(),
  });
});

export default router;
