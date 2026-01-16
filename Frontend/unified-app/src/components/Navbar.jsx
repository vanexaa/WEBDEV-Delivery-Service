import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/admin/dashboard">
          <i className="bi bi-shield-check"></i> Admin Dashboard
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/admin/dashboard')}`} to="/admin/dashboard">
                Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/admin/riders')}`} to="/admin/riders">
                Riders
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/admin/deliveries')}`} to="/admin/deliveries">
                Deliveries
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/admin/history')}`} to="/admin/history">
                History
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/orders')}`} to="/orders">
                Orders (Test)
              </Link>
            </li>
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

export default Navbar;
