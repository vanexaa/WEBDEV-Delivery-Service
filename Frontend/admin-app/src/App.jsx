import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import RidersPage from './pages/RidersPage';
import DeliveriesPage from './pages/DeliveriesPage';
import HistoryPage from './pages/HistoryPage';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={<DashboardPage />}
        />
        <Route
          path="/riders"
          element={<RidersPage />}
        />
        <Route
          path="/deliveries"
          element={<DeliveriesPage />}
        />
        <Route
          path="/history"
          element={<HistoryPage />}
        />
      </Routes>
    </>
  );
}

export default App;
