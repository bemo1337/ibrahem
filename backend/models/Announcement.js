import mongoose from 'mongoose';

const AnnouncementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true, // Title is required
  },
  content: {
    type: String,
    required: true, // Content is required
  },
  dateCreated: {
    type: Date,
    default: Date.now, // Automatically set to the current date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UnionUser', // Reference to the UnionUser model
    required: true, // This field is required
  },
  status: {
    type: String,
    enum: ['active', 'archived'], // Define possible statuses
    default: 'active', // Default status is 'active'
  },
  viewCount: {
    type: Number,
    default: 0, // Initialize the view count to 0
  },
});

const Announcement = mongoose.model('Announcement', AnnouncementSchema);
export default Announcement; // Use default export