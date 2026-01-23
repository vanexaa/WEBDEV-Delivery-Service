import React, { useState, useEffect } from 'react';
import { useAuth } from '../../utils/AuthContext';
import { riderService } from '../../services/api';
import RiderNavbar from '../../components/RiderNavbar';
import '../../App.css';

const ProfilePage = () => {
  const { riderId } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (riderId) {
      loadProfile();
    } else {
      setLoading(false);
      setError('Rider ID not available');
    }
  }, [riderId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Validate riderId before making API call
      if (!riderId) {
        console.error('[ProfilePage] RiderId is null or undefined');
        
        // Try to get profile from JWT token (current user's profile)
        try {
          console.log('[ProfilePage] Attempting to load current rider profile from token...');
          const profileData = await riderService.getCurrentRiderProfile();
          if (profileData) {
            console.log('[ProfilePage] Current rider profile loaded:', profileData);
            setProfile(profileData);
            setError('');
            return;
          }
        } catch (tokenError) {
          console.warn('[ProfilePage] Failed to load profile from token:', tokenError);
        }
        
        setError('Rider ID is not available. Please log out and log in again.');
        setLoading(false);
        return;
      }

      // Ensure riderId is a number
      const numericRiderId = typeof riderId === 'string' ? parseInt(riderId, 10) : riderId;
      if (isNaN(numericRiderId) || numericRiderId <= 0) {
        console.error('[ProfilePage] Invalid riderId:', riderId);
        setError('Invalid rider ID. Please log out and log in again.');
        setLoading(false);
        return;
      }

      console.log('[ProfilePage] Loading profile for riderId:', numericRiderId);
      
      try {
        const profileData = await riderService.getRiderProfile(numericRiderId);
        console.log('[ProfilePage] Profile data received:', profileData);
        
        if (!profileData) {
          throw new Error('Profile data is null or undefined');
        }
        
        setProfile(profileData);
        setError('');
      } catch (apiError) {
        // If direct profile call fails, try current user endpoint as fallback
        console.warn('[ProfilePage] Direct profile call failed, trying current user endpoint:', apiError);
        try {
          const profileData = await riderService.getCurrentRiderProfile();
          if (profileData) {
            console.log('[ProfilePage] Profile loaded via current user endpoint:', profileData);
            setProfile(profileData);
            setError('');
            return;
          }
        } catch (fallbackError) {
          console.error('[ProfilePage] Fallback also failed:', fallbackError);
          throw apiError; // Throw original error
        }
        throw apiError;
      }
    } catch (err) {
      console.error('[ProfilePage] Error loading profile:', err);
      const errorMessage = err.message || 'Failed to load rider profile';
      setError(errorMessage);
      
      // Provide helpful error messages
      if (errorMessage.includes('Invalid rider ID') || errorMessage.includes('must be greater than 0')) {
        setError('Invalid rider ID. Please log out and log in again.');
      } else if (errorMessage.includes('not found')) {
        setError('Rider profile not found. Please contact administrator.');
      } else if (errorMessage.includes('Unauthorized') || errorMessage.includes('token')) {
        setError('Authentication failed. Please log out and log in again.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <RiderNavbar />
        <div className="container-fluid page-container">
          <div className="text-center py-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error || !profile) {
    return (
      <>
        <RiderNavbar />
        <div className="container-fluid page-container">
          <div className="alert alert-danger" role="alert">
            {error || 'Profile not found'}
          </div>
          <button className="btn btn-primary" onClick={loadProfile}>
            Retry
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <RiderNavbar />
      <div className="container-fluid page-container">
        <div className="row">
          <div className="col-12">
            <h4 className="px-4">Rider Profile</h4>
          </div>
        </div>

        <div className="row">
          <div className="md-6">
            <div className="card">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">Personal Information</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <h6 className="text-muted">Full Name</h6>
                  <p className="fs-5">{profile.fullName || profile.FullName || 'N/A'}</p>
                </div>
                <div className="mb-3">
                  <h6 className="text-muted">Phone Number</h6>
                  <p>{profile.phoneNumber || profile.PhoneNumber || 'N/A'}</p>
                </div>
                <div className="mb-3">
                  <h6 className="text-muted">Email</h6>
                  <p>{profile.email || profile.Email || 'N/A'}</p>
                </div>
                <div className="mb-3">
                  <h6 className="text-muted">Vehicle Type</h6>
                  <p>{profile.vehicleType || profile.VehicleType || 'N/A'}</p>
                </div>
                <div className="mb-3">
                  <h6 className="text-muted">Vehicle Number</h6>
                  <p>{profile.vehicleNumber || profile.VehicleNumber || 'N/A'}</p>
                </div>
                <div className="mb-3">
                  <h6 className="text-muted">Availability Status</h6>
                  <span className={`badge ${profile.isOnline || profile.IsOnline ? 'bg-success' : 'bg-secondary'}`}>
                    {profile.isOnline || profile.IsOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          
        </div>
      </div>
    </>
  );
};

export default ProfilePage;

