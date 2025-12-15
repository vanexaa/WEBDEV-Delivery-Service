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

const OrderDetailsPopup = ({ order, onAccept, onDecline }) => {
  if (!order) return null;

  const formattedItems = order.items; 

  return (
    <div className="modal-content order-details-popup-card">
        <div className="modal-header">
            <h3 className="popup-order-number">Order #{order.id}</h3>
            <button className="view-map-button">View Map</button>
        </div>

        <div className="modal-body popup-details-text">
            <p>Customer Name: **{order.customerName}**</p>
            <p>Delivery Address: {order.deliveryAddress}</p>
            <p>Delivery Notes: {order.deliveryNotes || 'N/A'}</p>
            <p>Items: {formattedItems}</p>
        </div>

        <div className="modal-footer d-flex justify-content-center">
            <button
                className="decline-button reason-btn failed-btn me-3"
                onClick={() => onDecline(order)}
            >
                Decline
            </button>
            <button
                className="accept-button reason-btn confirm-btn"
                onClick={() => onAccept(order)}
            >
                Accept
            </button>
        </div>
    </div>
  );
};


const initialQueuedOrders = [
  {
    id: '123123',
    customerName: 'Boss Oleg',
    deliveryAddress: '322 kanto nila fitz',
    deliveryNotes: '(if any)',
    items: '1x Barako, 1x 3-in-1',
    paymentMethod: 'Cash on Delivery',
  },
  {
    id: '696969',
    customerName: 'Pedro Reyes',
    deliveryAddress: 'Block 12 Lot 3, Rizal Province',
    deliveryNotes: '',
    items: '1x Americano, 1x Cappuccino',
    paymentMethod: 'Card',
  },
];

