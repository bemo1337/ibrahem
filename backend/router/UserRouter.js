const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User.js');
const Service = require('../models/ServiceModel.js');
const ServiceRequest = require('../models/ServiceRequestModel.js');
const UsersRequest = require('../models/UsersRequest.js');
const { userAuth } = require('../middleware/userMiddleware.js');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/profile_pictures';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 }, // 100KB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|tiff/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed (jpeg, jpg, png, tiff)'));
  }
});

/**
 * @route   GET /api/users/services/active
 * @desc    Get all active services
 * @access  Private (User)
 */
router.get('/services/active', userAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const services = await Service.find({ isActive: true })
      .select('_id serviceName description requirements createdAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await Service.countDocuments({ isActive: true });
    
    res.json({
      success: true,
      services,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error('Error fetching active services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active services',
      error: error.message
    });
  }
});



// User registration with file upload
router.post('/register', upload.single('profilePicture'), async (req, res, next) => {
  try {
    const {
      fullName,
      dateOfBirth,
      idNumber,
      licenseID,
      gender,
      major,
      email,
      password
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { idNumber }, { licenseID }] });
    if (existingUser) {
      // Clean up uploaded file if user already exists
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ 
        success: false,
        message: 'User with this email, ID number or license ID already exists' 
      });
    }

    // Handle file upload
    let profilePicturePath = '';
    if (req.file) {
      profilePicturePath = req.file.path;
    }

    // Create new user - password will be hashed by pre-save hook
    const newUser = new User({
      fullName,
      profilePicture: profilePicturePath,
      dateOfBirth,
      idNumber,
      licenseID,
      gender,
      major,
      email,
      password // Will be hashed automatically
    });

    await newUser.save();

    // Don't send sensitive data back
    const userResponse = {
      id: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
      status: newUser.status,
      profilePicture: profilePicturePath
    };

    res.status(201).json({ 
      success: true,
      message: 'Registration successful. Your account is pending approval.',
      user: userResponse
    });

  } catch (error) {
    // Clean up uploaded file if there was an error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('Registration error:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      body: req.body,
      file: req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : 'No file uploaded'
    });
    
    const errorMessage = error.code === 'LIMIT_FILE_SIZE' 
      ? 'File size too large. Maximum 100KB allowed.' 
      : `Registration failed: ${error.message || 'Please try again'}`;
      
    res.status(500).json({ 
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
});

// User login (Engineers only)
router.post('/login', async (req, res) => {
  console.log('Login request body:', req.body);
  const { email, password } = req.body;
  
  if (!email || !password) {
    console.log('Missing email or password');
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Check if user exists and explicitly select the password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Check if account is approved
    if (user.status !== 'approved') {
      return res.status(403).json({ 
        message: 'Your account is pending approval',
        status: user.status
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Create JWT token with engineer role
    const token = jwt.sign(
      { 
        id: user._id,
        role: 'engineer' // Always set role as engineer for this route
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Return user info (excluding password) and token
    const userData = user.toObject();
    delete userData.password;
    
    res.status(200).json({
      message: 'Engineer login successful',
      token,
      user: {
        ...userData,
        role: 'engineer' // Ensure role is set correctly
      },
      userType: 'engineer',
      dashboardPath: '/dashboard'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});


// User dashboard (protected by middleware)
router.get('/dashboard', userAuth, async (req, res) => {
    try {
      // Dashboard data
      res.json({
        userInfo: {
          id: req.user._id,
          fullName: req.user.fullName,
          email: req.user.email,
        //   profilePicture: req.user.profilePicture,
          dateOfBirth: req.user.dateOfBirth,
          idNumber: req.user.idNumber,
          licenseID: req.user.licenseID,
          gender: req.user.gender,
          major: req.user.major,
          status: req.user.status,
          membershipJoinDate: req.user.membershipJoinDate,
          rank: req.user.rank
        },
        stats: {
          activeJobs: 0, // TODO: Add actual job count
          completedJobs: 0 // TODO: Add actual completed jobs
        }
      });
      
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({ message: 'Failed to load dashboard' });
    }
  });



// Request a service
router.post('/request-service', userAuth, async (req, res) => {
  try {
    const { serviceName } = req.body;
    
    // Find the service by name
    const service = await Service.findOne({ 
      serviceName,
      isActive: true 
    });
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found or inactive' });
    }
    
    // Create new request
    const newRequest = new UsersRequest({
      service: service._id,
      user: req.user._id,
      status: 'pending'
    });
    
    await newRequest.save();
    
    res.status(201).json({
      message: 'Service request submitted successfully',
      request: newRequest
    });
    
  } catch (error) {
    console.error('Service request error:', error);
    res.status(500).json({ message: 'Failed to submit service request' });
  }
});



// Test endpoint to create a test user
router.post('/test-user', async (req, res) => {
  try {
    // Check if test user already exists
    const testEmail = 'test@example.com';
    const existingUser = await User.findOne({ email: testEmail });
    
    if (existingUser) {
      return res.status(400).json({ message: 'Test user already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // Create test user
    const testUser = new User({
      fullName: 'Test User',
      dateOfBirth: new Date('1990-01-01'),
      idNumber: '1234567890',
      licenseID: 'LIC123456',
      gender: 'Male',
      major: 'IT',
      email: testEmail,
      password: hashedPassword,
      status: 'approved',
      role: 'engineer',
      membershipJoinDate: new Date(),
      rank: 'Member'
    });

    await testUser.save();

    // Create JWT token
    const token = jwt.sign(
      { id: testUser._id, role: testUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Remove password from response
    const userObj = testUser.toObject();
    delete userObj.password;

    res.status(201).json({
      message: 'Test user created successfully',
      token,
      user: userObj
    });
  } catch (error) {
    console.error('Test user creation error:', error);
    res.status(500).json({ message: 'Error creating test user' });
  }
});

// Get user's service requests
router.get('/my-requests', userAuth, async (req, res) => {
  try {
    const requests = await ServiceRequest.find({ requestedBy: req.user._id })
      .populate('service', 'serviceName description')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Error fetching user service requests:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching your service requests',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;