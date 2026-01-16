import React, { useState, useEffect } from 'react';
import { deliveryService, riderService } from '../../services/api';
import Navbar from '../../components/Navbar';
import '../../App.css';

const DeliveriesPage = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [availableRiders, setAvailableRiders] = useState([]);
  const [loadingRiders, setLoadingRiders] = useState(false);
  const [reassigning, setReassigning] = useState(false);

  useEffect(() => {
    loadDeliveries();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      console.log('[DeliveriesPage] Auto-refreshing deliveries...');
      loadDeliveries();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDeliveries = async () => {
    try {
      setLoading(true);
      console.log('[DeliveriesPage] Loading deliveries...');
      
      // Try to get deliveries with order info, fallback to regular endpoint
      const data = await deliveryService.getActiveDeliveriesWithOrders().catch(err => {
        console.warn('[DeliveriesPage] Failed to get deliveries with orders, using fallback:', err);
        return deliveryService.getActiveDeliveries();
      });
      
      console.log('[DeliveriesPage] Loaded deliveries:', data?.length || 0);
      setDeliveries(data || []);
      setError('');
    } catch (err) {
      console.error('[DeliveriesPage] Error loading deliveries:', err);
      setError('Failed to load deliveries.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDelivery = async (delivery) => {
    try {
      const deliveryDetails = await deliveryService.getDeliveryByOrderId(delivery.orderId);
      setSelectedDelivery(deliveryDetails);
      setShowViewModal(true);
    } catch (err) {
      console.error('Error loading delivery details:', err);
      setSelectedDelivery(delivery);
      setShowViewModal(true);
    }
  };

  const handleReassignClick = async (delivery) => {
    try {
      setSelectedDelivery(delivery);
      setLoadingRiders(true);
      console.log('[DeliveriesPage] Loading riders for reassignment...');
      
      // Try to get riders with availability, fallback to regular endpoint
      const riders = await riderService.getAllRidersWithAvailability().catch(err => {
        console.warn('[DeliveriesPage] Failed to get riders with availability, using fallback:', err);
        return riderService.getAllRiders();
      });
      
      // Filter online riders - handle both camelCase and PascalCase
      const onlineRiders = (riders || []).filter(r => {
        const isOnline = r.isOnline || r.IsOnline || false;
        return isOnline;
      });
      
      console.log('[DeliveriesPage] Found online riders:', onlineRiders.length);
      setAvailableRiders(onlineRiders);
      setShowReassignModal(true);
    } catch (err) {
      console.error('[DeliveriesPage] Error loading riders:', err);
      setAvailableRiders([]);
      setShowReassignModal(true);
    } finally {
      setLoadingRiders(false);
    }
  };

  const handleReassign = async (newRiderId) => {
    if (!selectedDelivery) return;
    
    try {
      setReassigning(true);
      const orderId = selectedDelivery.orderId || selectedDelivery.OrderId;
      console.log('[DeliveriesPage] Reassigning delivery:', orderId, 'to rider:', newRiderId);
      
      if (!orderId) {
        alert('Invalid order ID. Cannot reassign delivery.');
        return;
      }
      
      const result = await deliveryService.reassignDelivery(orderId, newRiderId);
      console.log('[DeliveriesPage] Reassign result:', result);
      
      // Force refresh after a short delay to ensure backend has processed
      await new Promise(resolve => setTimeout(resolve, 500));
      await loadDeliveries();
      
      setShowReassignModal(false);
      setSelectedDelivery(null);
      setError('');
      
      alert('Delivery reassigned successfully!');
      console.log('[DeliveriesPage] Deliveries refreshed after reassignment');
    } catch (err) {
      console.error('[DeliveriesPage] Error reassigning delivery:', err);
      setError(err.message || 'Failed to reassign delivery.');
      alert(err.message || 'Failed to reassign delivery.');
    } finally {
      setReassigning(false);
    }
  };

  const handleCloseModals = () => {
    setShowViewModal(false);
    setShowReassignModal(false);
    setSelectedDelivery(null);
    setAvailableRiders([]);
  };

  return (
    <>
      <Navbar />
      <div className="container-fluid page-container">
      <div className="row">
        <div className="col-12">
          <h4 className="mb-3">All Deliveries</h4>
          <div className="card">
            <div className="card-body">
              {loading && (
                <div className="text-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )}
              {error && (
                <div className="alert alert-warning" role="alert">
                  {error}
                </div>
              )}
              {!loading && !error && (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Status</th>
                        <th>Assigned At</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliveries.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center">
                            No deliveries found
                          </td>
                        </tr>
                      ) : (
                        deliveries.map((delivery) => {
                          // Handle both DTO format (order property) and regular format
                          const order = delivery.order || delivery.Order || {};
                          const orderId = delivery.orderId || delivery.OrderId;
                          const riderId = delivery.riderId || delivery.RiderId;
                          const status = delivery.status || delivery.Status;
                          const assignedAt = delivery.assignedAt || delivery.AssignedAt;
                          
                          return (
                            <tr key={orderId}>
                              <td>#{orderId}</td>
                              <td>{order.customerName || order.CustomerName || 'N/A'}</td>
                              <td>
                                <span className="badge bg-primary">{status}</span>
                              </td>
                              <td>{assignedAt ? new Date(assignedAt).toLocaleString() : 'N/A'}</td>
                              <td>
                                <button 
                                  className="btn btn-sm btn-primary me-2"
                                  onClick={() => handleViewDelivery(delivery)}
                                >
                                  View
                                </button>
                                {riderId && (
                                  <button 
                                    className="btn btn-sm btn-warning"
                                    onClick={() => handleReassignClick(delivery)}
                                  >
                                    Reassign
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* View Delivery Modal */}
      {showViewModal && selectedDelivery && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Delivery Details - Order #{selectedDelivery.orderId}</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={handleCloseModals}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Order ID:</strong> #{selectedDelivery.orderId}
                  </div>
                  <div className="col-md-6">
                    <strong>Status:</strong>{' '}
                    <span className="badge bg-primary">{selectedDelivery.status}</span>
                  </div>
                </div>
                {selectedDelivery.order && (
                  <>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <strong>Customer Name:</strong> {selectedDelivery.order.customerName || 'N/A'}
                      </div>
                      <div className="col-md-6">
                        <strong>Customer Phone:</strong> {selectedDelivery.order.customerPhone || 'N/A'}
                      </div>
                    </div>
                    <div className="row mb-3">
                      <div className="col-12">
                        <strong>Delivery Address:</strong> {selectedDelivery.order.deliveryAddress || 'N/A'}
                      </div>
                    </div>
                  </>
                )}
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Assigned At:</strong>{' '}
                    {selectedDelivery.assignedAt 
                      ? new Date(selectedDelivery.assignedAt).toLocaleString() 
                      : 'N/A'}
                  </div>
                  <div className="col-md-6">
                    <strong>Rider ID:</strong> {selectedDelivery.riderId || 'Not assigned'}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleCloseModals}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Delivery Modal */}
      {showReassignModal && selectedDelivery && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Reassign Delivery - Order #{selectedDelivery.orderId}</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={handleCloseModals}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <p>Select a new rider for this delivery:</p>
                {loadingRiders ? (
                  <div className="text-center py-3">
                    <div className="spinner-border spinner-border-sm" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : availableRiders.length === 0 ? (
                  <div className="alert alert-warning">No online riders available.</div>
                ) : (
                  <div className="list-group">
                    {availableRiders.map((rider) => (
                      <button
                        key={rider.riderId}
                        type="button"
                        className="list-group-item list-group-item-action"
                        onClick={() => handleReassign(rider.riderId)}
                        disabled={reassigning}
                      >
                        <div>
                          <strong>{rider.fullName}</strong>
                          <br />
                          <small className="text-muted">
                            {rider.vehicleType} - {rider.phoneNumber}
                          </small>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {reassigning && (
                  <div className="text-center mt-3">
                    <div className="spinner-border spinner-border-sm" role="status">
                      <span className="visually-hidden">Reassigning...</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleCloseModals}
                  disabled={reassigning}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default DeliveriesPage;
