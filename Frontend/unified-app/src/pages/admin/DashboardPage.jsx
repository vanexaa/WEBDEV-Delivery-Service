import React, { useState, useEffect } from 'react';
import { deliveryService, riderService, orderService } from '../../services/api';
import Navbar from '../../components/AdminNavbar';
import '../../App.css';

const AdminDashboardPage = () => {
  const [stats, setStats] = useState({
    activeDeliveries: 0,
    pendingAssignments: 0,
    onlineRiders: 0,
    todayDeliveries: 0
  });
  const [deliveries, setDeliveries] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]); // New: Unassigned/pending orders
  const [loading, setLoading] = useState(true);
  const [loadingPendingOrders, setLoadingPendingOrders] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null); // New: Selected order for assignment
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAssignOrderModal, setShowAssignOrderModal] = useState(false); // New: Modal for assigning orders
  const [availableRiders, setAvailableRiders] = useState([]);
  const [loadingRiders, setLoadingRiders] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadDashboardData();
    loadPendingOrders();
    
    // Auto-refresh every 10 seconds to catch new orders quickly
    // Orders appear as "Pending" immediately after customer creates them
    const interval = setInterval(() => {
      console.log('[AdminDashboard] Auto-refreshing pending orders (10s interval)...');
      loadDashboardData();
      loadPendingOrders();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('[AdminDashboard] Loading dashboard data...');
      
      // Fetch deliveries and riders in parallel
      const [activeDeliveries, allRiders, allOrders] = await Promise.all([
        deliveryService.getActiveDeliveries().catch(err => {
          console.warn('[AdminDashboard] Failed to get deliveries:', err);
          return [];
        }),
        riderService.getAllRidersWithAvailability().catch(err => {
          console.warn('[AdminDashboard] Failed to get riders with availability, falling back:', err);
          return riderService.getAllRiders();
        }),
        orderService.getAllOrders().catch(err => {
          console.warn('[AdminDashboard] Failed to get orders:', err);
          return [];
        })
      ]);
      
      console.log('[AdminDashboard] Loaded deliveries:', activeDeliveries?.length || 0);
      console.log('[AdminDashboard] Loaded riders:', allRiders?.length || 0);
      console.log('[AdminDashboard] Loaded orders:', allOrders?.length || 0);
      
      // Create order lookup map for quick access
      const orderMap = {};
      (allOrders || []).forEach(o => {
        const orderId = o.orderId || o.OrderId;
        if (orderId) orderMap[orderId] = o;
      });
      
      // Create rider lookup map for quick access
      const riderMap = {};
      (allRiders || []).forEach(r => {
        const riderId = r.riderId || r.RiderId;
        if (riderId) riderMap[riderId] = r;
      });
      
      // Enrich deliveries with order and rider information
      const enrichedDeliveries = (activeDeliveries || []).map(d => {
        const orderId = d.orderId || d.OrderId;
        const riderId = d.riderId || d.RiderId;
        const order = orderMap[orderId] || {};
        const rider = riderMap[riderId] || {};
        
        return {
          ...d,
          order: {
            customerName: order.customerName || order.CustomerName || 'N/A',
            customerPhone: order.customerPhone || order.CustomerPhone || 'N/A',
            deliveryAddress: order.deliveryAddress || order.DeliveryAddress || 'N/A',
            orderTotal: order.orderTotal || order.OrderTotal || 0
          },
          riderName: rider.fullName || rider.FullName || (riderId ? `Rider #${riderId}` : 'Unassigned')
        };
      });
      
      console.log('[AdminDashboard] Enriched deliveries:', enrichedDeliveries.length);
      
      const riders = allRiders || [];
      
      // Check for online status - handle both camelCase and PascalCase
      const onlineRiders = riders.filter(r => {
        const isOnline = r.isOnline || r.IsOnline || false;
        return isOnline;
      }).length;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayDeliveries = enrichedDeliveries.filter(d => {
        const assignedAt = d.assignedAt || d.AssignedAt;
        if (!assignedAt) return false;
        const assignedDate = new Date(assignedAt);
        assignedDate.setHours(0, 0, 0, 0);
        return assignedDate.getTime() === today.getTime();
      }).length;
      
      // Note: pendingAssignments is set by loadPendingOrders() from SQL (single source of truth)
      // We only update the other stats here to avoid overwriting the SQL-based pendingAssignments
      setStats(prev => ({
        ...prev,
        activeDeliveries: enrichedDeliveries.length,
        onlineRiders: onlineRiders,
        todayDeliveries: todayDeliveries
      }));
      
      setDeliveries(enrichedDeliveries.slice(0, 10));
    } catch (error) {
      console.error('[AdminDashboard] Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load pending assignments directly from the SQL backend.
   * This uses the dedicated /api/orders/pending-assignments endpoint which is
   * the SINGLE SOURCE OF TRUTH for pending assignments.
   * 
   * No local filtering is done - data comes directly from SQL.
   */
  const loadPendingOrders = async () => {
    try {
      setLoadingPendingOrders(true);
      console.log('[AdminDashboard] Loading pending assignments from SQL (single source of truth)...');
      
      // Use the dedicated pending-assignments endpoint - NO local filtering!
      const pendingAssignments = await orderService.getPendingAssignments();
      
      console.log('[AdminDashboard] Pending assignments from SQL:', pendingAssignments?.length || 0);
      
      // Log details for debugging
      if (pendingAssignments && pendingAssignments.length > 0) {
        console.log('[AdminDashboard] Pending assignment details:', 
          pendingAssignments.map(p => ({
            orderId: p.orderId || p.OrderId,
            status: p.status || p.Status,
            deliveryId: p.deliveryId || p.DeliveryId,
            pendingReason: p.pendingReason || p.PendingReason
          }))
        );
      }
      
      setPendingOrders(pendingAssignments || []);
      
      // Update the stats.pendingAssignments count to match SQL data
      setStats(prev => ({
        ...prev,
        pendingAssignments: pendingAssignments?.length || 0
      }));
      
    } catch (error) {
      console.error('[AdminDashboard] Error loading pending assignments from SQL:', error);
      setPendingOrders([]);
    } finally {
      setLoadingPendingOrders(false);
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
      
      // Get riders with availability status
      const riders = await riderService.getAllRidersWithAvailability().catch(err => {
        console.warn('[AdminDashboard] Failed to get riders with availability, using fallback:', err);
        return riderService.getAllRiders();
      });
      
      // Filter to only show online riders
      const onlineRiders = (riders || []).filter(r => {
        const isOnline = r.isOnline || r.IsOnline || false;
        return isOnline;
      });
      
      console.log('[AdminDashboard] Found online riders:', onlineRiders.length);
      setAvailableRiders(onlineRiders);
      setShowAssignModal(true);
    } catch (err) {
      console.error('Error loading riders:', err);
      setAvailableRiders([]);
      setShowAssignModal(true);
    } finally {
      setLoadingRiders(false);
    }
  };

  // New: Handle assigning a pending order
  const handleAssignOrderClick = async (order) => {
    try {
      setSelectedOrder(order);
      setLoadingRiders(true);
      console.log('[AdminDashboard] Loading riders for order assignment:', order.orderId || order.OrderId);
      
      // Get riders with availability status
      const riders = await riderService.getAllRidersWithAvailability().catch(err => {
        console.warn('[AdminDashboard] Failed to get riders with availability, using fallback:', err);
        return riderService.getAllRiders();
      });
      
      // Filter to only show online riders
      const onlineRiders = (riders || []).filter(r => {
        const isOnline = r.isOnline || r.IsOnline || false;
        return isOnline;
      });
      
      console.log('[AdminDashboard] Found online riders for order assignment:', onlineRiders.length);
      setAvailableRiders(onlineRiders);
      setShowAssignOrderModal(true);
    } catch (err) {
      console.error('[AdminDashboard] Error loading riders for order assignment:', err);
      setAvailableRiders([]);
      setShowAssignOrderModal(true);
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
      await loadPendingOrders();
      
      setShowAssignModal(false);
      setSelectedDelivery(null);
      alert('Delivery assigned successfully! The rider will see the order in their dashboard.');
    } catch (err) {
      console.error('[AdminDashboard] Error assigning delivery:', err);
      const errorMsg = err.message || err.response?.data?.message || 'Failed to assign delivery. Please try again.';
      alert(errorMsg);
    } finally {
      setAssigning(false);
    }
  };

  // New: Handle assigning a pending order to a rider
  const handleAssignOrder = async (riderId) => {
    if (!selectedOrder) return;
    
    try {
      setAssigning(true);
      const orderId = selectedOrder.orderId || selectedOrder.OrderId;
      console.log('[AdminDashboard] Assigning pending order:', orderId, 'to rider:', riderId);
      
      if (!orderId) {
        alert('Invalid order ID. Cannot assign order.');
        return;
      }
      
      // Use the same assignment endpoint - it will create a delivery if it doesn't exist
      const result = await deliveryService.assignDelivery(orderId, riderId);
      console.log('[AdminDashboard] Order assignment result:', result);
      
      // Force refresh after a short delay to ensure backend has processed
      await new Promise(resolve => setTimeout(resolve, 500));
      await loadDashboardData();
      await loadPendingOrders();
      
      setShowAssignOrderModal(false);
      setSelectedOrder(null);
      alert(`Order #${orderId} assigned successfully to rider! The rider will see the order in their dashboard.`);
    } catch (err) {
      console.error('[AdminDashboard] Error assigning order:', err);
      console.error('[AdminDashboard] Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      // Extract error message from various sources
      let errorMsg = 'Failed to assign order. Please try again.';
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      alert(`Error: ${errorMsg}`);
    } finally {
      setAssigning(false);
    }
  };

  const handleCloseModals = () => {
    setShowViewModal(false);
    setShowAssignModal(false);
    setShowAssignOrderModal(false);
    setSelectedDelivery(null);
    setSelectedOrder(null);
    setAvailableRiders([]);
  };

  return (
    <>
      <Navbar />
      <div className="container-fluid page-container">
      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-6 col-md-3 mb-3">
          <div className="card stat-card stat-primary">
            <div className="card-body">
              <h5 className="card-title">Active Deliveries</h5>
              <h2>{stats.activeDeliveries}</h2>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3 mb-3">
          <div className="card stat-card stat-success">
            <div className="card-body">
              <h5 className="card-title">Online Riders</h5>
              <h2>{stats.onlineRiders}</h2>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3 mb-3">
          <div className="card stat-card stat-warning">
            <div className="card-body">
              <h5 className="card-title">Pending Assignments</h5>
              <h2>{stats.pendingAssignments}</h2>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3 mb-3">
          <div className="card stat-card stat-info">
            <div className="card-body">
              <h5 className="card-title">Today's Deliveries</h5>
              <h2>{stats.todayDeliveries}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Pending/Unassigned Orders - Always visible */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-warning">
            <div className="card-header bg-warning text-dark">
              <h5 className="mb-0">
                <i className="bi bi-exclamation-triangle"></i> Pending Orders ({pendingOrders.length})
                <small className="ms-2">Orders waiting for rider assignment</small>
                <button 
                  className="btn btn-sm btn-outline-dark float-end"
                  onClick={() => loadPendingOrders()}
                  disabled={loadingPendingOrders}
                >
                  <i className="bi bi-arrow-clockwise"></i> Refresh
                </button>
              </h5>
            </div>
            <div className="card-body">
              {loadingPendingOrders ? (
                <div className="text-center py-3">
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : pendingOrders.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-inbox fs-1"></i>
                  <p className="mt-2 mb-0">No pending orders</p>
                  <small>New customer orders will appear here automatically</small>
                </div>
              ) : (
                  <div className="table-responsive">
                    <table className="table table-sm table-hover">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Customer</th>
                          <th>Address</th>
                          <th>Order Date</th>
                          <th>Total</th>
                          <th>Reason</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingOrders.slice(0, 10).map((order) => {
                          const orderId = order.orderId || order.OrderId;
                          const pendingReason = order.pendingReason || order.PendingReason || 'Unassigned';
                          return (
                            <tr key={orderId}>
                              <td><strong>#{orderId}</strong></td>
                              <td>{order.customerName || order.CustomerName || 'N/A'}</td>
                              <td>
                                <small>{order.deliveryAddress || order.DeliveryAddress || 'N/A'}</small>
                              </td>
                              <td>
                                {order.orderDate || order.OrderDate 
                                  ? new Date(order.orderDate || order.OrderDate).toLocaleString() 
                                  : 'N/A'}
                              </td>
                              <td>₱{parseFloat(order.orderTotal || order.OrderTotal || 0).toFixed(2)}</td>
                              <td>
                                <small className="text-muted" title={pendingReason}>
                                  {pendingReason.length > 25 ? pendingReason.substring(0, 25) + '...' : pendingReason}
                                </small>
                              </td>
                              <td>
                                <button 
                                  className="btn btn-sm btn-success"
                                  onClick={() => handleAssignOrderClick(order)}
                                  title="Assign this order to a rider"
                                >
                                  <i className="bi bi-person-plus"></i> Assign
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {pendingOrders.length > 10 && (
                      <div className="text-center mt-2">
                        <small className="text-muted">Showing first 10 of {pendingOrders.length} pending orders</small>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      {/* Recent Deliveries - Shows deliveries that have been assigned to riders */}
      {(() => {
        // Filter deliveries to only show those with riders assigned
        // Shows: Assigned (waiting for rider), Accepted, PickedUp, InTransit, Delivered
        const activeStatuses = ['Assigned', 'Accepted', 'PickedUp', 'InTransit', 'Delivered'];
        const activeDeliveries = deliveries.filter(d => {
          const riderId = d.riderId || d.RiderId;
          const status = d.status || d.Status;
          return riderId && riderId > 0 && activeStatuses.includes(status);
        });
        
        // Only show the section if there are deliveries with riders assigned
        if (activeDeliveries.length === 0 && !loading) {
          return null; // Don't render anything if no assigned deliveries
        }
        
        return (
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
                            <th>Rider</th>
                            <th>Status</th>
                            <th>Assigned At</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeDeliveries.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="text-center text-muted">
                                No deliveries with assigned riders
                              </td>
                            </tr>
                          ) : (
                            activeDeliveries.map((delivery) => {
                              // Handle both DTO format (order property) and regular format
                              const order = delivery.order || delivery.Order || {};
                              const orderId = delivery.orderId || delivery.OrderId;
                              const riderId = delivery.riderId || delivery.RiderId;
                              const status = delivery.status || delivery.Status;
                              const assignedAt = delivery.assignedAt || delivery.AssignedAt;
                              const riderName = delivery.riderName || delivery.RiderName || `Rider #${riderId}`;
                              
                              // Determine badge color based on status
                              const getStatusBadge = (status) => {
                                switch(status) {
                                  case 'Assigned': return 'bg-warning text-dark'; // Waiting for rider to accept
                                  case 'Accepted': return 'bg-info'; // Rider accepted
                                  case 'PickedUp': return 'bg-primary'; // Picked up from restaurant
                                  case 'InTransit': return 'bg-primary'; // On the way
                                  case 'Delivered': return 'bg-success'; // Completed
                                  default: return 'bg-secondary';
                                }
                              };
                              
                              return (
                                <tr key={`${orderId}-${delivery.deliveryId || delivery.DeliveryId}`}>
                                  <td>#{orderId}</td>
                                  <td>{order.customerName || order.CustomerName || 'N/A'}</td>
                                  <td>{riderName}</td>
                                  <td>
                                    <span className={`badge ${getStatusBadge(status)}`}>{status}</span>
                                  </td>
                                  <td>{assignedAt ? new Date(assignedAt).toLocaleString() : 'N/A'}</td>
                                  <td>
                                    <button 
                                      className="btn btn-sm btn-primary me-2"
                                      onClick={() => handleViewDelivery(delivery)}
                                    >
                                      View
                                    </button>
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
        );
      })()}

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

      {/* Assign Order Modal (for pending/unassigned orders) */}
      {showAssignOrderModal && selectedOrder && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">
                  <i className="bi bi-person-plus"></i> Assign Order #{selectedOrder.orderId || selectedOrder.OrderId}
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={handleCloseModals}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                {/* Order Details */}
                <div className="card mb-3">
                  <div className="card-body">
                    <h6 className="card-title">Order Details</h6>
                    <div className="row">
                      <div className="col-md-6">
                        <strong>Customer:</strong> {selectedOrder.customerName || selectedOrder.CustomerName || 'N/A'}
                      </div>
                      <div className="col-md-6">
                        <strong>Phone:</strong> {selectedOrder.customerPhone || selectedOrder.CustomerPhone || 'N/A'}
                      </div>
                    </div>
                    <div className="row mt-2">
                      <div className="col-12">
                        <strong>Address:</strong> {selectedOrder.deliveryAddress || selectedOrder.DeliveryAddress || 'N/A'}
                      </div>
                    </div>
                    <div className="row mt-2">
                      <div className="col-md-6">
                        <strong>Total:</strong> ₱{parseFloat(selectedOrder.orderTotal || selectedOrder.OrderTotal || 0).toFixed(2)}
                      </div>
                      <div className="col-md-6">
                        <strong>Status:</strong> <span className="badge bg-warning">{selectedOrder.status || selectedOrder.Status || 'Pending'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rider Selection */}
                <div>
                  <h6>Select an Online Rider:</h6>
                  {loadingRiders ? (
                    <div className="text-center py-3">
                      <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Loading riders...</span>
                      </div>
                    </div>
                  ) : availableRiders.length === 0 ? (
                    <div className="alert alert-warning">
                      <i className="bi bi-exclamation-triangle"></i> No online riders available. 
                      Please wait for a rider to come online, or the system will auto-assign when a rider becomes available.
                    </div>
                  ) : (
                    <div className="list-group">
                      {availableRiders.map((rider) => {
                        const riderId = rider.riderId || rider.RiderId;
                        const fullName = rider.fullName || rider.FullName || 'Unknown';
                        const vehicleType = rider.vehicleType || rider.VehicleType || 'N/A';
                        const phoneNumber = rider.phoneNumber || rider.PhoneNumber || 'N/A';
                        const isOnline = rider.isOnline || rider.IsOnline || false;
                        
                        return (
                          <button
                            key={riderId}
                            type="button"
                            className="list-group-item list-group-item-action"
                            onClick={() => handleAssignOrder(riderId)}
                            disabled={assigning || !isOnline}
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <strong>{fullName}</strong>
                                <br />
                                <small className="text-muted">
                                  <i className="bi bi-bicycle"></i> {vehicleType} | 
                                  <i className="bi bi-telephone ms-2"></i> {phoneNumber}
                                </small>
                              </div>
                              <div>
                                {isOnline && (
                                  <span className="badge bg-success">
                                    <i className="bi bi-circle-fill"></i> Online
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {assigning && (
                  <div className="text-center mt-3">
                    <div className="spinner-border spinner-border-sm text-success" role="status">
                      <span className="visually-hidden">Assigning order...</span>
                    </div>
                    <p className="mt-2 text-muted">Assigning order to rider...</p>
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
