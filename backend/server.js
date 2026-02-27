const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { errorHandler } = require('./middleware/errorMiddleware');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Performance Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(compression());

// Trust proxy - needed when behind reverse proxy (production)
app.set('trust proxy', 1);

// Logger (only in dev/test)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// General Middleware
app.use(express.json());

// CORS Configuration (Must be before Rate Limiting)
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://travellersdeal.com', 'http://localhost:3000', 'http://localhost:5173', 'null'] // Production frontend + local dev + mobile
    : '*',
  credentials: true,
};
app.use(cors(corsOptions));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 5000, // Higher limit for dev HMR
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use(limiter);

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Routes
app.get('/', (req, res) => {
  res.send('API is running...');
});

const authRoutes = require('./routes/authRoutes');
const experienceRoutes = require('./routes/experienceRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const userRoutes = require('./routes/userRoutes');
const cartRoutes = require('./routes/cartRoutes');
const homepageRoutes = require('./routes/homepageRoutes');
const path = require('path');

app.use('/api/auth', authRoutes);
app.use('/api/experiences', experienceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes); // Reviews
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/homepage', homepageRoutes);


// Use __dirname for consistent path resolution regardless of CWD
const uploadsPath = path.join(__dirname, 'uploads');
const vendorUploadsPath = path.join(__dirname, 'uploadsbyvenders');

console.log('Serving static uploads from:', uploadsPath);
console.log('Serving vendor uploads from:', vendorUploadsPath);

app.use('/uploads', express.static(uploadsPath));
app.use('/uploadsbyvenders', express.static(vendorUploadsPath));

// Error Handling Middleware
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} (0.0.0.0)`);
});
