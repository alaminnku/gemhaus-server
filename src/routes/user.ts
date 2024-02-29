import bcrypt from 'bcrypt';
import { Router } from 'express';
import User from '../models/user';
import { deleteFields, isValidEmail, upload } from '../lib/utils';
import { invalidEmail, requiredFields } from '../lib/messages';
import { uploadImage } from '../config/s3';

const router = Router();

// Sign up user
router.post('/sign-up', upload.none(), async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error(requiredFields);
  }
  if (!isValidEmail(email)) {
    res.status(400);
    throw new Error(invalidEmail);
  }

  try {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    // Create user
    await User.create({
      name,
      email,
      role: 'USER',
      password: hashed,
    });
    res.status(201).json({ message: 'Sign up successful' });
  } catch (err) {
    console.log(err);
    throw err;
  }
});

// Authorize user
router.post('/authorize', upload.none(), async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error(requiredFields);
  }
  if (!isValidEmail(email)) {
    res.status(400);
    throw new Error(invalidEmail);
  }

  try {
    // Get the user and match password
    const user = await User.findOne({ email }).lean();
    if (!user || !user.password) {
      res.status(400);
      throw new Error('Invalid credentials');
    }
    const correctPassword = await bcrypt.compare(password, user.password);

    if (!user || !correctPassword) {
      res.status(400);
      throw new Error('Invalid credentials');
    }

    deleteFields(user, ['password', 'createdAt']);
    res.status(200).json(user);
  } catch (err) {
    console.log(err);
    throw err;
  }
});

// Create/update user
router.post('/upsert', upload.none(), async (req, res) => {
  const { name, email, image } = req.body;

  if (!name || !email) {
    res.status(400);
    throw new Error(requiredFields);
  }
  if (!isValidEmail(email)) {
    res.status(400);
    throw new Error(invalidEmail);
  }

  try {
    await User.updateOne(
      { email },
      { name, email, image, role: 'USER' },
      { upsert: true }
    );

    res.status(201).json({ message: 'User upsert successful' });
  } catch (err) {
    console.log(err);
    throw err;
  }
});

// Create an agent
router.post('/agent', upload.single('file'), async (req, res) => {
  const file = req.file;
  const { name, email, phone, address, qrCodeLink, bio } = req.body;

  if (!file || !name || !email || !phone || !address || !qrCodeLink || !bio) {
    res.status(400);
    throw new Error(requiredFields);
  }
  if (!isValidEmail(email)) {
    res.status(400);
    throw new Error(invalidEmail);
  }

  // Upload image to S3
  const { buffer, mimetype } = file;
  const image = await uploadImage(res, buffer, mimetype);

  try {
    const response = await User.create({
      name,
      email,
      phone,
      address,
      qrCodeLink,
      bio,
      image,
      role: 'AGENT',
    });
    const agent = response.toObject();
    deleteFields(agent, ['createdAt']);
    res.status(201).json(agent);
  } catch (err) {
    console.log(err);
    throw err;
  }
});

// Get all agents
router.get('/agent', async (req, res) => {
  try {
    const agents = await User.find({ role: 'AGENT' })
      .select('-createdAt -updatedAt -__v')
      .lean()
      .orFail();
    res.status(200).json(agents);
  } catch (err) {
    console.log(err);
    throw err;
  }
});

export default router;
