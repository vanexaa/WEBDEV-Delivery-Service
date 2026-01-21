import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import logo from '../assets/logo.png';
import '../css/CustomerNavbar.css';

const CustomerNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
  <nav className="kapebara-navbar">
    <div className="logo-container" onClick={(e) => navigateTo && navigateTo('dashboard', e)}>
              <img 
                src={logo} 
                alt="Kapebara Admin" 
                className="logo-img"
                onError={(e) => {e.target.style.display='none'; e.target.nextSibling.style.display='block'}} 
              />
              <span className="logo-text" style={{display: 'none'}}>Kapebara</span>
            </div>

      {/* CENTER – LINKS */}
      <div className="kapebara-nav-links">
        <Link
          to="/customer/orders"
          className={`nav-link ${isActive('/customer/orders') ? 'active' : ''}`}
        >
          My Orders
        </Link>

        <Link
          to="/customer/orders-test"
          className={`nav-link ${isActive('/customer/orders-test') ? 'active' : ''}`}
        >
          Create Order
        </Link>
      </div>

      {/* RIGHT – USER + LOGOUT */}
      <div className="kapebara-nav-icons">
        <span className="user-name hidden-mobile">
          Hi, {user?.username}
        </span>

        <button
          className="icon-btn"
          onClick={handleLogout}
          aria-label="Logout"
        >
          <i className="bi bi-box-arrow-right"></i>
        </button>
      </div>

    
  </nav>
);

};

export default CustomerNavbar;
