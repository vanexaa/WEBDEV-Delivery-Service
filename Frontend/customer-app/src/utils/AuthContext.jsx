import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for token in URL params (from auth-app redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');

    if (tokenFromUrl) {
      console.log('Customer App: Token found in URL, attempting authentication...');
      
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
            console.log('Customer App: User data from API:', userData);
            // Handle both PascalCase (C#) and camelCase (JS) property names
            const userId = userData.userId ?? userData.UserId;
            const username = userData.username ?? userData.Username ?? '';
            const email = userData.email ?? userData.Email ?? '';
            const role = userData.role ?? userData.Role ?? '';
            
            if (userId && role) {
              const normalizedUserData = {
                userId: userId,
                username: username,
                email: email,
                role: role
              };
              
              setUser(normalizedUserData);
              localStorage.setItem('user', JSON.stringify(normalizedUserData));
            }
          } else {
            // Response not OK - clear invalid token
            console.warn('Customer App: Authentication response not OK:', response.status);
            localStorage.removeItem('authToken');
            setToken(null);
          }
          // Clear URL params
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error) {
          console.warn('Customer App: Authentication failed:', error);
          // Clear invalid token but continue
          localStorage.removeItem('authToken');
          setToken(null);
        } finally {
          setLoading(false);
        }
      };
      
      fetchUserData();
    } else {
      // Check for stored auth data
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(userData);
        } catch (error) {
          console.error('Customer App: Error parsing stored user data:', error);
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    try {
      const response = await authService.login(username, password);
      if (response.user.role !== 'Customer') {
        throw new Error('Access denied. Customer access required.');
      }
      
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    console.log('Customer App: Logging out...');
    setUser(null);
    setToken(null);
    setLoading(false);
    // Clear all storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('authError');
    sessionStorage.clear();
  };

  const value = {
    user,
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
