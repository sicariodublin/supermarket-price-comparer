//
import "bootstrap-icons/font/bootstrap-icons.css"; // Import Bootstrap Icon
import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/images/Frame-1.png";
import { useAuth } from "../context/AuthContext"; // Import useAuth for authentication state
import "./Header.css"; // Create a separate CSS file to style the header

function Header() {
  const { isAuthenticated, logout } = useAuth();

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
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/search">Search</Link>
          </li>
          <li>
            <Link to="/how-it-works">How it Works</Link>
          </li>
        </ul>

       {/* Navigation Links - Right Side */}
       <ul className="navbar__links-right">
          {!isAuthenticated ? (
            <>
              <li>
                <Link to="/login">Login</Link>
              </li>
              <li>
                <Link to="/register">Register</Link>
              </li>
            </>
          ) : (
            <li>
              <p className="logout-button" onClick={logout}>
                  Logout
                </p>
            </li>
          )}
        </ul>

        {/* Quick Search Form */}
        <form
          className="quick-search-form"
          action="/search"
          style={{ position: "relative" }}
        >
          <input
            type="text"
            placeholder="Quick Search"
            name="query"
            style={{ paddingRight: "3rem" }} // Add padding to avoid overlap with the button
          />
          <button
            className="magnifying-icon"
            type="submit"
            style={{
              borderRadius: "100%",
              width: "2rem",
              height: "2.2rem",
              backgroundColor: "black",
              padding: "0.5rem",
              color: "white",
              cursor: "pointer",
              padding: "0.2rem",
              position: "absolute",
              top: "50%",
              left: "0rem", // Adjust as needed to align correctly
              transform: "translateY(-50%)",
              border: "none",
            }}
            aria-label="quick-search"
          >
            <i className="bi bi-search"></i>
          </button>
        </form>

        {/* Dashboard Icon - Only visible when logged in */}
        {isAuthenticated && (
          <div className="dashboard-icon">
            <Link to="/dashboard">
              <i className="bi bi-person pt-3 color-normal-blue" id="pers"></i>
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}

export default Header;
