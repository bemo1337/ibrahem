const express = require('express');
const UnionUser = require('../models/UnionUser.js');
const Service = require('../models/ServiceModel.js');
const { authUnion, managerOnly } = require('../middleware/unionMiddleware.js');

const router = express.Router();

// Apply authentication to all union routes
router.use(authUnion);



// Manager Dashboard
router.get('/dashboard', managerOnly, async (req, res) => {
  try {
    const pendingCount = await UnionUser.countDocuments({ status: 'on-hold' });
    
    const dashboardData = {
      userInfo: {
        fullName: req.user.fullName,
        email: req.user.email,
        role: req.user.role
      },
      stats: {
        pendingApprovals: pendingCount,
        activeJobs: 0,
        totalMembers: 0
      },
      quickActions: [
        { title: 'Review Pending Approvals', path: '/pending-registrations' },
        { title: 'Manage Union Staff', path: '/staff' },
        { title: 'View Reports', path: '/reports' }
      ]
    };
    
    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Failed to load dashboard' });
  }
});

// Create new service (Manager only)
router.post('/post-service', managerOnly, async (req, res) => {
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
      success: true,
      message: 'Service created successfully',
      data: newService
    });
  } catch (error) {
    console.error('Service creation error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: 'Service name already exists' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to create service',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});



module.exports = router;