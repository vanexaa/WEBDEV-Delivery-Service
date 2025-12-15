import React, { useState } from 'react';
import './Rider.css';

const getStatusClass = (status) => {
    switch (status) {
        case "Picked Up":
            return "status-picked-up";
        case "In transit":
            return "status-transit";
        case "Delivered":
            return "status-delivered";
        case "Failed":
            return "status-failed";
        default:
            return "status-default";
    }
};

const QueuedOrderPopup = ({ order, onAccept, onDecline, onClose }) => {
  if (!order) return null;

  const formattedItems = order.items; 

  return (
    <div className="modal-overlay bottom-center-modal">
        <div className="modal-content order-details-popup-card">
            <div className="modal-header d-flex justify-content-between align-items-center">
                <h3 className="popup-order-number">Order #{order.id}</h3>
                <span className="view-map-button">View Map</span>
                <button className="close-btn" onClick={onClose}>✖</button>
            </div>

            <div className="modal-body popup-details-text">
                <p>Customer Name: **{order.customerName}**</p>
                <p>Delivery Address: {order.deliveryAddress}</p>
                <p>Delivery Notes: {order.deliveryNotes || 'N/A'}</p>
                <p>Items: {formattedItems}</p>
            </div>

            <div className="modal-footer d-flex justify-content-center action-buttons mt-4">
                <button
                    className="action-btn failed-btn"
                    onClick={() => { onDecline(order); onClose(); }}
                >
                    Decline
                </button>
                <button
                    className="action-btn delivered-btn"
                    onClick={() => { onAccept(order); onClose(); }}
                >
                    Accept
                </button>
            </div>
        </div>
    </div>
  );
};

const AssignedOrderPopup = ({ order, onDelivered, onStatusChange, onClose }) => {
    if (!order) return null;

    const StatusDropdown = ({ currentStatus }) => (
        <div className="status-dropdown-group d-flex align-items-center">
            <label className="status-label me-2">Update Status:</label>
            <select
                className="status-select"
                value={currentStatus}
                onChange={(e) => onStatusChange(order.id, e.target.value)}
            >
                <option>Picked Up</option>
                <option>In transit</option>
                <option>Delivered</option>
                <option>Failed</option>
            </select>
        </div>
    );

    return (
        <div className="modal-overlay right-side-modal">
            <div className="modal-content right-details-modal">
                <button className="close-btn" onClick={onClose}>✖</button>

                <div className="modal-header">
                    <h2 className="details-header">Order Details</h2>
                </div>

                <div className="modal-body">
                    <div className="d-flex justify-content-between align-items-center status-line mb-3">
                        <span className="order-id-display">Order #{order.id}</span>
                        <StatusDropdown currentStatus={order.status} />
                    </div>

                    <div className="status-text mb-3 info-section">
                        Status: <span className={`status-badge ${getStatusClass(order.status)}`}>
                            {order.status}
                        </span>
                    </div>
                    
                    <div className="customer-info-box info-section">
                        <h3>Customer Info:</h3>
                        <p>Name: {order.customerName}</p>
                        <p>Address: {order.deliveryAddress}</p>
                        <p>Contact #: {order.customerPhone}</p>
                    </div>

                    <p className="payment-method-text mb-4">Payment Method: {order.paymentMethod}</p>

                    <div className="mock-map-right-details"></div>

                    <button
                        className="order-delivered-button action-btn delivered-btn"
                        onClick={() => { onDelivered(order.id); onClose(); }}
                    >
                        Order Delivered
                    </button>
                </div>
            </div>
        </div>
    );
};


const initialQueuedOrders = [
  { id: '123123', customerName: 'Boss Oleg', deliveryAddress: '322 kanto nila fitz', deliveryNotes: '(if any)', items: '1x Barako, 1x 3-in-1', paymentMethod: 'Cash on Delivery', customerPhone: '09XX XXX XXXX' },
  { id: '321321', customerName: 'Rosalin Santos', deliveryAddress: '101 Rose St, QC', deliveryNotes: 'Call first', items: '1x Iced Tea', paymentMethod: 'Card', customerPhone: '09AA AAA AAA' },
  { id: '696969', customerName: 'Pedro Reyes', deliveryAddress: 'Block 12 Lot 3, Rizal Province', deliveryNotes: '', items: '1x Americano, 1x Cappuccino', paymentMethod: 'Card', customerPhone: '09ZZ ZZZ ZZZZ' },
];

const initialAssignedOrders = [
  { id: '007', customerName: 'Juan Dela Cruz', deliveryAddress: '015 enta', customerPhone: '366650', status: 'In transit', paymentMethod: 'Cash on Delivery', items: '1x Espresso', deliveryNotes: 'Leave at guard house.' },
];

