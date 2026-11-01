const Grievance = require('../models/Grievance');
const { getDBStatus } = require('../config/db');
const { predictGrievanceCategoryAndPriority } = require('../services/aiServiceClient');

// In-memory store fallback with initial seed grievances
let memoryGrievances = [
  {
    _id: '662000000000000000000001',
    grievanceId: 'GRV-2026-10024',
    title: 'Severe water leakage in Hostel Block B 3rd Floor washroom',
    description: 'The main pipe in washroom 3B has burst and water is flooding into the corridor. Risk of slipping and electrical hazards near the water cooler.',
    category: 'Hostel & Housing',
    priority: 'Urgent',
    priorityOverridden: false,
    status: 'In Progress',
    student: '661000000000000000000001',
    studentName: 'Alex Chen',
    assignedTo: '661000000000000000000002',
    assignedToName: 'Prof. David Vance',
    department: 'Maintenance & Facilities',
    location: 'Hostel Block B, Floor 3',
    aiPrediction: {
      predictedCategory: 'Maintenance & Facilities',
      predictedPriority: 'Urgent',
      confidence: 0.94,
      keywords: ['water', 'leak', 'flooding', 'hazard'],
      evaluatedAt: new Date(Date.now() - 3600000 * 24)
    },
    statusHistory: [
      {
        status: 'Submitted',
        updatedByName: 'Alex Chen',
        note: 'Grievance registered via student portal',
        timestamp: new Date(Date.now() - 3600000 * 24)
      },
      {
        status: 'Assigned',
        updatedByName: 'Dr. Sarah Martinez',
        note: 'Assigned to Maintenance Lead Vance. Priority marked Urgent.',
        timestamp: new Date(Date.now() - 3600000 * 18)
      },
      {
        status: 'In Progress',
        updatedByName: 'Prof. David Vance',
        note: 'Plumbing team dispatched. Main valve temporarily closed.',
        timestamp: new Date(Date.now() - 3600000 * 8)
      }
    ],
    resolutionNotes: '',
    createdAt: new Date(Date.now() - 3600000 * 24),
    updatedAt: new Date(Date.now() - 3600000 * 8)
  },
  {
    _id: '662000000000000000000002',
    grievanceId: 'GRV-2026-10025',
    title: 'Campus Wi-Fi authentication portal timeout in Central Library',
    description: 'Students are unable to log into Eduroam/Campus-Secure WiFi in the quiet study hall. Radius server returns 504 timeout error.',
    category: 'IT & Network Services',
    priority: 'High',
    priorityOverridden: false,
    status: 'Pending Review',
    student: '661000000000000000000001',
    studentName: 'Alex Chen',
    assignedTo: null,
    assignedToName: null,
    department: 'IT & Network Services',
    location: 'Central Library, 2nd Floor',
    aiPrediction: {
      predictedCategory: 'IT & Network Services',
      predictedPriority: 'High',
      confidence: 0.92,
      keywords: ['wi-fi', 'server', 'portal', 'timeout'],
      evaluatedAt: new Date(Date.now() - 3600000 * 6)
    },
    statusHistory: [
      {
        status: 'Submitted',
        updatedByName: 'Alex Chen',
        note: 'Grievance submitted by student',
        timestamp: new Date(Date.now() - 3600000 * 6)
      },
      {
        status: 'Pending Review',
        updatedByName: 'System AI Triage',
        note: 'Categorized as IT & Network Services (High Priority). Queued for administrator review.',
        timestamp: new Date(Date.now() - 3600000 * 6)
      }
    ],
    resolutionNotes: '',
    createdAt: new Date(Date.now() - 3600000 * 6),
    updatedAt: new Date(Date.now() - 3600000 * 6)
  },
  {
    _id: '662000000000000000000003',
    grievanceId: 'GRV-2026-10026',
    title: 'Discrepancy in Mid-Term Grade Sheet for CS301',
    description: 'Assignment 3 marks were not factored into the portal grade sheet despite timely submission on Moodle before deadline.',
    category: 'Academic Affairs',
    priority: 'Medium',
    priorityOverridden: false,
    status: 'Resolved',
    student: '661000000000000000000001',
    studentName: 'Alex Chen',
    assignedTo: '661000000000000000000002',
    assignedToName: 'Prof. David Vance',
    department: 'Academic Affairs',
    location: 'Academic Block 1',
    aiPrediction: {
      predictedCategory: 'Academic Affairs',
      predictedPriority: 'Medium',
      confidence: 0.89,
      keywords: ['grade', 'marks', 'moodle', 'assignment'],
      evaluatedAt: new Date(Date.now() - 3600000 * 48)
    },
    statusHistory: [
      {
        status: 'Submitted',
        updatedByName: 'Alex Chen',
        note: 'Issue logged',
        timestamp: new Date(Date.now() - 3600000 * 48)
      },
      {
        status: 'Resolved',
        updatedByName: 'Academic Office',
        note: 'Grade sheet recalculated and updated in student portal.',
        timestamp: new Date(Date.now() - 3600000 * 12)
      }
    ],
    resolutionNotes: 'Verified Moodle submission logs with Course Instructor. 5 marks restored and posted to registrar portal.',
    resolvedAt: new Date(Date.now() - 3600000 * 12),
    createdAt: new Date(Date.now() - 3600000 * 48),
    updatedAt: new Date(Date.now() - 3600000 * 12)
  }
];

