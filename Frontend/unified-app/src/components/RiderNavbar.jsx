import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

const RiderNavbar = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    // Clear all storage and redirect to login page
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/login';
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/') ? 'active' : '';
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container-fluid">
        <span className="navbar-brand">
          <i className="bi bi-bicycle"></i> Rider Dashboard
        </span>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#riderNavbar"
          aria-controls="riderNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="riderNavbar">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <button
                className={`nav-link btn btn-link text-light ${isActive('/rider/dashboard')}`}
                onClick={() => navigate('/rider/dashboard')}
              >
                <i className="bi bi-house-door"></i> Dashboard
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link btn btn-link text-light ${isActive('/rider/history')}`}
                onClick={() => navigate('/rider/history')}
              >
                <i className="bi bi-clock-history"></i> History
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link btn btn-link text-light ${isActive('/rider/profile')}`}
                onClick={() => navigate('/rider/profile')}
              >
                <i className="bi bi-person-circle"></i> Profile
              </button>
            </li>
          </ul>
          <ul className="navbar-nav">
            <li className="nav-item">
              <span className="nav-link">Welcome, {user?.username}</span>
            </li>
            <li className="nav-item">
              <button className="nav-link btn btn-link text-light" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right"></i> Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default RiderNavbar;
