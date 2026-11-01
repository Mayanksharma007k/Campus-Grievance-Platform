const User = require('../models/User');
const { getDBStatus } = require('../config/db');
const { memoryUsers } = require('./authController');

// @desc    Get all staff members for task assignment
// @route   GET /api/users/staff
// @access  Private (admin)
exports.getStaffMembers = async (req, res, next) => {
  try {
    if (getDBStatus()) {
      const staffList = await User.find({ role: 'staff' }).select('name email department');
      return res.json({ success: true, count: staffList.length, staff: staffList });
    }

    const staffList = memoryUsers
      .filter(u => u.role === 'staff' || u.role === 'admin')
      .map(u => ({
        id: u.id || u._id,
        _id: u._id || u.id,
        name: u.name,
        email: u.email,
        department: u.department,
        role: u.role
      }));

    return res.json({ success: true, count: staffList.length, staff: staffList });
  } catch (err) {
    next(err);
  }
};