// Helper to generate unique Grievance ID: GRV-2026-XXXXX
const generateGrievanceId = () => {
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  return `GRV-2026-${randomSuffix}`;
};

// @desc    Submit a new grievance (Students)
// @route   POST /api/grievances
// @access  Private (student, admin)
exports.createGrievance = async (req, res, next) => {
  try {
    const { title, description, category: userCategory, location } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required' });
    }

    // Call AI Microservice for Category & Priority Assessment
    const aiResult = await predictGrievanceCategoryAndPriority(title, description);

    // Prefer explicit category if provided by user, otherwise AI predicted category
    const finalCategory = userCategory || aiResult.category;
    const finalPriority = aiResult.priority || 'Medium';
    const grievanceId = generateGrievanceId();

    const studentId = req.user.id || req.user._id;
    const studentName = req.user.name || 'Student';

    const statusHistory = [
      {
        status: 'Submitted',
        updatedBy: studentId,
        updatedByName: studentName,
        note: 'Grievance submitted by student',
        timestamp: new Date()
      },
      {
        status: 'Pending Review',
        updatedByName: 'AI Triage Agent',
        note: `AI Analysis complete: Tagged '${finalCategory}' with '${finalPriority}' priority (Confidence: ${(aiResult.confidence * 100).toFixed(0)}%).`,
        timestamp: new Date()
      }
    ];

    if (getDBStatus()) {
      const grievance = await Grievance.create({
        grievanceId,
        title,
        description,
        category: finalCategory,
        priority: finalPriority,
        status: 'Pending Review',
        student: studentId,
        department: finalCategory,
        location: location || 'Main Campus',
        aiPrediction: {
          predictedCategory: aiResult.category,
          predictedPriority: aiResult.priority,
          confidence: aiResult.confidence,
          keywords: aiResult.keywords,
          evaluatedAt: new Date()
        },
        statusHistory
      });

      return res.status(201).json({
        success: true,
        message: 'Grievance submitted successfully',
        grievance
      });
    }

    // In-Memory Fallback
    const newGrievance = {
      _id: `66200000000000000000000${memoryGrievances.length + 1}`,
      grievanceId,
      title,
      description,
      category: finalCategory,
      priority: finalPriority,
      priorityOverridden: false,
      status: 'Pending Review',
      student: studentId,
      studentName,
      assignedTo: null,
      assignedToName: null,
      department: finalCategory,
      location: location || 'Main Campus',
      aiPrediction: {
        predictedCategory: aiResult.category,
        predictedPriority: aiResult.priority,
        confidence: aiResult.confidence,
        keywords: aiResult.keywords,
        evaluatedAt: new Date()
      },
      statusHistory,
      resolutionNotes: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    memoryGrievances.unshift(newGrievance);

    return res.status(201).json({
      success: true,
      message: 'Grievance submitted successfully',
      grievance: newGrievance
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all grievances (scoped by role)
// @route   GET /api/grievances
// @access  Private
exports.getGrievances = async (req, res, next) => {
  try {
    const { status, category, priority, search } = req.query;
    const userRole = req.user.role;
    const userId = req.user.id || req.user._id;

    if (getDBStatus()) {
      let query = {};

      // Role scoping
      if (userRole === 'student') {
        query.student = userId;
      } else if (userRole === 'staff') {
        // Staff sees issues assigned to them or matching their department
        query.$or = [{ assignedTo: userId }, { department: req.user.department }];
      }
      // Admin sees all

      if (status) query.status = status;
      if (category) query.category = category;
      if (priority) query.priority = priority;
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { grievanceId: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      const grievances = await Grievance.find(query)
        .populate('student', 'name email studentId')
        .populate('assignedTo', 'name email department')
        .sort({ createdAt: -1 });

      return res.json({
        success: true,
        count: grievances.length,
        grievances
      });
    }

    // In-memory fallback
    let results = [...memoryGrievances];

    if (userRole === 'student') {
      results = results.filter(g => g.student === userId || g.studentName === req.user.name);
    } else if (userRole === 'staff') {
      results = results.filter(g => g.assignedTo === userId || g.department === req.user.department);
    }

    if (status) results = results.filter(g => g.status === status);
    if (category) results = results.filter(g => g.category === category);
    if (priority) results = results.filter(g => g.priority === priority);
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(g =>
        g.title.toLowerCase().includes(q) ||
        g.grievanceId.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q)
      );
    }

    return res.json({
      success: true,
      count: results.length,
      grievances: results
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single grievance by ID or GrievanceID
// @route   GET /api/grievances/:id
// @access  Private
exports.getGrievanceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (getDBStatus()) {
      const grievance = await Grievance.findOne({
        $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { grievanceId: id }]
      })
        .populate('student', 'name email studentId phone')
        .populate('assignedTo', 'name email department');

      if (!grievance) {
        return res.status(404).json({ success: false, message: 'Grievance not found' });
      }

      return res.json({ success: true, grievance });
    }

    const item = memoryGrievances.find(g => g._id === id || g.grievanceId === id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Grievance not found' });
    }

    return res.json({ success: true, grievance: item });
  } catch (err) {
    next(err);
  }
};

// @desc    Update Grievance Status
// @route   PATCH /api/grievances/:id/status
// @access  Private (staff, admin)
exports.updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    const validStatuses = ['Submitted', 'Pending Review', 'Assigned', 'In Progress', 'Resolved', 'Closed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const updaterName = req.user.name || 'Staff Member';
    const updaterId = req.user.id || req.user._id;

    if (getDBStatus()) {
      const grievance = await Grievance.findOne({
        $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { grievanceId: id }]
      });

      if (!grievance) {
        return res.status(404).json({ success: false, message: 'Grievance not found' });
      }

      grievance.status = status;
      if (status === 'Resolved') grievance.resolvedAt = new Date();
      if (status === 'Closed') grievance.closedAt = new Date();

      grievance.statusHistory.push({
        status,
        updatedBy: updaterId,
        updatedByName: updaterName,
        note: note || `Status transitioned to ${status}`,
        timestamp: new Date()
      });

      await grievance.save();
      return res.json({ success: true, message: `Status updated to ${status}`, grievance });
    }

    // In-Memory
    const item = memoryGrievances.find(g => g._id === id || g.grievanceId === id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Grievance not found' });
    }

    item.status = status;
    item.updatedAt = new Date();
    if (status === 'Resolved') item.resolvedAt = new Date();
    if (status === 'Closed') item.closedAt = new Date();

    item.statusHistory.push({
      status,
      updatedBy: updaterId,
      updatedByName: updaterName,
      note: note || `Status transitioned to ${status}`,
      timestamp: new Date()
    });

    return res.json({ success: true, message: `Status updated to ${status}`, grievance: item });
  } catch (err) {
    next(err);
  }
};

// @desc    Assign grievance to staff / department (Admin)
// @route   PATCH /api/grievances/:id/assign
// @access  Private (admin)
exports.assignGrievance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { staffId, staffName, department, note } = req.body;

    const updaterName = req.user.name || 'Administrator';
    const updaterId = req.user.id || req.user._id;

    if (getDBStatus()) {
      const grievance = await Grievance.findOne({
        $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { grievanceId: id }]
      });

      if (!grievance) {
        return res.status(404).json({ success: false, message: 'Grievance not found' });
      }

      if (staffId) grievance.assignedTo = staffId;
      if (department) grievance.department = department;
      grievance.status = 'Assigned';

      grievance.statusHistory.push({
        status: 'Assigned',
        updatedBy: updaterId,
        updatedByName: updaterName,
        note: note || `Assigned to ${staffName || 'Department Staff'} (${department || grievance.department})`,
        timestamp: new Date()
      });

      await grievance.save();
      return res.json({ success: true, message: 'Grievance assigned successfully', grievance });
    }

    const item = memoryGrievances.find(g => g._id === id || g.grievanceId === id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Grievance not found' });
    }

    item.assignedTo = staffId || '661000000000000000000002';
    item.assignedToName = staffName || 'Prof. David Vance';
    if (department) item.department = department;
    item.status = 'Assigned';
    item.updatedAt = new Date();

    item.statusHistory.push({
      status: 'Assigned',
      updatedBy: updaterId,
      updatedByName: updaterName,
      note: note || `Assigned to ${item.assignedToName} (${item.department})`,
      timestamp: new Date()
    });

    return res.json({ success: true, message: 'Grievance assigned successfully', grievance: item });
  } catch (err) {
    next(err);
  }
};

