const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

// Connect DB (handles live MongoDB and fallback)
const { connectDB, getDBStatus } = require('../backend/config/db');
connectDB();

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Campus Grievance Management API (Vercel Serverless)',
    mongoDBConnected: getDBStatus(),
    timestamp: new Date().toISOString()
  });
});

// Mount Backend Routes
app.use('/api/auth', require('../backend/routes/authRoutes'));
app.use('/api/grievances', require('../backend/routes/grievanceRoutes'));
app.use('/api/analytics', require('../backend/routes/analyticsRoutes'));
app.use('/api/users', require('../backend/routes/userRoutes'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found`
  });
});

app.use(require('../backend/middleware/errorHandler'));

module.exports = app;
