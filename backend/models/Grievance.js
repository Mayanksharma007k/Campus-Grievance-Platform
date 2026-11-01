const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['Submitted', 'Pending Review', 'Assigned', 'In Progress', 'Resolved', 'Closed'],
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedByName: {
    type: String,
    default: 'System'
  },
  note: {
    type: String,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const grievanceSchema = new mongoose.Schema({
  grievanceId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Please provide grievance title'],
    trim: true,
    maxlength: 140
  },
  description: {
    type: String,
    required: [true, 'Please provide grievance description'],
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Academic Affairs',
      'Hostel & Housing',
      'Maintenance & Facilities',
      'IT & Network Services',
      'Finance & Accounts',
      'Library & Learning Resources',
      'Campus Security',
      'Cafeteria & Dining',
      'General Administration'
    ],
    default: 'General Administration'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  priorityOverridden: {
    type: Boolean,
    default: false
  },
  priorityOverrideReason: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Submitted', 'Pending Review', 'Assigned', 'In Progress', 'Resolved', 'Closed'],
    default: 'Submitted'
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  department: {
    type: String,
    default: 'General Administration'
  },
  location: {
    type: String,
    trim: true,
    default: 'Main Campus'
  },
  aiPrediction: {
    predictedCategory: String,
    predictedPriority: String,
    confidence: Number,
    keywords: [String],
    evaluatedAt: Date
  },
  statusHistory: [statusHistorySchema],
  resolutionNotes: {
    type: String,
    trim: true
  },
  resolvedAt: {
    type: Date
  },
  closedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp on modify
grievanceSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.models.Grievance || mongoose.model('Grievance', grievanceSchema);
