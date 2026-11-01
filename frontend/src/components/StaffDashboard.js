import React, { useState, useEffect } from 'react';
import api from '../services/api';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import GrievanceTimeline from './GrievanceTimeline';

export default function StaffDashboard() {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModalGrievance, setActiveModalGrievance] = useState(null);

  // Status update modal state
  const [newStatus, setNewStatus] = useState('In Progress');
  const [statusNote, setStatusNote] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchStaffGrievances = async () => {
    try {
      setLoading(true);
      const res = await api.getGrievances();
      if (res.success) {
        setGrievances(res.grievances);
      }
    } catch (err) {
      console.error('Failed to load staff grievances', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffGrievances();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!activeModalGrievance) return;

    try {
      setUpdating(true);

      // If resolving, post resolution notes
      if (newStatus === 'Resolved' && resolutionNotes.trim()) {
        await api.addResolution(activeModalGrievance._id || activeModalGrievance.grievanceId, resolutionNotes);
      } else {
        await api.updateStatus(
          activeModalGrievance._id || activeModalGrievance.grievanceId,
          newStatus,
          statusNote || `Status updated to ${newStatus}`
        );
      }

      setActiveModalGrievance(null);
      setStatusNote('');
      setResolutionNotes('');
      await fetchStaffGrievances();
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div>
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h2>Department Staff Portal</h2>
          <p>Review assigned campus grievances, update action states, and attach resolution notes.</p>
        </div>
        <button className="btn-secondary" onClick={fetchStaffGrievances}>
          🔄 Refresh Tasks
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div>
            <div className="stat-label">Assigned Issues</div>
            <div className="stat-value">{grievances.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <div className="stat-label">Action Required</div>
            <div className="stat-value" style={{ color: '#b45309' }}>
              {grievances.filter(g => g.status === 'Pending Review' || g.status === 'Assigned').length}
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <div className="stat-label">In Progress</div>
            <div className="stat-value" style={{ color: '#c2410c' }}>
              {grievances.filter(g => g.status === 'In Progress').length}
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <div className="stat-label">Resolved</div>
            <div className="stat-value" style={{ color: '#15803d' }}>
              {grievances.filter(g => g.status === 'Resolved').length}
            </div>
          </div>
        </div>
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title & Description</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Reported Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>Loading tasks...</td></tr>
            ) : grievances.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>No grievances assigned to your department.</td></tr>
            ) : (
              grievances.map((g) => (
                <tr key={g._id || g.grievanceId}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{g.grievanceId}</td>
                  <td style={{ maxWidth: '300px' }}>
                    <div style={{ fontWeight: 600 }}>{g.title}</div>
                    <div style={{ color: '#64748b', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {g.description}
                    </div>
                  </td>
                  <td>{g.category}</td>
                  <td><PriorityBadge priority={g.priority} /></td>
                  <td><StatusBadge status={g.status} /></td>
                  <td>{new Date(g.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn-primary"
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      onClick={() => {
                        setActiveModalGrievance(g);
                        setNewStatus(g.status === 'Submitted' ? 'In Progress' : 'Resolved');
                      }}
                    >
                      Update / Resolve
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Staff Update Modal */}
      {activeModalGrievance && (
        <div className="modal-overlay" onClick={() => setActiveModalGrievance(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Update Grievance: {activeModalGrievance.grievanceId}</h3>
              <button className="close-btn" onClick={() => setActiveModalGrievance(null)}>✕</button>
            </div>

            <p style={{ fontWeight: 600, marginBottom: '8px' }}>{activeModalGrievance.title}</p>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '20px' }}>{activeModalGrievance.description}</p>

            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label>Transition Status To</label>
                <select
                  className="form-control"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="In Progress">In Progress (Work commenced)</option>
                  <option value="Resolved">Resolved (Work completed)</option>
                  <option value="Closed">Closed (Archived)</option>
                  <option value="Pending Review">Pending Review (Need more info)</option>
                </select>
              </div>

              {newStatus === 'Resolved' ? (
                <div className="form-group">
                  <label>Resolution Summary Notes *</label>
                  <textarea
                    className="form-control"
                    placeholder="Describe the exact action taken (e.g., replaced burst valve, cleaned hallway)..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    required
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label>Status Update Note (Audit log)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Electrician team dispatched to the floor"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn-secondary" onClick={() => setActiveModalGrievance(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={updating}>
                  {updating ? 'Saving...' : 'Apply Status Update'}
                </button>
              </div>
            </form>

            <div style={{ marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '10px' }}>Previous History</h4>
              <GrievanceTimeline history={activeModalGrievance.statusHistory} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
