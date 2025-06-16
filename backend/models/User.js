const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  profilePicture: {
    type: String,
    required: false, // Optional field for profile picture
  },
  dateOfBirth: {
    type: Date,
    required: true, // Set to true if you want to require this field
  },
  idNumber: {
    type: String,
    required: true,
    unique: true,
  },
  licenseID: {
    type: String,
    required: true,
    unique: true,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female'], // Add more if needed
    required: true,
    set: (value) => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase(),
  },
  major: {
    type: String,
    enum: ['IT', 'Civil Engineering', 'Mechanical Engineering', 'Electrical Engineering', 'Chemical Engineering'], // Replace with actual majors
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    select: false, // this ensures that the password hash is not included when fetching users
  },
  licenseFile: {
    type: String,
    required: false, // this field is not required
  },
  role: {
    type: String,
    default: 'engineer', // Default role is 'engineer'
  },
  status: {
    type: String,
    enum: ['approved', 'on-hold','rejected'], // Define possible statuses
    default: 'on-hold', // Default status is 'on-hold'
  },
  membershipJoinDate: {
    type: Date,
    required: false, // Optional field for membership join date set auto when they get approved
    
  },
  rank:{
      type : String,     // only manager can change the rank of engineers
      enum: ['junior', 'senior','master'],
      required  : false,
      default : 'junior'  
  }
});

// Middleware to set membershipJoinDate when status is approved
UserSchema.pre('save', function (next) {
    if (this.isModified('status') && this.status === 'approved') {
      this.membershipJoinDate = new Date(); // Set to current date and time
    }
    next();
  });

// Hash the password before saving the user model
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model('User', UserSchema);
module.exports = User;