const initialAssignedOrders = [
  {
    id: '007',
    customerName: 'Juan Dela Cruz',
    deliveryAddress: '015 enta',
    customerPhone: '366650',
    status: 'In transit',
    paymentMethod: 'Cash on Delivery',
    items: '1x Espresso',
    deliveryNotes: 'Leave at guard house.',
  },
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
  const [selectedAssignedOrder, setSelectedAssignedOrder] = useState(initialAssignedOrders[0] || null);
  const [showStatusOptions, setShowStatusOptions] = useState(false);

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
    setAssignedOrders([...assignedOrders, { ...orderToAccept, status: 'Picked Up', customerPhone: '09XX XXX XXXX' }]);
    setSelectedQueuedOrder(null);
    setSelectedAssignedOrder({ ...orderToAccept, status: 'Picked Up', customerPhone: '09XX XXX XXXX' });
  };

  const handleDeclineOrder = (orderToDecline) => {
    setQueuedOrders(queuedOrders.filter(order => order.id !== orderToDecline.id));
    setSelectedQueuedOrder(null);
  };

  const handleOrderDelivered = (orderId) => {
    if (!window.confirm(`Confirm Order #${orderId} Delivered?`)) {
      return;
    }
    setAssignedOrders(assignedOrders.filter(order => order.id !== orderId));
    setSelectedAssignedOrder(null);
  };

  const handleStatusChange = (newStatus) => {
    const orderId = selectedAssignedOrder.id;
    setAssignedOrders(assignedOrders.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
    if (selectedAssignedOrder) {
        setSelectedAssignedOrder(prev => ({...prev, status: newStatus}));
    }
    setShowStatusOptions(false);
  };

  const StatusDropdown = () => (
      <div className="status-dropdown-group">
        <button className="status-trigger-button" onClick={() => setShowStatusOptions(!showStatusOptions)}>
            Update Status
        </button>
        {showStatusOptions && (
            <div className="status-options-list">
                <button onClick={() => handleStatusChange('Picked Up')}>Picked Up</button>
                <button onClick={() => handleStatusChange('In transit')}>In transit</button>
                <button onClick={() => handleStatusChange('Delivered')}>Delivered</button>
                <button onClick={() => handleStatusChange('Failed')}>Failed</button>
            </div>
        )}
      </div>
  );


  return (
    <div className="rider-container">
      
      {/* 1. SIDEBAR */}
      <div className="sidebar-placeholder">
        <h3 className="sidebar-title">DEBAR TO!!!</h3>
        
        {/* Rider Info Card */}
        <div className="sidebar-card card">
          <div className="modal-body">
            <div className="d-flex align-items-center mb-3">
              <div className="driver-icon me-2"></div>
              <div>
                <div className="driver-name-plate">NAME: {riderInfo.name}</div>
                <div className="driver-info">VEHICLE TYPE: {riderInfo.vehicleType}</div>
                <div className="driver-info">PLATE NUMBER: {riderInfo.plateNumber}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery History Table */}
        <div className="delivery-history-label">DELIVERY HISTORY</div>
        <div className="delivery-history-table">
          <div className="table-row table-header"><div>DATE</div><div>ORDER ID</div><div>STATUS</div></div>
          <div className="table-row"><div>11/20</div><div>#101</div><div>Done</div></div>
          <div className="table-row"><div>11/19</div><div>#098</div><div>Done</div></div>
        </div>
      </div>

      {/* 2. MAIN CONTENT AREA */}
      <div className="main-content-area p-4">
        <div className="row mb-4">
          
          {/* Order Queue */}
          <div className="col-md-6">
            <div className="queue-card card">
              <div className="queue-header card-header">Order Queue</div>
              <div className="list-group list-group-flush">
                {queuedOrders.length > 0 ? (
                  queuedOrders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => handleSelectQueuedOrder(order)}
                      className={`list-group-item order-item ${selectedQueuedOrder && selectedQueuedOrder.id === order.id ? 'active' : ''}`}
                    >
                      Order #{order.id}
                      <button className="view-button">View</button>
                    </div>
                  ))
                ) : (
                  <div className="list-group-item text-center text-muted">No new orders in queue.</div>
                )}
              </div>
            </div>
          </div>

          {/* Assigned Orders */}
          <div className="col-md-6">
            <div className="assigned-card card">
              <div className="assigned-header card-header">Assigned Orders</div>
              <div className="list-group list-group-flush">
                {assignedOrders.length > 0 ? (
                  assignedOrders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => handleSelectAssignedOrder(order)}
                      className={`list-group-item order-item ${selectedAssignedOrder && selectedAssignedOrder.id === order.id ? 'active' : ''}`}
                    >
                      Order #{order.id}
                      <button className="view-button">View</button>
                    </div>
                  ))
                ) : (
                  <div className="list-group-item text-center text-muted">No assigned orders.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. ORDER DETAILS PANEL */}
      <div className="order-details-panel">
        <h5 className="details-header">Order Details</h5>
        {selectedAssignedOrder ? (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="order-number-text">Order #{selectedAssignedOrder.id}</span>
              
              <div className="update-status-group">
                <StatusDropdown />
              </div>
            </div>

            <div className="status-text mb-3">
              Status: <span className={`status-badge ${getStatusClass(selectedAssignedOrder.status)}`}>
                  {selectedAssignedOrder.status}
              </span>
            </div>

            <div className="customer-info-box info-section">
              <h3>Customer Info:</h3>
              <p>Name: {selectedAssignedOrder.customerName}</p>
              <p>Address: {selectedAssignedOrder.deliveryAddress}</p>
              <p>Contact #: {selectedAssignedOrder.customerPhone}</p>
            </div>

            <p className="payment-method-text mb-4">Payment Method: {selectedAssignedOrder.paymentMethod}</p>

            <div className="mock-map-right-details">
                {/* Placeholder for Map */}
            </div>

            <button
              className="order-delivered-button action-btn delivered-btn"
              onClick={() => handleOrderDelivered(selectedAssignedOrder.id)}
            >
              Order Delivered
            </button>
          </>
        ) : (
          <p className="text-center text-muted mt-5">Select an assigned order to view details.</p>
        )}
      </div>

      {/* 4. The Order Details "Pop-up" at the bottom center */}
      {selectedQueuedOrder && (
        <div className="modal-overlay bottom-center-details-container">
            <OrderDetailsPopup
             order={selectedQueuedOrder}
             onAccept={handleAcceptOrder}
             onDecline={handleDeclineOrder}
           />
        </div>
      )}
    </div>
  );
}

export default Rider;