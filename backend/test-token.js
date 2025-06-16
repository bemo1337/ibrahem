const jwt = require('jsonwebtoken');
require('dotenv').config();

// This is a test script to generate a JWT token for testing
// Make sure to replace the user ID with a valid manager/staff user ID from your database

const payload = {
  id: 'YOUR_MANAGER_OR_STAFF_USER_ID', // Replace with actual user ID
  role: 'manager' // or 'staff' depending on the user
};

const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
console.log('Generated JWT Token:');
console.log(token);
