import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { riderService } from '../services/api';

const AvailabilityToggle = () => {
  const { riderId } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load initial availability status from API
    const loadAvailability = async () => {
      if (riderId) {
        try {
          const availability = await riderService.getRiderAvailability(riderId);
          setIsOnline(availability?.isOnline || false);
        } catch (error) {
          console.error('Error loading availability:', error);
          // Fallback to localStorage
          const savedStatus = localStorage.getItem(`rider_${riderId}_online`);
          if (savedStatus !== null) {
            setIsOnline(savedStatus === 'true');
          }
        }
      }
    };
    loadAvailability();
  }, [riderId]);

  const handleToggle = async () => {
    if (!riderId) return;
    
    try {
      setLoading(true);
      const newStatus = !isOnline;
      
      // Update via API
      await riderService.updateAvailability(riderId, newStatus);
      
      // Update local state on success
      setIsOnline(newStatus);
      
      // Save to localStorage as backup
      localStorage.setItem(`rider_${riderId}_online`, newStatus.toString());
      
    } catch (error) {
      console.error('Error updating availability:', error);
      // Revert on error
      setIsOnline(!isOnline);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h6 className="mb-1">Availability Status</h6>
            <p className="text-muted mb-0 small">
              {isOnline 
                ? 'You are currently online and can receive orders' 
                : 'You are offline and will not receive new orders'}
            </p>
          </div>
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              role="switch"
              id="availabilityToggle"
              checked={isOnline}
              onChange={handleToggle}
              disabled={loading || !riderId}
              style={{ width: '3rem', height: '1.5rem' }}
            />
            <label className="form-check-label ms-2" htmlFor="availabilityToggle">
              <span className={`badge ${isOnline ? 'bg-success' : 'bg-secondary'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityToggle;

