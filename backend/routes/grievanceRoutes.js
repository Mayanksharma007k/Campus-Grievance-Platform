const express = require('express');
const router = express.Router();
const {
  createGrievance,
  getGrievances,
  getGrievanceById,
  updateStatus,
  assignGrievance,
  overridePriority,
  addResolutionNote
} = require('../controllers/grievanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, authorize('student', 'admin'), createGrievance)
  .get(protect, getGrievances);

router.route('/:id')
  .get(protect, getGrievanceById);

router.route('/:id/status')
  .patch(protect, authorize('staff', 'admin'), updateStatus);

router.route('/:id/assign')
  .patch(protect, authorize('admin'), assignGrievance);

router.route('/:id/priority')
  .patch(protect, authorize('admin'), overridePriority);

router.route('/:id/resolution')
  .post(protect, authorize('staff', 'admin'), addResolutionNote);

module.exports = router;
