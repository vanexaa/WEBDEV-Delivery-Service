import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { riderService } from '../services/api';
import RiderNavbar from '../components/RiderNavbar';
import '../App.css';

const ProfilePage = () => {
  const { riderId } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    vehicleType: '',
    vehicleNumber: ''
  });

  useEffect(() => {
    if (riderId) {
      loadProfile();
    }
  }, [riderId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profileData = await riderService.getRiderProfile(riderId);
      setProfile(profileData);
      if (profileData) {
        setFormData({
          fullName: profileData.fullName || '',
          phoneNumber: profileData.phoneNumber || '',
          email: profileData.email || '',
          vehicleType: profileData.vehicleType || '',
          vehicleNumber: profileData.vehicleNumber || ''
        });
      }
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load profile');
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await riderService.updateRiderProfile(riderId, formData);
      await loadProfile(); // Reload to show updated data
      setEditing(false);
      alert('Profile updated successfully!');
    } catch (err) {
      alert(err.message || 'Failed to update profile');
      console.error('Error updating profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        phoneNumber: profile.phoneNumber || '',
        email: profile.email || '',
        vehicleType: profile.vehicleType || '',
        vehicleNumber: profile.vehicleNumber || ''
      });
    }
    setEditing(false);
  };

  if (loading) {
    return (
      <>
        <RiderNavbar />
        <div className="container-fluid page-container">
          <div className="text-center mt-5">
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
        </div>
      </>
    );
  }

  return (
    <>
      <RiderNavbar />
      <div className="container-fluid page-container">
        <div className="row">
          <div className="col-lg-8 mx-auto">
            <div className="card">
              <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Profile & Settings</h5>
                {!editing && (
                  <button
                    className="btn btn-light btn-sm"
                    onClick={() => setEditing(true)}
                  >
                    <i className="bi bi-pencil"></i> Edit
                  </button>
                )}
              </div>
              <div className="card-body">
                {/* Statistics */}
                <div className="row mb-4">
                  <div className="col-md-4 text-center mb-3">
                    <div className="p-3 bg-light rounded">
                      <h6 className="text-muted">Total Deliveries</h6>
                      <h4>{profile.totalDeliveries || 0}</h4>
                    </div>
                  </div>
                  <div className="col-md-4 text-center mb-3">
                    <div className="p-3 bg-light rounded">
                      <h6 className="text-muted">Total Earnings</h6>
                      <h4 className="text-success">
                        ${(profile.totalEarnings || 0).toFixed(2)}
                      </h4>
                    </div>
                  </div>
                  <div className="col-md-4 text-center mb-3">
                    <div className="p-3 bg-light rounded">
                      <h6 className="text-muted">Average Rating</h6>
                      <h4>
                        {profile.averageRating
                          ? profile.averageRating.toFixed(1)
                          : 'N/A'}{' '}
                        <i className="bi bi-star-fill text-warning"></i>
                      </h4>
                    </div>
                  </div>
                </div>

                <hr />

                {/* Profile Information */}
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Full Name</label>
                    {editing ? (
                      <input
                        type="text"
                        className="form-control"
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData({ ...formData, fullName: e.target.value })
                        }
                      />
                    ) : (
                      <p>{profile.fullName || 'N/A'}</p>
                    )}
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Phone Number</label>
                    {editing ? (
                      <input
                        type="tel"
                        className="form-control"
                        value={formData.phoneNumber}
                        onChange={(e) =>
                          setFormData({ ...formData, phoneNumber: e.target.value })
                        }
                      />
                    ) : (
                      <p>{profile.phoneNumber || 'N/A'}</p>
                    )}
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Email</label>
                    {editing ? (
                      <input
                        type="email"
                        className="form-control"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                    ) : (
                      <p>{profile.email || 'N/A'}</p>
                    )}
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Vehicle Type</label>
                    {editing ? (
                      <select
                        className="form-select"
                        value={formData.vehicleType}
                        onChange={(e) =>
                          setFormData({ ...formData, vehicleType: e.target.value })
                        }
                      >
                        <option value="">Select Vehicle Type</option>
                        <option value="Bicycle">Bicycle</option>
                        <option value="Motorcycle">Motorcycle</option>
                        <option value="Car">Car</option>
                        <option value="Scooter">Scooter</option>
                      </select>
                    ) : (
                      <p>{profile.vehicleType || 'N/A'}</p>
                    )}
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Vehicle Number</label>
                    {editing ? (
                      <input
                        type="text"
                        className="form-control"
                        value={formData.vehicleNumber}
                        onChange={(e) =>
                          setFormData({ ...formData, vehicleNumber: e.target.value })
                        }
                      />
                    ) : (
                      <p>{profile.vehicleNumber || 'N/A'}</p>
                    )}
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Availability Status</label>
                    <p>
                      <span
                        className={`badge ${
                          profile.isOnline ? 'bg-success' : 'bg-secondary'
                        }`}
                      >
                        {profile.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </p>
                  </div>
                </div>

                {editing && (
                  <div className="mt-4">
                    <button className="btn btn-primary me-2" onClick={handleSave} disabled={saving}>
                      {saving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check"></i> Save Changes
                        </>
                      )}
                    </button>
                    <button className="btn btn-secondary" onClick={handleCancel} disabled={saving}>
                      <i className="bi bi-x"></i> Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
