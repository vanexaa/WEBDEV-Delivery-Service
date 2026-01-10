// src/pages/Rider.jsx
import React, { useState, useEffect } from 'react';
import { BsPerson } from 'react-icons/bs'; 
import '../css/Rider.css'; 

const API_BASE_URL = 'http://localhost:5292'; // Backend port from launchSettings.json
const RIDER_ID = 1; // TODO: Get from authentication context

const OrderItem = ({ order, onClickView }) => (
  <div className="order-item-row">
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span>Order #{order.orderId || order.id}</span>
      {order.customerName && (
        <span style={{ fontSize: '0.85rem', color: '#666' }}>{order.customerName}</span>
      )}
      {order.status && (
        <span style={{ 
          fontSize: '0.8rem', 
          padding: '2px 6px', 
          borderRadius: '4px', 
          backgroundColor: order.status === 'Delivered' ? '#4CAF50' : 
                          order.status === 'InTransit' ? '#2196F3' : 
                          order.status === 'PickedUp' ? '#FF9800' : '#9E9E9E',
          color: 'white',
          display: 'inline-block',
          marginTop: '4px'
        }}>
          {order.status === 'PickedUp' ? 'Picked Up' : order.status === 'InTransit' ? 'In Transit' : order.status}
        </span>
      )}
    </div>
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

const AssignedOrderModal = ({ order, onClose, onStatusUpdate }) => {
    const [currentStatus, setCurrentStatus] = useState(order.status || 'Assigned');
    const [isUpdating, setIsUpdating] = useState(false);

    const handleStatusChange = async (newStatus) => {
        setIsUpdating(true);
        try {
            await onStatusUpdate(order.orderId, newStatus);
            setCurrentStatus(newStatus);
        } catch (error) {
            alert('Failed to update status: ' + error.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const getStatusButtons = () => {
        const statusFlow = ['Assigned', 'PickedUp', 'InTransit', 'Delivered'];
        const currentIndex = statusFlow.indexOf(currentStatus);
        
        return (
            <div style={{ padding: '10px', marginTop: '15px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: 'white' }}>
                <p style={{marginBottom: '10px', fontWeight: 'bold'}}>Update Status:</p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {statusFlow.map((status, index) => {
                        const isActive = index === currentIndex;
                        const isNext = index === currentIndex + 1;
                        const isPast = index < currentIndex;
                        const canClick = isNext || (status === 'Delivered' && currentIndex >= 2);
                        
                        return (
                            <button
                                key={status}
                                onClick={() => canClick && handleStatusChange(status)}
                                disabled={!canClick || isUpdating}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    border: '1px solid #ddd',
                                    backgroundColor: isActive ? '#4CAF50' : isPast ? '#e0e0e0' : canClick ? '#aa6e39' : '#f5f5f5',
                                    color: isActive || canClick ? 'white' : '#999',
                                    cursor: canClick ? 'pointer' : 'not-allowed',
                                    fontSize: '0.9rem',
                                    fontWeight: isActive ? 'bold' : 'normal',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    if (canClick && !isActive) {
                                        e.target.style.backgroundColor = '#945d30';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (canClick && !isActive) {
                                        e.target.style.backgroundColor = '#aa6e39';
                                    }
                                }}
                            >
                                {status === 'PickedUp' ? 'Picked Up' : status === 'InTransit' ? 'In Transit' : status}
                            </button>
                        );
                    })}
                    <button
                        onClick={() => handleStatusChange('Failed')}
                        disabled={isUpdating}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: '1px solid #f44336',
                            backgroundColor: '#f44336',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        Mark Failed
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="modal-overlay-new">
            <div className="order-details-modal">
                <div className="details-header">
                    <h3>Order Details</h3>
                    <span style={{ cursor: 'pointer', fontSize: '1.5rem', color: '#1a1a1a' }} onClick={onClose}>
                        ✖
                    </span>
                </div>
                <div className="details-content">
                    <p><strong>Order #:</strong> {order.orderId}</p>
                    <p><strong>Status:</strong> {currentStatus}</p>
                    <p><strong>Customer:</strong> {order.customerName || 'N/A'}</p>
                    {order.address && <p><strong>Address:</strong> {order.address}</p>}
                    {order.contact && <p><strong>Contact #:</strong> {order.contact}</p>}
                    {order.payment && <p><strong>Payment Method:</strong> {order.payment}</p>}
                    
                    {getStatusButtons()}
                </div>
            </div>
        </div>
    );
};

function Rider() {
  const [isOnline, setIsOnline] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [history, setHistory] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'history', 'feedback'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch assigned orders
  const fetchAssignedOrders = async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      const response = await fetch(`${API_BASE_URL}/api/riders/${RIDER_ID}/orders`);
      if (!response.ok) {
        if (response.status === 404) {
          // No orders found is fine, just empty array
          setAssignedOrders([]);
          return;
        }
        throw new Error(`Server error: ${response.status}`);
      }
      const data = await response.json();
      // Handle new response structure with Orders and LoadInfo
      if (data.Orders && Array.isArray(data.Orders)) {
        setAssignedOrders(data.Orders);
        // Store load info if needed for display
        if (data.LoadInfo) {
          console.log('Rider Load Info:', data.LoadInfo);
        }
      } else if (Array.isArray(data)) {
        // Fallback for old response format
        setAssignedOrders(data);
      } else {
        setAssignedOrders([]);
      }
    } catch (err) {
      // Check if it's a network error (backend not running)
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Cannot connect to server. Please make sure the backend is running.');
      } else {
        setError(err.message);
      }
      console.error('Error fetching orders:', err);
      // Set empty array on error so UI doesn't break
      setAssignedOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch delivery history
  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      const response = await fetch(`${API_BASE_URL}/api/riders/${RIDER_ID}/history`);
      if (!response.ok) {
        if (response.status === 404) {
          // No history found is fine, just empty array
          setHistory([]);
          return;
        }
        throw new Error(`Server error: ${response.status}`);
      }
      const data = await response.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      // Check if it's a network error (backend not running)
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Cannot connect to server. Please make sure the backend is running.');
      } else {
        setError(err.message);
      }
      console.error('Error fetching history:', err);
      // Set empty array on error so UI doesn't break
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch feedback
  const fetchFeedback = async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      const response = await fetch(`${API_BASE_URL}/api/riders/${RIDER_ID}/feedback`);
      if (!response.ok) {
        if (response.status === 404) {
          // No feedback found is fine
          setFeedback({ averageRating: 0, feedbacks: [] });
          return;
        }
        throw new Error(`Server error: ${response.status}`);
      }
      const data = await response.json();
      setFeedback(data);
    } catch (err) {
      // Check if it's a network error (backend not running)
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Cannot connect to server. Please make sure the backend is running.');
      } else {
        setError(err.message);
      }
      console.error('Error fetching feedback:', err);
      // Set default feedback on error so UI doesn't break
      setFeedback({ averageRating: 0, feedbacks: [] });
    } finally {
      setLoading(false);
    }
  };

  // Update availability
  const handleAvailabilityToggle = async (available) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/riders/${RIDER_ID}/availability`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isAvailable: available }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update availability');
      }
      const data = await response.json();
      setIsOnline(data.isAvailable);
      
      // Show warning if setting unavailable with active deliveries
      if (data.activeDeliveries && data.activeDeliveries > 0) {
        alert(`Warning: You have ${data.activeDeliveries} active delivery(ies). You've been marked as unavailable.`);
      }
    } catch (err) {
      alert('Failed to update availability: ' + err.message);
      console.error('Error updating availability:', err);
    }
  };

  // Update order status
  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/deliveries/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      
      // Refresh assigned orders
      await fetchAssignedOrders();
      
      // If delivered, refresh history
      if (newStatus === 'Delivered' || newStatus === 'Failed') {
        await fetchHistory();
      }
    } catch (err) {
      throw err;
    }
  };

  // Fetch order details
  const fetchOrderDetails = async (orderId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/riders/${RIDER_ID}/orders/${orderId}`);
      if (!response.ok) throw new Error('Failed to fetch order details');
      return await response.json();
    } catch (err) {
      console.error('Error fetching order details:', err);
      return null;
    }
  };

  useEffect(() => {
    fetchAssignedOrders();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    } else if (activeTab === 'feedback') {
      fetchFeedback();
    }
  }, [activeTab]);

  const handleViewClick = async (order) => {
    const details = await fetchOrderDetails(order.orderId);
    setSelectedOrder({ ...order, ...details });
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


  return (
    <div className="app">
      <div className="order-dashboard-container">
        
        <div className="top-header-section">
          <BsPerson className="profile-icon" />
          <label className="rider-toggle">
              <input 
                type="checkbox" 
                checked={isOnline}
                onChange={(e) => handleAvailabilityToggle(e.target.checked)}
              />
              <span className="slider"></span>
          </label>
          <span style={{ marginLeft: '10px', fontSize: '0.9rem' }}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #ddd' }}>
          <button
            onClick={() => setActiveTab('orders')}
            className="rider-tab-button"
            style={{
              padding: '10px 20px',
              border: 'none',
              backgroundColor: activeTab === 'orders' ? '#aa6e39' : 'transparent',
              color: activeTab === 'orders' ? 'white' : '#1a1a1a',
              cursor: 'pointer',
              borderTopLeftRadius: '8px',
              borderTopRightRadius: '8px',
              fontWeight: activeTab === 'orders' ? 'bold' : 'normal',
              transition: 'background-color 0.2s, color 0.2s'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'orders') {
                e.target.style.backgroundColor = '#aa6e39';
                e.target.style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'orders') {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#1a1a1a';
              }
            }}
          >
            Assigned Orders
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className="rider-tab-button"
            style={{
              padding: '10px 20px',
              border: 'none',
              backgroundColor: activeTab === 'history' ? '#aa6e39' : 'transparent',
              color: activeTab === 'history' ? 'white' : '#1a1a1a',
              cursor: 'pointer',
              borderTopLeftRadius: '8px',
              borderTopRightRadius: '8px',
              fontWeight: activeTab === 'history' ? 'bold' : 'normal',
              transition: 'background-color 0.2s, color 0.2s'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'history') {
                e.target.style.backgroundColor = '#aa6e39';
                e.target.style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'history') {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#1a1a1a';
              }
            }}
          >
            History
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className="rider-tab-button"
            style={{
              padding: '10px 20px',
              border: 'none',
              backgroundColor: activeTab === 'feedback' ? '#aa6e39' : 'transparent',
              color: activeTab === 'feedback' ? 'white' : '#1a1a1a',
              cursor: 'pointer',
              borderTopLeftRadius: '8px',
              borderTopRightRadius: '8px',
              fontWeight: activeTab === 'feedback' ? 'bold' : 'normal',
              transition: 'background-color 0.2s, color 0.2s'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'feedback') {
                e.target.style.backgroundColor = '#aa6e39';
                e.target.style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'feedback') {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#1a1a1a';
              }
            }}
          >
            Feedback
          </button>
        </div>

        {error && (
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#f5e6d3', 
            color: '#642f19', 
            borderRadius: '4px', 
            marginBottom: '20px',
            border: '1px solid #aa6e39',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#642f19',
                cursor: 'pointer',
                fontSize: '1.2rem',
                padding: '0 8px',
                fontWeight: 'bold'
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="order-card">
            <h3 className="order-card-title">Assigned Orders</h3>
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
            ) : assignedOrders.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                No assigned orders at the moment.
              </div>
            ) : (
              <div className="orders-list">
                {assignedOrders.map((order) => (
                  <OrderItem 
                    key={order.orderId} 
                    order={order} 
                    onClickView={handleViewClick} 
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="order-card">
            <h3 className="order-card-title">Delivery History</h3>
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
            ) : history.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                No delivery history yet.
              </div>
            ) : (
              <div className="orders-list">
                {history.map((order) => (
                  <div key={order.orderId} className="order-item-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <span><strong>Order #{order.orderId}</strong></span>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        backgroundColor: order.status === 'Delivered' ? '#4CAF50' : '#f44336',
                        color: 'white',
                        fontSize: '0.85rem'
                      }}>
                        {order.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>
                      <p>Customer: {order.customerName || 'N/A'}</p>
                      <p>Delivered: {new Date(order.deliveredAt).toLocaleString()}</p>
                      {order.rating && (
                        <p>Rating: {'⭐'.repeat(order.rating)} ({order.rating}/5)</p>
                      )}
                      {order.feedback && (
                        <p style={{ fontStyle: 'italic', marginTop: '5px' }}>"{order.feedback}"</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <div className="order-card">
            <h3 className="order-card-title">Feedback Summary</h3>
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
            ) : !feedback || feedback.feedbacks.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                No feedback received yet.
              </div>
            ) : (
              <div>
                <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px', marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>Average Rating</h4>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2196F3' }}>
                    {feedback.averageRating.toFixed(1)} / 5.0
                  </div>
                  <div style={{ marginTop: '5px' }}>
                    {'⭐'.repeat(Math.round(feedback.averageRating))}
                  </div>
                </div>
                <h4 style={{ marginBottom: '15px' }}>Recent Feedback</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {feedback.feedbacks.map((fb) => (
                    <div key={fb.feedbackId} style={{ 
                      padding: '15px', 
                      border: '1px solid #ddd', 
                      borderRadius: '8px',
                      backgroundColor: 'white'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div style={{ fontSize: '1.2rem' }}>
                          {'⭐'.repeat(fb.rating)}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>
                          {new Date(fb.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      {fb.comment && (
                        <p style={{ margin: '10px 0 0 0', fontStyle: 'italic', color: '#333' }}>
                          "{fb.comment}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {selectedOrder && (
          <AssignedOrderModal
              order={selectedOrder}
              onClose={handleCloseModal}
              onStatusUpdate={handleStatusUpdate}
          />
      )}
    </div>
  );
}

export default Rider;