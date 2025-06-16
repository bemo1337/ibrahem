const express = require('express');
const Service = require('../models/ServiceModel.js');
const ServiceRequest = require('../models/ServiceRequestModel.js');
const { authUnion } = require('../middleware/unionMiddleware.js');
const { userAuth } = require('../middleware/userMiddleware.js');

const router = express.Router();

// Get all active services (public route, no auth required)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [services, total] = await Promise.all([
      Service.find({ isActive: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'fullName'),
      Service.countDocuments({ isActive: true })
    ]);

    res.json({
      services,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalServices: total
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ message: 'Error fetching services' });
  }
});

// Create new service (Protected - Union users only)
router.post('/services', authUnion, async (req, res) => {
  try {
    const { serviceName, description, requirements } = req.body;
    
    if (!serviceName) {
      return res.status(400).json({ message: 'Service name is required' });
    }

    const newService = new Service({
      serviceName,
      description,
      requirements: requirements || [],
      createdBy: req.user._id,
      isActive: true
    });

    await newService.save();
    
    res.status(201).json({
      message: 'Service created successfully',
      service: newService
    });
  } catch (error) {
    console.error('Error creating service:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Service with this name already exists' });
    }
    res.status(500).json({ message: 'Error creating service' });
  }
});

// Create a new service request (Protected - Authenticated users only)
router.post('/service-requests', userAuth, async (req, res) => {
  try {
    const { service, description } = req.body;
    
    if (!service) {
      return res.status(400).json({ message: 'Service ID is required' });
    }

    // Check if the service exists and is active
    const serviceExists = await Service.findOne({ 
      _id: service,
      isActive: true 
    });

    if (!serviceExists) {
      return res.status(404).json({ message: 'Service not found or inactive' });
    }

    // Check if user already has a pending request for this service
    const existingRequest = await ServiceRequest.findOne({
      service: serviceExists._id,
      requestedBy: req.user._id,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ 
        message: 'You already have a pending request for this service',
        requestId: existingRequest._id
      });
    }

    // Create the service request
    const newRequest = new ServiceRequest({
      service: serviceExists._id,
      serviceName: serviceExists.serviceName,
      requestedBy: req.user._id,
      description: description || `Request for service: ${serviceExists.serviceName}`,
      status: 'pending'
    });

    await newRequest.save();
    
    // Populate the service and user details in the response
    await newRequest.populate([
      { path: 'service', select: 'serviceName description' },
      { path: 'requestedBy', select: 'fullName email' }
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Service request submitted successfully',
      data: newRequest
    });
  } catch (error) {
    console.error('Error creating service request:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating service request',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Create a new service request (Protected - Authenticated users only)
router.post('/service-requests', userAuth, async (req, res) => {
  try {
    const { service, description } = req.body;
    
    if (!service) {
      return res.status(400).json({ message: 'Service ID is required' });
    }

    // Check if the service exists and is active
    const serviceExists = await Service.findOne({ 
      _id: service,
      isActive: true 
    });

    if (!serviceExists) {
      return res.status(404).json({ message: 'Service not found or inactive' });
    }

    // Check if user already has a pending request for this service
    const existingRequest = await ServiceRequest.findOne({
      service: serviceExists._id,
      requestedBy: req.user._id,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ 
        message: 'You already have a pending request for this service',
        requestId: existingRequest._id
      });
    }

    // Create the service request
    const newRequest = new ServiceRequest({
      service: serviceExists._id,
      serviceName: serviceExists.serviceName,
      requestedBy: req.user._id,
      description: description || `Request for service: ${serviceExists.serviceName}`,
      status: 'pending'
    });

    await newRequest.save();
    
    // Populate the service and user details in the response
    await newRequest.populate([
      { path: 'service', select: 'serviceName description' },
      { path: 'requestedBy', select: 'fullName email' }
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Service request submitted successfully',
      data: newRequest
    });
  } catch (error) {
    console.error('Error creating service request:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating service request',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
