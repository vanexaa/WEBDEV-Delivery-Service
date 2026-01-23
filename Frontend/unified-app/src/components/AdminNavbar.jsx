import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import '../css/AdminNavbar.css'; // 👈 we’ll add this
import logo from '../assets/logo.png'; // 👈 make sure to have a logo image


const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
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

{/* CENTER – NAV LINKS */}
        <div className="kapebara-nav-links">
          <Link className={`nav-link ${isActive('/admin/dashboard')}`} to="/admin/dashboard">
                Dashboard
              </Link> 
          <Link className={`nav-link ${isActive('/admin/riders')}`} to="/admin/riders">
                Riders
              </Link>
          <Link className={`nav-link ${isActive('/admin/deliveries')}`} to="/admin/deliveries">
                Deliveries
              </Link>
          
         {/* <Link className={`nav-link ${isActive('/admin/history')}`} to="/admin/history">
                History
              </Link> */}
            
        </div>  

        {/* RIGHT – ICONS */}
        <div className="kapebara-nav-icons">
          <button className="icon-btn" title="Notifications">
            <i className="bi bi-bell"></i>
          </button>

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

          <div className="profile-menu">
            <button
              className="icon-btn"
                on Click={() => setShowProfileMenu(!showProfileMenu)}
                aria-label="Profile">
              <i className="bi bi-person"></i>
            </button>

            {showProfileMenu && (
              <div className="profile-dropdown-card">
                <button className="dropdown-item">Profile</button>
                <button className="dropdown-item">About KapeBara</button>
                <button className="dropdown-item danger" onClick={handleLogout}>
                  Log Out
                </button>
              </div>
            )}
          </div>
        
        <button
          className="icon-btn mobile-menu-btn"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            aria-label="Menu">
           <i className="bi bi-list"></i>
        </button>

        {showMobileMenu && (
          <div className="kapebara-mobile-menu">
            <Link to="/admin/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/admin/riders" className="nav-link">Riders</Link>
            <Link to="/admin/deliveries" className="nav-link">Deliveries</Link>
            <Link to="/admin/history" className="nav-link">History</Link>
          </div>
        )}
        </div>
      
    </nav>
  );
};

export default Navbar;
