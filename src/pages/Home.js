import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css'; // Import CSS for Home page

function Home() {
  return (
    <di className="home-page">
      <div className="home-container">
        <div className="header-content">
          <h1>Welcome to addandcompare.com!</h1>
          <p>Ireland's new supermarket prices comparison website!</p>
          <p>
            addandcompare was created with the intention to make you save money by comparing prices from supermarkets across Ireland. Find the best option for your groceries shop with our user-friendly website. Shop smart, save time, and happy shop.
          </p>
          <Link to="/register">
            <button className="become-member-button">Become a Member!</button>
          </Link>
        </div>
      </div>
    </di>
  );
}

export default Home;
