import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { deliveryService, customerService, orderService } from '../services/api';
import FeedbackForm from '../components/FeedbackForm';
import StatusTimeline from '../components/StatusTimeline';
import CustomerNavbar from '../components/CustomerNavbar';
import '../App.css';

const TrackOrderPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get('orderId') || '');
  const [tracking, setTracking] = useState(null);
  const [order, setOrder] = useState(null);
  const [riderInfo, setRiderInfo] = useState(null);
  const [eta, setEta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [riderLoading, setRiderLoading] = useState(false);
  const [riderError, setRiderError] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const handleTrack = async (orderIdToTrack = null) => {
    const idToUse = orderIdToTrack || orderId;

    if (!idToUse) {
      setError('Please enter an order ID');
      return;
    }

    setLoading(true);
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
      const orderIdNum = parseInt(idToUse);

      // Load order details
      try {
        const orderData = await orderService.getOrderById(orderIdNum);
        setOrder(orderData);
      } catch (err) {
        console.error('Error loading order:', err);
      }

      // Load tracking data
          const trackingData = await deliveryService.getDeliveryByOrderId(orderIdNum);
      setTracking(trackingData);

      // Load rider info
      setRiderLoading(true);
      try {
        const riderData = await customerService.getRiderInfo(orderIdNum);
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
        const etaData = await customerService.getETA(orderIdNum);
        setEta(etaData);
      } catch (err) {
        console.error('Error loading ETA:', err);
      }

      // Show feedback form if delivery is completed
      if (trackingData?.status === 'Delivered') {
        setShowFeedback(true);
      }
    } catch (err) {
      setError(err.message || 'Failed to load order tracking');
      console.error('Error tracking order:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-track if orderId is in URL
    const urlOrderId = searchParams.get('orderId');
    if (urlOrderId && urlOrderId !== orderId) {
      setOrderId(urlOrderId);
      handleTrack(urlOrderId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    // Auto-refresh tracking if order is being tracked
    if (orderId && tracking) {
      // Stop polling if delivery is completed
      if (tracking.status === 'Delivered' || tracking.status === 'Failed') {
        return;
      }
      const interval = setInterval(() => {
        handleTrack(orderId);
      }, 12000); // Refresh every 12 seconds (10-15 second range)

      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, tracking]);

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
    <>
      <CustomerNavbar />
      <div className="container-fluid page-container">
        <div className="row justify-content-center">
          <div className="col-md-10">
            <h2 className="mb-4">
              <i className="bi bi-truck"></i> Track Your Order
            </h2>

          {/* Order ID Input */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="row align-items-end">
                <div className="col-md-8 mb-3 mb-md-0">
                  <label htmlFor="orderIdInput" className="form-label fw-bold">
                    Order ID
                  </label>
                  <input
                    type="number"
                    className="form-control form-control-lg"
                    id="orderIdInput"
                    placeholder="Enter your order ID"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleTrack();
                      }
                    }}
                  />
                </div>
                <div className="col-md-4">
                  <button
                    className="btn btn-success btn-lg w-100"
                    type="button"
                    onClick={() => handleTrack()}
                    disabled={loading || !orderId}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Tracking...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-search"></i> Track Order
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

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

          {tracking && order && (
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
          )}

          {!tracking && !loading && !error && (
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="bi bi-truck fs-1 text-muted"></i>
                <p className="text-muted mt-3">
                  Enter your order ID above to track your delivery
                </p>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </>
  );
};

export default TrackOrderPage;
