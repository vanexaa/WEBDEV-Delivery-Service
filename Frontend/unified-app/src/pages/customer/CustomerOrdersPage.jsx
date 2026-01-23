import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService, deliveryService, customerService } from '../../services/api';
import { useAuth } from '../../utils/AuthContext';
import CustomerNavbar from '../../components/CustomerNavbar';
import '../../App.css';

const CustomerOrdersPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [customerId, setCustomerId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Get customerId from userId
    fetchCustomerId();
  }, [user]);

  useEffect(() => {
    if (customerId) {
      loadOrders();
    }
  }, [customerId]);

  const fetchCustomerId = async () => {
    try {
      const userId = user?.userId || user?.UserId;
      console.log('[CustomerOrdersPage] UserId from auth:', userId);
      
      if (!userId) {
        setError('User ID not available. Please log in again.');
        setLoading(false);
        return;
      }

      // Since we can't modify the backend, we'll try multiple approaches:
      // 1. Use userId as customerId (common pattern where they match)
      // 2. If that fails, try fetching all orders and filtering client-side
      
      // First attempt: Use userId as customerId
      console.log('[CustomerOrdersPage] Attempting to use userId as customerId:', userId);
      setCustomerId(userId);
      
      // We'll test if this works in loadOrders()
    } catch (err) {
      console.error('[CustomerOrdersPage] Error fetching customerId:', err);
      setError('Failed to identify customer. Please log in again.');
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    if (!customerId) {
      console.warn('[CustomerOrdersPage] No customerId available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('[CustomerOrdersPage] Loading orders for customerId:', customerId);
      
      // Try fetching orders by customerId
      let response;
      let usedFallback = false;
      
      try {
        response = await orderService.getOrdersByCustomerId(customerId);
        console.log('[CustomerOrdersPage] Orders fetched by customerId:', response?.length || 0);
        
        // If we got empty results and customerId might not be correct, try fallback
        const ordersList = Array.isArray(response) ? response : [];
        if (ordersList.length === 0) {
          console.log('[CustomerOrdersPage] No orders found with customerId, trying fallback method...');
          usedFallback = true;
          throw new Error('No orders found with customerId');
        }
      } catch (fetchErr) {
        // Fallback: If fetching by customerId fails or returns empty, 
        // try fetching all orders and filter client-side by username/email
        console.warn('[CustomerOrdersPage] Primary method failed, using fallback:', fetchErr.message);
        usedFallback = true;
        
        try {
          const allOrders = await orderService.getAllOrders();
          console.log('[CustomerOrdersPage] Fetched all orders for filtering:', allOrders?.length || 0);
          
          // Filter orders client-side - try multiple matching strategies
          const userId = user?.userId || user?.UserId;
          const username = user?.username || user?.Username;
          const email = user?.email || user?.Email;
          
          console.log('[CustomerOrdersPage] Filtering orders by:');
          console.log('  - CustomerId:', customerId);
          console.log('  - UserId:', userId);
          console.log('  - Username:', username);
          console.log('  - Email:', email);
          
          const filteredOrders = Array.isArray(allOrders) ? allOrders.filter(order => {
            const orderCustomerId = order.customerId || order.CustomerId;
            const orderCustomerName = (order.customerName || order.CustomerName || '').toLowerCase();
            const orderEmail = (order.email || order.Email || '').toLowerCase();
            
            // Match by customerId (primary method)
            if (orderCustomerId === customerId || orderCustomerId === userId) {
              console.log('[CustomerOrdersPage] Matched order', order.orderId || order.OrderId, 'by CustomerId');
              return true;
            }
            
            // Match by username (if username matches customer name)
            if (username) {
              const usernameLower = username.toLowerCase();
              if (orderCustomerName.includes(usernameLower) || orderCustomerName === usernameLower) {
                console.log('[CustomerOrdersPage] Matched order', order.orderId || order.OrderId, 'by Username/Name');
                return true;
              }
            }
            
            // Match by email (if email matches)
            if (email) {
              const emailLower = email.toLowerCase();
              if (orderEmail && orderEmail.includes(emailLower)) {
                console.log('[CustomerOrdersPage] Matched order', order.orderId || order.OrderId, 'by Email');
                return true;
              }
            }
            
            return false;
          }) : [];
          
          console.log('[CustomerOrdersPage] Filtered orders using fallback:', filteredOrders.length);
          response = filteredOrders;
        } catch (allOrdersErr) {
          console.error('[CustomerOrdersPage] Fallback also failed:', allOrdersErr);
          throw fetchErr; // Throw original error
        }
      }
      
      // Handle both array and object responses
      const ordersList = Array.isArray(response) ? response : (response.orders || []);
      
      // Store the method used for debugging
      if (usedFallback) {
        console.log('[CustomerOrdersPage] Used fallback filtering method');
      }
      
      setOrders(ordersList);
      
      console.log('[CustomerOrdersPage] ===== ORDER LOADING SUMMARY =====');
      console.log('[CustomerOrdersPage] CustomerId used:', customerId);
      console.log('[CustomerOrdersPage] Method used:', usedFallback ? 'Fallback (all orders + filter)' : 'Direct (by customerId)');
      console.log('[CustomerOrdersPage] Orders found:', ordersList.length);
      
      if (ordersList.length === 0) {
        console.warn('[CustomerOrdersPage] No orders found. Possible reasons:');
        console.warn('  1. CustomerId in Order table does not match userId');
        console.warn('  2. Customer has no orders yet');
        console.warn('  3. CustomerId needs to be retrieved from Customer table (requires backend endpoint)');
        console.warn('[CustomerOrdersPage] Note: Backend cannot be modified, so CustomerId lookup is limited');
      } else {
        console.log('[CustomerOrdersPage] Successfully loaded orders for customer');
      }
    } catch (err) {
      console.error('[CustomerOrdersPage] Error loading orders:', err);
      setError(err.message || 'Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleViewDetails = async (orderId) => {
    try {
      console.log('[CustomerOrdersPage] Fetching order details for ID:', orderId);
      const order = await orderService.getOrderById(orderId);
      console.log('[CustomerOrdersPage] Order details:', order);
      
      // Try to get delivery info to see if rider is assigned
      let deliveryInfo = null;
      try {
        deliveryInfo = await deliveryService.getDeliveryByOrderId(orderId);
        console.log('[CustomerOrdersPage] Delivery info:', deliveryInfo);
      } catch (deliveryErr) {
        console.warn('[CustomerOrdersPage] Could not fetch delivery info:', deliveryErr);
      }
      
      setSelectedOrder({ ...order, deliveryInfo });
      setShowDetailsModal(true);
    } catch (err) {
      console.error('[CustomerOrdersPage] Error fetching order details:', err);
      alert(`Failed to load order details: ${err.message || 'Unknown error'}`);
    }
  };

  const handleViewRider = async (orderId) => {
    try {
      // Get rider info from the order/delivery
      const riderInfo = await customerService.getRiderInfo(orderId);
      
      if (riderInfo) {
        const riderName = riderInfo.fullName || riderInfo.FullName || 'Rider';
        const riderPhone = riderInfo.phoneNumber || riderInfo.PhoneNumber || 'N/A';
        
        alert(`Rider Information:\n\nName: ${riderName}\nPhone: ${riderPhone}\n\nThe rider details feature has been removed.`);
      } else {
        alert('No rider assigned to this order yet.');
      }
    } catch (err) {
      console.error('[CustomerOrdersPage] Error fetching rider info:', err);
      alert('Unable to load rider information. The order may not have a rider assigned yet.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower === 'pending') return 'bg-warning text-dark';
    if (statusLower === 'confirmed') return 'bg-info';
    if (statusLower === 'preparing') return 'bg-primary';
    if (statusLower === 'ready') return 'bg-success';
    if (statusLower === 'delivered') return 'bg-success';
    if (statusLower === 'cancelled') return 'bg-danger';
    return 'bg-secondary';
  };

  return (
    <>
      <CustomerNavbar />
      <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '20px' }}>
        {/* Header */}
        <div className="container-fluid mb-4">
        <div className="row align-items-center">
          <div className="col">
            <h1 className="h2 mb-0">My Orders</h1>
            <p className="text-muted">View and track your orders</p>
          </div>
          <div className="col-auto">
            <button
              className="btn btn-outline-primary"
              onClick={handleRefresh}
              disabled={refreshing || loading}
            >
              <i className={`bi bi-arrow-clockwise ${refreshing ? 'spin' : ''}`}></i>
              {refreshing ? ' Refreshing...' : ' Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="container-fluid mb-3">
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <strong>Error:</strong> {error}
            <button
              type="button"
              className="btn-close"
              onClick={() => setError(null)}
            ></button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="container-fluid">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading orders...</span>
            </div>
            <p className="mt-3 text-muted">Loading your orders...</p>
          </div>
        </div>
      )}

      {/* Orders List */}
      {!loading && !error && (
        <div className="container-fluid">
          {orders.length === 0 ? (
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="bi bi-inbox" style={{ fontSize: '4rem', color: '#ccc' }}></i>
                <h4 className="mt-3 text-muted">No Orders Found</h4>
                <p className="text-muted">You don't have any orders yet.</p>
                <button
                  className="btn btn-primary mt-3"
                  onClick={() => navigate('/customer/track')}
                >
                  Track an Order
                </button>
              </div>
            </div>
          ) : (
            <div className="row">
              {orders.map((order) => {
                const orderId = order.orderId || order.OrderId;
                const customerName = order.customerName || order.CustomerName;
                const deliveryAddress = order.deliveryAddress || order.DeliveryAddress;
                const orderTotal = order.orderTotal || order.OrderTotal;
                const paymentMethod = order.paymentMethod || order.PaymentMethod;
                const status = order.status || order.Status;
                const orderDate = order.orderDate || order.OrderDate;

                return (
                  <div key={orderId} className="col-md-6 col-lg-4 mb-4">
                    <div className="card h-100 shadow-sm">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <h5 className="card-title mb-1">
                              Order #{orderId}
                            </h5>
                            <small className="text-muted">{formatDate(orderDate)}</small>
                          </div>
                          <span className={`badge ${getStatusBadgeClass(status)}`}>
                            {status || 'Pending'}
                          </span>
                        </div>

                        <div className="mb-3">
                          <p className="mb-1">
                            <strong>Total:</strong> ₱{parseFloat(orderTotal || 0).toFixed(2)}
                          </p>
                          <p className="mb-1 text-muted small">
                            <i className="bi bi-geo-alt"></i>{' '}
                            {deliveryAddress ? 
                              (deliveryAddress.length > 50 ? 
                                `${deliveryAddress.substring(0, 50)}...` : 
                                deliveryAddress
                              ) : 'No address'
                            }
                          </p>
                          <p className="mb-0">
                            <span className="badge bg-secondary">
                              {paymentMethod || 'COD'}
                            </span>
                          </p>
                        </div>

                        <div className="d-grid gap-2">
                          <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => handleViewDetails(orderId)}
                          >
                            <i className="bi bi-eye"></i> View Details
                          </button>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleViewRider(orderId)}
                          >
                            <i className="bi bi-person"></i> View Rider
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Order Details #{selectedOrder.orderId || selectedOrder.OrderId}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedOrder(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Order ID:</strong>
                    <p>#{selectedOrder.orderId || selectedOrder.OrderId}</p>
                  </div>
                  <div className="col-md-6">
                    <strong>Status:</strong>
                    <p>
                      <span
                        className={`badge ${getStatusBadgeClass(
                          selectedOrder.status || selectedOrder.Status
                        )}`}
                      >
                        {selectedOrder.status || selectedOrder.Status || 'Pending'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Customer Name:</strong>
                    <p>{selectedOrder.customerName || selectedOrder.CustomerName}</p>
                  </div>
                  <div className="col-md-6">
                    <strong>Phone:</strong>
                    <p>{selectedOrder.customerPhone || selectedOrder.CustomerPhone}</p>
                  </div>
                </div>

                <div className="mb-3">
                  <strong>Delivery Address:</strong>
                  <p>{selectedOrder.deliveryAddress || selectedOrder.DeliveryAddress}</p>
                </div>

                {selectedOrder.specialInstructions || selectedOrder.SpecialInstructions ? (
                  <div className="mb-3">
                    <strong>Special Instructions:</strong>
                    <p className="text-muted">
                      {selectedOrder.specialInstructions || selectedOrder.SpecialInstructions}
                    </p>
                  </div>
                ) : null}

                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Order Total:</strong>
                    <p className="fs-5 text-success">
                      <strong>₱{parseFloat(
                        selectedOrder.orderTotal || selectedOrder.OrderTotal || 0
                      ).toFixed(2)}</strong>
                    </p>
                  </div>
                  <div className="col-md-6">
                    <strong>Payment Method:</strong>
                    <p>
                      <span className="badge bg-secondary">
                        {selectedOrder.paymentMethod || selectedOrder.PaymentMethod || 'COD'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mb-3">
                  <strong>Order Date:</strong>
                  <p>{formatDate(selectedOrder.orderDate || selectedOrder.OrderDate)}</p>
                </div>

                {/* Assigned Rider Info */}
                {selectedOrder.deliveryInfo && (selectedOrder.deliveryInfo.riderId || selectedOrder.deliveryInfo.RiderId) && (
                  <div className="mb-3 p-3 bg-light rounded">
                    <strong>Assigned Rider:</strong>
                    <p className="mb-0 text-muted">
                      Rider ID: {selectedOrder.deliveryInfo.riderId || selectedOrder.deliveryInfo.RiderId}
                      {selectedOrder.deliveryInfo.status && (
                        <>
                          <br />
                          <small>Delivery Status: {selectedOrder.deliveryInfo.status || selectedOrder.deliveryInfo.Status}</small>
                        </>
                      )}
                    </p>
                  </div>
                )}

                {/* Raw JSON for debugging */}
                {/*<details className="mt-4">
                  <summary className="cursor-pointer text-muted">
                    <small>Debug: View Raw API Response</small>
                  </summary>
                  <pre className="bg-light p-3 rounded mt-2" style={{ fontSize: '0.75rem', maxHeight: '200px', overflow: 'auto' }}>
                    {JSON.stringify(selectedOrder, null, 2)}
                  </pre>
                </details>*/}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedOrder(null);
                  }}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={async () => {
                    const orderId = selectedOrder.orderId || selectedOrder.OrderId;
                    await handleViewRider(orderId);
                  }}
                >
                  View Rider
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

export default CustomerOrdersPage;
