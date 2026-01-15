import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { deliveryService } from '../services/api';
import RiderNavbar from '../components/RiderNavbar';
import AvailabilityToggle from '../components/AvailabilityToggle';
import '../App.css';

const DashboardPage = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { riderId, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadActiveOrders();
    // Refresh orders every 30 seconds
    const interval = setInterval(loadActiveOrders, 30000);
    return () => clearInterval(interval);
  }, [riderId, user]);

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

  const loadActiveOrders = async () => {
    try {
      setLoading(true);
      const deliveries = await deliveryService.getActiveDeliveries();
      
      // Filter by riderId if available, otherwise show all (or empty)
      if (riderId) {
        const riderOrders = deliveries.filter((d) => d.riderId === riderId);
        setOrders(riderOrders);
      } else {
        // If riderId is not available, show empty or all orders
        setOrders([]);
      }
      setError('');
    } catch (err) {
      setError('Failed to load orders. Please try again.');
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderClick = (transactionCode) => {
    navigate(`/orders/${transactionCode}`);
  };

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
