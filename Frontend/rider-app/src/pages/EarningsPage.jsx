import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { riderService } from '../services/api';
import RiderNavbar from '../components/RiderNavbar';
import '../App.css';

const EarningsPage = () => {
  const { riderId } = useAuth();
  const [onlinePayments, setOnlinePayments] = useState({ totalOnlinePayments: 0, transactionCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFilter, setDateFilter] = useState('today'); // today, week, month, all
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (riderId) {
      loadOnlinePayments();
    }
  }, [riderId, dateFilter]);

  const loadOnlinePayments = async () => {
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

      const paymentsData = await riderService.getRiderOnlinePayments(riderId, start, end);
      setOnlinePayments(paymentsData || { totalOnlinePayments: 0, transactionCount: 0 });
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load online payments');
      console.error('Error loading online payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomDateFilter = () => {
    if (startDate && endDate) {
      loadOnlinePayments();
    }
  };

  return (
    <>
      <RiderNavbar />
      <div className="container-fluid page-container">
        <div className="row mb-4">
          <div className="col-12">
            <h2 className="mb-4">Online Payments</h2>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="row mb-4">
          <div className="col-md-6 mb-3">
            <div className="card text-center">
              <div className="card-body">
                <h6 className="text-muted">Total Online Payments</h6>
                <h3 className="text-success">${onlinePayments.totalOnlinePayments.toFixed(2)}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-6 mb-3">
            <div className="card text-center">
              <div className="card-body">
                <h6 className="text-muted">Online Payment Transactions</h6>
                <h3>{onlinePayments.transactionCount}</h3>
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

        {/* Online Payments Summary */}
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">Online Payments Summary</h5>
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
            ) : onlinePayments.transactionCount === 0 ? (
              <div className="alert alert-info" role="alert">
                No online payments found for the selected period.
              </div>
            ) : (
              <div className="alert alert-success" role="alert">
                <h5>Summary</h5>
                <p className="mb-1"><strong>Total Online Payments:</strong> ${onlinePayments.totalOnlinePayments.toFixed(2)}</p>
                <p className="mb-0"><strong>Number of Transactions:</strong> {onlinePayments.transactionCount}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default EarningsPage;
