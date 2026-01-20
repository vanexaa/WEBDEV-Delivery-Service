import React from "react";
import "./Navbar.css";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="navbar">
      <Link to="/" className={({ isActive }) => (isActive ? "active" : "")}>
        Home
      </Link>
      <Link
        to="/login"
        className={({ isActive }) => (isActive ? "active" : "")}
      >
        Login
      </Link>
      <Link
        to="/about"
        className={({ isActive }) => (isActive ? "active" : "")}
      >
        About Us
      </Link>
      <Link
        to="/signup"
        className={({ isActive }) => (isActive ? "active" : "")}
      >
        Sign Up
      </Link>
    </nav>
  );
};

export default Navbar;
