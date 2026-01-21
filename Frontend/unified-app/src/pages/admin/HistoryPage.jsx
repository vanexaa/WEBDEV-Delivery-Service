import React, { useState, useEffect } from 'react';
import { riderService } from '../../services/api';
import Navbar from '../../components/Navbar';
import '../../App.css';

/**
 * Admin Dashboard - Delivery History Page
 * 
 * DATA FLOW:
 * Database (seeded mock data) → DeliveryService → DeliveriesController → Frontend
 * 
 * This page fetches delivery history from the backend API endpoint:
 * GET /api/deliveries/history
 * 
 * The backend retrieves data from the database (DeliveryServiceDB and OrderServiceDB).
 * Mock data is seeded into the database on application startup.
 * 
 * NOTE: The database mock data can be replaced with real production data
 * without changing this frontend code.
 */

const HistoryPage = () => {
  const [allHistory, setAllHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [displayedHistory, setDisplayedHistory] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter states
  const [selectedRiderName, setSelectedRiderName] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Load data from backend API on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Apply filters whenever filter states change
  useEffect(() => {
    applyFilters();
  }, [allHistory, selectedRiderName, selectedStatus, selectedPaymentMethod, startDate, endDate, dateFilter]);

  // Apply search filter on top of filtered history
  useEffect(() => {
    // Apply search filter on top of filtered history
    if (searchQuery.trim() === '') {
      setDisplayedHistory(filteredHistory);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const searched = filteredHistory.filter((delivery) => {
        const transactionCode = delivery.transactionCode?.toLowerCase() || '';
        const riderName = getRiderName(delivery.riderId)?.toLowerCase() || '';
        const customerName = delivery.order?.customerName?.toLowerCase() || '';
        const address = delivery.order?.deliveryAddress?.toLowerCase() || '';
        const status = delivery.status?.toLowerCase() || '';
        const orderId = delivery.orderId?.toString() || '';
        
        return (
          transactionCode.includes(query) ||
          riderName.includes(query) ||
          customerName.includes(query) ||
          address.includes(query) ||
          status.includes(query) ||
          orderId.includes(query)
        );
      });
      setDisplayedHistory(searched);
    }
  }, [filteredHistory, searchQuery, riders]);

  /**
   * Load delivery history and riders from backend API
   * API Endpoint: GET /api/deliveries/history
   */
  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch from backend API - data comes from database
      const [historyData, ridersData] = await Promise.all([
        riderService.getAllDeliveryHistory(),
        riderService.getAllRiders()
      ]);
      
      setAllHistory(historyData || []);
      setRiders(ridersData || []);
    } catch (err) {
      setError(err.message || 'Failed to load delivery history from database');
      console.error('Error loading history from backend:', err);
      setAllHistory([]);
      setRiders([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Apply filters to delivery history
   * All filtering is done client-side after fetching from backend
   */
  const applyFilters = () => {
    let filtered = [...allHistory];

    // Filter by rider name
    if (selectedRiderName) {
      const selectedRider = riders.find(r => r.fullName === selectedRiderName);
      if (selectedRider) {
        filtered = filtered.filter(d => d.riderId === selectedRider.riderId);
      }
    }

    // Filter by status
    if (selectedStatus) {
      filtered = filtered.filter(d => d.status === selectedStatus);
    }

    // Filter by payment method
    if (selectedPaymentMethod) {
      filtered = filtered.filter(d => d.order?.paymentMethod === selectedPaymentMethod);
    }

    // Filter by date
    let start = null;
    let end = null;

    if (dateFilter === 'custom') {
      if (startDate) {
        start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
      }
      if (endDate) {
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
      }
    } else {
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
        case 'year':
          start = new Date(today);
          start.setFullYear(today.getFullYear() - 1);
          end = new Date();
          break;
        default:
          break;
      }
    }

    if (start || end) {
      filtered = filtered.filter(delivery => {
        const deliveryDate = new Date(delivery.assignedAt || delivery.deliveredAt || delivery.createdAt);
        if (start && deliveryDate < start) return false;
        if (end && deliveryDate > end) return false;
        return true;
      });
    }

    setFilteredHistory(filtered);
  };

  /**
   * Get rider name by riderId
   */
  const getRiderName = (riderId) => {
    const rider = riders.find(r => r.riderId === riderId);
    return rider ? rider.fullName : 'Unknown Rider';
  };

  /**
   * Get CSS class for status badge
   */
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Delivered':
      case 'Completed':
        return 'bg-success';
      case 'Failed':
        return 'bg-danger';
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

  /**
   * Handle date filter change
   */
  const handleDateFilterChange = (value) => {
    setDateFilter(value);
    if (value !== 'custom') {
      setStartDate('');
      setEndDate('');
    }
  };

  /**
   * Clear all filters and search
   */
  const clearAllFilters = () => {
    setSelectedRiderName('');
    setSelectedStatus('');
    setSelectedPaymentMethod('');
    setStartDate('');
    setEndDate('');
    setDateFilter('all');
    setSearchQuery('');
  };

  /**
   * Get unique statuses from all history
   */
  const getUniqueStatuses = () => {
    const statuses = [...new Set(allHistory.map(d => d.status).filter(Boolean))];
    return statuses.sort();
  };

  /**
   * Get unique payment methods from all history
   */
  const getUniquePaymentMethods = () => {
    const methods = [...new Set(allHistory.map(d => d.order?.paymentMethod).filter(Boolean))];
    return methods.sort();
  };

  // Calculate summary statistics from database results
  const totalDeliveries = displayedHistory.length;
  const completedDeliveries = displayedHistory.filter(d => 
    d.status === 'Delivered' || d.status === 'Completed'
  ).length;
  const failedDeliveries = displayedHistory.filter(d => d.status === 'Failed').length;

  // Active filters display
  const activeFilters = [
    selectedRiderName && `Rider: ${selectedRiderName}`,
    selectedStatus && `Status: ${selectedStatus}`,
    selectedPaymentMethod && `Payment: ${selectedPaymentMethod}`,
    dateFilter !== 'all' && `Date: ${dateFilter}`,
    searchQuery && `Search: "${searchQuery}"`
  ].filter(Boolean);

  return (
    <>
      <Navbar />
      <div className="container-fluid page-container">
        <div className="row">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="mb-0">Delivery History</h4>
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={loadData}
                disabled={loading}
              >
                <i className="bi bi-arrow-clockwise"></i> Refresh
              </button>
            </div>

            {error && (
              <div className="alert alert-warning" role="alert">
                {error}
              </div>
            )}

            {/* Summary Cards */}
            <div className="row mb-4">
              <div className="col-md-4 mb-3">
                <div className="card text-center border-primary">
                  <div className="card-body">
                    <h6 className="text-muted mb-2">Total Deliveries</h6>
                    <h2 className="text-primary mb-0">{totalDeliveries}</h2>
                  </div>
                </div>
              </div>
              <div className="col-md-4 mb-3">
                <div className="card text-center border-success">
                  <div className="card-body">
                    <h6 className="text-muted mb-2">Completed</h6>
                    <h2 className="text-success mb-0">{completedDeliveries}</h2>
                  </div>
                </div>
              </div>
              <div className="col-md-4 mb-3">
                <div className="card text-center border-danger">
                  <div className="card-body">
                    <h6 className="text-muted mb-2">Failed</h6>
                    <h2 className="text-danger mb-0">{failedDeliveries}</h2>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="card mb-4">
              <div className="card-body">
                <div className="row align-items-end">
                  <div className="col-md-10">
                    <label className="form-label fw-bold">
                      <i className="bi bi-search"></i> Search Deliveries
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      placeholder="Search by transaction code, order ID, rider name, customer name, address, or status..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="col-md-2">
                    {searchQuery && (
                      <button
                        className="btn btn-outline-secondary w-100"
                        onClick={() => setSearchQuery('')}
                      >
                        <i className="bi bi-x-circle"></i> Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="card mb-4">
              <div className="card-header bg-light">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <i className="bi bi-funnel"></i> Filters
                  </h5>
                  {activeFilters.length > 0 && (
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={clearAllFilters}
                    >
                      <i className="bi bi-x-circle"></i> Clear All Filters
                    </button>
                  )}
                </div>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-3 mb-3">
                    <label className="form-label fw-bold">Rider</label>
                    <select
                      className="form-select"
                      value={selectedRiderName}
                      onChange={(e) => setSelectedRiderName(e.target.value)}
                    >
                      <option value="">All Riders</option>
                      {riders.map((rider) => (
                        <option key={rider.riderId} value={rider.fullName}>
                          {rider.fullName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3 mb-3">
                    <label className="form-label fw-bold">Status</label>
                    <select
                      className="form-select"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                      <option value="">All Statuses</option>
                      {getUniqueStatuses().map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3 mb-3">
                    <label className="form-label fw-bold">Payment Method</label>
                    <select
                      className="form-select"
                      value={selectedPaymentMethod}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    >
                      <option value="">All Payment Methods</option>
                      {getUniquePaymentMethods().map((method) => (
                        <option key={method} value={method}>
                          {method}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3 mb-3">
                    <label className="form-label fw-bold">Date Range</label>
                    <select
                      className="form-select"
                      value={dateFilter}
                      onChange={(e) => handleDateFilterChange(e.target.value)}
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">Last 7 Days</option>
                      <option value="month">Last 30 Days</option>
                      <option value="year">Last Year</option>
                      <option value="custom">Custom Range</option>
                    </select>
                  </div>
                </div>
                {dateFilter === 'custom' && (
                  <div className="row mt-2">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Start Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">End Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                )}
                {activeFilters.length > 0 && (
                  <div className="mt-3">
                    <small className="text-muted">Active filters: </small>
                    {activeFilters.map((filter, index) => (
                      <span key={index} className="badge bg-info me-2">
                        {filter}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* History Table */}
            <div className="card">
              <div className="card-header bg-light">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <i className="bi bi-list-ul"></i> Delivery History
                    {displayedHistory.length > 0 && (
                      <span className="badge bg-primary ms-2">{displayedHistory.length}</span>
                    )}
                  </h5>
                  {displayedHistory.length > 0 && (
                    <small className="text-muted">
                      Showing {displayedHistory.length} of {allHistory.length} deliveries
                    </small>
                  )}
                </div>
              </div>
              <div className="card-body">
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 text-muted">Loading delivery history from database...</p>
                  </div>
                ) : displayedHistory.length === 0 ? (
                  <div className="alert alert-info text-center" role="alert">
                    <i className="bi bi-info-circle fs-4"></i>
                    <p className="mb-0 mt-2">
                      {searchQuery || activeFilters.length > 0
                        ? 'No deliveries found matching your search criteria. Try adjusting your filters.'
                        : 'No delivery history found in database.'}
                    </p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-striped table-hover align-middle">
                      <thead className="table-dark">
                        <tr>
                          <th>Transaction Code</th>
                          <th>Order ID</th>
                          <th>Rider</th>
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
                        {displayedHistory.map((delivery) => (
                          <tr key={delivery.deliveryId || delivery.transactionCode}>
                            <td>
                              <strong>{delivery.transactionCode || `ORD-${delivery.orderId}`}</strong>
                            </td>
                            <td>#{delivery.orderId || delivery.deliveryId || 'N/A'}</td>
                            <td>{getRiderName(delivery.riderId)}</td>
                            <td>{delivery.order?.customerName || 'N/A'}</td>
                            <td>
                              <small className="text-muted">
                                {delivery.order?.deliveryAddress 
                                  ? (delivery.order.deliveryAddress.length > 40
                                      ? delivery.order.deliveryAddress.substring(0, 40) + '...'
                                      : delivery.order.deliveryAddress)
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
                                  : '-'}
                              </small>
                            </td>
                            <td>
                              <span className={`badge ${delivery.order?.paymentMethod === 'Online Payment' ? 'bg-info' : 'bg-secondary'}`}>
                                {delivery.order?.paymentMethod || 'N/A'}
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => {
                                  console.log('View delivery:', delivery);
                                  // TODO: Add view details functionality
                                }}
                              >
                                <i className="bi bi-eye"></i> View
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
        </div>
      </div>
    </>
  );
};

export default HistoryPage;
