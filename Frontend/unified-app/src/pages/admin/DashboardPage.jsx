import React, { useState, useEffect } from 'react';
import { deliveryService, riderService } from '../../services/api';
import Navbar from '../../components/Navbar';
import '../../App.css';

const AdminDashboardPage = () => {
  const [stats, setStats] = useState({
    activeDeliveries: 0,
    pendingAssignments: 0,
    onlineRiders: 0,
    todayDeliveries: 0
  });
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [availableRiders, setAvailableRiders] = useState([]);
  const [loadingRiders, setLoadingRiders] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('[AdminDashboard] Loading dashboard data...');
      
      // Use endpoints that include order/availability data
      const [activeDeliveries, allRiders] = await Promise.all([
        deliveryService.getActiveDeliveriesWithOrders().catch(err => {
          console.warn('[AdminDashboard] Failed to get deliveries with orders, falling back:', err);
          return deliveryService.getActiveDeliveries();
        }),
        riderService.getAllRidersWithAvailability().catch(err => {
          console.warn('[AdminDashboard] Failed to get riders with availability, falling back:', err);
          return riderService.getAllRiders();
        })
      ]);
      
      console.log('[AdminDashboard] Loaded deliveries:', activeDeliveries?.length || 0);
      console.log('[AdminDashboard] Loaded riders:', allRiders?.length || 0);
      
      // Handle both DTO format (with order) and regular format
      const deliveries = activeDeliveries || [];
      const riders = allRiders || [];
      
      // Check for online status - handle both camelCase and PascalCase
      const onlineRiders = riders.filter(r => {
        const isOnline = r.isOnline || r.IsOnline || false;
        return isOnline;
      }).length;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayDeliveries = deliveries.filter(d => {
        const assignedAt = d.assignedAt || d.AssignedAt;
        if (!assignedAt) return false;
        const assignedDate = new Date(assignedAt);
        assignedDate.setHours(0, 0, 0, 0);
        return assignedDate.getTime() === today.getTime();
      }).length;
      
      setStats({
        activeDeliveries: deliveries.length,
        pendingAssignments: deliveries.filter(d => {
          const riderId = d.riderId || d.RiderId;
          const status = d.status || d.Status;
          return !riderId || status === 'Pending';
        }).length,
        onlineRiders: onlineRiders,
        todayDeliveries: todayDeliveries
      });
      
      setDeliveries(deliveries.slice(0, 10));
    } catch (error) {
      console.error('[AdminDashboard] Error loading dashboard data:', error);
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

  const handleAssignClick = async (delivery) => {
    try {
      setSelectedDelivery(delivery);
      setLoadingRiders(true);
      const riders = await riderService.getAllRiders();
      setAvailableRiders(riders.filter(r => r.isOnline) || []);
      setShowAssignModal(true);
    } catch (err) {
      console.error('Error loading riders:', err);
      setAvailableRiders([]);
      setShowAssignModal(true);
    } finally {
      setLoadingRiders(false);
    }
  };

  const handleAssign = async (riderId) => {
    if (!selectedDelivery) return;
    
    try {
      setAssigning(true);
      const orderId = selectedDelivery.orderId || selectedDelivery.OrderId;
      console.log('[AdminDashboard] Assigning delivery:', orderId, 'to rider:', riderId);
      
      if (!orderId) {
        alert('Invalid order ID. Cannot assign delivery.');
        return;
      }
      
      const result = await deliveryService.assignDelivery(orderId, riderId);
      console.log('[AdminDashboard] Assignment result:', result);
      
      // Force refresh after a short delay
      await new Promise(resolve => setTimeout(resolve, 500));
      await loadDashboardData();
      
      setShowAssignModal(false);
      setSelectedDelivery(null);
      alert('Delivery assigned successfully!');
    } catch (err) {
      console.error('[AdminDashboard] Error assigning delivery:', err);
      alert(err.message || 'Failed to assign delivery. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  const handleCloseModals = () => {
    setShowViewModal(false);
    setShowAssignModal(false);
    setSelectedDelivery(null);
    setAvailableRiders([]);
  };

  return (
    <>
      <Navbar />
      <div className="container-fluid page-container">
      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card text-white bg-primary stat-card">
            <div className="card-body">
              <h5 className="card-title">Active Deliveries</h5>
              <h2>{stats.activeDeliveries}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-white bg-success stat-card">
            <div className="card-body">
              <h5 className="card-title">Online Riders</h5>
              <h2>{stats.onlineRiders}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-white bg-warning stat-card">
            <div className="card-body">
              <h5 className="card-title">Pending Assignments</h5>
              <h2>{stats.pendingAssignments}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-white bg-info stat-card">
            <div className="card-body">
              <h5 className="card-title">Today's Deliveries</h5>
              <h2>{stats.todayDeliveries}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Deliveries */}
      <div className="row">
        <div className="col-12">
          <h4 className="mb-3">Recent Deliveries</h4>
          <div className="card">
            <div className="card-body">
              {loading && (
                <div className="text-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )}
              {!loading && (
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
                                {!riderId && (
                                  <button 
                                    className="btn btn-sm btn-success"
                                    onClick={() => handleAssignClick(delivery)}
                                  >
                                    Assign
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

      {/* Assign Delivery Modal */}
      {showAssignModal && selectedDelivery && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Assign Delivery - Order #{selectedDelivery.orderId}</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={handleCloseModals}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <p>Select a rider for this delivery:</p>
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
                        onClick={() => handleAssign(rider.riderId)}
                        disabled={assigning}
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
                {assigning && (
                  <div className="text-center mt-3">
                    <div className="spinner-border spinner-border-sm" role="status">
                      <span className="visually-hidden">Assigning...</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleCloseModals}
                  disabled={assigning}
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

export default AdminDashboardPage;
