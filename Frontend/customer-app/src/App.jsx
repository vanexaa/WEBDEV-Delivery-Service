import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './utils/AuthContext';
import TrackOrderPage from './pages/TrackOrderPage';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    // Redirect to unified-app login (assuming unified-app runs on port 3000)
    window.location.href = 'http://localhost:3000/login';
    return null;
  }
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
              <TrackOrderPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;
