import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { riderService } from '../../services/api';
import RiderNavbar from '../../components/RiderNavbar';
import '../../App.css';

/**
 * Rider Dashboard - Delivery History Page
 * 
 * DATA FLOW:
 * Database (seeded mock data) → RiderService → RidersController → Frontend
 * 
 * This page fetches delivery history for the logged-in rider from the backend API endpoint:
 * GET /api/riders/{riderId}/history?startDate={startDate}&endDate={endDate}
 * 
 * The backend retrieves data from the database (DeliveryServiceDB and OrderServiceDB),
 * filtered by the rider's ID. Mock data is seeded into the database on application startup.
 * 
 * NOTE: The database mock data can be replaced with real production data
 * without changing this frontend code.
 */

const DeliveryHistoryPage = () => {
  const { riderId } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // today, week, month, all
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Load data from backend API when riderId or dateFilter changes
  useEffect(() => {
    if (riderId) {
      loadHistory();
    }
  }, [riderId, dateFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply search filter whenever deliveries or searchQuery changes
  useEffect(() => {
    // Apply search filter whenever deliveries or searchQuery changes
    if (searchQuery.trim() === '') {
      setFilteredDeliveries(deliveries);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = deliveries.filter((delivery) => {
        const transactionCode = delivery.transactionCode?.toLowerCase() || 
                               `ORD-${delivery.orderId || delivery.DeliveryId}`.toLowerCase();
        const customerName = delivery.customerName?.toLowerCase() || 
                            delivery.order?.customerName?.toLowerCase() || 
                            delivery.CustomerName?.toLowerCase() || '';
        const address = delivery.deliveryAddress?.toLowerCase() || 
                       delivery.order?.deliveryAddress?.toLowerCase() || 
                       delivery.DeliveryAddress?.toLowerCase() || '';
        const status = delivery.status?.toLowerCase() || delivery.Status?.toLowerCase() || '';
        
        return (
          transactionCode.includes(query) ||
          customerName.includes(query) ||
          address.includes(query) ||
          status.includes(query)
        );
      });
      setFilteredDeliveries(filtered);
    }
  }, [deliveries, searchQuery]);

  /**
   * Load delivery history from backend API
   * API Endpoint: GET /api/riders/{riderId}/history
   * Data comes from database, filtered by riderId
   */
  const loadHistory = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('[DeliveryHistoryPage] Loading history for riderId:', riderId);
      
      // Calculate date range based on filter
      let start = null;
      let end = null;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      switch (dateFilter) {
        case 'today':
          start = today;
          end = new Date();
          break;
        case 'week':
          start = new Date(today);
          start.setDate(today.getDate() - 7);
          end = new Date();
          break;
        case 'month':
          start = new Date(today);
          start.setMonth(today.getMonth() - 1);
          end = new Date();
          break;
        case 'all':
        default:
          // No date filter - fetch all history
          start = null;
          end = null;
          break;
      }

      // Fetch from backend API - data comes from database
      const historyData = await riderService.getRiderHistory(riderId, start, end);
      console.log('[DeliveryHistoryPage] History data received from database:', historyData);
      
      // Ensure we have an array
      if (!Array.isArray(historyData)) {
        console.warn('[DeliveryHistoryPage] History data is not an array:', historyData);
        setDeliveries([]);
        setError('');
        return;
      }
      
      // Map RiderOrderDto to expected format
      const mappedDeliveries = historyData.map(delivery => ({
        deliveryId: delivery.deliveryId || delivery.DeliveryId,
        orderId: delivery.orderId || delivery.OrderId,
        transactionCode: `ORD-${delivery.orderId || delivery.OrderId}`,
        status: delivery.status || delivery.Status,
        assignedAt: delivery.assignedAt || delivery.AssignedAt,
        deliveredAt: delivery.deliveredAt || delivery.DeliveredAt,
        customerName: delivery.customerName || delivery.CustomerName,
        deliveryAddress: delivery.deliveryAddress || delivery.DeliveryAddress,
        // Keep order structure for compatibility
        order: {
          customerName: delivery.customerName || delivery.CustomerName,
          deliveryAddress: delivery.deliveryAddress || delivery.DeliveryAddress,
          customerPhone: delivery.customerPhone || delivery.CustomerPhone,
          paymentMethod: 'Cash on Delivery' // Default, could be enhanced from order data
        }
      }));
      
      console.log('[DeliveryHistoryPage] Mapped deliveries:', mappedDeliveries);
      setDeliveries(mappedDeliveries);
      setError('');
    } catch (err) {
      console.error('[DeliveryHistoryPage] Error loading history from backend:', err);
      setError(err.message || 'Failed to load delivery history from database');
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle order click - navigate to order details
   */
  const handleOrderClick = (transactionCode) => {
    navigate(`/rider/orders/${transactionCode}`);
  };

  /**
   * Get CSS class for status badge
   */
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Completed':
      case 'Delivered':
        return 'bg-success';
      case 'Failed':
        return 'bg-danger';
      case 'In Progress':
      case 'InTransit':
      case 'PickedUp':
        return 'bg-primary';
      case 'Assigned':
      case 'Accepted':
        return 'bg-warning';
      default:
        return 'bg-secondary';
    }
  };

  // Calculate summary statistics from database results
  const totalDeliveries = filteredDeliveries.length;
  const completedDeliveries = filteredDeliveries.filter(d => 
    d.status === 'Completed' || d.status === 'Delivered'
  ).length;

  return (
    <>
      <RiderNavbar />
      <div className="container-fluid page-container">
        <div className="row mb-4">
          <div className="col-12">
            <h2 className="mb-4">Delivery History</h2>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="row mb-4">
          <div className="col-md-6 mb-3">
            <div className="card text-center">
              <div className="card-body">
                <h6 className="text-muted">Total Deliveries</h6>
                <h3>{totalDeliveries}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-6 mb-3">
            <div className="card text-center">
              <div className="card-body">
                <h6 className="text-muted">Completed</h6>
                <h3 className="text-success">{completedDeliveries}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="row">
              <div className="col-12">
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

        {/* Date Filter */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="row align-items-end">
              <div className="col-md-4 mb-3 mb-md-0">
                <label className="form-label">Filter by Period</label>
                <select
                  className="form-select"
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                  }}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery History List */}
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">My Deliveries</h5>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted">Loading delivery history from database...</p>
              </div>
            ) : error ? (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            ) : filteredDeliveries.length === 0 ? (
              <div className="alert alert-info" role="alert">
                {searchQuery 
                  ? 'No deliveries found matching your search.' 
                  : 'No delivery history found for the selected period in database.'}
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Transaction Code</th>
                      <th>Customer</th>
                      <th>Address</th>
                      <th>Status</th>
                      <th>Assigned At</th>
                      <th>Delivered At</th>
                      <th>Payment Method</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDeliveries.map((delivery) => (
                      <tr key={delivery.deliveryId}>
                        <td>
                          <strong>{delivery.transactionCode}</strong>
                        </td>
                        <td>{delivery.customerName || delivery.order?.customerName || 'N/A'}</td>
                        <td>
                          <small>
                            {delivery.deliveryAddress || delivery.order?.deliveryAddress
                              ? ((delivery.deliveryAddress || delivery.order.deliveryAddress).length > 40
                                  ? (delivery.deliveryAddress || delivery.order.deliveryAddress).substring(0, 40) + '...'
                                  : (delivery.deliveryAddress || delivery.order.deliveryAddress))
                              : 'N/A'}
                          </small>
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(delivery.status)}`}>
                            {delivery.status}
                          </span>
                        </td>
                        <td>
                          <small>
                            {delivery.assignedAt
                              ? new Date(delivery.assignedAt).toLocaleString()
                              : 'N/A'}
                          </small>
                        </td>
                        <td>
                          <small>
                            {delivery.deliveredAt
                              ? new Date(delivery.deliveredAt).toLocaleString()
                              : delivery.status === 'Completed' && delivery.assignedAt
                              ? new Date(delivery.assignedAt).toLocaleString()
                              : '-'}
                          </small>
                        </td>
                        <td>
                          <span className={`badge ${delivery.order?.paymentMethod === 'Online Payment' ? 'bg-info' : 'bg-secondary'}`}>
                            {delivery.order?.paymentMethod || 'Cash on Delivery'}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleOrderClick(delivery.transactionCode)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default DeliveryHistoryPage;
