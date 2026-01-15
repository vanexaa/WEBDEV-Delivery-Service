import React, { useState, useEffect } from 'react';
import { deliveryService } from '../services/api';
import '../App.css';

const DashboardPage = () => {
  const [stats, setStats] = useState({
    activeDeliveries: 0,
    pendingAssignments: 0,
    onlineRiders: 0,
    todayDeliveries: 0
  });
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const activeDeliveries = await deliveryService.getActiveDeliveries();
      
      setStats({
        activeDeliveries: activeDeliveries.length,
        pendingAssignments: activeDeliveries.filter(d => d.status === 'Assigned').length,
        onlineRiders: 0, // Would need additional API call
        todayDeliveries: 0 // Would need additional API call
      });
      
      setDeliveries(activeDeliveries.slice(0, 10));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid page-container">
      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card text-white bg-primary stat-card">
            <div className="card-body">
              <h5 className="card-title">Active Deliveries</h5>
              <h2>{stats.activeDeliveries}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-white bg-success stat-card">
            <div className="card-body">
              <h5 className="card-title">Online Riders</h5>
              <h2>{stats.onlineRiders}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-white bg-warning stat-card">
            <div className="card-body">
              <h5 className="card-title">Pending Assignments</h5>
              <h2>{stats.pendingAssignments}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-white bg-info stat-card">
            <div className="card-body">
              <h5 className="card-title">Today's Deliveries</h5>
              <h2>{stats.todayDeliveries}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Deliveries */}
      <div className="row">
        <div className="col-12">
          <h4 className="mb-3">Recent Deliveries</h4>
          <div className="card">
            <div className="card-body">
              {loading && (
                <div className="text-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )}
              {!loading && (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Rider</th>
                        <th>Customer</th>
                        <th>Status</th>
                        <th>Assigned At</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliveries.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center">
                            No deliveries found
                          </td>
                        </tr>
                      ) : (
                        deliveries.map((delivery) => {
                          const order = delivery.order || {};
                          return (
                            <tr key={delivery.orderId}>
                              <td>#{delivery.orderId}</td>
                              <td>
                                {delivery.riderId ? `Rider #${delivery.riderId}` : 'Unassigned'}
                              </td>
                              <td>{order.customerName || 'N/A'}</td>
                              <td>
                                <span className="badge bg-primary">{delivery.status}</span>
                              </td>
                              <td>{new Date(delivery.assignedAt).toLocaleString()}</td>
                              <td>
                                <button className="btn btn-sm btn-primary">
                                  View
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
