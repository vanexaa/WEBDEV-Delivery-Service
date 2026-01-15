import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { riderService } from '../services/api';
import RiderNavbar from '../components/RiderNavbar';
import '../App.css';

const DeliveryHistoryPage = () => {
  const { riderId } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // today, week, month, all
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (riderId) {
      loadHistory();
    }
  }, [riderId, dateFilter]);

  const loadHistory = async () => {
    try {
      setLoading(true);
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
        case 'custom':
          if (startDate && endDate) {
            start = new Date(startDate);
            end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
          }
          break;
        default:
          break;
      }

      const historyData = await riderService.getRiderHistory(riderId, start, end);
      setDeliveries(historyData || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load delivery history');
      console.error('Error loading history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Apply search filter whenever deliveries or searchQuery changes
    if (searchQuery.trim() === '') {
      setFilteredDeliveries(deliveries);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = deliveries.filter((delivery) => {
        const transactionCode = delivery.transactionCode?.toLowerCase() || '';
        const customerName = delivery.order?.customerName?.toLowerCase() || '';
        const address = delivery.order?.deliveryAddress?.toLowerCase() || '';
        const status = delivery.status?.toLowerCase() || '';
        
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

  const handleCustomDateFilter = () => {
    if (startDate && endDate) {
      loadHistory();
    }
  };

  const handleOrderClick = (transactionCode) => {
    navigate(`/orders/${transactionCode}`);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Delivered':
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

  const totalDeliveries = filteredDeliveries.length;
  const completedDeliveries = filteredDeliveries.filter(d => d.status === 'Delivered').length;

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
                    if (e.target.value !== 'custom') {
                      setStartDate('');
                      setEndDate('');
                    }
                  }}
                >
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="custom">Custom Range</option>
                  <option value="all">All Time</option>
                </select>
              </div>
              {dateFilter === 'custom' && (
                <>
                  <div className="col-md-3 mb-3 mb-md-0">
                    <label className="form-label">Start Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="col-md-3 mb-3 mb-md-0">
                    <label className="form-label">End Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                  <div className="col-md-2">
                    <button className="btn btn-primary w-100" onClick={handleCustomDateFilter}>
                      Apply
                    </button>
                  </div>
                </>
              )}
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
              </div>
            ) : error ? (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            ) : filteredDeliveries.length === 0 ? (
              <div className="alert alert-info" role="alert">
                {searchQuery ? 'No deliveries found matching your search.' : 'No delivery history found for the selected period.'}
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
                        <td>{delivery.transactionCode}</td>
                        <td>{delivery.order?.customerName || 'N/A'}</td>
                        <td>
                          <small>
                            {delivery.order?.deliveryAddress 
                              ? delivery.order.deliveryAddress.substring(0, 40) + '...'
                              : 'N/A'}
                          </small>
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(delivery.status)}`}>
                            {delivery.status}
                          </span>
                        </td>
                        <td>
                          {delivery.assignedAt
                            ? new Date(delivery.assignedAt).toLocaleString()
                            : 'N/A'}
                        </td>
                        <td>
                          {delivery.deliveredAt
                            ? new Date(delivery.deliveredAt).toLocaleString()
                            : '-'}
                        </td>
                        <td>
                          <span className={`badge ${delivery.order?.paymentMethod === 'Online Payment' ? 'bg-info' : 'bg-secondary'}`}>
                            {delivery.order?.paymentMethod || 'N/A'}
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
