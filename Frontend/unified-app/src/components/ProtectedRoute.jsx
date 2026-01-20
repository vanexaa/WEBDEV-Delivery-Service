import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import safeStorage from '../utils/storage';

const ProtectedRoute = ({ children, requiredRole }) => {
  const [isAuthorized, setIsAuthorized] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        const token = safeStorage.getItem('authToken');
        const userData = safeStorage.getItem('user');
        
        if (!token || !userData) {
          console.log('[ProtectedRoute] No token or user data found');
          setIsAuthorized(false);
          setIsLoading(false);
          return;
        }

        const user = JSON.parse(userData);
        const userRole = user.role || user.Role;
        
        console.log('[ProtectedRoute] Checking authorization - required role:', requiredRole, 'user role:', userRole);
        
        if (userRole && userRole.toLowerCase() === requiredRole.toLowerCase()) {
          // Additional validation: verify token is still valid
          try {
            const { authService } = await import('../services/api');
            const validationResult = await authService.validateToken();
            if (validationResult.isValid) {
              console.log('[ProtectedRoute] Authorization granted');
              setIsAuthorized(true);
            } else {
              console.warn('[ProtectedRoute] Token validation failed:', validationResult.message);
              setIsAuthorized(false);
            }
          } catch (validationError) {
            console.error('[ProtectedRoute] Error validating token:', validationError);
            // Allow access if validation fails (backend might be down)
            setIsAuthorized(true);
          }
        } else {
          console.warn('[ProtectedRoute] Role mismatch - required:', requiredRole, 'user has:', userRole);
          setIsAuthorized(false);
        }
      } catch (error) {
        console.error('[ProtectedRoute] Error checking authorization:', error);
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthorization();
  }, [requiredRole]);

  if (isLoading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
