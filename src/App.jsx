import React from "react";
import { Routes, Route } from "react-router-dom";
import AdminRider from "./pages/AdminRider.jsx";
import Rider from "./pages/Rider.jsx";
import Customer from "./pages/Customer.jsx"; 
function App() {
  return (
    <Routes>
      <Route path="/" element={<Customer />} />
      <Route path="/rider" element={<Rider />} />
      <Route path="/adminrider" element={<AdminRider />} />
    </Routes>
  );
}

export default App;
