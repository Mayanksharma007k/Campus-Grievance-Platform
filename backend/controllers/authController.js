const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const jwtConfig = require('../config/jwt');
const User = require('../models/User');
const { getDBStatus } = require('../config/db');

// In-memory user store fallback for standalone zero-config execution
const memoryUsers = [
  {
    _id: '661000000000000000000001',
    id: '661000000000000000000001',
    name: 'Alex Chen',
    email: 'student@campus.edu',
    passwordHash: '$2a$10$X87X3mN.rN8L76P2M9Z0zeoNqmJzUjUqD4g7M6wU.F4v5fWfNnU1u', // password123
    role: 'student',
    studentId: 'STU-2024-8842',
    department: 'Computer Science'
  },
  {
    _id: '661000000000000000000002',
    id: '661000000000000000000002',
    name: 'Prof. David Vance',
    email: 'staff@campus.edu',
    passwordHash: '$2a$10$X87X3mN.rN8L76P2M9Z0zeoNqmJzUjUqD4g7M6wU.F4v5fWfNnU1u', // password123
    role: 'staff',
    department: 'Maintenance & Facilities'
  },
  {
    _id: '661000000000000000000003',
    id: '661000000000000000000003',
    name: 'Dr. Sarah Martinez',
    email: 'admin@campus.edu',
    passwordHash: '$2a$10$X87X3mN.rN8L76P2M9Z0zeoNqmJzUjUqD4g7M6wU.F4v5fWfNnU1u', // password123
    role: 'admin',
    department: 'General Administration'
  }
];

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id ? user._id.toString() : user.id,
      role: user.role,
      email: user.email,
      name: user.name,
      department: user.department
    },
    jwtConfig.secret,
    { expiresIn: jwtConfig.expiresIn }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'student', department, studentId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    if (getDBStatus()) {
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ success: false, message: 'User already exists with this email' });
      }

      const user = await User.create({
        name,
        email,
        password,
        role,
        department,
        studentId
      });

      const token = generateToken(user);
      return res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          studentId: user.studentId
        }
      });
    }

    // In-Memory Fallback
    const existing = memoryUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const newId = `66100000000000000000000${memoryUsers.length + 1}`;
    const newUser = {
      _id: newId,
      id: newId,
      name,
      email,
      passwordHash,
      role,
      department: department || 'General Administration',
      studentId: studentId || `STU-${Date.now().toString().slice(-4)}`
    };
    memoryUsers.push(newUser);

    const token = generateToken(newUser);
    return res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        studentId: newUser.studentId
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    if (getDBStatus()) {
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const token = generateToken(user);
      return res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          studentId: user.studentId
        }
      });
    }

    // In-memory fallback
    const user = memoryUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Default prototype allows password123 or hashed comparison
    const isMatch = password === 'password123' || (await bcrypt.compare(password, user.passwordHash));
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user);
    return res.json({
      success: true,
      token,
      user: {
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        studentId: user.studentId
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get currently authenticated user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get demo users list for quick prototyping
// @route   GET /api/auth/demo-users
// @access  Public
exports.getDemoUsers = (req, res) => {
  res.json({
    success: true,
    message: 'Demo credentials ready for testing all roles',
    demoUsers: [
      { role: 'student', email: 'student@campus.edu', password: 'password123', name: 'Alex Chen (Student)' },
      { role: 'staff', email: 'staff@campus.edu', password: 'password123', name: 'Prof. David Vance (Staff - Maintenance)' },
      { role: 'admin', email: 'admin@campus.edu', password: 'password123', name: 'Dr. Sarah Martinez (Administrator)' }
    ]
  });
};

module.exports.memoryUsers = memoryUsers;
