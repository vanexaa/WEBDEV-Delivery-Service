import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, riderService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [riderId, setRiderId] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth data
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(userData);
        
        // If user is a rider, fetch rider ID
        if (userData.role === 'Rider' && userData.userId) {
          fetchRiderId(userData.userId);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchRiderId = async (userId) => {
    try {
      const riders = await riderService.getAllRiders();
      const rider = riders.find(r => (r.userId || r.UserId) === userId);
      if (rider) {
        setRiderId(rider.riderId || rider.RiderId);
      }
    } catch (error) {
      console.error('Error fetching rider ID:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await authService.login(username, password);
      
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // If user is a rider, fetch rider ID
      if (response.user.role === 'Rider' && response.user.userId) {
        await fetchRiderId(response.user.userId);
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
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
