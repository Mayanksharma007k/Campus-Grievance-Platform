#!/bin/bash
echo "=========================================================="
echo "Starting Campus Grievance Platform Services"
echo "=========================================================="

echo "Starting Backend API on port 5000..."
cd backend && npm start &
BACKEND_PID=$!

echo "Starting Frontend on port 3000..."
cd ../frontend && npm start &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
