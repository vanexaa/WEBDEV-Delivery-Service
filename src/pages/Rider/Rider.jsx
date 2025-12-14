import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, ListGroup } from 'react-bootstrap';
import './Rider.css';

const OrderDetailsPopup = ({ order, onAccept, onDecline }) => {
  if (!order) return null;

  const formattedItems = order.items.map(item => `${item.quantity}x ${item.name}`).join(', ');

  return (
    <Card className="order-details-popup-card">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <Card.Title className="popup-order-number">
            Order #{order.id}
          </Card.Title>
          <Button variant="link" className="view-map-button">
            View Map
          </Button>
        </div>

        <div className="popup-details-text">
          <p>Customer Name: **{order.customerName}**</p>
          <p>Delivery Address: {order.deliveryAddress}</p>
          <p>Delivery Notes: {order.deliveryNotes || 'N/A'}</p>
          <p>Items: {formattedItems}</p>
        </div>

        <div className="d-flex justify-content-center mt-4">
          <Button
            className="decline-button me-3"
            onClick={() => onDecline(order)}
          >
            Decline
          </Button>
          <Button
            className="accept-button"
            onClick={() => onAccept(order)}
          >
            Accept
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};


const initialQueuedOrders = [
  {
    id: '123123',
    customerName: 'Boss Oleg',
    deliveryAddress: '322 kanto nila fitz',
    deliveryNotes: '(if any)',
    items: [{ name: "Barako", quantity: 1 }, { name: "3-in-1", quantity: 1 }],
    paymentMethod: 'Cash on Delivery',
    customerPhone: '09XX XXX XXXX',
  },
  {
    id: '696969',
    customerName: 'Pedro Reyes',
    deliveryAddress: 'Block 12 Lot 3, Rizal Province',
    deliveryNotes: '',
    items: [{ name: "Americano", quantity: 1 }, { name: "Cappuccino", quantity: 1 }],
    paymentMethod: 'Cash on Delivery',
    customerPhone: '09ZZ ZZZ ZZZZ',
  },
];

const initialAssignedOrders = [
  {
    id: '007',
    customerName: 'James Bond',
    deliveryAddress: 'MI6 Headquarters, London',
    deliveryNotes: 'Secret delivery',
    items: [{ name: "Espresso", quantity: 1 }],
    paymentMethod: 'Card',
    customerPhone: '09AA AAA AAAA',
    status: 'In Transit',
  },
];

const riderInfo = {
  name: "Juan Dela Cruz",
  vehicleType: "Motorcycle",
  plateNumber: "ABC-1234",
};


function Rider() {
  const [queuedOrders, setQueuedOrders] = useState(initialQueuedOrders);
  const [assignedOrders, setAssignedOrders] = useState(initialAssignedOrders);
  const [selectedQueuedOrder, setSelectedQueuedOrder] = useState(null);
  const [selectedAssignedOrder, setSelectedAssignedOrder] = useState(initialAssignedOrders[0] || null);

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
    setSelectedQueuedOrder(null);
    setSelectedAssignedOrder({ ...orderToAccept, status: 'Picked Up' });
  };

  const handleDeclineOrder = (orderToDecline) => {
    setQueuedOrders(queuedOrders.filter(order => order.id !== orderToDecline.id));
    setSelectedQueuedOrder(null);
  };

  const handleOrderDelivered = (orderId) => {
    if (!window.confirm(`Are you sure you want to mark Order #${orderId} as Delivered?`)) {
      return;
    }
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
      <div className="sidebar-placeholder">
        <h3 className="text-white sidebar-title">SIDEBAR TO!!!</h3>
        <Card className="sidebar-card">
          <Card.Body>
            <div className="d-flex align-items-center mb-3">
              <div className="driver-icon me-2"></div>
              <div>
                <div className="driver-name-plate">NAME: {riderInfo.name}</div>
                <div className="driver-info">VEHICLE TYPE: {riderInfo.vehicleType}</div>
                <div className="driver-info">PLATE NUMBER: {riderInfo.plateNumber}</div>
              </div>
            </div>
            <div className="delivery-history-label">DELIVERY HISTORY</div>
            <div className="delivery-history-table">
              <div className="table-row table-header"><div>DATE</div><div>ORDER ID</div><div>STATUS</div></div>
              <div className="table-row"><div>11/20</div><div>#101</div><div>Done</div></div>
              <div className="table-row"><div>11/19</div><div>#098</div><div>Done</div></div>
            </div>
          </Card.Body>
        </Card>
      </div>

      <Container fluid className="main-content-area p-4">
        <Row className="mb-4">
          <Col md={4}>
            <Card className="queue-card">
              <Card.Header as="h5" className="queue-header">Order Queue</Card.Header>
              <ListGroup variant="flush">
                {queuedOrders.length > 0 ? (
                  queuedOrders.map((order) => (
                    <ListGroup.Item
                      key={order.id}
                      action
                      active={selectedQueuedOrder && selectedQueuedOrder.id === order.id}
                      onClick={() => handleSelectQueuedOrder(order)}
                      className="order-item"
                    >
                      Order #{order.id}
                      <Button variant="outline-secondary" size="sm" className="view-button">
                        View
                      </Button>
                    </ListGroup.Item>
                  ))
                ) : (
                  <ListGroup.Item className="text-center text-muted">No new orders in queue.</ListGroup.Item>
                )}
              </ListGroup>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="assigned-card">
              <Card.Header as="h5" className="assigned-header">Assigned Orders</Card.Header>
              <ListGroup variant="flush">
                {assignedOrders.length > 0 ? (
                  assignedOrders.map((order) => (
                    <ListGroup.Item
                      key={order.id}
                      action
                      active={selectedAssignedOrder && selectedAssignedOrder.id === order.id}
                      onClick={() => handleSelectAssignedOrder(order)}
                      className="order-item assigned-item"
                    >
                      Order #{order.id}
                      <Button variant="outline-secondary" size="sm" className="view-button">
                        View
                      </Button>
                    </ListGroup.Item>
                  ))
                ) : (
                  <ListGroup.Item className="text-center text-muted">No assigned orders.</ListGroup.Item>
                )}
              </ListGroup>
            </Card>
          </Col>
        </Row>
      </Container>

      <div className="order-details-panel">
        <h5 className="details-header">Order Details</h5>
        {selectedAssignedOrder ? (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="order-number-text">Order #{selectedAssignedOrder.id}</span>
              <div className="update-status-group">
                <span className="status-label me-2">Update Status:</span>
                <select
                  className="form-select status-dropdown"
                  value={selectedAssignedOrder.status}
                  onChange={(e) => handleStatusChange(selectedAssignedOrder.id, e.target.value)}
                >
                  <option value="Picked Up">Picked Up</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>
            </div>

            <div className="status-text mb-3">
              Status: **{selectedAssignedOrder.status}**
            </div>

            <div className="customer-info-box">
              <p>Customer Info:</p>
              <p>Name: {selectedAssignedOrder.customerName}</p>
              <p>Address: {selectedAssignedOrder.deliveryAddress}</p>
              <p>Contact #: {selectedAssignedOrder.customerPhone}</p>
            </div>

            <p className="payment-method-text mb-4">Payment Method: {selectedAssignedOrder.paymentMethod}</p>

            <div className="mock-map-right-details">
            </div>

            <Button
              className="order-delivered-button"
              onClick={() => handleOrderDelivered(selectedAssignedOrder.id)}
            >
              Order Delivered
            </Button>
          </>
        ) : (
          <p className="text-center text-muted mt-5">Select an assigned order to view details.</p>
        )}
      </div>

      {selectedQueuedOrder && (
        <div className="bottom-center-details-container">
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