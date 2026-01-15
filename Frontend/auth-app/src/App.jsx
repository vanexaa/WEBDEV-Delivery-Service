import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = {
  auth: 'http://localhost:5001'
};

// App URLs based on role
const APP_URLS = {
  Rider: 'http://localhost:3001',
  Admin: 'http://localhost:3003',
  Customer: 'http://localhost:3002'
};

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Always clear old tokens on page load to ensure fresh login
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Don't clear if there's a token in URL (shouldn't happen, but be safe)
    if (urlParams.get('token')) {
      console.warn('Auth App: Token found in URL - this should not happen on login page');
      return;
    }
    
    if (urlParams.get('clearSession') === 'true') {
      localStorage.clear();
      sessionStorage.clear();
      // Remove the parameter from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      // Always clear old tokens when landing on login page (unless clearSession is already set)
      // This ensures switching between different user types works correctly
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('riderId');
      localStorage.removeItem('authError');
      // Keep sessionStorage for redirect flags, but clear auth-related items
      sessionStorage.removeItem('rider_app_redirect_attempted');
      sessionStorage.removeItem('admin_app_redirect_attempted');
      sessionStorage.removeItem('customer_app_redirect_attempted');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username || !password) {
      setError('Please enter both username and password');
      setLoading(false);
      return;
    }

    try {
      console.log('Auth App: Attempting login for:', username);
      const response = await fetch(`${API_BASE_URL.auth}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      console.log('Auth App: Login response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
        console.error('Auth App: Login failed:', errorData);
        throw new Error(errorData.message || `Login failed (${response.status}). Please check your credentials.`);
      }

      const data = await response.json();
      console.log('Auth App: Full login response:', data);
      console.log('Auth App: Response keys:', Object.keys(data));
      
      // Handle both camelCase and PascalCase response structures
      const token = data.token ?? data.Token;
      const userData = data.user ?? data.User;
      
      console.log('Auth App: Token found:', !!token);
      console.log('Auth App: User data:', userData);
      
      if (!token) {
        console.error('Auth App: No token in response:', data);
        throw new Error('No token received from server');
      }
      
      if (!userData) {
        console.error('Auth App: No user data in response:', data);
        throw new Error('No user data received from server');
      }
      
      // Get user role - handle both camelCase and PascalCase
      const userRole = userData.role ?? userData.Role;
      console.log('Auth App: Extracted role:', userRole);
      console.log('Auth App: Available APP_URLS keys:', Object.keys(APP_URLS));

      if (!userRole) {
        console.error('Auth App: No role in response. Full data:', data);
        console.error('Auth App: User data structure:', userData);
        setLoading(false);
        throw new Error('User role not found in response');
      }

      // IMPORTANT: Clear ALL old storage before storing new token
      // This prevents token conflicts when switching between user types
      localStorage.clear();
      // Don't clear sessionStorage here - let the target app handle it
      // sessionStorage.clear();
      
      // Store only the new token (user data will be stored by the target app)
      localStorage.setItem('authToken', token);

      // Determine redirect URL based on role (case-sensitive match)
      const redirectUrl = APP_URLS[userRole];

      if (!redirectUrl) {
        console.error('Auth App: Unknown role:', userRole);
        console.error('Auth App: Available roles in APP_URLS:', Object.keys(APP_URLS));
        console.error('Auth App: Role comparison - exact match:', userRole === 'Admin', userRole === 'Customer', userRole === 'Rider');
        setLoading(false);
        throw new Error(`Unknown user role: ${userRole}. Expected one of: ${Object.keys(APP_URLS).join(', ')}`);
      }

      // Redirect to appropriate app with token
      const finalUrl = `${redirectUrl}?token=${encodeURIComponent(token)}`;
      console.log(`Auth App: Redirecting ${userRole} to: ${finalUrl}`);
      console.log(`Auth App: Token length: ${token.length}, Token preview: ${token.substring(0, 20)}...`);
      
      // Set redirecting state and clear form before redirect
      setLoading(false);
      setRedirecting(true);
      setUsername('');
      setPassword('');
      
      // Store redirect URL in sessionStorage as fallback
      sessionStorage.setItem('pendingRedirect', finalUrl);
      
      // Log redirect details for debugging
      console.log('Auth App: ========== REDIRECT STARTING ==========');
      console.log('Auth App: User Role:', userRole);
      console.log('Auth App: Redirect URL:', finalUrl);
      console.log('Auth App: Token stored:', !!localStorage.getItem('authToken'));
      console.log('Auth App: Current URL:', window.location.href);
      
      // Immediately redirect - use replace to prevent back button issues
      // Use a small delay to ensure state updates complete
      setTimeout(() => {
        try {
          console.log('Auth App: Executing redirect now...');
          // Use replace instead of href to prevent back button from going to login page
          window.location.replace(finalUrl);
        } catch (redirectError) {
          console.error('Auth App: Redirect error:', redirectError);
          // Fallback: try using window.location.href
          try {
            window.location.href = finalUrl;
          } catch (hrefError) {
            console.error('Auth App: Both redirect methods failed:', hrefError);
            // Last resort: show manual redirect link
            setError(`Redirect failed. Please click here to continue: ${finalUrl}`);
            setRedirecting(false);
          }
        }
      }, 50); // Small delay to ensure state updates
      
      // Fallback: Force redirect after 1 second if still on this page
      setTimeout(() => {
        const currentUrl = window.location.href;
        if (currentUrl.includes('localhost:3000') && !currentUrl.includes('token')) {
          console.warn('Auth App: Redirect timeout detected!');
          console.warn('Auth App: Current URL:', currentUrl);
          console.warn('Auth App: Target URL:', finalUrl);
          console.warn('Auth App: Forcing redirect...');
          window.location.replace(finalUrl);
        }
      }, 1000);

    } catch (err) {
      console.error('Auth App: Login error:', err);
      setError(err.message || 'An error occurred during login. Please try again.');
      setLoading(false);
    }
  };

  // Show redirecting message if redirecting
  if (redirecting) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Redirecting...</span>
          </div>
          <h5>Redirecting...</h5>
          <p className="text-muted">Please wait while we redirect you to your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow-lg" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <h2 className="card-title mb-2">
              <i className="bi bi-box-seam me-2"></i>
              Delivery Management System
            </h2>
            <p className="text-muted">Login to continue</p>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="username" className="form-label fw-bold">
                Username
              </label>
              <input
                type="text"
                className="form-control form-control-lg"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                placeholder="Enter your username"
                autoComplete="username"
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="form-label fw-bold">
                Password
              </label>
              <input
                type="password"
                className="form-control form-control-lg"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg w-100"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Logging in...
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Login
                </>
              )}
            </button>
          </form>

          <div className="mt-4">
            <div className="card bg-light">
              <div className="card-body p-3">
                <h6 className="card-subtitle mb-2 text-muted">Test Accounts:</h6>
                <div className="small">
                  <div><strong>Admin:</strong> admin / password123</div>
                  <div><strong>Rider:</strong> rider1 / password123</div>
                  <div><strong>Customer:</strong> customer1 / password123</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
