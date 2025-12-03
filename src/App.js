import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Test from './pages/Customer/test'; // make sure the path matches exactly (capital T)

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route showing your Test page */}
        <Route path="/" element={<Test />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
