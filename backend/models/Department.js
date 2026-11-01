const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  headOfDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  contactEmail: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  slaHours: {
    type: Number,
    default: 48 // Default SLA: 48 hours
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.Department || mongoose.model('Department', departmentSchema);
