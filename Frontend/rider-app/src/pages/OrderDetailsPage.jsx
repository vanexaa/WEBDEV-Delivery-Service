import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { deliveryService, orderService } from '../services/api';
import RiderNavbar from '../components/RiderNavbar';
import '../App.css';

const OrderDetailsPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { riderId } = useAuth();
  const [order, setOrder] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusNotes, setStatusNotes] = useState('');
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [failureReason, setFailureReason] = useState('');
  const [showCodModal, setShowCodModal] = useState(false);
  const [codReceived, setCodReceived] = useState(false);

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      const [orderData, deliveryData] = await Promise.all([
        orderService.getOrderById(orderId),
        deliveryService.getDeliveryByOrderId(orderId).catch(() => null)
      ]);
      setOrder(orderData);
      setDelivery(deliveryData);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load order details');
      console.error('Error loading order:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!delivery) return;

    setUpdatingStatus(true);
    try {
      // Get current location for InTransit status
      let latitude = null;
      let longitude = null;
      if (newStatus === 'InTransit') {
        if (navigator.geolocation) {
          await new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                latitude = position.coords.latitude;
                longitude = position.coords.longitude;
                resolve();
              },
              () => resolve(),
              { timeout: 5000 }
            );
          });
        }
      }

      await deliveryService.updateDeliveryStatus(
        orderId,
        newStatus,
        statusNotes || null,
        latitude,
        longitude
      );

      if (newStatus === 'Delivered' && order?.paymentMethod === 'COD') {
        setShowCodModal(true);
      } else {
        await loadOrderDetails();
        setStatusNotes('');
      }
    } catch (err) {
      alert(err.message || 'Failed to update status');
      console.error('Error updating status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleMarkDelivered = async () => {
    if (order?.paymentMethod === 'COD' && !codReceived) {
      alert('Please confirm COD payment received');
      return;
    }

    try {
      await deliveryService.updateDeliveryStatus(orderId, 'Delivered', statusNotes);
      setShowCodModal(false);
      await loadOrderDetails();
      setStatusNotes('');
      navigate('/');
    } catch (err) {
      alert(err.message || 'Failed to mark as delivered');
    }
  };

  const handleReportFailure = async () => {
    if (!failureReason.trim()) {
      alert('Please provide a reason for failure');
      return;
    }

    try {
      await deliveryService.markDeliveryAsFailed(orderId, failureReason);
      setShowFailureModal(false);
      setFailureReason('');
      navigate('/');
    } catch (err) {
      alert(err.message || 'Failed to report failure');
    }
  };

  const openNavigation = (address, app = 'google') => {
    const encodedAddress = encodeURIComponent(address);
    if (app === 'google') {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, '_blank');
    } else if (app === 'waze') {
      window.open(`https://waze.com/ul?q=${encodedAddress}`, '_blank');
    }
  };

  const handleCallCustomer = (phone) => {
    window.location.href = `tel:${phone}`;
  };

  const handleMessageCustomer = (phone) => {
    window.location.href = `sms:${phone}`;
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

  const getNextStatusOptions = (currentStatus) => {
    switch (currentStatus) {
      case 'Assigned':
        return ['Accepted'];
      case 'Accepted':
        return ['PickedUp'];
      case 'PickedUp':
        return ['InTransit'];
      case 'InTransit':
        return ['Delivered'];
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <>
        <RiderNavbar />
        <div className="container-fluid page-container">
          <div className="text-center mt-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <RiderNavbar />
        <div className="container-fluid page-container">
          <div className="alert alert-danger" role="alert">
            {error || 'Order not found'}
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Back to Dashboard
          </button>
        </div>
      </>
    );
  }

  const nextStatusOptions = getNextStatusOptions(delivery?.status || order.status);

  return (
    <>
      <RiderNavbar />
      <div className="container-fluid page-container">
        <div className="row mb-3">
          <div className="col-12">
            <button className="btn btn-secondary" onClick={() => navigate('/')}>
              <i className="bi bi-arrow-left"></i> Back to Dashboard
            </button>
          </div>
        </div>

        <div className="row">
          <div className="col-lg-8">
            {/* Order Information */}
            <div className="card mb-4">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">Order #{order.orderId}</h5>
              </div>
              <div className="card-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <h6 className="text-muted">Status</h6>
                    <span className={`badge bg-${getStatusColor(delivery?.status || order.status)}`}>
                      {delivery?.status || order.status}
                    </span>
                  </div>
                  <div className="col-md-6">
                    <h6 className="text-muted">Order Date</h6>
                    <p>{new Date(order.orderDate).toLocaleString()}</p>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <h6 className="text-muted">Order Total</h6>
                    <p className="fs-5 fw-bold">${order.orderTotal.toFixed(2)}</p>
                  </div>
                  <div className="col-md-6">
                    <h6 className="text-muted">Payment Method</h6>
                    <p>{order.paymentMethod}</p>
                  </div>
                </div>

                {order.specialInstructions && (
                  <div className="mb-3">
                    <h6 className="text-muted">Special Instructions</h6>
                    <p className="alert alert-info mb-0">{order.specialInstructions}</p>
                  </div>
                )}

                {/* Delivery Timeline */}
                {delivery && (
                  <div className="mt-4">
                    <h6 className="text-muted mb-3">Delivery Timeline</h6>
                    <div className="timeline">
                      {delivery.assignedAt && (
                        <div className="timeline-item">
                          <strong>Assigned:</strong> {new Date(delivery.assignedAt).toLocaleString()}
                        </div>
                      )}
                      {delivery.acceptedAt && (
                        <div className="timeline-item">
                          <strong>Accepted:</strong> {new Date(delivery.acceptedAt).toLocaleString()}
                        </div>
                      )}
                      {delivery.pickedUpAt && (
                        <div className="timeline-item">
                          <strong>Picked Up:</strong> {new Date(delivery.pickedUpAt).toLocaleString()}
                        </div>
                      )}
                      {delivery.deliveredAt && (
                        <div className="timeline-item">
                          <strong>Delivered:</strong> {new Date(delivery.deliveredAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Information */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">Customer Information</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <h6 className="text-muted">Name</h6>
                    <p>{order.customerName}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <h6 className="text-muted">Phone</h6>
                    <p>
                      {order.customerPhone}
                      <button
                        className="btn btn-sm btn-outline-primary ms-2"
                        onClick={() => handleCallCustomer(order.customerPhone)}
                        title="Call Customer"
                      >
                        <i className="bi bi-telephone"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-success ms-1"
                        onClick={() => handleMessageCustomer(order.customerPhone)}
                        title="Message Customer"
                      >
                        <i className="bi bi-chat-dots"></i>
                      </button>
                    </p>
                  </div>
                </div>
                <div className="mb-3">
                  <h6 className="text-muted">Delivery Address</h6>
                  <p>{order.deliveryAddress}</p>
                  <div className="mt-2">
                    <button
                      className="btn btn-sm btn-primary me-2"
                      onClick={() => openNavigation(order.deliveryAddress, 'google')}
                    >
                      <i className="bi bi-geo-alt"></i> Open Google Maps
                    </button>
                    <button
                      className="btn btn-sm btn-info"
                      onClick={() => openNavigation(order.deliveryAddress, 'waze')}
                    >
                      <i className="bi bi-navigator"></i> Open Waze
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            {/* Status Update */}
            {nextStatusOptions.length > 0 && (
              <div className="card mb-4">
                <div className="card-header bg-warning">
                  <h5 className="mb-0">Update Status</h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label">Next Status</label>
                    <div className="d-grid gap-2">
                      {nextStatusOptions.map((status) => (
                        <button
                          key={status}
                          className="btn btn-primary"
                          onClick={() => handleStatusUpdate(status)}
                          disabled={updatingStatus}
                        >
                          {updatingStatus ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              Updating...
                            </>
                          ) : (
                            `Mark as ${status}`
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Notes (Optional)</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={statusNotes}
                      onChange={(e) => setStatusNotes(e.target.value)}
                      placeholder="Add any notes about this status update..."
                    />
                  </div>
                  <button
                    className="btn btn-danger w-100"
                    onClick={() => setShowFailureModal(true)}
                    disabled={updatingStatus}
                  >
                    <i className="bi bi-exclamation-triangle"></i> Report Issue
                  </button>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Quick Actions</h5>
              </div>
              <div className="card-body">
                <div className="d-grid gap-2">
                  <button
                    className="btn btn-outline-primary"
                    onClick={() => handleCallCustomer(order.customerPhone)}
                  >
                    <i className="bi bi-telephone"></i> Call Customer
                  </button>
                  <button
                    className="btn btn-outline-success"
                    onClick={() => handleMessageCustomer(order.customerPhone)}
                  >
                    <i className="bi bi-chat-dots"></i> Message Customer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COD Modal */}
      {showCodModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">COD Payment Confirmation</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCodModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>Order Total: <strong>${order.orderTotal.toFixed(2)}</strong></p>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="codReceived"
                    checked={codReceived}
                    onChange={(e) => setCodReceived(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="codReceived">
                    I confirm that I have received the COD payment of ${order.orderTotal.toFixed(2)}
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCodModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleMarkDelivered}
                  disabled={!codReceived}
                >
                  Confirm Delivery
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Failure Modal */}
      {showFailureModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">Report Delivery Issue</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowFailureModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <label className="form-label">Reason for Failure</label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  placeholder="Please provide details about why the delivery failed..."
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowFailureModal(false);
                    setFailureReason('');
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleReportFailure}
                >
                  Report Issue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderDetailsPage;