const riderInfo = {
  name: "Jane Doe",
  vehicleType: "Motorcycle",
  plateNumber: "ABC 1234",
};


function Rider() {
  const [queuedOrders, setQueuedOrders] = useState(initialQueuedOrders);
  const [assignedOrders, setAssignedOrders] = useState(initialAssignedOrders);
  const [selectedQueuedOrder, setSelectedQueuedOrder] = useState(null);
  const [selectedAssignedOrder, setSelectedAssignedOrder] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  const handleSelectQueuedOrder = (order) => {
    setSelectedQueuedOrder(order);
    setSelectedAssignedOrder(null);
  };

  const handleSelectAssignedOrder = (order) => {
    setSelectedAssignedOrder(order);
    setSelectedQueuedOrder(null);
  };

  const handleAcceptOrder = (orderToAccept) => {
    setQueuedOrders(queuedOrders.filter(order => order.id !== orderToAccept.id));
    setAssignedOrders([...assignedOrders, { ...orderToAccept, status: 'Picked Up' }]);
  };

  const handleDeclineOrder = (orderToDecline) => {
    setQueuedOrders(queuedOrders.filter(order => order.id !== orderToDecline.id));
  };

  const handleOrderDelivered = (orderId) => {
    setAssignedOrders(assignedOrders.filter(order => order.id !== orderId));
    setSelectedAssignedOrder(null);
  };

  const handleStatusChange = (orderId, newStatus) => {
    setAssignedOrders(assignedOrders.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
    if (selectedAssignedOrder && selectedAssignedOrder.id === orderId) {
        setSelectedAssignedOrder(prev => ({...prev, status: newStatus}));
    }
  };


  return (
    <div className="rider-container"> 
      
      {/* 1. LEFT SIDEBAR (Fixed) */}
      <div className="sidebar-placeholder">
        
        <div className="top-profile-bar">
            <div className="profile-icon"></div>
            <label className="toggle-switch">
                <input type="checkbox" checked={isOnline} onChange={() => setIsOnline(!isOnline)} />
                <span className="slider"></span>
            </label>
        </div>

        <div className="sidebar-card card">
            <div className="rider-info-display d-flex align-items-center mb-3">
                <div className="driver-icon me-3"></div>
                <div>
                    <div className="driver-name-plate">NAME: {riderInfo.name}</div>
                    <div className="driver-info">VEHICLE TYPE: {riderInfo.vehicleType}</div>
                    <div className="driver-info">PLATE NUMBER: {riderInfo.plateNumber}</div>
                </div>
            </div>
        </div>

        <div className="delivery-history-label">DELIVERY HISTORY</div>
        <div className="delivery-history-table">
            <div className="table-row table-header"><div>DATE</div><div>ORDER ID</div><div>STATUS</div></div>
            <div className="table-row"><div>11/20</div><div>#101</div><div>Done</div></div>
            <div className="table-row"><div>11/19</div><div>#098</div><div>Done</div></div>
        </div>
      </div>

      {/* 2. RIGHT MAIN CONTENT AREA (Scrollable, Side-by-Side Cards) */}
      <div className="main-content-area d-flex">
        
        <div className="queue-card card flex-fill">
            <div className="queue-header card-header">Order Queue</div>
            <div className="list-group list-group-flush">
                {queuedOrders.map((order) => (
                    <div
                        key={order.id}
                        onClick={() => handleSelectQueuedOrder(order)}
                        className={`list-group-item order-item d-flex justify-content-between align-items-center`}
                    >
                        Order #{order.id}
                        <button className="view-button">View</button>
                    </div>
                ))}
            </div>
        </div>

        <div className="assigned-card card flex-fill">
            <div className="assigned-header card-header">Assigned Orders</div>
            <div className="list-group list-group-flush">
                {assignedOrders.map((order) => (
                    <div
                        key={order.id}
                        onClick={() => handleSelectAssignedOrder(order)}
                        className={`list-group-item order-item d-flex justify-content-between align-items-center`}
                    >
                        Order #{order.id}
                        <button className="view-button">View</button>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* 3. POPUPS */}
      {selectedQueuedOrder && (
        <QueuedOrderPopup
             order={selectedQueuedOrder}
             onAccept={handleAcceptOrder}
             onDecline={handleDeclineOrder}
             onClose={() => setSelectedQueuedOrder(null)}
           />
      )}

      {selectedAssignedOrder && (
        <AssignedOrderPopup
             order={selectedAssignedOrder}
             onDelivered={handleOrderDelivered}
             onStatusChange={handleStatusChange}
             onClose={() => setSelectedAssignedOrder(null)}
           />
      )}
    </div>
  );
}

export default Rider;