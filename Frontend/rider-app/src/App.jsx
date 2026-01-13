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
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Authenticating...</p>
        </div>
      </div>
    );
  }
  
  // If not authenticated
  if (!isAuthenticated) {
    // Check for stored error info
    const errorInfoStr = localStorage.getItem('authError');
    const errorInfo = errorInfoStr ? JSON.parse(errorInfoStr) : null;
    
    // If there was a token in URL but auth failed, show error (don't redirect to prevent loop)
    if (tokenInUrl) {
      // Clear error info after displaying
      if (errorInfo) {
        localStorage.removeItem('authError');
      }
      
      // Clear the token from URL to prevent re-processing
      window.history.replaceState({}, document.title, window.location.pathname);
      
      return (
        <div className="d-flex justify-content-center align-items-center vh-100">
          <div className="alert alert-danger" style={{ maxWidth: '500px', margin: '20px' }}>
            <h5>Authentication Failed</h5>
            {errorInfo && errorInfo.type === 'network' ? (
              <>
                <p><strong>Connection Error:</strong> {errorInfo.message}</p>
                <p>Please ensure all backend services are running:</p>
                <ul>
                  <li>Auth Service: http://localhost:5001</li>
                  <li>Rider Service: http://localhost:5005</li>
                  <li>Delivery Service: http://localhost:5003</li>
                </ul>
                <p>You can start them using <code>start-backend.ps1</code> or manually with <code>dotnet run</code>.</p>
              </>
            ) : (
              <>
                <p>The authentication token is invalid or expired.</p>
                <p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      // Clear unified-app's session and redirect
                      sessionStorage.clear();
                      localStorage.clear();
                      window.location.href = 'http://localhost:3000?clearSession=true';
                    }}
                  >
                    Go to Login
                  </button>
                </p>
              </>
            )}
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
        // Clear any auth data before redirecting
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('riderId');
        window.location.href = 'http://localhost:3000';
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
          <p>
            <button 
              className="btn btn-primary"
              onClick={() => {
                sessionStorage.clear();
                localStorage.clear();
                window.location.href = 'http://localhost:3000';
              }}
            >
              Go to Login
            </button>
          </p>
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
