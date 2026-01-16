import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { deliveryService, riderService } from '../../services/api';
import RiderNavbar from '../../components/RiderNavbar';
import AvailabilityToggle from '../../components/AvailabilityToggle';
import '../../App.css';

const DashboardPage = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { riderId, user } = useAuth();
  const navigate = useNavigate();
  const refreshIntervalRef = useRef(null);
  const isMountedRef = useRef(true);

  // Memoize loadActiveOrders to prevent stale closures
  const loadActiveOrders = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      setLoading(true);
      console.log('[DashboardPage] Loading orders for riderId:', riderId);
      
      if (!riderId) {
        console.warn('[DashboardPage] RiderId not available, cannot load orders');
        setOrders([]);
        setError('');
        return;
      }

      // Use the rider-specific orders endpoint if available
      // Otherwise, fall back to filtering active deliveries
      try {
        const riderOrders = await riderService.getRiderOrders(riderId);
        console.log('[DashboardPage] Rider orders response:', riderOrders);
        
        if (riderOrders && riderOrders.length > 0) {
          // Map RiderOrderDto to the format expected by the UI
          const mappedOrders = riderOrders.map(order => ({
            transactionCode: `ORD-${order.orderId}`,
            riderId: riderId,
            status: order.status,
            order: {
              customerName: order.customerName,
              deliveryAddress: order.deliveryAddress,
              customerPhone: order.customerPhone
            },
            deliveryId: order.deliveryId,
            orderId: order.orderId,
            assignedAt: order.assignedAt
          }));
          
          if (isMountedRef.current) {
            setOrders(mappedOrders);
            console.log('[DashboardPage] Orders updated:', mappedOrders.length);
          }
        } else {
          // Fallback: get all active deliveries and filter by riderId
          const deliveries = await deliveryService.getActiveDeliveries();
          console.log('[DashboardPage] All deliveries:', deliveries);
          console.log('[DashboardPage] Filtering by riderId:', riderId, 'Type:', typeof riderId);
          
          // Filter by riderId - handle both string and number comparison
          const filteredDeliveries = deliveries.filter((d) => {
            const dRiderId = d.riderId || d.RiderId;
            return dRiderId != null && 
                   (dRiderId === riderId || 
                    parseInt(dRiderId) === parseInt(riderId) ||
                    dRiderId.toString() === riderId.toString());
          });
          
          console.log('[DashboardPage] Filtered orders for rider:', filteredDeliveries);
          if (isMountedRef.current) {
            setOrders(filteredDeliveries);
          }
        }
      } catch (riderOrdersError) {
        // Fallback to filtering active deliveries
        console.warn('[DashboardPage] Rider orders endpoint failed, using fallback:', riderOrdersError);
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
        
        console.log('[DashboardPage] Filtered orders for rider (fallback):', filteredDeliveries);
        if (isMountedRef.current) {
          setOrders(filteredDeliveries);
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

  useEffect(() => {
    isMountedRef.current = true;
    
    // Initial load
    loadActiveOrders();
    
    // Refresh orders every 30 seconds
    refreshIntervalRef.current = setInterval(() => {
      console.log('[DashboardPage] Auto-refreshing orders...');
      loadActiveOrders();
    }, 30000);
    
    return () => {
      isMountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [loadActiveOrders]);

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
            <h4 className="mb-0">Assigned Orders</h4>
            <button
              className="btn btn-primary btn-sm"
              onClick={loadActiveOrders}
              disabled={loading}
            >
              <i className="bi bi-arrow-clockwise"></i> Refresh
            </button>
          </div>
        </div>

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
                <i className="bi bi-info-circle"></i> No active orders assigned to you at the moment.
                Make sure you're online to receive new orders.
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
                  <div key={order.transactionCode} className="col-md-6 col-lg-4 mb-3">
                    <div 
                      className="card h-100 shadow-sm cursor-pointer"
                      onClick={() => handleOrderClick(order.transactionCode)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="card-body">
                        <h5 className="card-title">
                          {order.transactionCode}
                        </h5>
                        <p className="card-text">
                          <strong>Status:</strong> 
                          <span className={`badge bg-${order.status === 'Delivered' ? 'success' : order.status === 'Failed' ? 'danger' : 'primary'} ms-2`}>
                            {order.status}
                          </span>
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
                        <button className="btn btn-primary btn-sm w-100 mt-2">
                          View Details
                        </button>
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
