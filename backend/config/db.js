const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_grievance_db';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    isConnected = true;
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[MongoDB Warning] Could not connect to MongoDB at ${uri}.`);
    console.warn(`[MongoDB Warning] Running with in-memory persistence fallback for seamless standalone prototyping.`);
    isConnected = false;
  }
};

const getDBStatus = () => isConnected;

module.exports = { connectDB, getDBStatus };
