import React, { useState, useEffect } from 'react';
import { riderService } from '../services/api';
import '../App.css';

const RidersPage = () => {
  const [riders, setRiders] = useState([]);
  const [filteredRiders, setFilteredRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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
  );
};

export default RidersPage;
