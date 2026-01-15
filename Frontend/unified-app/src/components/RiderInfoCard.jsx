import React from 'react';

const RiderInfoCard = ({ riderInfo }) => {
  // Display rider info with proper field mapping
  // RiderInfoDto has: FullName, PhoneNumber, VehicleType, VehicleNumber, Rating, RiderId
  const displayName = riderInfo?.fullName || riderInfo?.FullName || riderInfo?.name || 'Driver';
  
  // Rating from backend or default
  const ratingValue = riderInfo?.rating || riderInfo?.Rating || riderInfo?.averageRating || riderInfo?.AverageRating;
  const displayRating = ratingValue ? (typeof ratingValue === 'number' ? ratingValue.toFixed(1) : ratingValue) : '5.0';
  
  // Plate/Vehicle number - check multiple possible field names
  const displayPlate = riderInfo?.vehicleNumber || riderInfo?.VehicleNumber || 
                       riderInfo?.plateNumber || riderInfo?.PlateNumber || 
                       riderInfo?.vehicleType || riderInfo?.VehicleType || 'N/A';

  return (
    <div style={{ marginBottom: '24px', marginTop: '10px' }}>
      {/* Driver Name - Large, Bold */}
      <h3 style={{ 
        fontSize: '28px', 
        fontWeight: 'bold', 
        marginBottom: '12px',
        color: '#333',
        lineHeight: '1.2',
        margin: 0,
        padding: 0
      }}>
        {displayName}
      </h3>
      
      {/* Rating with Yellow Star Icon */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px', 
        marginBottom: '12px',
        marginTop: '8px'
      }}>
        <i className="bi bi-star-fill" style={{ color: '#FFD700', fontSize: '24px' }}></i>
        <span style={{ fontSize: '20px', fontWeight: '600', color: '#333' }}>
          {displayRating}
        </span>
      </div>
      
      {/* Plate Number */}
      <div style={{ color: '#666', fontSize: '15px' }}>
        Plate # {displayPlate}
      </div>
    </div>
  );
};

export default RiderInfoCard;
