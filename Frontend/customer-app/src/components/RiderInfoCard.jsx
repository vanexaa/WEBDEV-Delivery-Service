import React from 'react';

const RiderInfoCard = ({ riderInfo }) => {
  if (!riderInfo) return null;

  return (
    <div className="card mb-4">
      <div className="card-header">
        <h5 className="mb-0">Rider Information</h5>
      </div>
      <div className="card-body">
        <div className="row">
          <div className="col-md-6">
            <h6>Name</h6>
            <p>{riderInfo.fullName}</p>
          </div>
          <div className="col-md-6">
            <h6>Phone</h6>
            <p>
              <a
                href={`tel:${riderInfo.phoneNumber}`}
                className="btn btn-sm btn-outline-primary"
              >
                <i className="bi bi-telephone"></i> {riderInfo.phoneNumber}
              </a>
            </p>
          </div>
          {riderInfo.vehicleType && (
            <div className="col-md-6">
              <h6>Vehicle</h6>
              <p>{riderInfo.vehicleType}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiderInfoCard;
