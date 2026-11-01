import React from 'react';

export default function GrievanceTimeline({ history = [] }) {
  if (!history || history.length === 0) {
    return <p style={{ fontSize: '0.85rem', color: '#64748b' }}>No audit trail entries yet.</p>;
  }

  return (
    <div className="timeline">
      {history.map((step, idx) => (
        <div key={idx} className="timeline-step">
          <div className="timeline-dot"></div>
          <div className="timeline-title">{step.status}</div>
          <div className="timeline-meta">
            Updated by <strong>{step.updatedByName || 'System'}</strong> •{' '}
            {step.timestamp ? new Date(step.timestamp).toLocaleString() : 'Just now'}
          </div>
          {step.note && <div className="timeline-note">{step.note}</div>}
        </div>
      ))}
    </div>
  );
}
