import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { deliveryService, riderService, orderService } from '../../services/api';
import RiderNavbar from '../../components/RiderNavbar';
import AvailabilityToggle from '../../components/AvailabilityToggle';
import safeStorage from '../../utils/storage';
import '../../App.css';

const DashboardPage = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [newOrderNotification, setNewOrderNotification] = useState(null);
  const { user, riderProfile, riderId: contextRiderId } = useAuth();
  // Try multiple sources for riderId in priority order
  const riderId = contextRiderId || riderProfile?.riderId || user?.riderId || user?.RiderId || 
                  parseInt(safeStorage.getItem('riderId') || '0', 10);
  const navigate = useNavigate();
  const refreshIntervalRef = useRef(null);
  const isMountedRef = useRef(true);

  // Memoize loadActiveOrders to prevent stale closures
  const loadActiveOrders = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      setLoading(true);
      console.log('[DashboardPage] Loading orders - riderId:', riderId, 'user:', user, 'riderProfile:', riderProfile, 'contextRiderId:', contextRiderId);
      
      if (!riderId || riderId === 0 || isNaN(riderId)) {
        const errorMsg = 'Rider ID not available. Please log out and log back in, or ensure your rider profile is set up.';
        console.warn('[DashboardPage] RiderId not available, cannot load orders. Sources:', {
          contextRiderId,
          riderProfileRiderId: riderProfile?.riderId,
          userRiderId: user?.riderId,
          localStorageRiderId: safeStorage.getItem('riderId')
        });
        setOrders([]);
        setError(errorMsg);
        setLoading(false);
        return;
      }

      // Use the rider-specific orders endpoint to get assigned orders
      try {
        console.log('[DashboardPage] Fetching orders for riderId:', riderId, 'Type:', typeof riderId);
        const riderOrders = await riderService.getRiderOrders(riderId);
        console.log('[DashboardPage] Rider orders API response:', riderOrders);
        console.log('[DashboardPage] Rider orders count:', riderOrders?.length || 0);
        
        if (riderOrders && Array.isArray(riderOrders) && riderOrders.length > 0) {
          // Map RiderOrderDto to the format expected by the UI
          const mappedOrders = riderOrders.map(order => {
            const orderId = order.orderId || order.OrderId;
            const status = order.status || order.Status || 'Assigned';
            
            console.log('[DashboardPage] Mapping order:', {
              orderId,
              status,
              customerName: order.customerName,
              deliveryId: order.deliveryId
            });
            
            return {
              transactionCode: `ORD-${orderId}`,
              riderId: riderId,
              status: status,
              order: {
                customerName: order.customerName || 'N/A',
                deliveryAddress: order.deliveryAddress || 'N/A',
                customerPhone: order.customerPhone || 'N/A'
              },
              deliveryId: order.deliveryId,
              orderId: orderId,
              assignedAt: order.assignedAt || order.AssignedAt
            };
          });
          
          console.log('[DashboardPage] Mapped orders:', mappedOrders);
          console.log('[DashboardPage] Orders with "Assigned" status:', 
            mappedOrders.filter(o => o.status === 'Assigned').length);
          
          // Check for new orders (notifications)
          if (isMountedRef.current) {
            const previousCount = lastOrderCount;
            const newCount = mappedOrders.length;
            
            if (newCount > previousCount && previousCount > 0) {
              const newOrders = mappedOrders.filter(o => 
                o.status === 'Assigned' || o.status === 'assigned'
              ).length;
              if (newOrders > 0) {
                setNewOrderNotification({
                  message: `🎉 ${newOrders} new order${newOrders > 1 ? 's' : ''} assigned to you!`,
                  type: 'success'
                });
                // Clear notification after 5 seconds
                setTimeout(() => setNewOrderNotification(null), 5000);
              }
            }
            
            setOrders(mappedOrders);
            setLastOrderCount(newCount);
            console.log('[DashboardPage] Orders state updated. Total:', mappedOrders.length);
          }
        } else {
          console.warn('[DashboardPage] ⚠️ No orders returned from rider orders API. Possible reasons:');
          console.warn('  1. Order exists but is not assigned to a rider (no delivery record)');
          console.warn('  2. Delivery exists but status is not "Assigned/Accepted/PickedUp/InTransit"');
          console.warn('  3. Delivery exists but RiderId does not match');
          console.warn('  4. Order is still "Pending" and background service has not assigned it yet');
          console.log('[DashboardPage] Trying fallback method...');
          
          // Fallback: get all active deliveries and filter by riderId
          try {
            const deliveries = await deliveryService.getActiveDeliveries();
            console.log('[DashboardPage] All active deliveries:', deliveries);
            console.log('[DashboardPage] Filtering by riderId:', riderId, 'Type:', typeof riderId);
            
            // Filter by riderId - handle both string and number comparison
            const filteredDeliveries = deliveries.filter((d) => {
              const dRiderId = d.riderId || d.RiderId;
              const matches = dRiderId != null && 
                     (dRiderId === riderId || 
                      parseInt(dRiderId) === parseInt(riderId) ||
                      dRiderId.toString() === riderId.toString());
              
              if (matches) {
                console.log('[DashboardPage] Found matching delivery:', {
                  deliveryId: d.deliveryId,
                  orderId: d.orderId,
                  riderId: dRiderId,
                  status: d.status
                });
              }
              
              return matches;
            });
            
            console.log('[DashboardPage] Filtered deliveries for rider:', filteredDeliveries.length);
            
            if (isMountedRef.current && filteredDeliveries.length > 0) {
              setOrders(filteredDeliveries);
              setLastOrderCount(filteredDeliveries.length);
              console.log('[DashboardPage] Orders set from fallback method');
            } else if (isMountedRef.current) {
              setOrders([]);
              setLastOrderCount(0);
              console.log('[DashboardPage] No orders found via fallback method either');
            }
          } catch (fallbackError) {
            console.error('[DashboardPage] Fallback method also failed:', fallbackError);
            if (isMountedRef.current) {
              setOrders([]);
            }
          }
        }
      } catch (riderOrdersError) {
        // Fallback to filtering active deliveries
        console.error('[DashboardPage] Rider orders endpoint failed:', riderOrdersError);
        console.warn('[DashboardPage] Using fallback method to get deliveries');
        
        try {
          const deliveries = await deliveryService.getActiveDeliveries();
          console.log('[DashboardPage] All deliveries (fallback):', deliveries);
          
          // Filter by riderId - handle both string and number comparison
          const filteredDeliveries = deliveries.filter((d) => {
            const dRiderId = d.riderId || d.RiderId;
            return dRiderId != null && 
                   (dRiderId === riderId || 
                    parseInt(dRiderId) === parseInt(riderId) ||
                    dRiderId.toString() === riderId.toString());
          });
          
          console.log('[DashboardPage] Filtered orders for rider (fallback):', filteredDeliveries.length);
          if (isMountedRef.current) {
            setOrders(filteredDeliveries.length > 0 ? filteredDeliveries : []);
            setLastOrderCount(filteredDeliveries.length);
          }
        } catch (fallbackError) {
          console.error('[DashboardPage] Fallback method failed:', fallbackError);
          if (isMountedRef.current) {
            setOrders([]);
            setError('Failed to load orders. Please check your connection and try again.');
          }
        }
      }
      
      if (isMountedRef.current) {
        setError('');
      }
    } catch (err) {
      console.error('[DashboardPage] Error loading orders:', err);
      if (isMountedRef.current) {
        setError('Failed to load orders. Please try again.');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [riderId]);

  // Log riderId changes for debugging
  useEffect(() => {
    console.log('[DashboardPage] RiderId changed:', {
      riderId,
      contextRiderId,
      riderProfileRiderId: riderProfile?.riderId,
      userRiderId: user?.riderId,
      localStorageRiderId: safeStorage.getItem('riderId')
    });
  }, [riderId, contextRiderId, riderProfile?.riderId, user?.riderId]);

  // Function to update rider location
  const updateRiderLocation = useCallback(async () => {
    if (!riderId || riderId === 0 || isNaN(riderId)) return;
    
    try {
      // Check if rider is online
      const availability = await riderService.getRiderAvailability(riderId);
      const isOnline = availability?.isOnline || availability?.IsOnline || false;
      
      if (!isOnline) {
        console.log('[DashboardPage] Rider is offline, skipping location update');
        return;
      }
      
      // Get current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            console.log('[DashboardPage] Updating rider location:', { latitude, longitude });
            
            try {
              await riderService.updateAvailability(riderId, true, latitude, longitude);
              console.log('[DashboardPage] Rider location updated successfully');
            } catch (error) {
              console.warn('[DashboardPage] Failed to update rider location:', error);
            }
          },
          (error) => {
            console.warn('[DashboardPage] Geolocation error:', error);
          },
          {
            enableHighAccuracy: true, // Use GPS for high accuracy
            timeout: 10000, // Allow up to 10 seconds for GPS to get accurate fix
            maximumAge: 0 // Never use cached location - always get fresh GPS data
          }
        );
      }
    } catch (error) {
      console.warn('[DashboardPage] Error checking availability for location update:', error);
    }
  }, [riderId]);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Only start polling if riderId is available
    if (riderId && riderId > 0) {
      // Initial load
      console.log('[DashboardPage] Starting order polling for riderId:', riderId);
      loadActiveOrders();
      
      // Update location immediately when dashboard loads (if rider is online)
      updateRiderLocation();
      
      // Refresh orders every 10 seconds for faster real-time updates
      // This ensures riders see new assignments within 10 seconds
      refreshIntervalRef.current = setInterval(() => {
        console.log('[DashboardPage] Auto-refreshing orders (10s interval) for riderId:', riderId);
        loadActiveOrders();
      }, 10000);
      
      // Update location every 10 seconds if rider is online (for accurate real-time tracking)
      const locationUpdateInterval = setInterval(() => {
        updateRiderLocation();
      }, 10000); // Update location every 10 seconds for better accuracy
      
      return () => {
        isMountedRef.current = false;
        if (refreshIntervalRef.current) {
          console.log('[DashboardPage] Clearing refresh interval');
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
        if (locationUpdateInterval) {
          clearInterval(locationUpdateInterval);
        }
      };
    } else {
      console.warn('[DashboardPage] Cannot start polling - riderId not available:', riderId);
      setLoading(false);
    }
    
    return () => {
      isMountedRef.current = false;
      if (refreshIntervalRef.current) {
        console.log('[DashboardPage] Clearing refresh interval');
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [loadActiveOrders, riderId, updateRiderLocation]);

  useEffect(() => {
    // Apply search filter whenever orders or searchQuery changes
    if (searchQuery.trim() === '') {
      setFilteredOrders(orders);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = orders.filter((order) => {
        const transactionCode = order.transactionCode?.toLowerCase() || '';
        const customerName = order.order?.customerName?.toLowerCase() || '';
        const address = order.order?.deliveryAddress?.toLowerCase() || '';
        const status = order.status?.toLowerCase() || '';
        
        return (
          transactionCode.includes(query) ||
          customerName.includes(query) ||
          address.includes(query) ||
          status.includes(query)
        );
      });
      setFilteredOrders(filtered);
    }
  }, [orders, searchQuery]);

  const handleOrderClick = (transactionCode) => {
    navigate(`/rider/orders/${transactionCode}`);
  };

  // Helper function to get current location
  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn('[DashboardPage] Geolocation not supported');
        resolve({ latitude: 14.5995, longitude: 120.9842 }); // Default location
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          resolve({ latitude, longitude });
        },
        (error) => {
          console.warn('[DashboardPage] Geolocation error:', error);
          resolve({ latitude: 14.5995, longitude: 120.9842 }); // Default location
        },
        {
          enableHighAccuracy: true, // Use GPS for high accuracy
          timeout: 10000, // Allow up to 10 seconds for GPS to get accurate fix
          maximumAge: 0 // Never use cached location - always get fresh GPS data
        }
      );
    });
  }, []);

  const handleAcceptOrder = async (orderId) => {
    if (!riderId) {
      alert('Rider ID not available. Please log out and log back in.');
      console.error('[DashboardPage] handleAcceptOrder: riderId is not available');
      return;
    }

    if (!orderId || orderId <= 0) {
      alert('Invalid order ID. Please refresh the page and try again.');
      console.error('[DashboardPage] handleAcceptOrder: invalid orderId:', orderId);
      return;
    }

    if (!confirm('Are you sure you want to accept this order?')) {
      return;
    }

    try {
      console.log('[DashboardPage] Accepting order - OrderId:', orderId, 'RiderId:', riderId);
      
      // Update location when accepting order
      try {
        const location = await getCurrentLocation();
        console.log('[DashboardPage] Updating location when accepting order:', location);
        await riderService.updateAvailability(riderId, true, location.latitude, location.longitude);
        console.log('[DashboardPage] Location updated successfully');
      } catch (locationError) {
        console.warn('[DashboardPage] Failed to update location when accepting order:', locationError);
        // Continue even if location update fails
      }
      
      const result = await deliveryService.acceptDelivery(orderId, riderId);
      console.log('[DashboardPage] Accept delivery API response:', result);
      alert('Order accepted successfully! Status updated to "In Progress".');
      
      // Refresh orders after acceptance (with small delay to ensure backend has updated)
      setTimeout(async () => {
        await loadActiveOrders();
      }, 1000);
    } catch (err) {
      console.error('[DashboardPage] Error accepting order:', err);
      const errorMessage = err.message || err.response?.data?.message || 'Failed to accept order. Please try again.';
      alert(errorMessage);
    }
  };

  const handleRejectOrder = async (orderId) => {
    if (!riderId) {
      alert('Rider ID not available. Please log out and log back in.');
      console.error('[DashboardPage] handleRejectOrder: riderId is not available');
      return;
    }

    if (!orderId || orderId <= 0) {
      alert('Invalid order ID. Please refresh the page and try again.');
      console.error('[DashboardPage] handleRejectOrder: invalid orderId:', orderId);
      return;
    }

    if (!confirm('Are you sure you want to reject this order? It will be reassigned to another rider.')) {
      return;
    }

    try {
      console.log('[DashboardPage] Rejecting order - OrderId:', orderId, 'RiderId:', riderId);
      const result = await deliveryService.rejectDelivery(orderId, riderId);
      console.log('[DashboardPage] Reject delivery API response:', result);
      alert('Order rejected. It will be reassigned to another available rider.');
      
      // Refresh orders after rejection (order should disappear from this rider's list)
      setTimeout(async () => {
        await loadActiveOrders();
      }, 1000);
    } catch (err) {
      console.error('[DashboardPage] Error rejecting order:', err);
      const errorMessage = err.message || err.response?.data?.message || 'Failed to reject order. Please try again.';
      alert(errorMessage);
    }
  };

  // Refresh orders when component becomes visible again (e.g., returning from order details)
  useEffect(() => {
    const handleFocus = () => {
      console.log('[DashboardPage] Window focused, refreshing orders...');
      loadActiveOrders();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadActiveOrders]);

  return (
    <>
      <RiderNavbar />
      <div className="container-fluid page-container">
        <div className="row mb-4">
          <div className="col-12">
            <AvailabilityToggle />
          </div>
        </div>
        
        <div className="row mb-3">
          <div className="col-12 d-flex justify-content-between align-items-center">
            <div>
              <h4 className="mb-0">My Orders</h4>
              {riderId && (
                <small className="text-muted">Rider ID: {riderId} | Auto-refresh: Every 15s</small>
              )}
            </div>
            <div className="d-flex gap-2">
              {orders.length > 0 && (
                <button
                  className="btn btn-info btn-sm"
                  onClick={() => navigate('/rider/details')}
                  title="View rider details and assigned orders"
                >
                  <i className="bi bi-person-badge"></i> My Details
                </button>
              )}
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  console.log('[DashboardPage] Manual refresh triggered');
                  loadActiveOrders();
                }}
                disabled={loading}
                title="Refresh orders list"
              >
                <i className="bi bi-arrow-clockwise"></i> {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* New Order Notification */}
        {newOrderNotification && (
          <div className={`alert alert-${newOrderNotification.type} alert-dismissible fade show`} role="alert">
            <strong>{newOrderNotification.message}</strong>
            <button
              type="button"
              className="btn-close"
              onClick={() => setNewOrderNotification(null)}
              aria-label="Close"
            ></button>
          </div>
        )}

        {/* Order Statistics */}
        {!loading && orders.length > 0 && (
          <div className="row mb-3">
            <div className="col-12">
              <div className="card border-primary">
                <div className="card-body py-2">
                  <div className="d-flex justify-content-around text-center">
                    <div>
                      <strong className="d-block text-warning fs-5">
                        {orders.filter(o => o.status === 'Assigned' || o.status === 'assigned').length}
                      </strong>
                      <small className="text-muted">⚠️ Pending Action</small>
                    </div>
                    <div>
                      <strong className="d-block text-primary fs-5">
                        {orders.filter(o => o.status !== 'Assigned' && o.status !== 'assigned').length}
                      </strong>
                      <small className="text-muted">Active</small>
                    </div>
                    <div>
                      <strong className="d-block text-success fs-5">{orders.length}</strong>
                      <small className="text-muted">Total Orders</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        {!loading && !error && orders.length > 0 && (
          <div className="row mb-3">
            <div className="col-12">
              <div className="card">
                <div className="card-body">
                  <label className="form-label">Search</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by transaction code, customer name, address, or status..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="row">
          <div className="col-12">
            {loading && (
              <div className="text-center py-5">
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
            {!loading && !error && orders.length === 0 && (
              <div className="alert alert-info" role="alert">
                <i className="bi bi-info-circle"></i> <strong>No orders assigned</strong>
                <br />
                <small className="mt-2 d-block">
                  <strong>To receive orders:</strong>
                  <ul className="mt-2 mb-0" style={{ textAlign: 'left' }}>
                    <li>Make sure you're online (use the toggle above)</li>
                    <li>New orders are automatically assigned to online riders</li>
                    <li>Orders will appear here within 10-30 seconds of assignment</li>
                    <li>The system checks for new assignments every 30 seconds</li>
                  </ul>
                  <div className="mt-2">
                    <strong>Rider ID:</strong> {riderId ? riderId : 'Not available - Please refresh or re-login'}
                  </div>
                  <div className="mt-2">
                    <strong>Refresh Interval:</strong> Every 10 seconds
                  </div>
                </small>
              </div>
            )}
            {!loading && !error && orders.length > 0 && filteredOrders.length === 0 && (
              <div className="alert alert-info" role="alert">
                No orders found matching your search.
              </div>
            )}
            {!loading && !error && filteredOrders.length > 0 && (
              <div className="row">
                {filteredOrders.map((order) => (
                  <div key={order.transactionCode || `order-${order.orderId}`} className="col-md-6 col-lg-4 mb-3">
                    <div 
                      className={`card h-100 shadow-sm ${order.status === 'Assigned' ? 'border-warning border-2' : ''}`}
                      style={{ cursor: order.status === 'Assigned' ? 'default' : 'pointer' }}
                      onClick={order.status !== 'Assigned' ? () => handleOrderClick(order.transactionCode) : undefined}
                    >
                      <div className="card-body">
                        <h5 className="card-title">
                          {order.transactionCode}
                        </h5>
                        <p className="card-text">
                          <strong>Status:</strong> 
                          <span className={`badge bg-${
                            (order.status === 'Delivered' || order.status === 'delivered') ? 'success' : 
                            (order.status === 'Failed' || order.status === 'failed') ? 'danger' : 
                            (order.status === 'Assigned' || order.status === 'assigned') ? 'warning' : 
                            'primary'
                          } ms-2`}>
                            {(order.status === 'Assigned' || order.status === 'assigned') && '⚠️ '}
                            {order.status || 'Unknown'}
                          </span>
                          {(order.status === 'Assigned' || order.status === 'assigned') && (
                            <small className="d-block text-warning mt-1">
                              <i className="bi bi-exclamation-triangle"></i> Action required - Accept or Reject
                            </small>
                          )}
                        </p>
                        {order.order && (
                          <>
                            <p className="card-text">
                              <strong>Customer:</strong> {order.order.customerName || 'N/A'}
                            </p>
                            <p className="card-text">
                              <strong>Address:</strong> {order.order.deliveryAddress || 'N/A'}
                            </p>
                          </>
                        )}
                        {(order.status === 'Assigned' || order.status === 'assigned') && (
                          <div className="d-grid gap-2 mt-3">
                            <button
                              className="btn btn-success btn-sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const orderId = order.orderId || order.id || parseInt(order.transactionCode?.replace('ORD-', '') || '0');
                                console.log('[DashboardPage] Accept button clicked for order:', {
                                  order,
                                  extractedOrderId: orderId
                                });
                                if (orderId && orderId > 0) {
                                  handleAcceptOrder(orderId);
                                } else {
                                  alert('Unable to determine order ID. Please refresh and try again.');
                                  console.error('[DashboardPage] Invalid orderId extracted:', orderId);
                                }
                              }}
                              title="Accept this order"
                            >
                              <i className="bi bi-check-circle"></i> Accept Order
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const orderId = order.orderId || order.id || parseInt(order.transactionCode?.replace('ORD-', '') || '0');
                                console.log('[DashboardPage] Reject button clicked for order:', {
                                  order,
                                  extractedOrderId: orderId
                                });
                                if (orderId && orderId > 0) {
                                  handleRejectOrder(orderId);
                                } else {
                                  alert('Unable to determine order ID. Please refresh and try again.');
                                  console.error('[DashboardPage] Invalid orderId extracted:', orderId);
                                }
                              }}
                              title="Reject this order (will be reassigned to another rider)"
                            >
                              <i className="bi bi-x-circle"></i> Reject Order
                            </button>
                          </div>
                        )}
                        {(order.status !== 'Assigned' && order.status !== 'assigned') && (
                          <button className="btn btn-primary btn-sm w-100 mt-2">
                            View Details
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
