import React, { useState, useEffect } from 'react';
import { riderService } from '../services/api';
import '../App.css';

const RidersPage = () => {
  const [riders, setRiders] = useState([]);
  const [filteredRiders, setFilteredRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRider, setSelectedRider] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [riderHistory, setRiderHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    loadRiders();
  }, []);

  useEffect(() => {
    // Apply search filter whenever riders or searchQuery changes
    if (searchQuery.trim() === '') {
      setFilteredRiders(riders);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = riders.filter((rider) => {
        const name = rider.fullName?.toLowerCase() || '';
        const phone = rider.phoneNumber?.toLowerCase() || '';
        const vehicleType = rider.vehicleType?.toLowerCase() || '';
        const vehicleNumber = rider.vehicleNumber?.toLowerCase() || '';
        
        return (
          name.includes(query) ||
          phone.includes(query) ||
          vehicleType.includes(query) ||
          vehicleNumber.includes(query)
        );
      });
      setFilteredRiders(filtered);
    }
  }, [riders, searchQuery]);

  const loadRiders = async () => {
    try {
      setLoading(true);
      const data = await riderService.getAllRiders();
      setRiders(data || []);
      setError('');
    } catch (err) {
      setError('Failed to load riders.');
      console.error('Error loading riders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewRider = async (rider) => {
    try {
      setSelectedRider(rider);
      setShowModal(true);
      setLoadingHistory(true);
      setRiderHistory([]);
      
      // Load rider history
      const history = await riderService.getRiderHistory(rider.riderId);
      setRiderHistory(history || []);
    } catch (err) {
      console.error('Error loading rider details:', err);
      setRiderHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRider(null);
    setRiderHistory([]);
  };


  return (
    <div className="container-fluid page-container">
      <div className="row">
        <div className="col-12">
          <h4 className="mb-3">Riders Management</h4>
          
          {error && (
            <div className="alert alert-warning" role="alert">
              {error}
            </div>
          )}

          {/* Search Bar */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="row">
                <div className="col-12">
                  <label className="form-label">Search</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by name, phone, vehicle type, or vehicle number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">All Riders</h5>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : filteredRiders.length === 0 ? (
                <div className="alert alert-info" role="alert">
                  {searchQuery ? 'No riders found matching your search.' : 'No riders found.'}
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Vehicle Type</th>
                        <th>Vehicle Number</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRiders.map((rider) => (
                        <tr key={rider.riderId}>
                          <td>{rider.fullName}</td>
                          <td>{rider.phoneNumber}</td>
                          <td>{rider.vehicleType}</td>
                          <td>{rider.vehicleNumber || '-'}</td>
                          <td>
                            <span className={`badge ${rider.isOnline ? 'bg-success' : 'bg-secondary'}`}>
                              {rider.isOnline ? 'Online' : 'Offline'}
                            </span>
                          </td>
                          <td>
                            <button 
                              className="btn btn-sm btn-primary"
                              onClick={() => handleViewRider(rider)}
                            >
                              View
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

      {/* Rider Details Modal */}
      {showModal && selectedRider && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Rider Details</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={handleCloseModal}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Name:</strong> {selectedRider.fullName}
                  </div>
                  <div className="col-md-6">
                    <strong>Phone:</strong> {selectedRider.phoneNumber}
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Vehicle Type:</strong> {selectedRider.vehicleType}
                  </div>
                  <div className="col-md-6">
                    <strong>Vehicle Number:</strong> {selectedRider.vehicleNumber || 'N/A'}
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Status:</strong>{' '}
                    <span className={`badge ${selectedRider.isOnline ? 'bg-success' : 'bg-secondary'}`}>
                      {selectedRider.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <div className="col-md-6">
                    <strong>Rider ID:</strong> {selectedRider.riderId}
                  </div>
                </div>

                <hr />

                <h6 className="mb-3">Delivery History</h6>
                {loadingHistory ? (
                  <div className="text-center py-3">
                    <div className="spinner-border spinner-border-sm" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : riderHistory.length === 0 ? (
                  <div className="alert alert-info">No delivery history found.</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Status</th>
                          <th>Assigned At</th>
                          <th>Completed At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {riderHistory.map((delivery) => (
                          <tr key={delivery.orderId || delivery.deliveryId}>
                            <td>#{delivery.orderId || delivery.deliveryId}</td>
                            <td>
                              <span className="badge bg-primary">{delivery.status}</span>
                            </td>
                            <td>
                              {delivery.assignedAt 
                                ? new Date(delivery.assignedAt).toLocaleString() 
                                : 'N/A'}
                            </td>
                            <td>
                              {delivery.completedAt 
                                ? new Date(delivery.completedAt).toLocaleString() 
                                : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleCloseModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RidersPage;
