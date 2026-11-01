import React, { useState, useEffect } from 'react';
import api from '../services/api';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import GrievanceTimeline from './GrievanceTimeline';

const CATEGORIES = [
  'Auto-detect with AI',
  'Academic Affairs',
  'Hostel & Housing',
  'Maintenance & Facilities',
  'IT & Network Services',
  'Finance & Accounts',
  'Library & Learning Resources',
  'Campus Security',
  'Cafeteria & Dining'
];

export default function StudentDashboard() {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedGrievance, setSelectedGrievance] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Auto-detect with AI');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Live AI Preview State
  const [aiPreview, setAiPreview] = useState(null);

  const fetchMyGrievances = async () => {
    try {
      setLoading(true);
      const res = await api.getGrievances();
      if (res.success) {
        setGrievances(res.grievances);
      }
    } catch (err) {
      console.error('Failed to load grievances', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyGrievances();
  }, []);

  // Quick client-side heuristic for instant real-time AI typing feedback
  useEffect(() => {
    if (!title && !description) {
      setAiPreview(null);
      return;
    }
    const full = `${title} ${description}`.toLowerCase();
    let detectedCat = 'General Administration';
    let detectedPri = 'Medium';

    if (full.includes('wifi') || full.includes('internet') || full.includes('portal') || full.includes('login')) {
      detectedCat = 'IT & Network Services';
    } else if (full.includes('water') || full.includes('pipe') || full.includes('leak') || full.includes('electric') || full.includes('fan')) {
      detectedCat = 'Maintenance & Facilities';
    } else if (full.includes('hostel') || full.includes('room') || full.includes('dorm') || full.includes('geyser')) {
      detectedCat = 'Hostel & Housing';
    } else if (full.includes('exam') || full.includes('grade') || full.includes('marks') || full.includes('course')) {
      detectedCat = 'Academic Affairs';
    } else if (full.includes('fee') || full.includes('refund') || full.includes('scholarship')) {
      detectedCat = 'Finance & Accounts';
    }

    if (full.includes('shock') || full.includes('fire') || full.includes('burst') || full.includes('leak') || full.includes('flood')) {
      detectedPri = 'Urgent';
    } else if (full.includes('broken') || full.includes('tomorrow') || full.includes('deadline')) {
      detectedPri = 'High';
    }

    setAiPreview({
      category: detectedCat,
      priority: detectedPri,
      confidence: 0.92
    });
  }, [title, description]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    try {
      setSubmitting(true);
      const payload = {
        title,
        description,
        location: location || 'Main Campus',
        category: category === 'Auto-detect with AI' ? undefined : category
      };
      const res = await api.createGrievance(payload);
      if (res.success) {
        setShowModal(false);
        setTitle('');
        setDescription('');
        setLocation('');
        setCategory('Auto-detect with AI');
        await fetchMyGrievances();
      }
    } catch (err) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h2>Student Grievance Portal</h2>
          <p>Submit issues with AI automatic triage, track resolutions, and view status history.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <span>+</span> Submit New Grievance
        </button>
      </div>

      {/* Summary Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div>
            <div className="stat-label">Total Submitted</div>
            <div className="stat-value">{grievances.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <div className="stat-label">In Progress</div>
            <div className="stat-value" style={{ color: '#c2410c' }}>
              {grievances.filter(g => g.status === 'In Progress' || g.status === 'Assigned').length}
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <div className="stat-label">Resolved / Closed</div>
            <div className="stat-value" style={{ color: '#15803d' }}>
              {grievances.filter(g => g.status === 'Resolved' || g.status === 'Closed').length}
            </div>
          </div>
        </div>
      </div>

      {/* Grievance List / Cards */}
      {loading ? (
        <p style={{ textAlign: 'center', padding: '40px' }}>Loading your grievances...</p>
      ) : grievances.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px' }}>
          <h3>No grievances submitted yet</h3>
          <p style={{ color: '#64748b', marginTop: '8px' }}>Use the button above to report any campus infrastructure, academic, or hostel issues.</p>
        </div>
      ) : (
        <div className="grievance-cards-grid">
          {grievances.map((g) => (
            <div key={g._id || g.grievanceId} className="grievance-card" onClick={() => setSelectedGrievance(g)} style={{ cursor: 'pointer' }}>
              <div className="card-top">
                <span className="grievance-id">{g.grievanceId}</span>
                <StatusBadge status={g.status} />
              </div>
              <h4 className="card-title">{g.title}</h4>
              <p className="card-desc">{g.description}</p>
              
              {g.aiPrediction && (
                <div className="ai-pill">
                  <span>🤖 AI Auto-Tag: <strong>{g.aiPrediction.predictedCategory || g.category}</strong></span>
                  <PriorityBadge priority={g.priority} />
                </div>
              )}

              <div className="card-footer">
                <span>📍 {g.location || g.department}</span>
                <span>{new Date(g.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submission Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Submit Campus Grievance</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Grievance Title *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Water pipe leakage in Hostel Block B washroom"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Detailed Description *</label>
                <textarea
                  className="form-control"
                  placeholder="Explain the issue, exact room/hall, and any safety hazards..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              {/* Real-time AI Preview Callout */}
              {aiPreview && (
                <div className="ai-preview-box">
                  <div className="ai-preview-header">
                    <span>⚡ AI Real-Time Assistant Analysis</span>
                  </div>
                  <div className="ai-preview-tags">
                    <span>Predicted Category: <strong>{aiPreview.category}</strong></span>
                    <span>Assessed Priority: <strong>{aiPreview.priority}</strong></span>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    className="form-control"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Campus Location / Hall</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Library 2nd Floor, Room 204"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting & Analyzing...' : 'Submit Grievance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details & Audit Trail Modal */}
      {selectedGrievance && (
        <div className="modal-overlay" onClick={() => setSelectedGrievance(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="grievance-id" style={{ marginRight: '8px' }}>{selectedGrievance.grievanceId}</span>
                <StatusBadge status={selectedGrievance.status} />
              </div>
              <button className="close-btn" onClick={() => setSelectedGrievance(null)}>✕</button>
            </div>

            <h3 style={{ marginBottom: '12px', fontSize: '1.25rem' }}>{selectedGrievance.title}</h3>
            <p style={{ color: '#475569', fontSize: '0.95rem', marginBottom: '20px', lineHeight: '1.6' }}>
              {selectedGrievance.description}
            </p>

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.85rem' }}>
              <div><strong>Department:</strong> {selectedGrievance.department || selectedGrievance.category}</div>
              <div style={{ marginTop: '4px' }}><strong>Priority:</strong> <PriorityBadge priority={selectedGrievance.priority} /></div>
              {selectedGrievance.assignedToName && (
                <div style={{ marginTop: '4px' }}><strong>Assigned Staff:</strong> {selectedGrievance.assignedToName}</div>
              )}
              {selectedGrievance.resolutionNotes && (
                <div style={{ marginTop: '10px', padding: '10px', background: '#ecfdf5', borderRadius: '6px', borderLeft: '4px solid #10b981' }}>
                  <strong>Official Resolution:</strong>
                  <p style={{ marginTop: '4px', color: '#065f46' }}>{selectedGrievance.resolutionNotes}</p>
                </div>
              )}
            </div>

            <h4 style={{ fontSize: '1rem', marginBottom: '10px' }}>Resolution Audit Trail & Timeline</h4>
            <GrievanceTimeline history={selectedGrievance.statusHistory} />
          </div>
        </div>
      )}
    </div>
  );
}
