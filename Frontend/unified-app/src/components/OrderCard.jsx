import React from 'react';
import './OrderCard.css'; // 👈 add this

const OrderCard = ({ order, onClick }) => {
  const orderData = order.order || {};

  // Kapebara-aligned status styles
  const statusClassMap = {
    Assigned: 'status-assigned',
    Accepted: 'status-accepted',
    PickedUp: 'status-pickedup',
    InTransit: 'status-transit',
    Delivered: 'status-delivered',
    Failed: 'status-failed'
  };

  return (
    <div className="card order-card" onClick={onClick}>
      <div className="card-body">

        {/* Header */}
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h6 className="order-title">
            {order.transactionCode}
          </h6>

          <span
            className={`status-badge ${
              statusClassMap[order.status] || 'status-assigned'
            }`}
          >
            {order.status}
          </span>
        </div>

        {/* Customer */}
        <p className="order-text">
          <span className="order-label">Customer:</span>{' '}
          {orderData.customerName || 'N/A'}
        </p>

        {/* Address */}
        <p className="order-text">
          <span className="order-label">Address:</span>{' '}
          {orderData.deliveryAddress
            ? `${orderData.deliveryAddress.substring(0, 30)}…`
            : 'N/A'}
        </p>

        {/* Assigned time */}
        <p className="order-text">
          <span className="order-label">Assigned:</span>{' '}
          {order.assignedAt
            ? new Date(order.assignedAt).toLocaleString()
            : 'N/A'}
        </p>

      </div>
    </div>
  );
};

export default OrderCard;
