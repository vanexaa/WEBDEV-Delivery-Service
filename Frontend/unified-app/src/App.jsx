import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import { AuthProvider } from './utils/AuthContext';

// Rider pages
import RiderDashboard from './pages/rider/DashboardPage';
import RiderOrderDetails from './pages/rider/OrderDetailsPage';
import RiderDeliveryHistory from './pages/rider/DeliveryHistoryPage';
import RiderProfile from './pages/rider/ProfilePage';
import RiderDetails from './pages/rider/RiderDetailsPage';

// Customer pages
import CustomerOrdersPage from './pages/customer/CustomerOrdersPage';
import OrdersPage from './pages/customer/OrdersPage';

// Admin pages
import AdminDashboard from './pages/admin/DashboardPage';
import AdminRiders from './pages/admin/RidersPage';
import AdminDeliveries from './pages/admin/DeliveriesPage';
import AdminHistory from './pages/admin/HistoryPage';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Login route - accessible to all */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Default redirect to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Rider routes */}
        <Route
          path="/rider/*"
          element={
            <ProtectedRoute requiredRole="Rider">
              <Routes>
                <Route path="dashboard" element={<RiderDashboard />} />
                <Route path="details" element={<RiderDetails />} />
                <Route path="orders/:transactionCode" element={<RiderOrderDetails />} />
                <Route path="history" element={<RiderDeliveryHistory />} />
                <Route path="profile" element={<RiderProfile />} />
                <Route path="*" element={<Navigate to="/rider/dashboard" replace />} />
              </Routes>
            </ProtectedRoute>
          }
        />
        
        {/* Customer routes */}
        <Route
          path="/customer/*"
          element={
            <ProtectedRoute requiredRole="Customer">
              <Routes>
                <Route path="orders" element={<CustomerOrdersPage />} />
                <Route path="orders-test" element={<OrdersPage />} />
                <Route path="*" element={<Navigate to="/customer/orders" replace />} />
              </Routes>
            </ProtectedRoute>
          }
        />
        
        {/* Admin routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute requiredRole="Admin">
              <Routes>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="riders" element={<AdminRiders />} />
                <Route path="deliveries" element={<AdminDeliveries />} />
                <Route path="history" element={<AdminHistory />} />
                <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
              </Routes>
            </ProtectedRoute>
          }
        />
        
      </Routes>
    </AuthProvider>
  );
}

export default App;
