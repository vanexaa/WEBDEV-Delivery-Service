import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { riderService } from '../services/api';
import RiderNavbar from '../components/RiderNavbar';
import '../App.css';

const EarningsPage = () => {
  const { riderId } = useAuth();
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFilter, setDateFilter] = useState('today'); // today, week, month, all
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (riderId) {
      loadEarnings();
    }
  }, [riderId, dateFilter]);

  const loadEarnings = async () => {
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

      const earningsData = await riderService.getEarnings(riderId, start, end);
      setEarnings(earningsData || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load earnings');
      console.error('Error loading earnings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomDateFilter = () => {
    if (startDate && endDate) {
      loadEarnings();
    }
  };

  const totalEarnings = earnings.reduce((sum, earning) => sum + (earning.amount || 0), 0);
  const totalDeliveries = earnings.length;
  const averageEarning = totalDeliveries > 0 ? totalEarnings / totalDeliveries : 0;

  return (
    <>
      <RiderNavbar />
      <div className="container-fluid page-container">
        <div className="row mb-4">
          <div className="col-12">
            <h2 className="mb-4">Earnings</h2>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="row mb-4">
          <div className="col-md-4 mb-3">
            <div className="card text-center">
              <div className="card-body">
                <h6 className="text-muted">Total Earnings</h6>
                <h3 className="text-success">${totalEarnings.toFixed(2)}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="card text-center">
              <div className="card-body">
                <h6 className="text-muted">Total Deliveries</h6>
                <h3>{totalDeliveries}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="card text-center">
              <div className="card-body">
                <h6 className="text-muted">Average per Delivery</h6>
                <h3>${averageEarning.toFixed(2)}</h3>
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

        {/* Earnings List */}
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">Earnings History</h5>
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
            ) : earnings.length === 0 ? (
              <div className="alert alert-info" role="alert">
                No earnings found for the selected period.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Order ID</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Payment Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnings.map((earning) => (
                      <tr key={earning.earningId}>
                        <td>
                          {earning.earningDate
                            ? new Date(earning.earningDate).toLocaleDateString()
                            : 'N/A'}
                        </td>
                        <td>#{earning.orderId || 'N/A'}</td>
                        <td className="fw-bold text-success">
                          ${(earning.amount || 0).toFixed(2)}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              earning.status === 'Paid'
                                ? 'bg-success'
                                : earning.status === 'Pending'
                                ? 'bg-warning'
                                : 'bg-secondary'
                            }`}
                          >
                            {earning.status || 'Pending'}
                          </span>
                        </td>
                        <td>
                          {earning.paymentDate
                            ? new Date(earning.paymentDate).toLocaleDateString()
                            : 'Pending'}
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

export default EarningsPage;
