const express = require('express');
const router = express.Router();
const { getStaffMembers } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/staff', protect, authorize('admin', 'staff'), getStaffMembers);

module.exports = router;
