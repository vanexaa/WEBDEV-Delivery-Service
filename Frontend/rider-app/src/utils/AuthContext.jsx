import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Default rider ID for testing (authentication removed)
  const DEFAULT_RIDER_ID = 1;
  
  const [user, setUser] = useState({
    userId: 1,
    username: 'rider1',
    email: 'rider1@restaurant.com',
    role: 'Rider'
  });
  const [riderId, setRiderId] = useState(DEFAULT_RIDER_ID);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Try to fetch rider ID from API (optional, won't fail if it doesn't work)
    const fetchRiderId = async () => {
      try {
        const response = await fetch(`http://localhost:5005/api/riders/${DEFAULT_RIDER_ID}`);
        if (response.ok) {
          const rider = await response.json();
          const fetchedRiderId = rider.riderId ?? rider.RiderId;
          if (fetchedRiderId) {
            setRiderId(fetchedRiderId);
          }
        }
      } catch (error) {
        console.warn('Could not fetch rider ID, using default:', error);
        // Continue with default rider ID
      }
    };
    
    fetchRiderId();
    setLoading(false);
  }, []);

  const logout = () => {
    console.log('Rider App: Logout (no-op since auth is disabled)');
    // No-op since authentication is disabled
  };

  const value = {
    user,
    riderId,
    token: null, // No token needed
    loading,
    isAuthenticated: true, // Always authenticated since auth is disabled
    login: async () => ({ success: true }), // No-op
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
