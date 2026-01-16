import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, riderService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [riderId, setRiderId] = useState(null);
  const [riderProfile, setRiderProfile] = useState(null); // Store full rider profile
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth data
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        console.log('[AuthContext] Restoring session from localStorage');
        const userData = JSON.parse(storedUser);
        
        // Handle both camelCase and PascalCase
        const userId = userData.userId || userData.UserId;
        const role = userData.role || userData.Role;
        
        console.log('[AuthContext] Restored user - userId:', userId, 'role:', role);
        
        // Normalize user object
        const riderIdFromStorage = userData.riderId || userData.RiderId;
        const normalizedUser = {
          userId: userId,
          username: userData.username || userData.Username,
          email: userData.email || userData.Email,
          role: role,
          riderId: riderIdFromStorage
        };
        
        setToken(storedToken);
        setUser(normalizedUser);
        
        // If riderId is in stored user data, set it immediately
        if (riderIdFromStorage) {
          const numericRiderId = typeof riderIdFromStorage === 'string' 
            ? parseInt(riderIdFromStorage, 10) 
            : riderIdFromStorage;
          if (!isNaN(numericRiderId) && numericRiderId > 0) {
            console.log('[AuthContext] Restored riderId from storage:', numericRiderId);
            setRiderId(numericRiderId);
            localStorage.setItem('riderId', numericRiderId.toString());
          }
        }
        
        // Validate token with backend
        authService.validateToken()
          .then(validationResult => {
            if (validationResult.isValid) {
              console.log('[AuthContext] Token validated successfully');
              // If user is a rider and riderId not already loaded, fetch it
              if ((role === 'Rider' || role === 'rider') && userId) {
                if (!riderIdFromStorage) {
                  console.log('[AuthContext] Restoring rider session, fetching rider ID');
                  fetchRiderId(userId);
                } else {
                  // RiderId already loaded, just fetch profile
                  const numericRiderId = typeof riderIdFromStorage === 'string' 
                    ? parseInt(riderIdFromStorage, 10) 
                    : riderIdFromStorage;
                  if (!isNaN(numericRiderId) && numericRiderId > 0) {
                    riderService.getRiderByUserId(userId)
                      .then(rider => {
                        if (rider) {
                          setRiderProfile(rider);
                          console.log('[AuthContext] Rider profile restored:', rider);
                        }
                        setLoading(false);
                      })
                      .catch(err => {
                        console.warn('[AuthContext] Could not load rider profile:', err);
                        setLoading(false);
                      });
                  } else {
                    setLoading(false);
                  }
                }
              } else {
                setLoading(false);
              }
            } else {
              console.warn('[AuthContext] Token validation failed:', validationResult.message);
              // Token is invalid, clear storage
              logout();
            }
          })
          .catch(err => {
            console.error('[AuthContext] Error validating token:', err);
            // If validation fails, still try to restore (in case backend is down)
            if ((role === 'Rider' || role === 'rider') && userId) {
              if (!riderIdFromStorage) {
                fetchRiderId(userId);
              } else {
                setLoading(false);
              }
            } else {
              setLoading(false);
            }
          });
      } catch (error) {
        console.error('[AuthContext] Error parsing stored user data:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setLoading(false);
      }
    } else {
      console.log('[AuthContext] No stored session found');
      setLoading(false);
    }
  }, []);

  const fetchRiderId = async (userId) => {
    try {
      console.log('[AuthContext] Fetching rider ID for userId:', userId);
      
      // Use the new byuser endpoint for more efficient lookup
      const rider = await riderService.getRiderByUserId(userId);
      if (rider) {
        const id = rider.riderId || rider.RiderId;
        setRiderId(id);
        setRiderProfile(rider); // Store full profile for display
        console.log('[AuthContext] Rider profile loaded successfully - riderId:', id, 'profile:', rider);
        
        // Store riderId in localStorage for quick access
        localStorage.setItem('riderId', id.toString());
      } else {
        console.warn('[AuthContext] No rider found for userId:', userId);
        setLoading(false);
      }
    } catch (error) {
      console.error('[AuthContext] Error fetching rider ID:', error);
      // Fallback: try getAllRiders if byuser endpoint fails
      try {
        console.log('[AuthContext] Attempting fallback: getAllRiders');
        const riders = await riderService.getAllRiders();
        const rider = riders.find(r => {
          const rUserId = r.userId || r.UserId;
          return rUserId === userId || parseInt(rUserId) === parseInt(userId);
        });
        
        if (rider) {
          const id = rider.riderId || rider.RiderId;
          setRiderId(id);
          setRiderProfile(rider);
          localStorage.setItem('riderId', id.toString());
          console.log('[AuthContext] Rider profile loaded via fallback - riderId:', id);
        } else {
          console.warn('[AuthContext] Rider not found in fallback search for userId:', userId);
        }
      } catch (fallbackError) {
        console.error('[AuthContext] Fallback also failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      console.log('[AuthContext] Starting login for username:', username);
      const response = await authService.login(username, password);
      
      console.log('[AuthContext] Login response received:', response);
      
      if (!response || !response.token || !response.user) {
        console.error('[AuthContext] Invalid login response:', response);
        return { success: false, error: 'Invalid response from server' };
      }
      
      // Handle both camelCase and PascalCase from backend (due to JsonNamingPolicy.CamelCase)
      const userData = response.user;
      const userId = userData.userId || userData.UserId;
      const role = userData.role || userData.Role;
      const usernameFromResponse = userData.username || userData.Username;
      const emailFromResponse = userData.email || userData.Email;
      const riderIdFromResponse = userData.riderId || userData.RiderId;
      
      console.log('[AuthContext] Extracted user data - userId:', userId, 'role:', role, 'riderId:', riderIdFromResponse);
      
      // Normalize user object to camelCase for consistency
      const normalizedUser = {
        userId: userId,
        username: usernameFromResponse,
        email: emailFromResponse,
        role: role,
        riderId: riderIdFromResponse // Include riderId if available
      };
      
      setToken(response.token);
      setUser(normalizedUser);
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      
      console.log('[AuthContext] Token and user data stored in localStorage');
      
      // If user is a rider, set riderId immediately if available in response
      if ((role === 'Rider' || role === 'rider') && userId) {
        if (riderIdFromResponse) {
          // RiderId was included in login response
          console.log('[AuthContext] RiderId from login response:', riderIdFromResponse);
          setRiderId(riderIdFromResponse);
          localStorage.setItem('riderId', riderIdFromResponse.toString());
          
          // Fetch full rider profile
          try {
            const rider = await riderService.getRiderByUserId(userId);
            if (rider) {
              setRiderProfile(rider);
              console.log('[AuthContext] Rider profile loaded:', rider);
            }
          } catch (profileError) {
            console.warn('[AuthContext] Could not load rider profile:', profileError);
          }
          
          setLoading(false);
        } else {
          // RiderId not in response, try to fetch it
          console.log('[AuthContext] RiderId not in login response, attempting to fetch rider ID for userId:', userId);
          try {
            await fetchRiderId(userId);
          } catch (fetchError) {
            console.error('[AuthContext] Failed to fetch riderId:', fetchError);
            // Even if fetch fails, continue - rider profile might not exist yet
            setLoading(false);
          }
        }
      } else {
        console.log('[AuthContext] User is not a rider or userId not available, role:', role);
        setLoading(false);
      }
      
      return { success: true };
    } catch (error) {
      console.error('[AuthContext] Login error:', error);
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const logout = () => {
    setUser(null);
    setRiderId(null);
    setRiderProfile(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('riderId');
  };

  const value = {
    user,
    riderId,
    riderProfile, // Expose rider profile
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
