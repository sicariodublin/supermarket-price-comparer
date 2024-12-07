import React from 'react';
import '../styles/HowItWorks.css'; // Import CSS for Home page

function HowItWorks() {
  return (
    <div className="how-it-works-page">
      <div className="how-it-works-container">
        <div className="header-works">
          <h1>How it works!</h1>
          <p>Ireland's new supermarket prices comparison website!</p>
          <p>At addandcompare.com, we simplify your grocery shopping by providing a platform to compare product prices from various supermarkets. Here’s how you can make the most of our service:</p>
      
      <h2>For Guests (Unregistered Users)</h2>
      <p>Guests can freely access our website and use the search functionality to compare prices across a wide range of products. This allows you to:</p>
      <ul>
          <li>Search for products to see current prices from different supermarkets in Ireland.</li>
          <li>View product details and average prices without creating an account.</li>
      </ul>
      
      <h2>For Registered Users</h2>
      <p>By creating a free account on addandcompare.com, you unlock additional features that enhance your shopping experience. Registered users can:</p>
      <ul>
          <li>Add new products to the platform.</li>
          <li>Update product prices and details based on their latest shopping experiences.</li>
          <li>Access a personalized dashboard with product tracking, shop list, and more.</li>
      </ul>
      
      <h2>Getting Started</h2>
      <p>To begin, simply:</p>
      <ol>
          <li>Visit our registration page to create your account.</li>
          <li>Once registered, log in to access your personalized dashboard.</li>
          <li>Start adding or searching for products immediately!</li>
      </ol>
      
      <h2>Our Commitment</h2>
      <p>We are dedicated to keeping our platform up-to-date and reliable. We encourage our users to contribute by updating product prices and information to help fellow shoppers.</p>
      
      <h2>Need Help?</h2>
      <p>If you need assistance or have any questions, visit our <a href="/contact-us">Contact Us</a> page, and we'll be happy to help you navigate our site or resolve any issues.</p>
        </div>
      </div>
    </div>
  );
}

export default HowItWorks;