// @desc    Override grievance priority (Admin)
// @route   PATCH /api/grievances/:id/priority
// @access  Private (admin)
exports.overridePriority = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { priority, reason } = req.body;
    const validPriorities = ['Low', 'Medium', 'High', 'Urgent'];

    if (!validPriorities.includes(priority)) {
      return res.status(400).json({ success: false, message: `Priority must be one of: ${validPriorities.join(', ')}` });
    }

    if (getDBStatus()) {
      const grievance = await Grievance.findOne({
        $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { grievanceId: id }]
      });

      if (!grievance) {
        return res.status(404).json({ success: false, message: 'Grievance not found' });
      }

      const prevPriority = grievance.priority;
      grievance.priority = priority;
      grievance.priorityOverridden = true;
      grievance.priorityOverrideReason = reason || 'Admin Priority Override';

      grievance.statusHistory.push({
        status: grievance.status,
        updatedBy: req.user.id || req.user._id,
        updatedByName: req.user.name || 'Administrator',
        note: `Priority changed from ${prevPriority} to ${priority}. Reason: ${reason || 'Administrative review'}`,
        timestamp: new Date()
      });

      await grievance.save();
      return res.json({ success: true, message: `Priority updated to ${priority}`, grievance });
    }

    const item = memoryGrievances.find(g => g._id === id || g.grievanceId === id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Grievance not found' });
    }

    const prevPriority = item.priority;
    item.priority = priority;
    item.priorityOverridden = true;
    item.priorityOverrideReason = reason || 'Admin Priority Override';
    item.updatedAt = new Date();

    item.statusHistory.push({
      status: item.status,
      updatedBy: req.user.id || req.user._id,
      updatedByName: req.user.name || 'Administrator',
      note: `Priority changed from ${prevPriority} to ${priority}. Reason: ${reason || 'Administrative review'}`,
      timestamp: new Date()
    });

    return res.json({ success: true, message: `Priority updated to ${priority}`, grievance: item });
  } catch (err) {
    next(err);
  }
};

