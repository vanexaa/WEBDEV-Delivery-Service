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
      const [activeDeliveries, allRiders] = await Promise.all([
        deliveryService.getActiveDeliveries(),
        riderService.getAllRiders()
      ]);
      
      const onlineRiders = allRiders.filter(r => r.isOnline).length;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayDeliveries = activeDeliveries.filter(d => {
        const assignedDate = new Date(d.assignedAt);
        assignedDate.setHours(0, 0, 0, 0);
        return assignedDate.getTime() === today.getTime();
      }).length;
      
      setStats({
        activeDeliveries: activeDeliveries.length,
        pendingAssignments: activeDeliveries.filter(d => !d.riderId || d.status === 'Pending').length,
        onlineRiders: onlineRiders,
        todayDeliveries: todayDeliveries
      });
      
      setDeliveries(activeDeliveries.slice(0, 10));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
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
      await deliveryService.assignDelivery(selectedDelivery.orderId, riderId);
      await loadDashboardData();
      setShowAssignModal(false);
      setSelectedDelivery(null);
    } catch (err) {
      console.error('Error assigning delivery:', err);
      alert('Failed to assign delivery. Please try again.');
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
                          const order = delivery.order || {};
                          return (
                            <tr key={delivery.orderId}>
                              <td>#{delivery.orderId}</td>
                              <td>{order.customerName || 'N/A'}</td>
                              <td>
                                <span className="badge bg-primary">{delivery.status}</span>
                              </td>
                              <td>{new Date(delivery.assignedAt).toLocaleString()}</td>
                              <td>
                                <button 
                                  className="btn btn-sm btn-primary me-2"
                                  onClick={() => handleViewDelivery(delivery)}
                                >
                                  View
                                </button>
                                {!delivery.riderId && (
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
