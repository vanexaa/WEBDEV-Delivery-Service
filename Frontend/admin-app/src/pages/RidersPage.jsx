import React, { useState, useEffect } from 'react';
import { riderService } from '../services/api';
import '../App.css';

const RidersPage = () => {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRiders();
  }, []);

  const loadRiders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await riderService.getAllRiders();
      setRiders(data);
    } catch (err) {
      console.error('Error loading riders:', err);
      setError(err.message || 'Failed to load riders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (isOnline, isActive) => {
    if (!isActive) {
      return <span className="badge bg-secondary">Inactive</span>;
    }
    return isOnline ? (
      <span className="badge bg-success">Online</span>
    ) : (
      <span className="badge bg-warning">Offline</span>
    );
  };

  return (
    <div className="container-fluid page-container">
      <div className="row">
        <div className="col-12">
          <h4 className="mb-3">Riders Management</h4>
          <div className="card">
            <div className="card-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted">Loading riders...</p>
                </div>
              ) : error ? (
                <div className="alert alert-danger" role="alert">
                  <strong>Error:</strong> {error}
                  <button 
                    className="btn btn-sm btn-outline-danger ms-2" 
                    onClick={loadRiders}
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Rider ID</th>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th>Vehicle</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {riders.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center text-muted">
                            No riders found
                          </td>
                        </tr>
                      ) : (
                        riders.map((rider) => (
                          <tr key={rider.riderId}>
                            <td>{rider.riderId}</td>
                            <td>{rider.fullName}</td>
                            <td>{rider.phoneNumber}</td>
                            <td>{rider.email || '-'}</td>
                            <td>{rider.vehicleType || '-'}</td>
                            <td>{getStatusBadge(rider.isOnline, rider.isActive)}</td>
                            <td>
                              <button 
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => {
                                  // View rider details - can be implemented later
                                  alert(`View details for rider ${rider.riderId}`);
                                }}
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))
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

export default RidersPage;
