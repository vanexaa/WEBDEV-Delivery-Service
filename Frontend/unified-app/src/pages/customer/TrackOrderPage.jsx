import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { deliveryService, customerService, orderService } from '../../services/api';
import RiderInfoCard from '../../components/RiderInfoCard';
import '../../App.css';

const TrackOrderPage = () => {
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState(null);
  const [riderInfo, setRiderInfo] = useState(null);
  const [eta, setEta] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [chatMessage, setChatMessage] = useState('');

  const handleTrack = async () => {
    if (!orderId) {
      setError('Please enter an order ID');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Fetch order details
      const orderData = await orderService.getOrderById(orderId);
      setOrder(orderData);

      // Fetch tracking information
      const trackingData = await deliveryService.getDeliveryTracking(orderId);
      setTracking(trackingData);

      // Fetch rider info if delivery is assigned
      if (trackingData?.riderId) {
        try {
          const rider = await customerService.getRiderInfo(orderId);
          setRiderInfo(rider);
        } catch (err) {
          console.error('Error fetching rider info:', err);
        }
      }

      // Fetch ETA
      try {
        const etaData = await customerService.getETA(orderId);
        setEta(etaData);
      } catch (err) {
        console.error('Error fetching ETA:', err);
      }
    } catch (err) {
      setError(err.message || 'Failed to load tracking information');
      setTracking(null);
      setOrder(null);
      setRiderInfo(null);
      setEta(null);
    } finally {
      setLoading(false);
    }
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (chatMessage.trim()) {
      // TODO: Implement chat functionality
      console.log('Sending message:', chatMessage);
      setChatMessage('');
    }
  };

  const handleCallDriver = () => {
    if (riderInfo?.phoneNumber) {
      window.location.href = `tel:${riderInfo.phoneNumber}`;
    } else {
      alert('Driver phone number not available');
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f5f5f5', 
      padding: '20px',
      position: 'relative'
    }}>
      {/* Back Arrow */}
      <button
        onClick={() => navigate(-1)}
        style={{
          position: 'absolute',
          left: '20px',
          top: '20px',
          background: 'none',
          border: 'none',
          fontSize: '24px',
          cursor: 'pointer',
          zIndex: 10,
          padding: '10px'
        }}
      >
        <i className="bi bi-arrow-left" style={{ fontSize: '32px', color: '#333' }}></i>
      </button>

      <div style={{ 
        maxWidth: '600px', 
        margin: '0 auto',
        paddingTop: '60px'
      }}>
        {!tracking && !loading && (
          <div className="card" style={{ borderRadius: '20px', padding: '30px' }}>
            <h2 className="mb-4">Track Your Order</h2>
            <div className="mb-3">
              <input
                type="text"
                className="form-control form-control-lg"
                placeholder="Enter Order ID or Transaction Code"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleTrack()}
                style={{ borderRadius: '12px', padding: '12px' }}
              />
              <button 
                onClick={handleTrack} 
                className="btn btn-primary mt-3 w-100" 
                disabled={loading}
                style={{ borderRadius: '12px', padding: '12px' }}
              >
                {loading ? 'Tracking...' : 'Track Order'}
              </button>
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
          </div>
        )}

        {loading && (
          <div className="card" style={{ borderRadius: '20px', padding: '40px', textAlign: 'center' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading tracking information...</p>
          </div>
        )}

        {tracking && !loading && (
          <div className="card" style={{ 
            borderRadius: '20px', 
            padding: '0',
            overflow: 'hidden',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            position: 'relative'
          }}>
            {/* Estimated Time Badge */}
            <div style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              backgroundColor: '#fff',
              padding: '10px 18px',
              borderRadius: '25px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              zIndex: 5,
              minWidth: '120px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#666', marginBottom: '4px' }}>
                Estimated time
              </div>
              {eta ? (
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                  {eta.estimatedMinutes ? `${eta.estimatedMinutes} min` : eta.estimatedTime || 'Calculating...'}
                </div>
              ) : (
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                  Calculating...
                </div>
              )}
            </div>

            <div style={{ padding: '24px' }}>
              {/* Driver Information */}
              <RiderInfoCard riderInfo={riderInfo} />

              {/* Map Container */}
              <div style={{
                width: '100%',
                height: '300px',
                backgroundColor: '#f0f0f0',
                borderRadius: '12px',
                marginBottom: '16px',
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid #ddd'
              }}>
                {/* Map with street layout - Stylized representation */}
                <div style={{
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                  background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 50%, #81c784 100%)',
                  backgroundImage: `
                    repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px),
                    repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px),
                    radial-gradient(circle at 30% 40%, #4caf50 0%, #4caf50 15%, transparent 15%),
                    radial-gradient(circle at 70% 60%, #2196f3 0%, #2196f3 20%, transparent 20%)
                  `,
                  backgroundSize: '40px 40px, 40px 40px, 200px 200px, 150px 150px',
                  backgroundPosition: '0 0, 0 0, 0 0, 100% 100%'
                }}>
                  {/* Street grid overlay */}
                  <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                    {/* Horizontal streets */}
                    <line x1="0" y1="25%" x2="100%" y2="25%" stroke="#999" strokeWidth="2" opacity="0.3" />
                    <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#999" strokeWidth="2" opacity="0.3" />
                    <line x1="0" y1="75%" x2="100%" y2="75%" stroke="#999" strokeWidth="2" opacity="0.3" />
                    {/* Vertical streets */}
                    <line x1="25%" y1="0" x2="25%" y2="100%" stroke="#999" strokeWidth="2" opacity="0.3" />
                    <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#999" strokeWidth="2" opacity="0.3" />
                    <line x1="75%" y1="0" x2="75%" y2="100%" stroke="#999" strokeWidth="2" opacity="0.3" />
                  </svg>
                  
                  {/* Red pins for locations */}
                  {/* Pin 1 - Restaurant/Pickup */}
                  <div style={{
                    position: 'absolute',
                    top: '30%',
                    left: '25%',
                    width: '24px',
                    height: '24px',
                    backgroundColor: '#dc3545',
                    borderRadius: '50% 50% 50% 0',
                    transform: 'rotate(-45deg)',
                    border: '3px solid white',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
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
                  
                  {/* Pin 2 - Rider current location */}
                  <div style={{
                    position: 'absolute',
                    top: '45%',
                    left: '50%',
                    width: '24px',
                    height: '24px',
                    backgroundColor: '#dc3545',
                    borderRadius: '50% 50% 50% 0',
                    transform: 'rotate(-45deg)',
                    border: '3px solid white',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
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
                  
                  {/* Pin 3 - Customer destination */}
                  <div style={{
                    position: 'absolute',
                    top: '65%',
                    left: '75%',
                    width: '24px',
                    height: '24px',
                    backgroundColor: '#dc3545',
                    borderRadius: '50% 50% 50% 0',
                    transform: 'rotate(-45deg)',
                    border: '3px solid white',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
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
                  
                  {/* Pin 4 - Additional location */}
                  <div style={{
                    position: 'absolute',
                    top: '20%',
                    left: '60%',
                    width: '24px',
                    height: '24px',
                    backgroundColor: '#dc3545',
                    borderRadius: '50% 50% 50% 0',
                    transform: 'rotate(-45deg)',
                    border: '3px solid white',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
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

              {/* Location Text */}
              <div style={{ 
                color: '#666', 
                fontSize: '14px', 
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                Location {order?.deliveryAddress || tracking?.deliveryAddress || 'customer location'}
              </div>

              {/* Chat and Call Section */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '8px' }}>
                <form onSubmit={handleChatSubmit} style={{ flex: 1, margin: 0 }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Chat with your driver"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    style={{
                      borderRadius: '25px',
                      padding: '14px 24px',
                      border: '1px solid #ddd',
                      fontSize: '15px',
                      width: '100%'
                    }}
                  />
                </form>
                <button
                  onClick={handleCallDriver}
                  className="btn btn-primary"
                  style={{
                    borderRadius: '50%',
                    width: '52px',
                    height: '52px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    flexShrink: 0,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                  disabled={!riderInfo?.phoneNumber}
                >
                  <i className="bi bi-telephone-fill" style={{ fontSize: '22px' }}></i>
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrderPage;
