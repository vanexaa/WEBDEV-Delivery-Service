import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { deliveryService, customerService, orderService } from '../services/api';
import RiderInfoCard from '../components/RiderInfoCard';
import FeedbackForm from '../components/FeedbackForm';
import StatusTimeline from '../components/StatusTimeline';
import '../App.css';

const TrackOrderPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [order, setOrder] = useState(null);
  const [riderInfo, setRiderInfo] = useState(null);
  const [eta, setEta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState('');
  const [riderLoading, setRiderLoading] = useState(false);
  const [riderError, setRiderError] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Load all orders for the customer
  useEffect(() => {
    const loadOrders = async () => {
      if (!user?.userId) return;

      try {
        setLoading(true);
        setError('');
        console.log('Loading orders for customer ID:', user.userId);
        const customerOrders = await orderService.getOrdersByCustomerId(user.userId);
        console.log('Orders loaded:', customerOrders);
        setOrders(customerOrders || []);
      } catch (err) {
        console.error('Error loading orders:', err);
        console.error('Error details:', err.message, err.stack);
        
        // Provide more specific error message
        if (err.message?.includes('404') || err.message?.includes('Not Found')) {
          setError('Orders endpoint not found. Please restart the Order Service to load the new endpoint.');
        } else if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
          setError('Cannot connect to Order Service. Please ensure it is running on port 5009.');
        } else {
          setError(`Failed to load your orders: ${err.message || 'Unknown error'}. Please try again.`);
        }
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [user]);

  // Load order details when an order is selected
  const loadOrderDetails = async (orderId) => {
    setSelectedOrderId(orderId);
    setDetailsLoading(true);
    setError('');
    setTracking(null);
    setOrder(null);
    setRiderInfo(null);
    setEta(null);
    setRiderLoading(false);
    setRiderError('');
    setFeedbackSubmitted(false);
    setShowFeedback(false);

    try {
      // Load order details
      try {
        const orderData = await orderService.getOrderById(orderId);
        setOrder(orderData);
      } catch (err) {
        console.error('Error loading order:', err);
      }

      // Load tracking data
      try {
        const trackingData = await deliveryService.getDeliveryByOrderId(orderId);
        setTracking(trackingData);

        // Show feedback form if delivery is completed
        if (trackingData?.status === 'Delivered') {
          setShowFeedback(true);
        }
      } catch (err) {
        console.error('Error loading tracking:', err);
      }

      // Load rider info
      setRiderLoading(true);
      try {
        const riderData = await customerService.getRiderInfo(orderId);
        setRiderInfo(riderData);
        setRiderError('');
      } catch (err) {
        console.error('Error loading rider info:', err);
        setRiderError('Rider information not available');
      } finally {
        setRiderLoading(false);
      }

      // Load ETA
      try {
        const etaData = await customerService.getETA(orderId);
        setEta(etaData);
      } catch (err) {
        console.error('Error loading ETA:', err);
      }
    } catch (err) {
      setError(err.message || 'Failed to load order details');
      console.error('Error loading order details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Auto-refresh tracking for selected order
  useEffect(() => {
    if (selectedOrderId && tracking) {
      // Stop polling if delivery is completed
      if (tracking.status === 'Delivered' || tracking.status === 'Failed') {
        return;
      }
      const interval = setInterval(() => {
        loadOrderDetails(selectedOrderId);
      }, 12000); // Refresh every 12 seconds

      return () => clearInterval(interval);
    }
  }, [selectedOrderId, tracking]);

  const handleFeedbackSuccess = () => {
    setFeedbackSubmitted(true);
    setShowFeedback(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: 'secondary',
      Assigned: 'info',
      Accepted: 'primary',
      PickedUp: 'warning',
      InTransit: 'primary',
      Delivered: 'success',
      Failed: 'danger',
      Cancelled: 'dark'
    };
    return colors[status] || 'secondary';
  };

  const getStatusIcon = (status) => {
    const icons = {
      Pending: 'bi-clock',
      Assigned: 'bi-person-check',
      Accepted: 'bi-check-circle',
      PickedUp: 'bi-box-seam',
      InTransit: 'bi-truck',
      Delivered: 'bi-check-circle-fill',
      Failed: 'bi-x-circle',
      Cancelled: 'bi-x-circle'
    };
    return icons[status] || 'bi-circle';
  };

  return (
    <div className="container-fluid page-container">
      <div className="row justify-content-center">
        <div className="col-md-12">
          <h2 className="mb-4">
            <i className="bi bi-truck"></i> My Orders
          </h2>

          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="bi bi-exclamation-triangle"></i> {error}
            </div>
          )}

          {feedbackSubmitted && (
            <div className="alert alert-success" role="alert">
              <i className="bi bi-check-circle"></i> Thank you for your feedback!
            </div>
          )}

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-muted">Loading your orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="bi bi-inbox fs-1 text-muted"></i>
                <p className="text-muted mt-3">You don't have any orders yet.</p>
              </div>
            </div>
          ) : (
            <div className="row">
              {/* Orders List */}
              <div className="col-lg-4 mb-4">
                <div className="card">
                  <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">
                      <i className="bi bi-list-ul me-2"></i>All Orders ({orders.length})
                    </h5>
                  </div>
                  <div className="card-body p-0" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                    {orders.map((orderItem) => (
                      <div
                        key={orderItem.orderId}
                        className={`p-3 border-bottom order-item ${selectedOrderId === orderItem.orderId ? 'bg-light' : ''}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => loadOrderDetails(orderItem.orderId)}
                      >
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h6 className="mb-1">Order #{orderItem.orderId}</h6>
                            <small className="text-muted">
                              {new Date(orderItem.orderDate).toLocaleDateString()}
                            </small>
                          </div>
                          <span className={`badge bg-${getStatusColor(orderItem.status)}`}>
                            {orderItem.status}
                          </span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="text-muted small">{orderItem.deliveryAddress}</span>
                          <span className="fw-bold text-success">${orderItem.orderTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div className="col-lg-8">
                {detailsLoading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 text-muted">Loading order details...</p>
                  </div>
                ) : selectedOrderId && tracking && order ? (
                  <div className="row">
                    {/* Left Side - Rider Information */}
                    <div className="col-lg-4 mb-4">
                      <div className="card h-100">
                        <div className="card-body text-center">
                          {/* Rider Avatar */}
                          <div className="mb-3">
                            <div
                              className="rounded-circle bg-primary d-inline-flex align-items-center justify-content-center"
                              style={{
                                width: '80px',
                                height: '80px',
                                fontSize: '2.5rem',
                                color: 'white'
                              }}
                            >
                              <i className="bi bi-person"></i>
                            </div>
                          </div>

                          {/* Rider Details */}
                          {riderInfo ? (
                            <>
                              <h6 className="text-muted mb-1">Rider Name</h6>
                              <p className="fw-bold mb-3">{riderInfo.fullName || 'N/A'}</p>

                              <h6 className="text-muted mb-1">Phone Number</h6>
                              <p className="mb-3">
                                {riderInfo.phoneNumber || 'N/A'}
                                {riderInfo.phoneNumber && (
                                  <a
                                    href={`tel:${riderInfo.phoneNumber}`}
                                    className="btn btn-sm btn-outline-primary ms-2"
                                    title="Call Rider"
                                  >
                                    <i className="bi bi-telephone"></i>
                                  </a>
                                )}
                              </p>

                              <h6 className="text-muted mb-1">Vehicle Type</h6>
                              <p className="mb-3">{riderInfo.vehicleType || 'N/A'}</p>

                              {riderInfo.vehicleNumber && (
                                <>
                                  <h6 className="text-muted mb-1">Plate Number</h6>
                                  <p className="mb-3">{riderInfo.vehicleNumber}</p>
                                </>
                              )}

                              <h6 className="text-muted mb-1">Payment Method</h6>
                              <p className="fw-bold mb-0">{order.paymentMethod || 'COD'}</p>
                            </>
                          ) : riderLoading ? (
                            <div className="py-3">
                              <div className="spinner-border spinner-border-sm" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-muted">No rider assigned yet</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Side - ETA and Order Summary */}
                    <div className="col-lg-8 mb-4">
                      {/* ETA Section */}
                      <div className="card mb-4">
                        <div className="card-body">
                          <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center">
                              <div
                                className="me-3"
                                style={{
                                  width: '60px',
                                  height: '60px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '2.5rem'
                                }}
                              >
                                <i className="bi bi-truck"></i>
                              </div>
                              <div>
                                <h6 className="text-muted mb-1">Estimated Time of Arrival:</h6>
                                {eta?.estimatedTime ? (
                                  <span className="badge bg-warning text-dark fs-6 px-3 py-2">
                                    {eta.estimatedTime} minutes
                                  </span>
                                ) : (
                                  <span className="badge bg-secondary fs-6 px-3 py-2">
                                    Not available
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-end">
                              <span className={`badge bg-${getStatusColor(tracking.status)} fs-6 p-2`}>
                                <i className={`bi ${getStatusIcon(tracking.status)} me-2`}></i>
                                {tracking.status}
                              </span>
                            </div>
                          </div>
                          {eta?.estimatedArrival && (
                            <div className="mt-2">
                              <small className="text-muted">
                                Expected arrival: {new Date(eta.estimatedArrival).toLocaleTimeString()}
                              </small>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Order Summary */}
                      <div className="card mb-4">
                        <div className="card-header bg-primary text-white">
                          <h5 className="mb-0">Order Summary</h5>
                        </div>
                        <div className="card-body">
                          <div className="row mb-3">
                            <div className="col-md-6">
                              <h6 className="text-muted">Order ID</h6>
                              <p className="fw-bold">#{order.orderId}</p>
                            </div>
                            <div className="col-md-6">
                              <h6 className="text-muted">Order Total</h6>
                              <p className="fw-bold fs-5 text-success">${order.orderTotal.toFixed(2)}</p>
                            </div>
                          </div>
                          {order.deliveryAddress && (
                            <div className="mb-3">
                              <h6 className="text-muted">Delivery Address</h6>
                              <p>{order.deliveryAddress}</p>
                              <div className="mt-2 d-flex gap-2">
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryAddress)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-outline-primary"
                                >
                                  <i className="bi bi-geo-alt"></i> Open Google Maps
                                </a>
                                <a
                                  href={`https://waze.com/ul?q=${encodeURIComponent(order.deliveryAddress)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-outline-info"
                                >
                                  <i className="bi bi-compass"></i> Open Waze
                                </a>
                              </div>
                            </div>
                          )}
                          {order.specialInstructions && (
                            <div className="mb-3">
                              <h6 className="text-muted">Special Instructions</h6>
                              <p className="text-muted">{order.specialInstructions}</p>
                            </div>
                          )}
                          <div className="border-top pt-3">
                            <h6 className="text-muted mb-2">Order Details</h6>
                            <p className="text-muted mb-0">
                              Order placed on {new Date(order.orderDate).toLocaleString()}
                            </p>
                            <p className="text-muted mb-0">Total: ${order.orderTotal.toFixed(2)}</p>
                            <p className="text-muted mb-0">Payment: {order.paymentMethod}</p>
                          </div>
                        </div>
                      </div>

                      {/* Status History Timeline */}
                      {tracking.statusHistory && tracking.statusHistory.length > 0 && (
                        <div className="card mb-4">
                          <div className="card-header">
                            <h5 className="mb-0">Status History</h5>
                          </div>
                          <div className="card-body">
                            <StatusTimeline
                              statusHistory={tracking.statusHistory}
                              currentStatus={tracking.status}
                            />
                          </div>
                        </div>
                      )}

                      {/* Feedback Form */}
                      {showFeedback && !feedbackSubmitted && (
                        <div className="mb-4">
                          <FeedbackForm
                            orderId={tracking.orderId}
                            onFeedbackSubmitted={handleFeedbackSuccess}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ) : selectedOrderId ? (
                  <div className="card">
                    <div className="card-body text-center py-5">
                      <i className="bi bi-info-circle fs-1 text-muted"></i>
                      <p className="text-muted mt-3">Loading order details...</p>
                    </div>
                  </div>
                ) : (
                  <div className="card">
                    <div className="card-body text-center py-5">
                      <i className="bi bi-cursor fs-1 text-muted"></i>
                      <p className="text-muted mt-3">Select an order from the list to view details</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackOrderPage;
