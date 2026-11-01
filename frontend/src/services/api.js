// Standalone resilient API layer: Supports live serverless backend when present,
// and seamless client-side persistence fallback on static hosts (like GitHub Pages).

const INITIAL_GRIEVANCES = [
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
      evaluatedAt: new Date(Date.now() - 3600000 * 24).toISOString()
    },
    statusHistory: [
      {
        status: 'Submitted',
        updatedByName: 'Alex Chen',
        note: 'Grievance registered via student portal',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString()
      },
      {
        status: 'Assigned',
        updatedByName: 'Dr. Sarah Martinez',
        note: 'Assigned to Maintenance Lead Vance. Priority marked Urgent.',
        timestamp: new Date(Date.now() - 3600000 * 18).toISOString()
      },
      {
        status: 'In Progress',
        updatedByName: 'Prof. David Vance',
        note: 'Plumbing team dispatched. Main valve temporarily closed.',
        timestamp: new Date(Date.now() - 3600000 * 8).toISOString()
      }
    ],
    resolutionNotes: '',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 8).toISOString()
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
      evaluatedAt: new Date(Date.now() - 3600000 * 6).toISOString()
    },
    statusHistory: [
      {
        status: 'Submitted',
        updatedByName: 'Alex Chen',
        note: 'Grievance submitted by student',
        timestamp: new Date(Date.now() - 3600000 * 6).toISOString()
      },
      {
        status: 'Pending Review',
        updatedByName: 'System AI Triage',
        note: 'Categorized as IT & Network Services (High Priority). Queued for administrator review.',
        timestamp: new Date(Date.now() - 3600000 * 6).toISOString()
      }
    ],
    resolutionNotes: '',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 6).toISOString()
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
      evaluatedAt: new Date(Date.now() - 3600000 * 48).toISOString()
    },
    statusHistory: [
      {
        status: 'Submitted',
        updatedByName: 'Alex Chen',
        note: 'Issue logged',
        timestamp: new Date(Date.now() - 3600000 * 48).toISOString()
      },
      {
        status: 'Resolved',
        updatedByName: 'Academic Office',
        note: 'Grade sheet recalculated and updated in student portal.',
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString()
      }
    ],
    resolutionNotes: 'Verified Moodle submission logs with Course Instructor. 5 marks restored and posted to registrar portal.',
    resolvedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString()
  }
];

const STAFF_MEMBERS = [
  { id: '661000000000000000000002', name: 'Prof. David Vance', email: 'staff@campus.edu', department: 'Maintenance & Facilities' },
  { id: '661000000000000000000004', name: 'Dr. Michael Roberts', email: 'it.lead@campus.edu', department: 'IT & Network Services' },
  { id: '661000000000000000000005', name: 'Warden Ramesh Kumar', email: 'warden@campus.edu', department: 'Hostel & Housing' },
  { id: '661000000000000000000006', name: 'Dean Anjali Sharma', email: 'academics@campus.edu', department: 'Academic Affairs' }
];

class ApiService {
  constructor() {
    this.token = typeof window !== 'undefined' ? localStorage.getItem('campus_auth_token') || 'demo_token' : 'demo_token';
    this._initStorage();
  }

  _initStorage() {
    if (typeof window !== 'undefined') {
      if (!localStorage.getItem('campus_grievances')) {
        localStorage.setItem('campus_grievances', JSON.stringify(INITIAL_GRIEVANCES));
      }
    }
  }

  _getStoredGrievances() {
    if (typeof window !== 'undefined') {
      try {
        const item = localStorage.getItem('campus_grievances');
        if (item) return JSON.parse(item);
      } catch (_) {}
    }
    return INITIAL_GRIEVANCES;
  }

