import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [riderId, setRiderId] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRiderId = async (userId, authToken) => {
    try {
      const response = await fetch(`http://localhost:5005/api/riders/${userId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (response.ok) {
        const rider = await response.json();
        // Handle both camelCase and PascalCase
        return rider.riderId ?? rider.RiderId;
      } else {
        console.error('Failed to fetch rider ID:', response.status, await response.text().catch(() => ''));
      }
    } catch (error) {
      console.error('Error fetching rider ID:', error);
      // Check if it's a network error
      const isNetworkError = error.message?.includes('Failed to fetch') || 
                             error.message?.includes('NetworkError') ||
                             error.name === 'TypeError';
      if (isNetworkError) {
        console.error('Network error: Rider Service may not be running on http://localhost:5005');
      }
    }
    return null;
  };

  useEffect(() => {
    // Check for token in URL params (from unified-app redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');

    if (tokenFromUrl) {
      console.log('Rider App: Token found in URL, starting authentication...');
      
      // IMPORTANT: Clear any old tokens/data first to prevent conflicts
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('riderId');
      localStorage.removeItem('authError');
      sessionStorage.clear();
      
      // Store new token and fetch user data from API
      setToken(tokenFromUrl);
      localStorage.setItem('authToken', tokenFromUrl);
      
      // Fetch user data using the token
      const fetchUserData = async () => {
        try {
          const response = await fetch('http://localhost:5001/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${tokenFromUrl}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            console.log('User data from API:', userData);
            // Handle both PascalCase (C#) and camelCase (JS) property names
            // .NET Core serializes to camelCase by default, so check camelCase first
            const userId = userData.userId ?? userData.UserId;
            const username = userData.username ?? userData.Username ?? '';
            const email = userData.email ?? userData.Email ?? '';
            const role = userData.role ?? userData.Role ?? '';
            
            if (!userId || !role) {
              console.error('Invalid user data structure:', userData);
              throw new Error('Invalid user data received from API');
            }
            
            // Verify role is Rider
            if (role !== 'Rider') {
              console.error('User is not a Rider:', role);
              throw new Error(`Access denied. Expected Rider role, got ${role}`);
            }
            
            const normalizedUserData = {
              userId: userId,
              username: username,
              email: email,
              role: role
            };
            
            setUser(normalizedUserData);
            localStorage.setItem('user', JSON.stringify(normalizedUserData));
            
            // Fetch rider ID if user is a rider (don't fail if this fails)
            if (role === 'Rider') {
              try {
                const riderId = await fetchRiderId(userId, tokenFromUrl);
                if (riderId) {
                  setRiderId(riderId);
                  localStorage.setItem('riderId', riderId.toString());
                } else {
                  console.warn('Could not fetch rider ID, but continuing with authentication');
                }
              } catch (riderError) {
                console.error('Error fetching rider ID (non-fatal):', riderError);
                // Don't fail authentication if rider ID fetch fails
              }
            }
            
            // Clear URL params on success
            window.history.replaceState({}, document.title, window.location.pathname);
            setLoading(false);
          } else {
            const errorText = await response.text().catch(() => 'Unable to read error response');
            console.error('Failed to fetch user data:', response.status, errorText);
            
            // Store detailed error info
            const errorInfo = {
              type: response.status === 401 ? 'unauthorized' : 'server',
              message: `Authentication failed: ${response.status} ${response.statusText}`,
              details: errorText
            };
            localStorage.setItem('authError', JSON.stringify(errorInfo));
            
            // Clear invalid token - don't redirect to avoid loop
            localStorage.removeItem('authToken');
            setToken(null);
            setUser(null);
            setLoading(false);
            // Don't redirect - let ProtectedRoute handle it naturally
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Check if it's a network error
          const isNetworkError = error.message?.includes('Failed to fetch') || 
                                 error.message?.includes('NetworkError') ||
                                 error.message?.includes('ERR_CONNECTION_REFUSED') ||
                                 error.code === -102 ||
                                 error.name === 'TypeError';
          
          if (isNetworkError) {
            console.error('Network error detected. Please ensure Auth Service is running on http://localhost:5001');
            // Store error info for display
            localStorage.setItem('authError', JSON.stringify({
              type: 'network',
              message: 'Cannot connect to authentication service. Please ensure the Auth Service is running on port 5001.'
            }));
          }
          
          // Log detailed error information
          if (error.message) {
            console.error('Error message:', error.message);
          }
          if (error.cause) {
            console.error('Error cause:', error.cause);
          }
          // Clear invalid token - don't redirect to avoid loop
          localStorage.removeItem('authToken');
          setToken(null);
          setUser(null);
          setLoading(false);
          // Don't redirect - let ProtectedRoute handle it naturally
        }
      };
      
      fetchUserData();
    } else {
      // Check for stored auth data
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('user');
      const storedRiderId = localStorage.getItem('riderId');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setRiderId(storedRiderId ? parseInt(storedRiderId) : null);
      }
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    try {
      const response = await authService.login(username, password);
      if (response.user.role !== 'Rider') {
        throw new Error('Access denied. This is for riders only.');
      }
      
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Fetch rider ID
      const riderId = await fetchRiderId(response.user.userId, response.token);
      setRiderId(riderId);
      if (riderId) {
        localStorage.setItem('riderId', riderId.toString());
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    console.log('Rider App: Logging out...');
    setUser(null);
    setRiderId(null);
    setToken(null);
    setLoading(false);
    // Clear all storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('riderId');
    localStorage.removeItem('authError');
    sessionStorage.clear();
  };

  const value = {
    user,
    riderId,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
