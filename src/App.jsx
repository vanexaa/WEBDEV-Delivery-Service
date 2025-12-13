import React from "react";
import { Routes, Route } from "react-router-dom";
import Customer from "./pages/Customer/Customer.jsx";
import Rider from "./pages/Rider/Rider.jsx";
import AdminRider from "./pages/AdminRider/AdminRider.jsx";

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
