import React from 'react';
import RiderNavbar from '../components/RiderNavbar';
import '../App.css';

const ProfilePage = () => {
  return (
    <>
      <RiderNavbar />
      <div className="container-fluid page-container">
        <div className="row">
          <div className="col-12">
            <h4 className="mb-3">Rider Profile</h4>
            <div className="card">
              <div className="card-body">
                <p>Profile page coming soon...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;

