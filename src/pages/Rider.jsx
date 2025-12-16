// src/App.jsx
import React, { useState } from 'react';
import { BsPerson } from 'react-icons/bs'; 
import '../css/Rider.css'; 

const ordersData = [
    { id: '123123', type: 'queue', customerName: 'Juan Dela Cruz', address: '101 Main St.', notes: 'Call upon arrival', items: '1x Espresso, 1x Pastel De Nata' },
    { id: '321321', type: 'queue', customerName: 'Maria Santos', address: '202 Oak Ave.', notes: 'Leave at guard house', items: '2x Iced Latte, 1x Croissant' },
    { id: '696969', type: 'queue', customerName: 'Boss Oleg', address: '322 kanto nila fitz', notes: 'Delivery Notes (if any)', items: 'Barako, 3-in-1' },
    { id: '007', type: 'assigned', customerName: 'James Bond', status: 'In transit', address: 'Secret Lair, Manila', contact: '09XX-XXX-007', payment: 'Cash' },
];

const OrderItem = ({ order, onClickView }) => (
  <div className="order-item-row">
    <span>Order #{order.id}</span>
    <button 
      className="btn-view-accept-custom"
      onClick={() => onClickView(order)}
    >
      View
    </button>
  </div>
);

const OrderQueueModal = ({ order, onClose, onAccept, onDecline }) => (
  <div className="modal-overlay-new">
    <div className="order-details-modal">
        <div className="details-header">
            <h3>Order #{order.id}</h3>
            <span style={{ cursor: 'pointer', fontSize: '1.5rem', color: '#1a1a1a' }} onClick={onClose}>
                ✖
            </span>
        </div>
        <div className="details-content">
            <p><strong>Customer Name:</strong> {order.customerName}</p>
            <p>
                <strong>Delivery Address:</strong> {order.address}
                <span className="map-link">View Map</span>
            </p>
            <p><strong>Delivery Notes:</strong> {order.notes}</p>
            
            <div className="details-items">
                <p><strong>Items:</strong> {order.items}</p>
            </div>
        </div>
        
        <div className="action-buttons-queue">
            <button className="btn-decline-custom" onClick={onDecline}>Decline</button>
            <button className="btn-accept-custom" onClick={onAccept}>Accept</button>
        </div>
    </div>
  </div>
);

const AssignedOrderModal = ({ order, onClose, onDelivered }) => (
    <div className="modal-overlay-new">
        <div className="order-details-modal">
            <div className="details-header">
                <h3>Order Details</h3>
                <span style={{ cursor: 'pointer', fontSize: '1.5rem', color: '#1a1a1a' }} onClick={onClose}>
                    ✖
                </span>
            </div>
            <div className="details-content">
                <p><strong>Order #:</strong> {order.id}</p>
                <p><strong>Status:</strong> {order.status}</p>
                <p><strong>Customer:</strong> {order.customerName}</p>
                <p><strong>Address:</strong> {order.address}</p>
                <p><strong>Contact #:</strong> {order.contact}</p>
                <p><strong>Payment Method:</strong> {order.payment}</p>
                
                <div style={{ padding: '10px', marginTop: '15px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: 'white' }}>
                    <p style={{marginBottom: '5px', fontWeight: 'bold'}}>Update Status:</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                        <span>Picked Up</span>
                        <span>In Transit</span>
                        <span>Delivered</span>
                        <span>Failed</span>
                    </div>
                </div>
            </div>
            
            <button className="btn-delivery-action" onClick={onDelivered}>Order Delivered</button>
        </div>
    </div>
);

function Rider() {
  const [isOnline, setIsOnline] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const orderQueueData = ordersData.filter(o => o.type === 'queue');
  const assignedOrdersData = ordersData.filter(o => o.type === 'assigned');

  const handleViewClick = (order) => {
    setSelectedOrder(order);
  };
  
  const handleCloseModal = () => {
    setSelectedOrder(null);
  };

  const handleAccept = () => {
    alert(`Order ${selectedOrder.id} accepted!`);
    handleCloseModal();
  };

  const handleDecline = () => {
    alert(`Order ${selectedOrder.id} declined!`);
    handleCloseModal();
  };

  const handleDelivered = () => {
    alert(`Order ${selectedOrder.id} marked as delivered!`);
    handleCloseModal();
  };


  return (
    <div className="app">
      <div className="order-dashboard-container">
        
        <div className="top-header-section">
          <BsPerson className="profile-icon" />
          <label className="rider-toggle">
              <input 
                type="checkbox" 
                checked={isOnline}
                onChange={() => setIsOnline(!isOnline)}
              />
              <span className="slider"></span>
          </label>
        </div>

        <div style={{ display: 'flex', gap: '30px' }}>
            <div style={{ flex: 1 }}>
                <div className="order-card">
                    <h3 className="order-card-title">Order Queue</h3>
                    <div className="orders-list">
                        {orderQueueData.map((order) => (
                            <OrderItem 
                                key={order.id} 
                                order={order} 
                                onClickView={handleViewClick} 
                            />
                        ))}
                    </div>
                </div>
            </div>
            <div style={{ flex: 1 }}>
                <div className="order-card">
                    <h3 className="order-card-title">Assigned Orders</h3>
                    <div className="orders-list">
                        {assignedOrdersData.map((order) => (
                            <OrderItem 
                                key={order.id} 
                                order={order} 
                                onClickView={handleViewClick} 
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>
      
      {selectedOrder && selectedOrder.type === 'queue' && (
          <OrderQueueModal
              order={selectedOrder}
              onClose={handleCloseModal}
              onAccept={handleAccept}
              onDecline={handleDecline}
          />
      )}
      
      {selectedOrder && selectedOrder.type === 'assigned' && (
          <AssignedOrderModal
              order={selectedOrder}
              onClose={handleCloseModal}
              onDelivered={handleDelivered}
          />
      )}
    </div>
  );
}

export default Rider;