// Dashboard.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";
import "../styles/Modal.css";
import AccountSettingsModal from "./AccountSettingsModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import NewsletterOptionsModal from "./NewsletterOptionsModal";
import CheapestWeeklyShopModal from "./CheapestWeeklyShopModal";
import ProductSeasonalityModal from "./ProductSeasonalityModal";

const Dashboard = () => {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isNewsletterModalOpen, setIsNewsletterModalOpen] = useState(false);
  const [isWeeklyShopModalOpen, setIsWeeklyShopModalOpen] = useState(false);
  const [isSeasonalityModalOpen, setIsSeasonalityModalOpen] = useState(false);
  const navigate = useNavigate();
  /* const { user, logout, } = useAuth(); */

  // Mock data (replace with API calls later)
  const userData = {
    name: "Fsteyer",
    watchlist: [],
    dataCollectionDates: [
      { supermarket: "Aldi", date: "05-12-24" },
      { supermarket: "Dunnes Stores", date: "05-12-24" },
      { supermarket: "SuperValu", date: "05-12-24" },
      { supermarket: "Tesco", date: "05-12-24" },
    ],
    newsletterSettings: {
      weeklyDeals: true,
      priceAlerts: false,
      newProducts: true,
      seasonalTips: false
    },
    weeklyShopBudget: 150,
    preferredSupermarkets: ["Aldi", "Tesco"]
  };

  // Modal control handlers
  const handleOpenSettings = () => setIsSettingsModalOpen(true);
  const handleCloseSettings = () => setIsSettingsModalOpen(false);

  const handleOpenNewsletter = () => setIsNewsletterModalOpen(true);
  const handleCloseNewsletter = () => setIsNewsletterModalOpen(false);

  const handleOpenWeeklyShop = () => setIsWeeklyShopModalOpen(true);
  const handleCloseWeeklyShop = () => setIsWeeklyShopModalOpen(false);

  const handleOpenSeasonality = () => setIsSeasonalityModalOpen(true);
  const handleCloseSeasonality = () => setIsSeasonalityModalOpen(false);

  const handlePasswordReset = () => {
    setIsSettingsModalOpen(false);
    navigate("/password-reset");
  };

  const handleDeleteAccount = () => {
    setIsSettingsModalOpen(false);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    console.log("Account deleted");
    setIsDeleteModalOpen(false);
    // Call API to delete account here
  };

  const handleNewsletterSave = (settings) => {
    console.log("Newsletter settings saved:", settings);
    // Call API to save newsletter settings
    setIsNewsletterModalOpen(false);
  };

  const handleWeeklyShopSave = (data) => {
    console.log("Weekly shop preferences saved:", data);
    // Call API to save weekly shop preferences
    setIsWeeklyShopModalOpen(false);
  };

  return (
    <div className="dashboard">
      {/* Greeting Section */}
      <header className="dashboard-header">
        <div className="greeting">
          <i className="bi bi-person pt-3 color-normal-blue" id="pers"></i>
          <div>
            <p>Hello,</p>
            <p>{userData.name}!</p>
          </div>
        </div>
      </header>

      {/* My Options Section */}
      <section className="options-section">
        <h3>My Options</h3>
        <div className="options-grid">
          <div className="option" onClick={handleOpenSettings}>
            <span>Account Settings</span>
            <i className="bi bi-gear"></i>
          </div>
          <div className="option" onClick={handleOpenNewsletter}>
            <span>Newsletter Options</span>
            <i className="bi bi-envelope"></i>
          </div>
          <div className="option" onClick={handleOpenWeeklyShop}>
            <span>Cheapest Weekly Shop</span>
            <i className="bi bi-bar-chart"></i>
          </div>
          <div className="option" onClick={handleOpenSeasonality}>
            <span>Product Seasonality</span>
            <i className="bi bi-cloud-sun"></i>
          </div>
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

      {/* Account Settings Modal */}
      <AccountSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={handleCloseSettings}
        onPasswordReset={handlePasswordReset}
        onDeleteAccount={handleDeleteAccount}
      />

      {/* Newsletter Options Modal */}
      <NewsletterOptionsModal
        isOpen={isNewsletterModalOpen}
        onClose={handleCloseNewsletter}
        onSave={handleNewsletterSave}
        currentSettings={userData.newsletterSettings}
      />

      {/* Cheapest Weekly Shop Modal */}
      <CheapestWeeklyShopModal
        isOpen={isWeeklyShopModalOpen}
        onClose={handleCloseWeeklyShop}
        onSave={handleWeeklyShopSave}
        currentBudget={userData.weeklyShopBudget}
        preferredSupermarkets={userData.preferredSupermarkets}
      />

      {/* Product Seasonality Modal */}
      <ProductSeasonalityModal
        isOpen={isSeasonalityModalOpen}
        onClose={handleCloseSeasonality}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        /* user={user} // Pass the user data */
      />
    </div>
  );
};

export default Dashboard;
