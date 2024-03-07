import bcrypt from 'bcrypt';
import { Router } from 'express';
import User from '../models/user';
import {
  createAccessToken,
  createRefreshToken,
  deleteFields,
  createTokenExpiry,
  isValidEmail,
  upload,
  deleteImage,
  createImageId,
} from '../lib/utils';
import {
  invalidCredentials,
  invalidEmail,
  requiredFields,
  unauthorized,
} from '../lib/messages';
import auth from '../middleware/auth';
import { uploadImage } from '../lib/utils';

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

// Sign in user
router.post('/sign-in', upload.none(), async (req, res) => {
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
      console.log(invalidCredentials);
      res.status(403);
      throw new Error(invalidCredentials);
    }
    const correctPassword = await bcrypt.compare(password, user.password);

    if (!correctPassword) {
      console.log(invalidCredentials);
      res.status(403);
      throw new Error(invalidCredentials);
    }

    deleteFields(user, ['password', 'createdAt']);
    res.status(200).json({
      ...user,
      accessToken: createAccessToken(user.email),
      refreshToken: createRefreshToken(user.email),
      expiresIn: createTokenExpiry(),
    });
  } catch (err) {
    console.log(err);
    throw err;
  }
});

// Create/update user
router.post('/upsert/:email', upload.none(), async (req, res) => {
  const { email } = req.params;
  const { name, image } = req.body;

  if (!name || !email) {
    res.status(400);
    throw new Error(requiredFields);
  }
  if (!isValidEmail(email)) {
    res.status(400);
    throw new Error(invalidEmail);
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      await User.create({ name, email, image, role: 'USER' });
      return res.status(201).json({ message: 'User created' });
    }

    user.name = name;
    user.image = image;
    await user.save();

    res.status(200).json({ message: 'User updated' });
  } catch (err) {
    console.log(err);
    throw err;
  }
});

// Create an agent
router.post('/agents', auth, upload.single('file'), async (req, res) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    console.log(unauthorized);
    res.status(403);
    throw new Error(unauthorized);
  }

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

// Update an agent
router.patch(
  '/agents/:id/update',
  auth,
  upload.single('file'),
  async (req, res) => {
    if (!req.user || req.user.role !== 'ADMIN') {
      console.log(unauthorized);
      res.status(403);
      throw new Error(unauthorized);
    }

    const file = req.file;
    const { id } = req.params;
    const {
      name,
      bio,
      image,
      email,
      phone,
      address,
      qrCodeLink,
      deletedImage,
    } = req.body;

    // Validate data
    if (!name || !email || !phone || !address || !qrCodeLink || !bio) {
      res.status(400);
      throw new Error(requiredFields);
    }
    if (!isValidEmail(email)) {
      res.status(400);
      throw new Error(invalidEmail);
    }
    if (!file && !image) {
      console.log('Agent image is required');
      res.status(400);
      throw new Error('Agent image is required');
    }

    let imageUrl = image;
    if (file) {
      const { buffer, mimetype } = file;
      imageUrl = await uploadImage(res, buffer, mimetype);
    }

    try {
      await User.findByIdAndUpdate(id, {
        bio,
        name,
        email,
        phone,
        address,
        qrCodeLink,
        image: imageUrl,
      });

      // Delete image from S3
      if (deletedImage) {
        const id = createImageId(deletedImage);
        await deleteImage(res, id);
      }
      res.status(201).json({ message: 'Agent updated' });
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
);

// Get all agents
router.get('/agents', async (req, res) => {
  try {
    const agents = await User.find({ role: 'AGENT' })
      .select('name email phone image')
      .lean()
      .orFail();
    res.status(200).json(agents);
  } catch (err) {
    console.log(err);
    throw err;
  }
});

// Get an agent
router.get('/agents/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const agent = await User.findById(id)
      .select('-createdAt -updatedAt -__v')
      .lean()
      .orFail();
    res.status(200).json(agent);
  } catch (err) {
    console.log(err);
    throw err;
  }
});

