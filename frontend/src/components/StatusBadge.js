import React from 'react';

const STATUS_CONFIG = {
  'Submitted': { class: 'status-submitted', label: 'Submitted' },
  'Pending Review': { class: 'status-pending-review', label: 'Pending Review' },
  'Assigned': { class: 'status-assigned', label: 'Assigned' },
  'In Progress': { class: 'status-in-progress', label: 'In Progress' },
  'Resolved': { class: 'status-resolved', label: 'Resolved' },
  'Closed': { class: 'status-closed', label: 'Closed' }
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { class: 'status-submitted', label: status };
  return (
    <span className={`badge-status ${config.class}`}>
      ● {config.label}
    </span>
  );
}
