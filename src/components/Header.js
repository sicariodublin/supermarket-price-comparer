// eslint-disable-next-line no-unused-vars
import React from "react"; // Required for JSX
import "bootstrap-icons/font/bootstrap-icons.css";
import { useState, useEffect, useRef } from "react"; // eslint-disable-line no-unused-vars
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProducts } from "../services/api";
import "./Header.css";
import Logo from "./Logo";

function Header() {
  const { isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim() && searchQuery.length >= 2) {
        fetchSearchSuggestions(searchQuery);
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSearchSuggestions = async (query) => {
    setIsSearching(true);
    try {
      const products = await getProducts(query);
      // Get unique product names and limit to 8 suggestions
      const uniqueNames = [...new Set(products.map(p => p.name))]
        .filter(name => name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 8);
      
      setSearchSuggestions(uniqueNames);
      setShowSuggestions(uniqueNames.length > 0);
    } catch (error) {
      console.error('Error fetching search suggestions:', error);
      setSearchSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setShowSuggestions(false);
      setIsMenuOpen(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    navigate(`/search?q=${encodeURIComponent(suggestion)}`);
    setIsMenuOpen(false);
  };

  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchInputFocus = () => {
    if (searchSuggestions.length > 0) {
      setShowSuggestions(true);
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
            <Logo variant="option1" width={200} height={60} className="brand-logo" />
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

          {/* Enhanced Search Bar */}
          <div className="navbar-search" ref={searchRef}>
            <form onSubmit={handleSearch}>
              <div className="search-input-group">
                <button type="submit" className="search-button" aria-label="Search">
                  {isSearching ? (
                    <i className="bi bi-arrow-clockwise spin"></i>
                  ) : (
                    <i className="bi bi-search"></i>
                  )}
                </button>
                <input
                  type="text"
                  placeholder="Find products...(e.g., eggs, milk)"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onFocus={handleSearchInputFocus}
                  className="search-input"
                  autoComplete="off"
                />
              </div>
            </form>
            
            {/* Search Suggestions Dropdown */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="search-suggestions" ref={suggestionsRef}>
                {searchSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="suggestion-item"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <i className="bi bi-search suggestion-icon"></i>
                    <span className="suggestion-text">{suggestion}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

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
                  <span>User</span>
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
