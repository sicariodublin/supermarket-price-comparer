import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/images/logo4.png';
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

        {/* Navigation Links */}
        <ul className="navbar__links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/search">Search</Link></li>
          <li><Link to="/how-it-works">How it Works</Link></li>
          <li><Link to="/login">Login</Link></li>
          <li><Link to="/register">Register</Link></li>
        </ul>

        {/* Search Bar */}
        <div className="navbar__search">
          <form method="get" action="/search">
            <input type="text" placeholder="Quick Search" name="query" />
            <button type="submit">
              <i className="fa fa-search" aria-hidden="true"></i>
            </button>
          </form>
        </div>
      </nav>
    </header>
  );
}

export default Header;