// Create agent's property
router.post(
  '/agents/:id/properties',
  auth,
  upload.array('files'),
  async (req, res) => {
    if (!req.user || req.user.role !== 'ADMIN') {
      res.status(403);
      throw new Error(unauthorized);
    }

    const { id } = req.params;
    const files = req.files as Express.Multer.File[];
    const { address, city, state, price, isFeatured, description } = req.body;

    if (
      !address ||
      !city ||
      !state ||
      !price ||
      !isFeatured ||
      !description ||
      files.length === 0
    ) {
      console.log(requiredFields);
      res.status(400);
      throw new Error(requiredFields);
    }

    // Upload images to S3
    let images = [];
    for (let i = 0; i < files.length; i++) {
      const { buffer, mimetype } = files[i];
      const image = await uploadImage(res, buffer, mimetype);
      images.push(image);
    }

    try {
      await User.findByIdAndUpdate(id, {
        $push: {
          properties: {
            address,
            city,
            state,
            price,
            images,
            description,
            isFeatured: isFeatured ? true : false,
          },
        },
      }).orFail();
      res.status(201).json({ message: 'Property added' });
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
);

// Update agent's property
router.patch(
  '/agents/:agentId/properties/:propertyId',
  auth,
  upload.array('files'),
  async (req, res) => {
    if (!req.user || req.user.role !== 'ADMIN') {
      res.status(403);
      throw new Error(unauthorized);
    }

    const files = req.files as Express.Multer.File[];
    const { agentId, propertyId } = req.params;
    const {
      address,
      city,
      state,
      price,
      images,
      isFeatured,
      description,
      deletedImages,
    } = req.body;

    // Validate data
    if (!address || !city || !state || !price || !isFeatured || !description) {
      console.log(requiredFields);
      res.status(400);
      throw new Error(requiredFields);
    }
    const prevImages = JSON.parse(images);
    if (prevImages.length + files.length < 1) {
      console.log('At least one image are required');
      res.status(400);
      throw new Error('At least one image are required');
    }

    // Upload new images to S3
    let updatedImages = prevImages;
    for (let i = 0; i < files.length; i++) {
      const { buffer, mimetype } = files[i];
      const image = await uploadImage(res, buffer, mimetype);
      updatedImages.push(image);
    }

    try {
      await User.findOneAndUpdate(
        { _id: agentId, 'properties._id': propertyId },
        {
          $set: {
            'properties.$.address': address,
            'properties.$.city': city,
            'properties.$.state': state,
            'properties.$.price': price,
            'properties.$.images': updatedImages,
            'properties.$.description': description,
            'properties.$.isFeatured': isFeatured ? true : false,
          },
        }
      );

      // Delete old images from S3
      const deletedUrls = JSON.parse(deletedImages);
      for (const deletedUrl of deletedUrls) {
        const id = createImageId(deletedUrl);
        await deleteImage(res, id);
      }
      res.status(201).json({ message: 'Property updated' });
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
);

// Create agent's transaction
router.post(
  '/agents/:id/transactions',
  auth,
  upload.none(),
  async (req, res) => {
    if (!req.user || req.user.role !== 'ADMIN') {
      console.log(unauthorized);
      res.status(403);
      throw new Error(unauthorized);
    }

    const { id } = req.params;
    const { address, type } = req.body;

    if (!type || !address) {
      res.status(400);
      throw new Error(requiredFields);
    }
    if (type !== 'sold' && type !== 'available') {
      res.status(400);
      throw new Error('Please provide a valid type');
    }

    try {
      await User.findByIdAndUpdate(id, {
        $push: { transactions: { address, type } },
      }).orFail();
      res.status(201).json({ message: 'Transaction added' });
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
);

// Get a user
router.get('/:id', upload.none(), async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id).lean().orFail();
    res.status(200).json(user);
  } catch (err) {
    console.log(err);
    throw err;
  }
});

export default router;
