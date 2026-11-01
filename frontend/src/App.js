import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import StudentDashboard from './components/StudentDashboard';
import StaffDashboard from './components/StaffDashboard';
import AdminDashboard from './components/AdminDashboard';
import './styles/App.css';

function MainAppContent() {
  const { currentUser } = useAuth();

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-wrapper">
        {currentUser?.role === 'student' && <StudentDashboard />}
        {currentUser?.role === 'staff' && <StaffDashboard />}
        {currentUser?.role === 'admin' && <AdminDashboard />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
