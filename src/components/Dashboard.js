import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext"; // Import AuthContext
import "../styles/Dashboard.css"; // Create a CSS file for styling

const Dashboard = () => {
  const { isAuthenticated, logout, token } = useContext(AuthContext); // Access auth details

  // Mock data (replace with API call later)
  const userData = {
    name: "Fsteyer",
    watchlist: [],
    dataCollectionDates: [
      { supermarket: "Aldi", date: "05-12-24" },
      { supermarket: "Dunnes Stores", date: "05-12-24" },
      { supermarket: "SuperValu", date: "05-12-24" },
      { supermarket: "Tesco", date: "05-12-24" },
    ],
  };

  return (
    <div className="dashboard">
      {/* Greeting Section */}
      <header className="dashboard-header">
        <div className="greeting">
        <i className="bi bi-person pt-3 color-normal-blue" id="pers"></i>
          <p>Hello,</p>
          <p>{userData.name}!</p>
        </div>
      </header>

      {/* My Options Section */}
      <section className="options-section">
        <h3>My Options</h3>
        <div className="options-grid">
          <Link to="/account-settings" className="option">
            <span>Account Settings</span>
            <i className="icon-settings"></i>
          </Link>
          <Link to="/newsletter-options" className="option">
            <span>Newsletter Options</span>
            <i className="icon-mail"></i>
          </Link>
          <Link to="/cheapest-weekly-shop" className="option">
            <span>Cheapest Weekly Shop</span>
            <i className="icon-chart"></i>
          </Link>
          <Link to="/product-seasonality" className="option">
            <span>Product Seasonality</span>
            <i className="icon-weather"></i>
          </Link>
        </div>
      </section>

      {/* My Watchlist Section */}
      <section className="watchlist-section">
        <h3>My Watchlist</h3>
        {userData.watchlist.length > 0 ? (
          <ul>
            {userData.watchlist.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        ) : (
          <p>You currently have no saved products.</p>
        )}
      </section>

      {/* Data Collection Dates */}
      <section className="data-collection-dates">
        <h3>Data Collection Dates</h3>
        <div className="dates-grid">
          {userData.dataCollectionDates.map((data, index) => (
            <div className="date-card" key={index}>
              <span>{data.supermarket}</span>
              <span>{data.date}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;

