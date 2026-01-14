import React from 'react';

const StatusTimeline = ({ statusHistory, currentStatus }) => {
  if (!statusHistory || statusHistory.length === 0) {
    return <p className="text-muted">No status updates yet</p>;
  }

  return (
    <div>
      {statusHistory.map((item, index) => {
        const isActive = item.status === currentStatus;
        return (
          <div key={index} className={`timeline-item ${isActive ? 'active' : ''}`}>
            <h6>{item.status}</h6>
            <small className="text-muted">
              {new Date(item.timestamp).toLocaleString()}
            </small>
            {item.notes && <p className="mt-2 mb-0">{item.notes}</p>}
          </div>
        );
      })}
    </div>
  );
};

export default StatusTimeline;
