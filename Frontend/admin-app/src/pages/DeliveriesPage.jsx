import React, { useState, useEffect } from 'react';
import { deliveryService } from '../services/api';
import '../App.css';

const DeliveriesPage = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDeliveries();
  }, []);

  const loadDeliveries = async () => {
    try {
      setLoading(true);
      const data = await deliveryService.getActiveDeliveries();
      setDeliveries(data);
      setError('');
    } catch (err) {
      setError('Failed to load deliveries.');
      console.error('Error loading deliveries:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid page-container">
      <div className="row">
        <div className="col-12">
          <h4 className="mb-3">All Deliveries</h4>
          <div className="card">
            <div className="card-body">
              {loading && (
                <div className="text-center">
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
              {!loading && !error && (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Status</th>
                        <th>Assigned At</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliveries.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center">
                            No deliveries found
                          </td>
                        </tr>
                      ) : (
                        deliveries.map((delivery) => {
                          const order = delivery.order || {};
                          return (
                            <tr key={delivery.orderId}>
                              <td>#{delivery.orderId}</td>
                              <td>{order.customerName || 'N/A'}</td>
                              <td>
                                <span className="badge bg-primary">{delivery.status}</span>
                              </td>
                              <td>{new Date(delivery.assignedAt).toLocaleString()}</td>
                              <td>
                                <button className="btn btn-sm btn-primary me-2">
                                  View
                                </button>
                                {delivery.riderId && (
                                  <button className="btn btn-sm btn-warning">
                                    Reassign
                                  </button>
                                )}
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

export default DeliveriesPage;
