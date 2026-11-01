import React from 'react';

export default function PriorityBadge({ priority }) {
  const p = (priority || 'Medium').toLowerCase();
  return (
    <span className={`badge-priority priority-${p}`}>
      {priority}
    </span>
  );
}
