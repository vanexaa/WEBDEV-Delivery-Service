import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [riderId, setRiderId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set dummy user data for testing (authentication disabled)
    const dummyUser = {
      userId: 1,
      username: 'rider1',
      email: 'rider1@example.com',
      role: 'Rider'
    };
    setUser(dummyUser);
    setRiderId(1); // Default rider ID for testing
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    // Dummy login - always succeeds
    const dummyUser = {
      userId: 1,
      username: username,
      email: `${username}@example.com`,
      role: 'Rider'
    };
    setUser(dummyUser);
    setRiderId(1);
    return { success: true };
  };

  const logout = () => {
    // Dummy logout - just reset to default
    const dummyUser = {
      userId: 1,
      username: 'rider1',
      email: 'rider1@example.com',
      role: 'Rider'
    };
    setUser(dummyUser);
    setRiderId(1);
  };

  const value = {
    user,
    riderId,
    loading,
    isAuthenticated: true, // Always authenticated in dummy mode
    login,
    logout,
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

