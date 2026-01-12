import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './utils/AuthContext';
import DashboardPage from './pages/DashboardPage';
import OrderDetailsPage from './pages/OrderDetailsPage';
import EarningsPage from './pages/EarningsPage';
import ProfilePage from './pages/ProfilePage';
import RiderNavbar from './components/RiderNavbar';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const [tokenInUrl, setTokenInUrl] = React.useState(null);
  
  // Check if there's a token in URL (from unified-app redirect) - only once on mount
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    setTokenInUrl(token);
  }, []);
  
  // Wait for authentication check to complete
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  // If not authenticated
  if (!isAuthenticated) {
    // If there was a token in URL but auth failed, show error (don't redirect to prevent loop)
    if (tokenInUrl) {
      return (
        <div className="d-flex justify-content-center align-items-center vh-100">
          <div className="alert alert-danger" style={{ maxWidth: '500px', margin: '20px' }}>
            <h5>Authentication Failed</h5>
            <p>The authentication token is invalid or expired.</p>
            <p>Please <a href="http://localhost:3000/login" onClick={() => {
              // Clear unified-app's session when clicking login link
              // Open unified-app in same window to clear its session
              window.location.href = 'http://localhost:3000/login?clearSession=true';
            }}>log in again</a></p>
          </div>
        </div>
      );
    }
    
    // If no token in URL (direct visit), redirect to login
    // But only once to prevent loops
    const redirectKey = 'rider_app_redirect_attempted';
    if (!sessionStorage.getItem(redirectKey)) {
      sessionStorage.setItem(redirectKey, 'true');
      setTimeout(() => {
        window.location.href = 'http://localhost:3000/login';
      }, 100);
      return (
        <div className="d-flex justify-content-center align-items-center vh-100">
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Redirecting to login...</span>
            </div>
          </div>
        </div>
      );
    }
    
    // If redirect was already attempted, show error
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="alert alert-danger" style={{ maxWidth: '500px', margin: '20px' }}>
          <h5>Authentication Required</h5>
          <p>Please <a href="http://localhost:3000/login">log in</a> to continue.</p>
        </div>
      </div>
    );
  }
  
  // Clear redirect flag on successful auth
  sessionStorage.removeItem('rider_app_redirect_attempted');
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:orderId"
          element={
            <ProtectedRoute>
              <OrderDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/earnings"
          element={
            <ProtectedRoute>
              <EarningsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;
