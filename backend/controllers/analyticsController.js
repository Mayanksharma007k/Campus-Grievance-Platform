const Grievance = require('../models/Grievance');
const { getDBStatus } = require('../config/db');
const { memoryGrievances } = require('./grievanceController');

// @desc    Get dashboard analytics, category stats & department metrics
// @route   GET /api/analytics/dashboard
// @access  Private (admin, staff)
exports.getDashboardAnalytics = async (req, res, next) => {
  try {
    const campusCategories = [
      'Academic Affairs',
      'Hostel & Housing',
      'Maintenance & Facilities',
      'IT & Network Services',
      'Finance & Accounts',
      'Library & Learning Resources',
      'Campus Security',
      'Cafeteria & Dining',
      'General Administration'
    ];

    let allGrievances = [];

    if (getDBStatus()) {
      allGrievances = await Grievance.find({});
    } else {
      allGrievances = memoryGrievances;
    }

    const total = allGrievances.length;

    // Status counts
    const statusCounts = {
      Submitted: 0,
      'Pending Review': 0,
      Assigned: 0,
      'In Progress': 0,
      Resolved: 0,
      Closed: 0
    };

    // Priority counts
    const priorityCounts = {
      Urgent: 0,
      High: 0,
      Medium: 0,
      Low: 0
    };

    // Category breakdown
    const categoryCounts = {};
    campusCategories.forEach(cat => (categoryCounts[cat] = 0));

    // Department breakdown
    const departmentStats = {};

    allGrievances.forEach(g => {
      if (statusCounts[g.status] !== undefined) statusCounts[g.status]++;
      if (priorityCounts[g.priority] !== undefined) priorityCounts[g.priority]++;

      if (g.category) {
        categoryCounts[g.category] = (categoryCounts[g.category] || 0) + 1;
      }

      const dept = g.department || g.category || 'General Administration';
      if (!departmentStats[dept]) {
        departmentStats[dept] = { total: 0, resolved: 0, inProgress: 0, pending: 0 };
      }
      departmentStats[dept].total++;
      if (g.status === 'Resolved' || g.status === 'Closed') {
        departmentStats[dept].resolved++;
      } else if (g.status === 'In Progress') {
        departmentStats[dept].inProgress++;
      } else {
        departmentStats[dept].pending++;
      }
    });

    // Resolution rate
    const resolvedCount = (statusCounts['Resolved'] || 0) + (statusCounts['Closed'] || 0);
    const resolutionRate = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;

    res.json({
      success: true,
      data: {
        summary: {
          totalGrievances: total,
          pendingReview: statusCounts['Pending Review'] || 0,
          inProgress: statusCounts['In Progress'] || 0,
          resolvedCount,
          urgentCount: priorityCounts['Urgent'] || 0,
          resolutionRate: `${resolutionRate}%`
        },
        statusCounts,
        priorityCounts,
        categoryBreakdown: categoryCounts,
        departmentStats
      }
    });
  } catch (err) {
    next(err);
  }
};
