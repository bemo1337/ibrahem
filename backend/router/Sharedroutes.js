const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User.js');
const UnionUser = require('../models/UnionUser.js');
const ServiceRequest = require('../models/ServiceRequestModel.js');
const bcrypt = require('bcryptjs');
const { authUnion } = require('../middleware/unionMiddleware.js');
const Service = require('../models/ServiceModel.js');
const UsersRequest = require('../models/UsersRequest.js');
const { userAuth } = require('../middleware/userMiddleware.js');

// For backward compatibility, we'll use ServiceRequest instead of UsersRequest
const RequestModel = ServiceRequest;

const router = express.Router();

// Test route to verify shared routes are working
router.get('/test', (req, res) => {
  console.log('Test route hit in shared routes');
  res.json({ message: 'Shared routes are working!' });
});

// Log all incoming requests to shared routes
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Shared route hit: ${req.method} ${req.originalUrl}`);
  next();
});



// Get manager dashboard data
router.get('/dashboard', authUnion, async (req, res) => {
  try {
    // Get counts for dashboard stats
    const pendingRegistrations = await User.countDocuments({ status: 'pending' });
    const activeServices = await Service.countDocuments({ status: 'active' });
    const totalMembers = await User.countDocuments({ status: 'approved' });

    // Get user info
    const user = await UnionUser.findById(req.user.id).select('-password');
    
    // Quick actions for the dashboard
    const quickActions = [
      { title: 'عرض طلبات التسجيل المعلقة', path: '/manager/pending-registrations' },
      { title: 'إدارة الخدمات', path: '/manager/services' },
      { title: 'عرض طلبات الخدمة', path: '/manager/service-requests' }
    ];

    res.json({
      userInfo: {
        fullName: user.fullName,
        email: user.email,
        role: user.role
      },
      stats: {
        pendingApprovals: pendingRegistrations,
        activeJobs: activeServices,
        totalMembers: totalMembers
      },
      quickActions: quickActions
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Error fetching dashboard data' });
  }
});

// Union User login (Managers and Staff only)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Union user login attempt for:', email);

  try {
    // Only check UnionUser collection for manager/staff
    const user = await UnionUser.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('No union user found with email:', email);
      return res.status(401).json({ 
        message: 'Invalid credentials. Please check your email and password.' 
      });
    }

    console.log('Union user found:', user.email, 'Role:', user.role);
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password mismatch for union user:', email);
      return res.status(401).json({ 
        message: 'Invalid credentials. Please check your email and password.' 
      });
    }

    // Check if account is approved
    if (user.status !== 'approved') {
      return res.status(403).json({ 
        message: 'Your account is not approved. Please contact the system administrator.'
      });
    }

    // Generate JWT with user's role (manager or staff)
    const token = jwt.sign(
      { 
        id: user._id, 
        role: user.role // This will be either 'manager' or 'staff'
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // All union users go to the manager dashboard
    const dashboardPath = '/manager/dashboard';

    // Don't send password back
    user.password = undefined;

    res.status(200).json({
      token,
      userType: 'union',
      dashboardPath,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role, // 'manager' or 'staff'
        position: user.position,
        status: user.status
      },
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Pending User Registrations (accessible to both managers and staff)
router.get('/pending-registrations', authUnion, async (req, res) => {
    try {
      // Verify user is either manager or staff
      if (!['manager', 'staff'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Access denied' });
      }
  
      const pendingUsers = await User.find({ status: 'on-hold' })
        .select('-password -__v')
        .sort({ createdAt: -1 });
  
      res.json({
        count: pendingUsers.length,
        users: pendingUsers
      });
    } catch (error) {
      console.error('Pending registrations error:', error);
      res.status(500).json({ message: 'Failed to fetch pending registrations' });
    }
  });

// Approve engineer registration
router.put('/approve-engineer/:id', authUnion, async (req, res) => {
  try {
    // Verify user is either manager or staff
    if (!['manager', 'staff'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'approved',
        membershipJoinDate: new Date() 
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'Engineer approved successfully',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        status: user.status,
        membershipJoinDate: user.membershipJoinDate
      }
    });
  } catch (error) {
    console.error('Approval error:', error);
    res.status(500).json({ message: 'Failed to approve engineer' });
  }
});

// Reject engineer registration
router.put('/reject-engineer/:id', authUnion, async (req, res) => {
  try {
    // Verify user is either manager or staff
    if (!['manager', 'staff'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'Engineer rejected successfully',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Rejection error:', error);
    res.status(500).json({ message: 'Failed to reject engineer' });
  }
});

// Middleware to handle both union and user auth
const optionalAuth = (req, res, next) => {
  // If already authenticated by authUnion
  if (req.user) return next();
  
  // Otherwise try userAuth
  userAuth(req, res, (err) => {
    if (err) return res.status(401).json({ message: 'Please login to access services' });
    next();
  });
};

// Get all active services (accessible to both users and union users)
router.get('/show-services', (req, res, next) => {
  // Try union auth first, then user auth if that fails
  authUnion(req, res, (err) => {
    if (err) {
      return optionalAuth(req, res, next);
    }
    next();
  });
}, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const services = await Service.find({})
      .select('_id serviceName description requirements isActive createdAt')
      .populate('createdBy', 'fullName -_id')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await Service.countDocuments({});
    
    res.json({
      services,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ message: 'Failed to fetch services' });
  }
});


// Toggle service active status 
router.patch('/services/:id/toggle-active', authUnion, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    service.isActive = !service.isActive;
    await service.save();
    
    res.json({
      message: `Service ${service.isActive ? 'activated' : 'deactivated'} successfully`,
      service
    });
    
  } catch (error) {
    console.error('Toggle active error:', error);
    res.status(500).json({ message: 'Failed to toggle service status' });
  }
});

// Get all service requests (for managers/staff)
router.get('/service-requests', authUnion, async (req, res) => {
  try {
    console.log('Service requests route hit'); // Debug log
    const { status, page = 1, limit = 10 } = req.query;
    
    console.log('Query params:', { status, page, limit }); // Debug log
    
    // Build query filter
    const filter = {};
    if (status) filter.status = status;
    
    console.log('Filter:', filter); // Debug log
    
    const requests = await ServiceRequest.find(filter)
      .populate('service', 'serviceName description')
      .populate('requestedBy', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    console.log('Found requests:', requests.length); // Debug log
    
    const count = await ServiceRequest.countDocuments(filter);
    
    // Transform the data to match frontend expectations
    const transformedRequests = requests.map(request => ({
      ...request.toObject(),
      user: request.requestedBy,
      requestedAt: request.createdAt
    }));
    
    const response = {
      data: transformedRequests,
      pages: Math.ceil(count / limit),
      page: parseInt(page),
      total: count
    };
    
    console.log('Sending response with', transformedRequests.length, 'requests'); // Debug log
    res.json(response);
    
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ 
      message: 'Failed to get service requests', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Approve service request
router.patch('/approve-service-request/:id', authUnion, async (req, res) => {
  console.log(`\n=== [${new Date().toISOString()}] Approve service request received ===`);
  console.log('Request ID:', req.params.id);
  console.log('Request method:', req.method);
  console.log('Request URL:', req.originalUrl);
  console.log('Request user:', req.user);
  
  try {
    // Check if ID is valid
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.error('Invalid request ID format:', req.params.id);
      return res.status(400).json({ 
        success: false,
        message: 'Invalid request ID format',
        requestId: req.params.id
      });
    }
    
    // Log database connection state
    console.log('Mongoose connection state:', mongoose.connection.readyState);
    
    // Find the request first to log its current state
    console.log('\n--- Searching for request in database ---');
    const existingRequest = await RequestModel.findById(req.params.id)
      .populate('service', 'serviceName description')
      .populate('requestedBy', 'fullName email');
    
    if (!existingRequest) {
      console.error('Request not found in database');
      // Try to find any request to check if the collection is accessible
      const anyRequest = await RequestModel.findOne();
      console.log('Sample request from database:', anyRequest);
      
      return res.status(404).json({ 
        success: false,
        message: 'Request not found',
        requestId: req.params.id,
        collectionAccessible: !!anyRequest
      });
    }
    
    console.log('\n--- Found existing request ---');
    console.log('Current status:', existingRequest.status);
    console.log('Requested by:', existingRequest.requestedBy);
    
    console.log('\n--- Updating request status to approved ---');
    const updatedRequest = await RequestModel.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'approved',
        processedBy: req.user._id,
        processedAt: new Date() 
      },
      { new: true, runValidators: true }
    ).populate('requestedBy', 'fullName email');
    
    if (!updatedRequest) {
      console.error('Failed to update request after finding it');
      return res.status(500).json({ 
        success: false,
        message: 'Failed to update request',
        requestId: req.params.id
      });
    }
    
    console.log('\n--- Request approved successfully ---');
    
    // Transform the response to match frontend expectations
    const response = {
      _id: updatedRequest._id,
      status: updatedRequest.status,
      service: updatedRequest.service,
      user: updatedRequest.requestedBy,
      requestedAt: updatedRequest.createdAt,
      processedAt: updatedRequest.processedAt,
      processedBy: updatedRequest.processedBy
    };
    
    res.json({
      success: true,
      message: 'Request approved successfully',
      request: response
    });
    
  } catch (error) {
    console.error('\n=== Approve request error ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to approve request',
      error: error.message,
      name: error.name,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Reject service request
router.patch('/reject-service-request/:id', authUnion, async (req, res) => {
  console.log(`\n=== [${new Date().toISOString()}] Reject service request received ===`);
  console.log('Request ID:', req.params.id);
  console.log('Request method:', req.method);
  console.log('Request URL:', req.originalUrl);
  console.log('User making request:', req.user);
  console.log('Rejection reason:', req.body?.reason);
  
  try {
    // Check if ID is valid
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.error('Invalid request ID format:', req.params.id);
      return res.status(400).json({ 
        success: false,
        message: 'Invalid request ID format',
        requestId: req.params.id
      });
    }
    
    // Log database connection state
    console.log('Mongoose connection state:', mongoose.connection.readyState);
    
    // Find the request first to log its current state
    console.log('\n--- Searching for request in database ---');
    const existingRequest = await RequestModel.findById(req.params.id)
      .populate('service', 'serviceName description')
      .populate('requestedBy', 'fullName email');
    
    if (!existingRequest) {
      console.error('Request not found in database');
      // Try to find any request to check if the collection is accessible
      const anyRequest = await RequestModel.findOne();
      console.log('Sample request from database:', anyRequest);
      
      return res.status(404).json({ 
        success: false,
        message: 'Request not found',
        requestId: req.params.id,
        collectionAccessible: !!anyRequest
      });
    }
    
    console.log('\n--- Found existing request ---');
    console.log('Current status:', existingRequest.status);
    console.log('Requested by:', existingRequest.requestedBy);
    
    const updateData = {
      status: 'rejected',
      processedBy: req.user._id,
      processedAt: new Date(),
      rejectionReason: req.body?.reason || 'No reason provided'
    };
    
    console.log('\n--- Updating request status to rejected ---');
    console.log('Update data:', updateData);
    
    const updatedRequest = await RequestModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('requestedBy', 'fullName email');
    
    if (!updatedRequest) {
      console.error('Failed to update request after finding it');
      return res.status(500).json({ 
        success: false,
        message: 'Failed to update request',
        requestId: req.params.id
      });
    }
    
    console.log('\n--- Request rejected successfully ---');
    
    // Transform the response to match frontend expectations
    const response = {
      _id: updatedRequest._id,
      status: updatedRequest.status,
      service: updatedRequest.service,
      user: updatedRequest.requestedBy,
      requestedAt: updatedRequest.createdAt,
      processedAt: updatedRequest.processedAt,
      processedBy: updatedRequest.processedBy,
      rejectionReason: updatedRequest.rejectionReason
    };
    
    res.json({
      success: true,
      message: 'Request rejected successfully',
      request: response
    });
    
  } catch (error) {
    console.error('\n=== Reject request error ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to reject request',
      error: error.message,
      name: error.name,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;