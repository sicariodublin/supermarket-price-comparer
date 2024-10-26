import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/images/Frame-1.png';
import magnifyingGlassIcon from '../assets/images/magnifying-glass-48.png';
import './Header.css'; // Create a separate CSS file to style the header


function Header() {
  return (
    <header className="header">
      <nav className="navbar">
        {/* Logo Section */}
        <div className="navbar__logo">
          <Link to="/">
          <img src={logo} alt="Supermarket Price Comparer Logo" />
          </Link>
        </div>

       {/* Navigation Links - Left Side */}
       <ul className="navbar__links-left">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/search">Search</Link></li>
          <li><Link to="/how-it-works">How it Works</Link></li>
        </ul>

        {/* Navigation Links - Right Side */}
        <ul className="navbar__links-right">
          <li><Link to="/login">Login</Link></li>
          <li><Link to="/register">Register</Link></li>
        </ul>

        {/* Quick Search Form */}
        <form className="quick-search-form" action="/search">
          <input type="text" placeholder="Quick Search" name="query" />
          <button type="submit">
          <img src={magnifyingGlassIcon} alt="Search Icon" />
          </button>
        </form>
      </nav>
    </header>
  );
}

export default Header;
