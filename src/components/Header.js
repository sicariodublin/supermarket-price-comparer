import "bootstrap-icons/font/bootstrap-icons.css";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/images/Frame-1.png";
import { useAuth } from "../context/AuthContext";
import "./Header.css";

function Header() {
  const { isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="modern-header">
      <nav className="modern-navbar">
        {/* Logo Section */}
        <div className="navbar-brand">
          <Link to="/" className="brand-link">
            <img src={logo} alt="AddAndCompare Logo" className="brand-logo" />
            <span className="brand-text">AddAndCompare</span>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className={`mobile-menu-toggle ${isMenuOpen ? 'active' : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Navigation Links */}
        <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                <i className="bi bi-house"></i>
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/search" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                <i className="bi bi-search"></i>
                Search
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/how-it-works" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                <i className="bi bi-question-circle"></i>
                How it Works
              </Link>
            </li>
          </ul>

          {/* Search Bar */}
          <form className="navbar-search" onSubmit={handleSearch}>
            <div className="search-input-group">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-button" aria-label="Search">
                <i className="bi bi-search"></i>
              </button>
            </div>
          </form>

          {/* User Actions */}
          <div className="navbar-actions">
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="btn btn-outline" onClick={() => setIsMenuOpen(false)}>
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary" onClick={() => setIsMenuOpen(false)}>
                  Sign Up
                </Link>
              </>
            ) : (
              <div className="user-menu">
                <Link to="/dashboard" className="user-profile" onClick={() => setIsMenuOpen(false)}>
                  <i className="bi bi-person-circle"></i>
                  <span>Dashboard</span>
                </Link>
                <button onClick={logout} className="btn btn-outline logout-btn">
                  <i className="bi bi-box-arrow-right"></i>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Header;
