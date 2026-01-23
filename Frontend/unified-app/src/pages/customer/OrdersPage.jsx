import React, { useState, useEffect } from 'react';
import { orderService } from '../../services/api';
import CustomerNavbar from '../../components/CustomerNavbar';
import '../../App.css';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Form state for creating orders
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    customerPhone: '',
    deliveryAddress: '',
    specialInstructions: '',
    orderTotal: '',
    paymentMethod: 'COD'
  });

  useEffect(() => {
    loadOrders();
  }, [refreshKey]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[OrdersPage] Loading all orders...');
      
      const response = await orderService.getAllOrders();
      console.log('[OrdersPage] Orders response:', response);
      
      // Handle both array and object responses
      const ordersList = Array.isArray(response) ? response : (response.orders || []);
      setOrders(ordersList);
      console.log('[OrdersPage] Loaded orders:', ordersList.length);
    } catch (err) {
      console.error('[OrdersPage] Error loading orders:', err);
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      console.log('[OrdersPage] Creating order with data:', formData);
      
      const orderData = {
        customerId: parseInt(formData.customerId, 10),
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        deliveryAddress: formData.deliveryAddress,
        specialInstructions: formData.specialInstructions || null,
        orderTotal: parseFloat(formData.orderTotal),
        paymentMethod: formData.paymentMethod
      };

      console.log('[OrdersPage] Sending order data:', orderData);
      const newOrder = await orderService.createOrder(orderData);
      console.log('[OrdersPage] Order created successfully:', newOrder);

      // Reset form
      setFormData({
        customerId: '',
        customerName: '',
        customerPhone: '',
        deliveryAddress: '',
        specialInstructions: '',
        orderTotal: '',
        paymentMethod: 'COD'
      });

      setShowCreateModal(false);
      alert('Order created successfully!');
      
      // Refresh orders list
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('[OrdersPage] Error creating order:', err);
      alert(`Failed to create order: ${err.message || 'Unknown error'}`);
    }
  };

  const handleViewDetails = async (orderId) => {
    try {
      console.log('[OrdersPage] Fetching order details for ID:', orderId);
      const order = await orderService.getOrderById(orderId);
      console.log('[OrdersPage] Order details:', order);
      setSelectedOrder(order);
      setShowDetailsModal(true);
    } catch (err) {
      console.error('[OrdersPage] Error fetching order details:', err);
      alert(`Failed to load order details: ${err.message || 'Unknown error'}`);
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
    if (statusLower === 'pending') return 'bg-warning';
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
      <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col">
          <h1 className="h2 mb-0">Orders</h1>
          <p className="text-muted">View and create orders</p>
        </div>
        <div className="col-auto">
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Create New Order
          </button>
          <button
            className="btn btn-outline-secondary ms-2"
            onClick={() => {
              console.log('[OrdersPage] Manual refresh triggered');
              setRefreshKey(prev => prev + 1);
            }}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Refresh
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <strong>Error:</strong> {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError(null)}
          ></button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading orders...</span>
          </div>
          <p className="mt-2 text-muted">Loading orders...</p>
        </div>
      )}

      {/* Orders Table */}
      {!loading && !error && (
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">
              All Orders ({orders.length})
              <small className="text-muted ms-2">Total: {orders.length}</small>
            </h5>
          </div>
          <div className="card-body">
            {orders.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted">No orders found. Create your first order!</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Phone</th>
                      <th>Address</th>
                      <th>Total</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th>Order Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const orderId = order.orderId || order.OrderId;
                      const customerName = order.customerName || order.CustomerName;
                      const customerPhone = order.customerPhone || order.CustomerPhone;
                      const deliveryAddress = order.deliveryAddress || order.DeliveryAddress;
                      const orderTotal = order.orderTotal || order.OrderTotal;
                      const paymentMethod = order.paymentMethod || order.PaymentMethod;
                      const status = order.status || order.Status;
                      const orderDate = order.orderDate || order.OrderDate;

                      return (
                        <tr key={orderId}>
                          <td>
                            <strong>#{orderId}</strong>
                          </td>
                          <td>{customerName || 'N/A'}</td>
                          <td>{customerPhone || 'N/A'}</td>
                          <td>
                            <small className="text-muted">
                              {deliveryAddress ? 
                                (deliveryAddress.length > 30 ? 
                                  `${deliveryAddress.substring(0, 30)}...` : 
                                  deliveryAddress
                                ) : 'N/A'
                              }
                            </small>
                          </td>
                          <td>
                            <strong>₱{parseFloat(orderTotal || 0).toFixed(2)}</strong>
                          </td>
                          <td>
                            <span className="badge bg-secondary">
                              {paymentMethod || 'COD'}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${getStatusBadgeClass(status)}`}>
                              {status || 'Pending'}
                            </span>
                          </td>
                          <td>
                            <small>{formatDate(orderDate)}</small>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleViewDetails(orderId)}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {showCreateModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create New Order</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCreateModal(false)}
                ></button>
              </div>
              <form onSubmit={handleCreateOrder}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Customer ID *</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.customerId}
                        onChange={(e) =>
                          setFormData({ ...formData, customerId: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Customer Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.customerName}
                        onChange={(e) =>
                          setFormData({ ...formData, customerName: e.target.value })
                        }
                        required
                        maxLength={255}
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Customer Phone *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.customerPhone}
                        onChange={(e) =>
                          setFormData({ ...formData, customerPhone: e.target.value })
                        }
                        required
                        maxLength={50}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Order Total *</label>
                      <div className="input-group">
                        <span className="input-group-text">₱</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          className="form-control"
                          value={formData.orderTotal}
                          onChange={(e) =>
                            setFormData({ ...formData, orderTotal: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Delivery Address *</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={formData.deliveryAddress}
                      onChange={(e) =>
                        setFormData({ ...formData, deliveryAddress: e.target.value })
                      }
                      required
                      maxLength={500}
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Special Instructions</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={formData.specialInstructions}
                      onChange={(e) =>
                        setFormData({ ...formData, specialInstructions: e.target.value })
                      }
                      maxLength={1000}
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Payment Method</label>
                    <select
                      className="form-select"
                      value={formData.paymentMethod}
                      onChange={(e) =>
                        setFormData({ ...formData, paymentMethod: e.target.value })
                      }
                    >
                      <option value="COD">Cash on Delivery (COD)</option>
                      <option value="Card">Card Payment</option>
                      <option value="Online">Online Payment</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Order
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-lg">
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
                    <strong>Customer ID:</strong>
                    <p>{selectedOrder.customerId || selectedOrder.CustomerId}</p>
                  </div>
                  <div className="col-md-6">
                    <strong>Customer Name:</strong>
                    <p>{selectedOrder.customerName || selectedOrder.CustomerName}</p>
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Customer Phone:</strong>
                    <p>{selectedOrder.customerPhone || selectedOrder.CustomerPhone}</p>
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
                    <p>
                      <strong className="text-success fs-5">
                        ₱{parseFloat(
                          selectedOrder.orderTotal || selectedOrder.OrderTotal || 0
                        ).toFixed(2)}
                      </strong>
                    </p>
                  </div>
                  <div className="col-md-6">
                    <strong>Order Date:</strong>
                    <p>{formatDate(selectedOrder.orderDate || selectedOrder.OrderDate)}</p>
                  </div>
                </div>
                
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
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default OrdersPage;