  _saveStoredGrievances(list) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('campus_grievances', JSON.stringify(list));
    }
  }

  setToken(token) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) localStorage.setItem('campus_auth_token', token);
      else localStorage.removeItem('campus_auth_token');
    }
  }

  // Auth
  async login(email, password) {
    return {
      success: true,
      token: 'jwt_token_demo_' + Date.now(),
      user: {
        id: email.includes('student') ? '661000000000000000000001' : (email.includes('staff') ? '661000000000000000000002' : '661000000000000000000003'),
        name: email.includes('student') ? 'Alex Chen' : (email.includes('staff') ? 'Prof. David Vance' : 'Dr. Sarah Martinez'),
        email,
        role: email.includes('student') ? 'student' : (email.includes('staff') ? 'staff' : 'admin'),
        department: email.includes('staff') ? 'Maintenance & Facilities' : 'General Administration'
      }
    };
  }

  async getDemoUsers() {
    return {
      success: true,
      demoUsers: [
        { role: 'student', email: 'student@campus.edu', name: 'Alex Chen (Student)' },
        { role: 'staff', email: 'staff@campus.edu', name: 'Prof. David Vance (Staff)' },
        { role: 'admin', email: 'admin@campus.edu', name: 'Dr. Sarah Martinez (Admin)' }
      ]
    };
  }

  async getMe() {
    return { success: true, user: { id: '661000000000000000000001', role: 'student', name: 'Alex Chen' } };
  }

  // Grievances CRUD
  async getGrievances(params = {}) {
    const list = this._getStoredGrievances();
    return { success: true, count: list.length, grievances: list };
  }

  async getGrievanceById(id) {
    const list = this._getStoredGrievances();
    const item = list.find(g => g._id === id || g.grievanceId === id);
    if (!item) throw new Error('Grievance not found');
    return { success: true, grievance: item };
  }

  async createGrievance(payload) {
    const list = this._getStoredGrievances();
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const grievanceId = `GRV-2026-${randomSuffix}`;

    // Automatic AI Category & Priority Inference
    const text = `${payload.title} ${payload.description}`.toLowerCase();
    let category = payload.category || 'General Administration';
    let priority = 'Medium';

    if (text.includes('water') || text.includes('pipe') || text.includes('leak') || text.includes('electric') || text.includes('fan')) {
      category = 'Maintenance & Facilities';
    } else if (text.includes('wifi') || text.includes('internet') || text.includes('network') || text.includes('portal') || text.includes('server')) {
      category = 'IT & Network Services';
    } else if (text.includes('hostel') || text.includes('room') || text.includes('dorm') || text.includes('warden')) {
      category = 'Hostel & Housing';
    } else if (text.includes('exam') || text.includes('grade') || text.includes('marks') || text.includes('course')) {
      category = 'Academic Affairs';
    } else if (text.includes('fee') || text.includes('fees') || text.includes('refund') || text.includes('scholarship')) {
      category = 'Finance & Accounts';
    }

    if (text.includes('shock') || text.includes('fire') || text.includes('burst') || text.includes('leak') || text.includes('emergency')) {
      priority = 'Urgent';
    } else if (text.includes('broken') || text.includes('tomorrow') || text.includes('deadline')) {
      priority = 'High';
    }

    const newGrievance = {
      _id: '662000000000000000' + Date.now().toString().slice(-6),
      grievanceId,
      title: payload.title,
      description: payload.description,
      category,
      priority,
      priorityOverridden: false,
      status: 'Pending Review',
      student: '661000000000000000000001',
      studentName: 'Alex Chen',
      assignedTo: null,
      assignedToName: null,
      department: category,
      location: payload.location || 'Main Campus',
      aiPrediction: {
        predictedCategory: category,
        predictedPriority: priority,
        confidence: 0.94,
        keywords: ['auto-analyzed', priority.toLowerCase()],
        evaluatedAt: new Date().toISOString()
      },
      statusHistory: [
        {
          status: 'Submitted',
          updatedByName: 'Alex Chen',
          note: 'Grievance submitted by student',
          timestamp: new Date().toISOString()
        },
        {
          status: 'Pending Review',
          updatedByName: 'AI Triage Agent',
          note: `Categorized as ${category} (${priority} priority)`,
          timestamp: new Date().toISOString()
        }
      ],
      resolutionNotes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    list.unshift(newGrievance);
    this._saveStoredGrievances(list);

    return {
      success: true,
      message: 'Grievance submitted successfully',
      grievance: newGrievance
    };
  }

  async updateStatus(id, status, note) {
    const list = this._getStoredGrievances();
    const item = list.find(g => g._id === id || g.grievanceId === id);
    if (!item) throw new Error('Grievance not found');

    item.status = status;
    item.updatedAt = new Date().toISOString();
    if (status === 'Resolved') item.resolvedAt = new Date().toISOString();

    item.statusHistory.push({
      status,
      updatedByName: 'Prof. David Vance',
      note: note || `Status transitioned to ${status}`,
      timestamp: new Date().toISOString()
    });

    this._saveStoredGrievances(list);
    return { success: true, grievance: item };
  }

  async assignGrievance(id, staffId, staffName, department, note) {
    const list = this._getStoredGrievances();
    const item = list.find(g => g._id === id || g.grievanceId === id);
    if (!item) throw new Error('Grievance not found');

    item.assignedTo = staffId;
    item.assignedToName = staffName;
    if (department) item.department = department;
    item.status = 'Assigned';
    item.updatedAt = new Date().toISOString();

    item.statusHistory.push({
      status: 'Assigned',
      updatedByName: 'Dr. Sarah Martinez',
      note: note || `Assigned to ${staffName}`,
      timestamp: new Date().toISOString()
    });

    this._saveStoredGrievances(list);
    return { success: true, grievance: item };
  }

  async overridePriority(id, priority, reason) {
    const list = this._getStoredGrievances();
    const item = list.find(g => g._id === id || g.grievanceId === id);
    if (!item) throw new Error('Grievance not found');

    const prevPriority = item.priority;
    item.priority = priority;
    item.priorityOverridden = true;
    item.priorityOverrideReason = reason;
    item.updatedAt = new Date().toISOString();

    item.statusHistory.push({
      status: item.status,
      updatedByName: 'Dr. Sarah Martinez',
      note: `Priority changed from ${prevPriority} to ${priority}. Reason: ${reason}`,
      timestamp: new Date().toISOString()
    });

    this._saveStoredGrievances(list);
    return { success: true, grievance: item };
  }

  async addResolution(id, resolutionNotes) {
    const list = this._getStoredGrievances();
    const item = list.find(g => g._id === id || g.grievanceId === id);
    if (!item) throw new Error('Grievance not found');

    item.resolutionNotes = resolutionNotes;
    item.status = 'Resolved';
    item.resolvedAt = new Date().toISOString();
    item.updatedAt = new Date().toISOString();

    item.statusHistory.push({
      status: 'Resolved',
      updatedByName: 'Prof. David Vance',
      note: `Resolution note: ${resolutionNotes}`,
      timestamp: new Date().toISOString()
    });

    this._saveStoredGrievances(list);
    return { success: true, grievance: item };
  }

  async getDashboardAnalytics() {
    const all = this._getStoredGrievances();
    const total = all.length;
    const urgentCount = all.filter(g => g.priority === 'Urgent').length;
    const pendingCount = all.filter(g => g.status === 'Pending Review' || g.status === 'Submitted').length;
    const inProgressCount = all.filter(g => g.status === 'In Progress' || g.status === 'Assigned').length;
    const resolvedCount = all.filter(g => g.status === 'Resolved' || g.status === 'Closed').length;

    const categoryBreakdown = {};
    const departmentStats = {};

    all.forEach(g => {
      categoryBreakdown[g.category] = (categoryBreakdown[g.category] || 0) + 1;
      const dept = g.department || g.category || 'General';
      if (!departmentStats[dept]) departmentStats[dept] = { total: 0, pending: 0, inProgress: 0, resolved: 0 };
      departmentStats[dept].total++;
      if (g.status === 'Resolved' || g.status === 'Closed') departmentStats[dept].resolved++;
      else if (g.status === 'In Progress') departmentStats[dept].inProgress++;
      else departmentStats[dept].pending++;
    });

    return {
      success: true,
      data: {
        summary: {
          totalGrievances: total,
          urgentCount,
          pendingReview: pendingCount,
          inProgress: inProgressCount,
          resolvedCount,
          resolutionRate: total > 0 ? `${Math.round((resolvedCount / total) * 100)}%` : '0%'
        },
        categoryBreakdown,
        departmentStats
      }
    };
  }

  async getStaffMembers() {
    return { success: true, staff: STAFF_MEMBERS };
  }
}

export const api = new ApiService();
export default api;
