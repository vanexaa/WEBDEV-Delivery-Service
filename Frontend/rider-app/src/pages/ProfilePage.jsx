import React, { useEffect, useState } from 'react';
import RiderNavbar from '../components/RiderNavbar';
import { getRiderProfile } from '../services/riderService';
import '../App.css';

const ProfilePage = () => {
  const [rider, setRider] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getRiderProfile();
        setRider(data);
      } catch (err) {
        setError('Failed to fetch');
      }
    };

    loadProfile();
  }, []);

  return (
    <>
      <RiderNavbar />

      <div className="container-fluid page-container">
        <div className="row justify-content-center">
          <div className="col-lg-6 col-md-8 col-12">
            <h4 className="mb-3">Rider Profile</h4>

            {error && <p className="text-danger">{error}</p>}
            {!rider && !error && <p>Loading profile...</p>}

            {rider && (
              <div className="card shadow-sm">
                <div className="card-body text-center">
                  <img
                    src={rider.profileImage}
                    alt="Rider"
                    className="rounded-circle mb-3"
                    width="120"
                    height="120"
                  />

                  <h5 className="mb-1">{rider.fullName}</h5>
                  <p className="text-muted mb-3">Delivery Rider</p>

                  <hr />

                  <div className="text-start">
                    <p><strong>Email:</strong> {rider.email}</p>
                    <p><strong>Phone:</strong> {rider.phoneNumber}</p>
                    <p><strong>Vehicle:</strong> {rider.vehicleType}</p>
                    <p><strong>Plate No:</strong> {rider.vehicleNumber}</p>
                    <p>
                      <strong>Status:</strong>{' '}
                      <span className="badge bg-success">{rider.status}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
// riderService.js