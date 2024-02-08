import { Router } from 'express';
import { requiredFields } from '../lib/messages';
import mail, { MailDataRequired } from '@sendgrid/mail';
import { upload } from '../lib/utils';

const router = Router();

router.post('/query', upload.none(), async (req, res) => {
  // Destructure and validate data
  const { name, email, subject, message, services } = req.body;
  if (!name || !email || !message) {
    console.log(requiredFields);
    res.status(400);
    throw new Error(requiredFields);
  }

  try {
    const template = {
      to: process.env.RECEIVER_EMAIL,
      from: process.env.SENDER_EMAIL,
      subject: `Message from ${name}`,
      html: `
            <p>Name: ${name}</p>
            <p>Email: ${email}</p>
            <p>Subject: ${subject || 'N/A'}</p>
            <p>Services: ${services || 'N/A'}</p>
            <p>Message: ${message}</p>
        `,
    };
    await mail.send(template as MailDataRequired);
    res.status(200).json({ message: 'Message sent successfully' });
  } catch (err) {
    console.log(err);
    throw err;
  }
});

router.post('/property-evaluation', upload.none(), async (req, res) => {
  // Destructure and validate data
  const {
    name,
    phone,
    email,
    city,
    address,
    state,
    isInHoaCommunity,
    isRented,
    doesAllowsStrLtr,
  } = req.body;
  if (!name || !phone || !email || !city || !state || !address) {
    console.log(requiredFields);
    res.status(400);
    throw new Error(requiredFields);
  }

  try {
    const template = {
      to: process.env.RECEIVER_EMAIL,
      from: process.env.SENDER_EMAIL,
      subject: `Message from ${name}`,
      html: `
            <p>Name: ${name}</p>
            <p>Phone: ${phone}</p>
            <p>Email: ${email}</p>
            <p>City: ${city}</p>
            <p>Address: ${address}</p>
            <p>State: ${state}</p>
            <p>Is your property in a HOA community?: ${
              isInHoaCommunity ? 'Yes' : 'No'
            }</p>
            <p>Is your property currently rented?: ${
              isRented ? 'Yes' : 'No'
            }</p>
            <p>Does that HOA community allows STR/LTR?: ${
              doesAllowsStrLtr ? 'Yes' : 'No'
            }</p>
        `,
    };
    await mail.send(template as MailDataRequired);
    res.status(200).json({ message: 'Message sent successfully' });
  } catch (err) {
    console.log(err);
    throw err;
  }
});

export default router;
