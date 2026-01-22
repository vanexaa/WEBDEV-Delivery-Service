import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { riderService } from '../../services/api';
import RiderNavbar from '../../components/RiderNavbar';
import safeStorage from '../../utils/storage';
import '../../App.css';

const RiderDetailsPage = () => {
  const navigate = useNavigate();
  const { riderId: contextRiderId, riderProfile: contextRiderProfile, user } = useAuth();
  
  // Get riderId from multiple sources
  const riderId = contextRiderId || contextRiderProfile?.riderId || user?.riderId || user?.RiderId || 
                  parseInt(safeStorage.getItem('riderId') || '0', 10);
  
  const [riderProfile, setRiderProfile] = useState(null);
  const [riderAvailability, setRiderAvailability] = useState(null);
  const [riderOrders, setRiderOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasAssignedOrders, setHasAssignedOrders] = useState(false);

  // Load rider data and check for assigned orders
  useEffect(() => {
    const loadRiderData = async () => {
      if (!riderId || riderId === 0 || isNaN(riderId)) {
        setError('Rider ID not available. Please log out and log back in.');
        setLoading(false);
        return;
      }

      try {
        setError('');
        
        // Fetch rider profile, availability, and orders in parallel
        const [profile, availability, orders] = await Promise.all([
          riderService.getRiderProfile(riderId).catch(err => {
            console.warn('[RiderDetailsPage] Error fetching rider profile:', err);
            return null;
          }),
          riderService.getRiderAvailability(riderId).catch(err => {
            console.warn('[RiderDetailsPage] Error fetching rider availability:', err);
            return null;
          }),
          riderService.getRiderOrders(riderId).catch(err => {
            console.warn('[RiderDetailsPage] Error fetching rider orders:', err);
            return [];
          })
        ]);

        console.log('[RiderDetailsPage] Rider data loaded:', { profile, availability, orders });
        
        setRiderProfile(profile);
        setRiderAvailability(availability);
        
        const ordersList = orders || [];
        setRiderOrders(ordersList);
        
        // Check if rider has any assigned/active orders
        const assignedOrders = ordersList.filter(order => {
          const status = order.status || order.Status || '';
          const activeStatuses = ['Assigned', 'assigned', 'Accepted', 'accepted', 'PickedUp', 'pickedUp', 
                                   'InTransit', 'inTransit', 'In Progress', 'in progress'];
          return activeStatuses.includes(status);
        });
        
        if (assignedOrders.length === 0) {
          // No assigned orders - redirect to dashboard
          console.log('[RiderDetailsPage] No assigned orders found, redirecting to dashboard');
          setError('You do not have any assigned orders. This page is only available when you have active orders.');
          setTimeout(() => {
            navigate('/rider/dashboard');
          }, 3000);
          setLoading(false);
          return;
        }
        
        setHasAssignedOrders(true);
      } catch (err) {
        console.error('[RiderDetailsPage] Error loading rider data:', err);
        setError(err.message || 'Failed to load rider information');
      } finally {
        setLoading(false);
      }
    };

    loadRiderData();
  }, [riderId, navigate]);

  // Extract display values with fallbacks
  const displayName = riderProfile?.fullName || riderProfile?.FullName || contextRiderProfile?.fullName || 'Rider';
  const phoneNumber = riderProfile?.phoneNumber || riderProfile?.PhoneNumber || contextRiderProfile?.phoneNumber || 'N/A';
  const email = riderProfile?.email || riderProfile?.Email || contextRiderProfile?.email || 'N/A';
  const vehicleType = riderProfile?.vehicleType || riderProfile?.VehicleType || contextRiderProfile?.vehicleType || 'N/A';
  const vehicleNumber = riderProfile?.vehicleNumber || riderProfile?.VehicleNumber || contextRiderProfile?.vehicleNumber || 'N/A';
  const ratingValue = riderProfile?.averageRating || riderProfile?.AverageRating || riderProfile?.rating || riderProfile?.Rating;
  const displayRating = ratingValue ? (typeof ratingValue === 'number' ? ratingValue.toFixed(1) : ratingValue) : '5.0';
  const isOnline = riderAvailability?.isOnline || riderAvailability?.IsOnline || false;
  
  // Get rider location coordinates
  const latitude = riderAvailability?.currentLatitude || riderAvailability?.CurrentLatitude;
  const longitude = riderAvailability?.currentLongitude || riderAvailability?.CurrentLongitude;
  const hasLocation = latitude != null && longitude != null;

  // Generate Google Maps URL for the location
  const mapsUrl = hasLocation 
    ? `https://www.google.com/maps?q=${latitude},${longitude}`
    : null;

  // Get last updated timestamp
  const lastSeen = riderAvailability?.lastSeen || riderAvailability?.LastSeen || 
                   riderAvailability?.updatedAt || riderAvailability?.UpdatedAt;
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown';
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const secondsAgo = Math.floor((now - date) / 1000);
      
      if (secondsAgo < 10) return 'Just now';
      if (secondsAgo < 60) return `${secondsAgo} seconds ago`;
      if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)} minutes ago`;
      return `${Math.floor(secondsAgo / 3600)} hours ago`;
    } catch {
      return 'Unknown';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower === 'assigned') return 'bg-warning text-dark';
    if (statusLower === 'accepted') return 'bg-info';
    if (statusLower === 'pickedup' || statusLower === 'picked up') return 'bg-primary';
    if (statusLower === 'intransit' || statusLower === 'in transit') return 'bg-primary';
    if (statusLower === 'delivered') return 'bg-success';
    if (statusLower === 'failed') return 'bg-danger';
    return 'bg-secondary';
  };

  return (
    <>
      <RiderNavbar />
      <div className="container-fluid py-4">
        <div className="row mb-3">
          <div className="col-12">
            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate('/rider/dashboard')}
            >
              <i className="bi bi-arrow-left"></i> Back to Dashboard
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading rider details...</p>
          </div>
        )}

        {error && !loading && (
          <div className="alert alert-warning" role="alert">
            <h5 className="alert-heading">Access Restricted</h5>
            <p>{error}</p>
            <hr />
            <p className="mb-0">
              <button className="btn btn-primary" onClick={() => navigate('/rider/dashboard')}>
                Go to Dashboard
              </button>
            </p>
          </div>
        )}

        {!loading && !error && hasAssignedOrders && riderProfile && (
          <>
            <div className="row mb-4">
              <div className="col-12">
                <h2>Rider Details</h2>
                <p className="text-muted">View your profile and assigned orders information</p>
              </div>
            </div>

            <div className="row">
              {/* Rider Profile Card */}
              <div className="col-md-6 mb-4">
                <div className="card h-100">
                  <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">
                      <i className="bi bi-person-circle"></i> Profile Information
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <h4 className="mb-1">{displayName}</h4>
                      <div className="d-flex align-items-center mb-2">
                        <i className="bi bi-star-fill text-warning me-2" style={{ fontSize: '20px' }}></i>
                        <span className="fs-5 fw-bold">{displayRating}</span>
                      </div>
                      <span className={`badge ${isOnline ? 'bg-success' : 'bg-secondary'}`}>
                        {isOnline ? '🟢 Online' : '⚫ Offline'}
                      </span>
                    </div>

                    <hr />

                    <div className="mb-2">
                      <strong><i className="bi bi-phone"></i> Phone:</strong>
                      <div className="ms-3">{phoneNumber}</div>
                    </div>

                    <div className="mb-2">
                      <strong><i className="bi bi-envelope"></i> Email:</strong>
                      <div className="ms-3">{email}</div>
                    </div>

                    <div className="mb-2">
                      <strong><i className="bi bi-bicycle"></i> Vehicle Type:</strong>
                      <div className="ms-3">{vehicleType}</div>
                    </div>

                    <div className="mb-2">
                      <strong><i className="bi bi-123"></i> Vehicle Number:</strong>
                      <div className="ms-3">{vehicleNumber}</div>
                    </div>

                    {riderProfile?.totalDeliveries !== undefined && (
                      <div className="mb-2">
                        <strong><i className="bi bi-box-seam"></i> Total Deliveries:</strong>
                        <div className="ms-3">{riderProfile.totalDeliveries || riderProfile.TotalDeliveries || 0}</div>
                      </div>
                    )}

                    {riderProfile?.totalEarnings !== undefined && (
                      <div className="mb-2">
                        <strong><i className="bi bi-currency-dollar"></i> Total Earnings:</strong>
                        <div className="ms-3">
                          ${(riderProfile.totalEarnings || riderProfile.TotalEarnings || 0).toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Location Card */}
              <div className="col-md-6 mb-4">
                <div className="card h-100">
                  <div className="card-header bg-info text-white">
                    <h5 className="mb-0">
                      <i className="bi bi-geo-alt"></i> Current Location
                    </h5>
                  </div>
                  <div className="card-body">
                    {hasLocation ? (
                      <>
                        <div className="mb-3" style={{
                          width: '100%',
                          height: '200px',
                          backgroundColor: '#f0f0f0',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: '1px solid #ddd'
                        }}>
                          {/* Simple map representation */}
                          <div style={{
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 50%, #81c784 100%)',
                            position: 'relative'
                          }}>
                            {/* Rider location pin */}
                            <div style={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              width: '24px',
                              height: '24px',
                              backgroundColor: '#dc3545',
                              borderRadius: '50% 50% 50% 0',
                              transformOrigin: 'center',
                              transform: 'translate(-50%, -100%) rotate(-45deg)',
                              border: '3px solid white',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                              zIndex: 10
                            }}>
                              <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%) rotate(45deg)',
                                width: '8px',
                                height: '8px',
                                backgroundColor: 'white',
                                borderRadius: '50%'
                              }}></div>
                            </div>
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="mb-2">
                            <strong>Coordinates:</strong>
                            <div>{latitude.toFixed(6)}, {longitude.toFixed(6)}</div>
                          </div>
                          {lastSeen && (
                            <div className="text-muted small">
                              <i className="bi bi-clock"></i> Last updated: {getTimeAgo(lastSeen)}
                            </div>
                          )}
                          {mapsUrl && (
                            <a
                              href={mapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline-primary mt-2"
                            >
                              <i className="bi bi-map"></i> Open in Maps
                            </a>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-muted py-5">
                        {isOnline 
                          ? 'Location not available. Make sure location permissions are granted.'
                          : 'Location not available. You are currently offline.'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Assigned Orders Section */}
            <div className="row">
              <div className="col-12">
                <div className="card">
                  <div className="card-header bg-warning text-dark">
                    <h5 className="mb-0">
                      <i className="bi bi-list-check"></i> Assigned Orders ({riderOrders.length})
                    </h5>
                  </div>
                  <div className="card-body">
                    {riderOrders.length === 0 ? (
                      <p className="text-muted text-center py-3">No assigned orders found.</p>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-hover">
                          <thead>
                            <tr>
                              <th>Order ID</th>
                              <th>Customer</th>
                              <th>Address</th>
                              <th>Status</th>
                              <th>Assigned At</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {riderOrders.map((order, index) => {
                              const orderId = order.orderId || order.OrderId;
                              const status = order.status || order.Status || 'Unknown';
                              return (
                                <tr key={orderId || index}>
                                  <td>
                                    <strong>#{orderId}</strong>
                                  </td>
                                  <td>
                                    {order.customerName || order.CustomerName || 'N/A'}
                                    {order.customerPhone && (
                                      <div className="small text-muted">
                                        <i className="bi bi-telephone"></i> {order.customerPhone || order.CustomerPhone}
                                      </div>
                                    )}
                                  </td>
                                  <td>
                                    <small>{order.deliveryAddress || order.DeliveryAddress || 'N/A'}</small>
                                  </td>
                                  <td>
                                    <span className={`badge ${getStatusBadgeClass(status)}`}>
                                      {status}
                                    </span>
                                  </td>
                                  <td>
                                    <small>{formatDate(order.assignedAt || order.AssignedAt)}</small>
                                  </td>
                                  <td>
                                    <button
                                      className="btn btn-sm btn-primary"
                                      onClick={() => {
                                        const transactionCode = `ORD-${orderId}`;
                                        navigate(`/rider/orders/${transactionCode}`);
                                      }}
                                    >
                                      <i className="bi bi-eye"></i> View
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default RiderDetailsPage;
