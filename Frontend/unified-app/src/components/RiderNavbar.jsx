import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import safeStorage, { safeSessionStorage } from '../utils/storage';
import logo from '../assets/logo.png';
import '../css/RiderNavbar.css';

const RiderNavbar = () => {
  const { logout, user, riderProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    safeStorage.clear();
    safeSessionStorage.clear();
    window.location.href = '/login';
  };

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/')
      ? 'active'
      : '';

  return (
    <nav className="kapebara-navbar">
        {/* LEFT – LOGO */}
        <div className="logo-container" onClick={(e) => navigateTo && navigateTo('dashboard', e)}>
          <img 
            src={logo} 
            alt="Kapebara Admin" 
            className="logo-img"
            onError={(e) => {e.target.style.display='none'; e.target.nextSibling.style.display='block'}} 
          />
          <span className="logo-text" style={{display: 'none'}}>Kapebara</span>
        </div>

        {/* CENTER – LINKS (DESKTOP ONLY) */}
        <div className="kapebara-nav-links">
          <button
            className={`nav-link ${isActive('/rider/dashboard')}`}
            onClick={() => navigate('/rider/dashboard')}
          >
            Dashboard
          </button>

          <button
            className={`nav-link ${isActive('/rider/history')}`}
            onClick={() => navigate('/rider/history')}
          >
            History
          </button>

          <button
            className={`nav-link ${isActive('/rider/profile')}`}
            onClick={() => navigate('/rider/profile')}
          >
            Profile
          </button>
        </div>

        {/* RIGHT – USER + ICONS */}
        <div className="kapebara-nav-icons">
          <span className="rider-name hidden-mobile">
            Hi, {riderProfile?.fullName || riderProfile?.FullName || user?.username || 'Rider'}
          </span>

          {/* LOGOUT (DESKTOP) */}
          <button className="icon-btn hidden-mobile" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i>
          </button>

          {/* MOBILE MENU BUTTON */}
          <button
            className="icon-btn mobile-menu-btn"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <i className="bi bi-list"></i>
          </button>
        </div>

      {/* MOBILE DROPDOWN */}
      {showMobileMenu && (
        <div className="kapebara-mobile-menu">
          <button onClick={() => { navigate('/rider/dashboard'); setShowMobileMenu(false); }}>
            Dashboard
          </button>
          <button onClick={() => { navigate('/rider/history'); setShowMobileMenu(false); }}>
            History
          </button>
          <button onClick={() => { navigate('/rider/profile'); setShowMobileMenu(false); }}>
            Profile
          </button>

          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default RiderNavbar;
