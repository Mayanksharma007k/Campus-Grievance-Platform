import React, { useState, useEffect } from 'react';
import api from '../services/api';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [grievances, setGrievances] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Assignment Modal
  const [assignModalGrievance, setAssignModalGrievance] = useState(null);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [assignDept, setAssignDept] = useState('');

  // Priority Override Modal
  const [overrideModalGrievance, setOverrideModalGrievance] = useState(null);
  const [newPriority, setNewPriority] = useState('Urgent');
  const [overrideReason, setOverrideReason] = useState('');

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, grievancesRes, staffRes] = await Promise.all([
        api.getDashboardAnalytics(),
        api.getGrievances(),
        api.getStaffMembers()
      ]);

      if (analyticsRes.success) setAnalytics(analyticsRes.data);
      if (grievancesRes.success) setGrievances(grievancesRes.grievances);
      if (staffRes.success) setStaffMembers(staffRes.staff);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignModalGrievance) return;
    try {
      const staff = staffMembers.find(s => s.id === selectedStaffId || s._id === selectedStaffId);
      await api.assignGrievance(
        assignModalGrievance._id || assignModalGrievance.grievanceId,
        selectedStaffId,
        staff ? staff.name : 'Department Staff',
        assignDept || assignModalGrievance.department,
        'Directly assigned via Admin Operations Panel'
      );
      setAssignModalGrievance(null);
      await loadAdminData();
    } catch (err) {
      alert(`Assignment failed: ${err.message}`);
    }
  };

  const handlePriorityOverrideSubmit = async (e) => {
    e.preventDefault();
    if (!overrideModalGrievance) return;
    try {
      await api.overridePriority(
        overrideModalGrievance._id || overrideModalGrievance.grievanceId,
        newPriority,
        overrideReason || 'Administrative assessment override'
      );
      setOverrideModalGrievance(null);
      setOverrideReason('');
      await loadAdminData();
    } catch (err) {
      alert(`Override failed: ${err.message}`);
    }
  };

  const summary = analytics?.summary || { totalGrievances: grievances.length, pendingReview: 0, inProgress: 0, resolvedCount: 0, urgentCount: 0, resolutionRate: '0%' };
  const categoryBreakdown = analytics?.categoryBreakdown || {};
  const departmentStats = analytics?.departmentStats || {};

  return (
    <div>
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h2>Campus Central Administration & Analytics</h2>
          <p>Real-time grievance oversight, automated AI classification statistics, staff delegation, and priority overrides.</p>
        </div>
        <button className="btn-secondary" onClick={loadAdminData}>
          🔄 Refresh Metrics
        </button>
      </div>

      {/* KPI Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <div>
            <div className="stat-label">Total Grievances</div>
            <div className="stat-value">{summary.totalGrievances}</div>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <div className="stat-label">Urgent / Critical</div>
            <div className="stat-value" style={{ color: '#b91c1c' }}>{summary.urgentCount}</div>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <div className="stat-label">Pending Review</div>
            <div className="stat-value" style={{ color: '#b45309' }}>{summary.pendingReview}</div>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <div className="stat-label">Resolution Rate</div>
            <div className="stat-value" style={{ color: '#15803d' }}>{summary.resolutionRate}</div>
          </div>
        </div>
      </div>

      {/* Analytics Charts & Breakdowns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {/* Category Breakdown */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '16px', fontWeight: 700 }}>Category-Wise Grievance Distribution</h3>
          {Object.entries(categoryBreakdown).map(([cat, count]) => {
            const pct = summary.totalGrievances > 0 ? Math.round((count / summary.totalGrievances) * 100) : 0;
            return (
              <div key={cat} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span>{cat}</span>
                  <strong>{count} ({pct}%)</strong>
                </div>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: `${pct}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Department Statistics */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '16px', fontWeight: 700 }}>Department Performance & Workload</h3>
          {Object.keys(departmentStats).length === 0 ? (
            <p style={{ color: '#64748b' }}>No department data recorded yet.</p>
          ) : (
            Object.entries(departmentStats).map(([dept, stats]) => (
              <div key={dept} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '0.9rem' }}>
                  <span>{dept}</span>
                  <span style={{ color: '#2563eb' }}>{stats.total} total</span>
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                  <span>Pending: <strong>{stats.pending}</strong></span>
                  <span>In Progress: <strong>{stats.inProgress}</strong></span>
                  <span style={{ color: '#15803d' }}>Resolved: <strong>{stats.resolved}</strong></span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Full Grievances Management Table */}
      <div className="data-table-wrapper">
        <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>All Campus Grievances & Dispatch Console</h3>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Showing {grievances.length} tickets</span>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Grievance ID</th>
              <th>Student / Title</th>
              <th>AI Category</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Assigned Staff</th>
              <th>Admin Controls</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>Loading grievance registry...</td></tr>
            ) : grievances.map((g) => (
              <tr key={g._id || g.grievanceId}>
                <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{g.grievanceId}</td>
                <td>
                  <div style={{ fontWeight: 600 }}>{g.title}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>By {g.studentName || g.student?.name || 'Student'}</div>
                </td>
                <td>{g.category}</td>
                <td>
                  <PriorityBadge priority={g.priority} />
                  {g.priorityOverridden && (
                    <span style={{ display: 'block', fontSize: '0.65rem', color: '#8b5cf6', fontWeight: 700 }}>
                      OVERRIDDEN
                    </span>
                  )}
                </td>
                <td><StatusBadge status={g.status} /></td>
                <td>
                  <span style={{ fontSize: '0.85rem' }}>
                    {g.assignedToName || g.assignedTo?.name || '— Unassigned —'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      onClick={() => {
                        setAssignModalGrievance(g);
                        setAssignDept(g.department || g.category);
                      }}
                    >
                      Assign
                    </button>
                    <button
                      className="btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#b91c1c' }}
                      onClick={() => {
                        setOverrideModalGrievance(g);
                        setNewPriority(g.priority);
                      }}
                    >
                      Priority
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Staff Assignment Modal */}
      {assignModalGrievance && (
        <div className="modal-overlay" onClick={() => setAssignModalGrievance(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delegate Grievance: {assignModalGrievance.grievanceId}</h3>
              <button className="close-btn" onClick={() => setAssignModalGrievance(null)}>✕</button>
            </div>

            <form onSubmit={handleAssignSubmit}>
              <div className="form-group">
                <label>Select Department Staff Member</label>
                <select
                  className="form-control"
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Staff Personnel --</option>
                  {staffMembers.map(s => (
                    <option key={s.id || s._id} value={s.id || s._id}>
                      {s.name} ({s.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Department Routing</label>
                <input
                  type="text"
                  className="form-control"
                  value={assignDept}
                  onChange={(e) => setAssignDept(e.target.value)}
                  placeholder="e.g. Maintenance & Facilities"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn-secondary" onClick={() => setAssignModalGrievance(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Priority Override Modal */}
      {overrideModalGrievance && (
        <div className="modal-overlay" onClick={() => setOverrideModalGrievance(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Override Priority: {overrideModalGrievance.grievanceId}</h3>
              <button className="close-btn" onClick={() => setOverrideModalGrievance(null)}>✕</button>
            </div>

            <form onSubmit={handlePriorityOverrideSubmit}>
              <div className="form-group">
                <label>Current Priority: <strong>{overrideModalGrievance.priority}</strong></label>
                <select
                  className="form-control"
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                >
                  <option value="Urgent">Urgent (Immediate Safety / Legal Hazard)</option>
                  <option value="High">High (Impacting Class / Exam / Services)</option>
                  <option value="Medium">Medium (Standard campus resolution)</option>
                  <option value="Low">Low (Informational / Enhancement)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Administrative Override Reason *</label>
                <textarea
                  className="form-control"
                  placeholder="State the administrative justification for altering priority..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn-secondary" onClick={() => setOverrideModalGrievance(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Apply Priority Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
