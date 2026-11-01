import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const DEMO_ACCOUNTS = {
  student: {
    id: '661000000000000000000001',
    name: 'Alex Chen',
    email: 'student@campus.edu',
    role: 'student',
    studentId: 'STU-2024-8842',
    department: 'Computer Science'
  },
  staff: {
    id: '661000000000000000000002',
    name: 'Prof. David Vance',
    email: 'staff@campus.edu',
    role: 'staff',
    department: 'Maintenance & Facilities'
  },
  admin: {
    id: '661000000000000000000003',
    name: 'Dr. Sarah Martinez',
    email: 'admin@campus.edu',
    role: 'admin',
    department: 'General Administration'
  }
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(DEMO_ACCOUNTS.student);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);

  // Authenticate demo account on role switch
  const switchRole = async (targetRole) => {
    setLoading(true);
    const target = DEMO_ACCOUNTS[targetRole];
    try {
      const res = await api.login(target.email, 'password123');
      if (res.token) {
        api.setToken(res.token);
        setToken(res.token);
        setCurrentUser(res.user);
      } else {
        setCurrentUser(target);
      }
    } catch (_) {
      // Local fallback for quick preview
      setCurrentUser(target);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    switchRole('student');
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, token, switchRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
