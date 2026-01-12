import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

const CustomerNavbar = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-success">
      <div className="container-fluid">
        <span className="navbar-brand">
          <i className="bi bi-cart-check"></i> Customer Dashboard
        </span>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#customerNavbar"
          aria-controls="customerNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="customerNavbar">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <button
                className={`nav-link btn btn-link text-light ${isActive('/customer')}`}
                onClick={() => navigate('/customer')}
              >
                <i className="bi bi-house-door"></i> Dashboard
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link btn btn-link text-light ${isActive('/customer/track')}`}
                onClick={() => navigate('/customer/track')}
              >
                <i className="bi bi-truck"></i> Track Order
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

export default CustomerNavbar;
