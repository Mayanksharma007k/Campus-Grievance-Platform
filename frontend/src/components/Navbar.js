import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { currentUser, switchRole, loading } = useAuth();

  const roleDisplayNames = {
    student: 'Student Portal',
    staff: 'Department Staff',
    admin: 'Central Admin'
  };

  return (
    <div>
      {/* Interactive Role Switcher for instant prototype evaluation */}
      <div className="role-banner">
        <div className="role-banner-left">
          <span className="prototype-tag">SRS Prototype</span>
          <span>Switch Simulated Persona:</span>
        </div>
        <div className="role-switcher-buttons">
          <button
            className={`role-btn ${currentUser?.role === 'student' ? 'active' : ''}`}
            onClick={() => switchRole('student')}
            disabled={loading}
          >
            👨‍🎓 Student (Alex)
          </button>
          <button
            className={`role-btn ${currentUser?.role === 'staff' ? 'active' : ''}`}
            onClick={() => switchRole('staff')}
            disabled={loading}
          >
            🛠️ Staff (Prof. Vance)
          </button>
          <button
            className={`role-btn ${currentUser?.role === 'admin' ? 'active' : ''}`}
            onClick={() => switchRole('admin')}
            disabled={loading}
          >
            🛡️ Admin (Dr. Martinez)
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="navbar">
        <div className="nav-brand">
          <div className="logo-badge">CG</div>
          <div className="brand-text">
            <h1>CampusCare AI</h1>
            <span>Campus Resource & Grievance Platform</span>
          </div>
        </div>

        <div className="user-profile-widget">
          <div className="user-meta">
            <div className="user-name">{currentUser?.name || 'Active User'}</div>
            <span className={`user-role-badge role-${currentUser?.role || 'student'}`}>
              {roleDisplayNames[currentUser?.role] || currentUser?.role}
            </span>
          </div>
        </div>
      </nav>
    </div>
  );
}
