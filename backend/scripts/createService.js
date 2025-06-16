import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Service from '../models/ServiceModel.js';
import UnionUser from '../models/UnionUser.js';

// Configure dotenv with the correct path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Use the MongoDB connection string from the environment variable or fallback to localhost
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/enghub';

async function createService() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find the manager user
    const manager = await UnionUser.findOne({ email: 'manager@gmail.com' });
    if (!manager) {
      throw new Error('Manager user not found');
    }

    // Check if service already exists
    const existingService = await Service.findOne({ serviceName: 'Engineering Consultation' });
    if (existingService) {
      console.log('ℹ️ Service already exists:', existingService);
      return;
    }

    // Create a new service with the manager as the creator
    const service = new Service({
      serviceName: 'Engineering Consultation',
      description: 'Professional engineering consultation services',
      requirements: ['Engineering degree', '5+ years experience'],
      category: 'technical',
      estimatedDuration: 60,
      price: 100,
      isActive: true,
      createdBy: manager._id
    });

    await service.save();
    console.log('✅ Service created successfully:', service);
    
  } catch (error) {
    console.error('❌ Error creating service:', error);
  } finally {
    // Close the database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Run the script
createService();