// @desc    Add resolution notes (Staff / Admin)
// @route   POST /api/grievances/:id/resolution
// @access  Private (staff, admin)
exports.addResolutionNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { resolutionNotes, markResolved = true } = req.body;

    if (!resolutionNotes) {
      return res.status(400).json({ success: false, message: 'Resolution notes cannot be empty' });
    }

    if (getDBStatus()) {
      const grievance = await Grievance.findOne({
        $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { grievanceId: id }]
      });

      if (!grievance) {
        return res.status(404).json({ success: false, message: 'Grievance not found' });
      }

      grievance.resolutionNotes = resolutionNotes;
      if (markResolved) {
        grievance.status = 'Resolved';
        grievance.resolvedAt = new Date();
      }

      grievance.statusHistory.push({
        status: grievance.status,
        updatedBy: req.user.id || req.user._id,
        updatedByName: req.user.name || 'Staff Member',
        note: `Resolution note submitted: ${resolutionNotes.slice(0, 80)}...`,
        timestamp: new Date()
      });

      await grievance.save();
      return res.json({ success: true, message: 'Resolution notes recorded', grievance });
    }

    const item = memoryGrievances.find(g => g._id === id || g.grievanceId === id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Grievance not found' });
    }

    item.resolutionNotes = resolutionNotes;
    if (markResolved) {
      item.status = 'Resolved';
      item.resolvedAt = new Date();
    }
    item.updatedAt = new Date();

    item.statusHistory.push({
      status: item.status,
      updatedBy: req.user.id || req.user._id,
      updatedByName: req.user.name || 'Staff Member',
      note: `Resolution note submitted: ${resolutionNotes.slice(0, 80)}...`,
      timestamp: new Date()
    });

    return res.json({ success: true, message: 'Resolution notes recorded', grievance: item });
  } catch (err) {
    next(err);
  }
};

module.exports.memoryGrievances = memoryGrievances;
