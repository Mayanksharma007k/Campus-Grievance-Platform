const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('campus_auth_token') || null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('campus_auth_token', token);
    } else {
      localStorage.removeItem('campus_auth_token');
    }
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      ...(options.headers || {})
    };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (err) {
      console.error(`API Error on ${endpoint}:`, err.message);
      throw err;
    }
  }

  // Auth
  login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  getDemoUsers() {
    return this.request('/auth/demo-users');
  }

  getMe() {
    return this.request('/auth/me');
  }

  // Grievances
  getGrievances(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/grievances${query ? `?${query}` : ''}`);
  }

  getGrievanceById(id) {
    return this.request(`/grievances/${id}`);
  }

  createGrievance(payload) {
    return this.request('/grievances', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  updateStatus(id, status, note) {
    return this.request(`/grievances/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note })
    });
  }

  assignGrievance(id, staffId, staffName, department, note) {
    return this.request(`/grievances/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ staffId, staffName, department, note })
    });
  }

  overridePriority(id, priority, reason) {
    return this.request(`/grievances/${id}/priority`, {
      method: 'PATCH',
      body: JSON.stringify({ priority, reason })
    });
  }

  addResolution(id, resolutionNotes) {
    return this.request(`/grievances/${id}/resolution`, {
      method: 'POST',
      body: JSON.stringify({ resolutionNotes })
    });
  }

  // Analytics & Users
  getDashboardAnalytics() {
    return this.request('/analytics/dashboard');
  }

  getStaffMembers() {
    return this.request('/users/staff');
  }
}

export const api = new ApiService();
export default api;
