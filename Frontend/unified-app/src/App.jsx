import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './utils/AuthContext';
import LoginPage from './pages/LoginPage';
import CustomerDashboard from './pages/CustomerDashboard';
import TrackOrderPage from './pages/TrackOrderPage';
import './App.css';

// Protected Route Component with Role-based routing
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Role-based redirect after login
const RoleRedirect = () => {
  const { user, loading } = useAuth();

  React.useEffect(() => {
    if (!loading && user) {
      // Check if user is returning from a failed redirect (to prevent loop)
      const urlParams = new URLSearchParams(window.location.search);
      const clearSession = urlParams.get('clearSession');
      
      if (clearSession === 'true') {
        // User came back from rider-app with clearSession flag
        // Clear the session and redirect to login
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        sessionStorage.removeItem('rider_redirect_attempted');
        window.location.href = '/login';
        return;
      }
      
      // Only check redirect flag if we're on the root path (not after navigation)
      // This prevents the flag from interfering with fresh logins
      const redirectAttempted = sessionStorage.getItem('rider_redirect_attempted');
      const currentPath = window.location.pathname;
      
      // If flag exists and we're at root, it means a previous redirect failed
      // But only act on it if we haven't navigated away yet
      if (redirectAttempted && currentPath === '/') {
        // Clear the flag and allow fresh redirect attempt
        sessionStorage.removeItem('rider_redirect_attempted');
      }
      
      if (user.role === 'Rider') {
        // Get token from localStorage
        const token = localStorage.getItem('authToken');
        if (token) {
          // Set flag to prevent redirect loop
          sessionStorage.setItem('rider_redirect_attempted', 'true');
          // Redirect to rider-app with token in URL
          // User data will be fetched by rider-app using the token
          window.location.href = `http://localhost:3001/?token=${encodeURIComponent(token)}`;
        }
      } else if (user.role === 'Admin') {
        // Get token from localStorage
        const token = localStorage.getItem('authToken');
        if (token) {
          // Redirect to admin-app with token in URL
          window.location.href = `http://localhost:3001/?token=${encodeURIComponent(token)}`;
        }
      }
    }
  }, [user, loading]);

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="spinner-border" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user.role === 'Customer') {
    return <Navigate to="/customer" />;
  }

  // For Rider and Admin, redirect is handled in useEffect
  return <div className="d-flex justify-content-center align-items-center vh-100">
    <div className="spinner-border" role="status">
      <span className="visually-hidden">Redirecting...</span>
    </div>
  </div>;
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={<RoleRedirect />}
        />
        <Route
          path="/customer"
          element={
            <ProtectedRoute allowedRoles={['Customer']}>
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/track"
          element={
            <ProtectedRoute allowedRoles={['Customer']}>
              <TrackOrderPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;
