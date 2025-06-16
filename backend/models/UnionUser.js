const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Import bcryptjs

const positionsEnum = ['supervisor', 'accountant', 'employee']; // Define the enum for positions

const UnionUserSchema = new mongoose.Schema({
    fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // Ensure email is unique
  },
  password: {
    type: String,
    required: true,
    select: false, // Do not return password in queries
  },
  idNumber: {
    type: String,
    required: true,
  },
  profilePicture: {
    type: String,
    required: false, // Optional field for profile picture
  },
  position: {
    type: String,
    enum: positionsEnum, // Use the defined enum for position
    required: false,
  },
  dateOfBirth: {
    type: Date,
    required: true, // Set to true if you want to require this field
  },
  gender: {
    type: String,
    enum: ['Male', 'Female'], // Add more if needed
    required: true,
  },
  role: {
    type: String,
   enum: ['staff','manager']
  },
  status: {
    type: String,
    default: null
  },
});

// Hash the password before saving the union user model
UnionUserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(this.password, salt);

  this.password = hash;
  next();
});

const UnionUser = mongoose.model('UnionUser', UnionUserSchema);
module.exports = UnionUser;