import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';

import errorHandler from './middlewares/error.middleware.js';
import routes from './routes/index.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, 
  max: process.env.RATE_LIMIT_MAX || 100,
  message: 'Too many requests, please try again later'
});
app.use('/api', limiter);

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Data sanitization
app.use(mongoSanitize());
app.use(hpp());

// API routes placeholder
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Smart Surveyor API' });
});
app.use('/api/v1', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

export default app;
