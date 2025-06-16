const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db.js');
const sharedRoutes = require('./router/Sharedroutes.js');
const userRoutes = require('./router/UserRouter.js');
// const staffRoutes = require('./router/StaffRouter.js');
const unionRoutes = require('./router/UnionUserRouter.js');
const serviceRoutes = require('./router/ServiceRouter.js');
// Load environment variables
dotenv.config();

// Check for required JWT secret
if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined');
  process.exit(1);
}

// Create Express app
const app = express();

// CORS Configuration
const corsOptions = {
  origin: 'http://localhost:3000', // Your frontend URL
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Initialize database connection
connectDB();

// Debug middleware to log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  // Set default Content-Type to JSON
  res.setHeader('Content-Type', 'application/json');
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  
  // Handle multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'File too large. Maximum size is 100KB.'
    });
  }
  
  if (err.message.includes('file format')) {
    return res.status(400).json({
      success: false,
      message: 'Invalid file type. Only JPEG, PNG, and TIFF are allowed.'
    });
  }
  
  // Handle other errors
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Routes
app.use('/api/shared', sharedRoutes);
app.use('/api/users', userRoutes);
// app.use('/api/staff', staffRoutes);
app.use('/api/union', unionRoutes);
app.use('/api', serviceRoutes);  // Mount at root to match frontend expectations

// Debug route to list all registered routes
const routes = [
  { path: '/api/shared', router: 'sharedRoutes' },
  { path: '/api/users', router: 'userRoutes' },
  { path: '/api/union', router: 'unionRoutes' },
  { path: '/api/services', router: 'serviceRoutes' },
];

app.get('/api/routes', (req, res) => {
  res.json({ routes });
});

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to MERN API' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
