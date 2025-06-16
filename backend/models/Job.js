import mongoose from 'mongoose';

const JobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  salary: {
    type: Number,
    required: false,
  },
  jobType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
    required: true,
  },
  skillsRequired: [{
    type: String,
  }],
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'postedByModel'
  },
  postedByModel: {
    type: String,
    required: true,
    enum: ['User', 'UnionUser']
  },
  interestedEngineers: [{
    engineer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dateExpressed: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['Open', 'Closed', 'Filled'],
    default: 'Open'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add method to express interest
JobSchema.methods.addInterestedEngineer = async function(userId) {
  if (this.interestedEngineers.some(e => e.engineer.equals(userId))) {
    throw new Error('User already expressed interest');
  }
  this.interestedEngineers.push({ engineer: userId });
  await this.save();
};

const Job = mongoose.model('Job', JobSchema);

export default Job;
