import mail from '@sendgrid/mail';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import express from 'express';
import 'express-async-errors';
const xssClean = require('xss-clean');
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import { connectDB } from './config/db';
import error from './middleware/error';
import Article from './routes/article';
import Property from './routes/property';
import Braintree from './routes/braintree';
import Mail from './routes/mail';

// Config
dotenv.config();

// Port
const PORT = process.env.PORT || 5100;

// Connect to database and config SendGrid mail
connectDB();
mail.setApiKey(process.env.SENDGRID_API_KEY as string);

// App
const app = express();

// Middleware
app.use(helmet());
app.use(cookieParser());
app.use(mongoSanitize());
app.use(xssClean());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  cors({
    credentials: true,
    origin: [
      process.env.CLIENT_ORIGIN as string,
      process.env.ADMIN_ORIGIN as string,
    ],
  })
);

// Routes
app.use('/articles', Article);
app.use('/properties', Property);
app.use('/braintree', Braintree);
app.use('/mail', Mail);

// Error middleware - Put after all main routes
app.use(error);

// Run the server
app.listen(PORT, () => console.log('Server started'));
