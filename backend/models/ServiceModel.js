const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  // Service details (posted by managers)
  serviceName: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  requirements: [String],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UnionUser',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  category: {
    type: String,
    enum: ['technical', 'administrative', 'support', 'other'],
    default: 'other'
  },
  estimatedDuration: {
    type: Number, // in minutes
    default: 60
  },
  price: {
    type: Number,
    default: 0
  },
  isFeatured: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for service requests
ServiceSchema.virtual('requests', {
  ref: 'ServiceRequest',
  localField: '_id',
  foreignField: 'service'
});

// Index for better query performance
ServiceSchema.index({ serviceName: 'text', description: 'text' });

module.exports = mongoose.model('Service', ServiceSchema);
