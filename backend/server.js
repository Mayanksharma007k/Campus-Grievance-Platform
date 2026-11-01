const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB, getDBStatus } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middlewares
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Campus Grievance Management API',
    mongoDBConnected: getDBStatus(),
    timestamp: new Date().toISOString()
  });
});

// Route registration
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/grievances', require('./routes/grievanceRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// 404 handler for undefined API routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found`
  });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Campus Grievance Backend Server running on port ${PORT}`);
  console.log(`📊 Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️ Database: ${getDBStatus() ? 'MongoDB Connected' : 'In-Memory Fallback Active'}`);
  console.log(`=======================================================`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
});

module.exports = app;
