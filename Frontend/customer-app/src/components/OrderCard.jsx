import React from 'react';

const OrderCard = ({ order, onClick }) => {
  const orderData = order.order || {};
  const statusColors = {
    Assigned: 'bg-secondary',
    Accepted: 'bg-info',
    PickedUp: 'bg-warning',
    InTransit: 'bg-primary',
    Delivered: 'bg-success',
    Failed: 'bg-danger'
  };

  return (
    <div className="card order-card" onClick={onClick}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h6 className="card-title">Order #{order.orderId}</h6>
          <span className={`badge ${statusColors[order.status] || 'bg-secondary'} status-badge`}>
            {order.status}
          </span>
        </div>
        <p className="card-text mb-1">
          <small className="text-muted">Customer:</small> {orderData.customerName || 'N/A'}
        </p>
        <p className="card-text mb-1">
          <small className="text-muted">Address:</small>{' '}
          {orderData.deliveryAddress
            ? `${orderData.deliveryAddress.substring(0, 30)}...`
            : 'N/A'}
        </p>
        <p className="card-text">
          <small className="text-muted">Assigned:</small>{' '}
          {new Date(order.assignedAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default OrderCard;
