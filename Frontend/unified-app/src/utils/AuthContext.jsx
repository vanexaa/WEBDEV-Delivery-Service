import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [riderId, setRiderId] = useState(null);

  useEffect(() => {
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
  }, []);

  const login = async (username, password) => {
    try {
      const response = await authService.login(username, password);
      
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Fetch rider ID if user is a rider
      // Note: For now, we'll use userId as riderId since the backend endpoint
      // to get rider by userId doesn't exist yet. This can be updated later.
      if (response.user.role === 'Rider') {
        // Try to fetch rider ID, but don't fail if it doesn't work
        try {
          const riderId = await fetchRiderId(response.user.userId, response.token);
          if (riderId) {
            setRiderId(riderId);
            localStorage.setItem('riderId', riderId.toString());
          } else {
            // Fallback: use userId as riderId (they might be the same)
            setRiderId(response.user.userId);
            localStorage.setItem('riderId', response.user.userId.toString());
          }
        } catch (error) {
          console.warn('Could not fetch rider ID, using userId as fallback:', error);
          // Fallback: use userId as riderId
          setRiderId(response.user.userId);
          localStorage.setItem('riderId', response.user.userId.toString());
        }
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const fetchRiderId = async (userId, authToken) => {
    try {
      const response = await fetch(`http://localhost:5005/api/riders/${userId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (response.ok) {
        const rider = await response.json();
        return rider.riderId;
      }
    } catch (error) {
      console.error('Error fetching rider ID:', error);
    }
    return null;
  };

  const logout = () => {
    setUser(null);
    setRiderId(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('riderId');
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
