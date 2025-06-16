import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import UnionUser from '../models/UnionUser.js';

// Configure dotenv with the correct path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Use the MongoDB connection string from the environment variable or fallback to localhost
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/enghub';

async function createManager() {
  try {
    console.log('Connecting to MongoDB...');
    console.log('Connection string:', mongoURI);
    
    // Connect to the database
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if manager already exists
    const existingManager = await UnionUser.findOne({ email: 'manager@gmail.com' });
    
    if (existingManager) {
      console.log('Manager account already exists. Updating password...');
    }

    const plainPassword = '12345678';
    
    if (existingManager) {
      // Update existing manager's password - the pre-save hook will hash it
      existingManager.password = plainPassword;
      await existingManager.save({ validateBeforeSave: true });
      console.log('Manager password updated successfully');
      
      // Verify the password was saved correctly
      const updatedUser = await UnionUser.findById(existingManager._id).select('+password');
      const isMatch = await bcrypt.compare(plainPassword, updatedUser.password);
      console.log('Password verification after update:', isMatch ? 'SUCCESS' : 'FAILED');
      if (!isMatch) {
        console.log('Hashed password in DB:', updatedUser.password);
      }
    } else {
      // Create a new manager user
      const manager = new UnionUser({
        fullName: 'Ibrahim Al Bonni',
        email: 'manager@gmail.com',
        password: plainPassword, // Let the pre-save hook handle hashing
        idNumber: '55588817',
        profilePicture: null,
        position: null,
        dateOfBirth: new Date('2005-05-02'),
        gender: 'Male',
        role: 'manager',
        status: 'approved'
      });

      // Save the new manager user to the database
      await manager.save();
      console.log('New manager account created successfully:');
      console.log(`- ${manager.email} (${manager.role}) - ID: ${manager._id}`);
    }
  } catch (error) {
    console.error('Error creating manager account:', error);
  } finally {
    // Close the database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
    process.exit(0);
  }
}

// Run the script
createManager();

// node backend/scripts/createManager.js