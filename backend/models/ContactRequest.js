import mongoose from 'mongoose';

const contactTypesEnum = [
  'report_system_issue',
  'report_certificate_issue',
  'general_inquiry',
  'other', // Add more types as needed
]; // Define the enum for contact types

const ContactRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true,
  },
  contactType: {
    type: String,
    enum: contactTypesEnum, // Use the defined enum for contact types
    required: true,
  },
  message: {
    type: String,
    required: true, // Message is required
  },
  dateCreated: {
    type: Date,
    default: Date.now, // Automatically set to the current date
  },
  status: {
    type: String,
    enum: ['pending', 'resolved'], // Define possible statuses
    default: 'pending', // Default status is 'pending'
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UnionUser', // Reference to the UnionUser model
    required: false, // Optional field for the union user who resolved the request
  },
});

const ContactRequest = mongoose.model('ContactRequest', ContactRequestSchema);
export default ContactRequest; // Use default export