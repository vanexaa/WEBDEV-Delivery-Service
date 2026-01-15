import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { riderService } from '../services/api';

const AvailabilityToggle = () => {
  const { riderId, token } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (riderId) {
      loadAvailability();
    } else {
      // If riderId is not available yet, stop loading
      setLoading(false);
    }
  }, [riderId]);

  const loadAvailability = async () => {
    if (!riderId) return; // Prevent API call if riderId is null
    try {
      const availability = await riderService.getAvailability(riderId);
      setIsOnline(availability.isOnline || false);
    } catch (error) {
      console.error('Error loading availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (e) => {
    const newStatus = e.target.checked;
    setUpdating(true);
    
    try {
      await riderService.updateAvailability(riderId, newStatus);
      setIsOnline(newStatus);
    } catch (error) {
      console.error('Error updating availability:', error);
      e.target.checked = !newStatus;
      alert('Failed to update availability. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="spinner-border spinner-border-sm" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="card-title mb-0">Availability Status</h5>
            <small className="text-muted">
              {isOnline ? 'Currently Online' : 'Currently Offline'}
            </small>
          </div>
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              id="availability-toggle"
              checked={isOnline}
              onChange={handleToggle}
              disabled={updating}
              style={{ width: '50px', height: '25px' }}
            />
            <label className="form-check-label ms-2" htmlFor="availability-toggle">
              {isOnline ? 'Go Offline' : 'Go Online'}
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityToggle;
