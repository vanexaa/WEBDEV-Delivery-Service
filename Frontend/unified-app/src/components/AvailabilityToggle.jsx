import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { riderService } from '../services/api';
import safeStorage from '../utils/storage';

const AvailabilityToggle = () => {
  const { riderId } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load initial availability status from API
    const loadAvailability = async () => {
      // Try to get riderId from context or localStorage
      let currentRiderId = riderId;
      
      if (!currentRiderId) {
        // Try localStorage as fallback
        const storedRiderId = safeStorage.getItem('riderId');
        if (storedRiderId) {
          console.log('[AvailabilityToggle] Using riderId from localStorage:', storedRiderId);
          currentRiderId = storedRiderId;
        } else {
          console.warn('[AvailabilityToggle] No riderId available yet, will retry...');
          // Retry after a delay
          const retryTimer = setTimeout(() => {
            const retryRiderId = safeStorage.getItem('riderId');
            if (retryRiderId) {
              loadAvailability();
            }
          }, 2000);
          return () => clearTimeout(retryTimer);
        }
      }
      
      try {
        // Ensure riderId is a number
        const numericRiderId = typeof currentRiderId === 'string' ? parseInt(currentRiderId, 10) : currentRiderId;
        if (isNaN(numericRiderId) || numericRiderId <= 0) {
          console.error('[AvailabilityToggle] Invalid riderId:', currentRiderId);
          return;
        }
        
        console.log('[AvailabilityToggle] Loading availability for riderId:', numericRiderId);
        
        const availability = await riderService.getRiderAvailability(numericRiderId);
        console.log('[AvailabilityToggle] Availability response:', availability);
        
        // Handle both camelCase and PascalCase
        const isOnlineValue = availability?.isOnline !== undefined 
          ? availability.isOnline 
          : (availability?.IsOnline !== undefined ? availability.IsOnline : false);
        
        console.log('[AvailabilityToggle] Setting isOnline to:', isOnlineValue);
        setIsOnline(isOnlineValue);
        
        // Save to localStorage as backup
        safeStorage.setItem(`rider_${numericRiderId}_online`, isOnlineValue.toString());
      } catch (error) {
        console.error('[AvailabilityToggle] Error loading availability:', error);
        console.error('[AvailabilityToggle] Error details:', {
          message: error.message,
          stack: error.stack
        });
        
        // Fallback to localStorage
        const numericRiderId = typeof currentRiderId === 'string' ? parseInt(currentRiderId, 10) : currentRiderId;
        if (!isNaN(numericRiderId) && numericRiderId > 0) {
          const savedStatus = safeStorage.getItem(`rider_${numericRiderId}_online`);
          if (savedStatus !== null) {
            console.log('[AvailabilityToggle] Using saved availability status from localStorage:', savedStatus);
            setIsOnline(savedStatus === 'true');
          } else {
            console.log('[AvailabilityToggle] No saved availability status, defaulting to offline');
            setIsOnline(false);
          }
        }
      }
    };
    
    loadAvailability();
  }, [riderId]);

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        console.warn('[AvailabilityToggle] Geolocation not supported by browser');
        // Use default location (can be configured) - example: Manila, Philippines
        resolve({ latitude: 14.5995, longitude: 120.9842 });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log('[AvailabilityToggle] Location obtained:', { latitude, longitude });
          resolve({ latitude, longitude });
        },
        (error) => {
          console.warn('[AvailabilityToggle] Geolocation error:', error);
          // Use default location if geolocation fails or is denied
          // Example: Manila, Philippines coordinates
          resolve({ latitude: 14.5995, longitude: 120.9842 });
        },
        {
          enableHighAccuracy: true, // Use GPS for high accuracy
          timeout: 10000, // Allow up to 10 seconds for GPS to get accurate fix
          maximumAge: 0 // Never use cached location - always get fresh GPS data
        }
      );
    });
  };

  const handleToggle = async () => {
    // Get riderId from context or localStorage
    let currentRiderId = riderId;
    
    if (!currentRiderId) {
      // Try to get from localStorage
      const storedRiderId = safeStorage.getItem('riderId');
      if (storedRiderId) {
        console.log('[AvailabilityToggle] Using riderId from localStorage for toggle');
        currentRiderId = storedRiderId;
      } else {
        console.error('[AvailabilityToggle] Cannot toggle availability: riderId is not set');
        alert('Rider ID not found. Please log out and log in again.');
        return;
      }
    }
    
    // Ensure riderId is a number
    const numericRiderId = typeof currentRiderId === 'string' ? parseInt(currentRiderId, 10) : currentRiderId;
    if (isNaN(numericRiderId) || numericRiderId <= 0) {
      console.error('[AvailabilityToggle] Invalid riderId:', currentRiderId);
      alert('Invalid rider ID. Please log out and log in again.');
      return;
    }
    
    try {
      setLoading(true);
      const newStatus = !isOnline;
      console.log(`[AvailabilityToggle] === TOGGLE START ===`);
      console.log(`[AvailabilityToggle] Current status: ${isOnline}`);
      console.log(`[AvailabilityToggle] New status: ${newStatus}`);
      console.log(`[AvailabilityToggle] RiderId: ${numericRiderId}`);
      
      // Get location coordinates if going online
      let latitude = null;
      let longitude = null;
      
      if (newStatus) {
        // Only fetch location when going online
        console.log('[AvailabilityToggle] Fetching current location...');
        const location = await getCurrentLocation();
        latitude = location.latitude;
        longitude = location.longitude;
        console.log('[AvailabilityToggle] Location to send:', { latitude, longitude });
      }
      
      // Update via API with location
      console.log(`[AvailabilityToggle] Calling API: updateAvailability(${numericRiderId}, ${newStatus}, ${latitude}, ${longitude})`);
      const result = await riderService.updateAvailability(numericRiderId, newStatus, latitude, longitude);
      console.log('[AvailabilityToggle] Availability update response:', result);
      
      // Optimistically update UI immediately
      setIsOnline(newStatus);
      console.log('[AvailabilityToggle] UI updated optimistically to:', newStatus);
      
      // Force refresh from server after a short delay to ensure consistency
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Re-fetch from server to get actual state
      try {
        console.log('[AvailabilityToggle] Refreshing availability from server...');
        const refreshed = await riderService.getRiderAvailability(numericRiderId);
        console.log('[AvailabilityToggle] Refreshed availability:', refreshed);
        
        // Handle both camelCase and PascalCase
        const actualStatus = refreshed?.isOnline !== undefined 
          ? refreshed.isOnline 
          : (refreshed?.IsOnline !== undefined ? refreshed.IsOnline : newStatus);
        
        setIsOnline(actualStatus);
        
        // Save to localStorage as backup
        safeStorage.setItem(`rider_${numericRiderId}_online`, actualStatus.toString());
        
        console.log(`[AvailabilityToggle] === TOGGLE SUCCESS ===`);
        console.log(`[AvailabilityToggle] Final status: ${actualStatus ? 'Online' : 'Offline'}`);
      } catch (refreshError) {
        console.warn('[AvailabilityToggle] Could not refresh, using optimistic update:', refreshError);
        console.warn('[AvailabilityToggle] Refresh error details:', {
          message: refreshError.message,
          stack: refreshError.stack
        });
        // Keep the optimistic update
        safeStorage.setItem(`rider_${numericRiderId}_online`, newStatus.toString());
        console.log('[AvailabilityToggle] Using optimistic update status:', newStatus);
      }
      
    } catch (error) {
      console.error('[AvailabilityToggle] === TOGGLE ERROR ===');
      console.error('[AvailabilityToggle] Error updating availability:', error);
      console.error('[AvailabilityToggle] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Show user-friendly error
      const errorMessage = error.message || 'Unknown error occurred';
      alert(`Failed to update availability: ${errorMessage}`);
      
      // Revert on error - try to reload from server
      try {
        console.log('[AvailabilityToggle] Attempting to revert status...');
        const currentAvailability = await riderService.getRiderAvailability(numericRiderId);
        const currentStatus = currentAvailability?.isOnline !== undefined
          ? currentAvailability.isOnline
          : (currentAvailability?.IsOnline !== undefined ? currentAvailability.IsOnline : false);
        setIsOnline(currentStatus);
        console.log('[AvailabilityToggle] Status reverted to:', currentStatus);
      } catch (revertError) {
        // If we can't revert, keep current state
        console.error('[AvailabilityToggle] Could not revert status:', revertError);
        // Don't change the state if revert fails
      }
    } finally {
      setLoading(false);
      console.log('[AvailabilityToggle] Toggle operation completed');
    }
  };

  // Get riderId for display purposes (from context or localStorage)
  const displayRiderId = riderId || safeStorage.getItem('riderId');
  const isDisabled = loading || (!riderId && !safeStorage.getItem('riderId'));

  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h6 className="mb-1">Availability Status</h6>
            <p className="text-muted mb-0 small">
              {loading 
                ? 'Updating...' 
                : (isOnline 
                  ? 'You are currently online and can receive orders' 
                  : 'You are offline and will not receive new orders')}
            </p>
            {displayRiderId && (
              <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>
                Rider ID: {displayRiderId}
              </p>
            )}
          </div>
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              role="switch"
              id="availabilityToggle"
              checked={isOnline}
              onChange={handleToggle}
              disabled={isDisabled}
              title={isDisabled 
                ? (loading ? 'Updating availability...' : 'Rider ID not loaded. Please refresh the page.') 
                : 'Click to toggle online/offline status'}
              style={{ width: '3rem', height: '1.5rem', cursor: isDisabled ? 'not-allowed' : 'pointer' }}
            />
            <label className="form-check-label ms-2" htmlFor="availabilityToggle" style={{ cursor: isDisabled ? 'not-allowed' : 'pointer' }}>
              <span className={`badge ${isOnline ? 'bg-success' : 'bg-secondary'}`}>
                {loading ? '...' : (isOnline ? 'Online' : 'Offline')}
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityToggle;

