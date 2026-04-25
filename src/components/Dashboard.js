// Dashboard.js
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Dashboard.css";
import "../styles/Modal.css";
import AccountSettingsModal from "./AccountSettingsModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import NewsletterOptionsModal from "./NewsletterOptionsModal";
import CheapestWeeklyShopModal from "./CheapestWeeklyShopModal";
import ProductSeasonalityModal from "./ProductSeasonalityModal";
import {
  getCollectionDates,
  getMyProductSubmissions,
  getPendingProducts,
  getProductReports,
  updateProductApproval,
  updateProductReport,
} from '../services/api';
import { formatEuro } from "../utilities/productTrust";

const Dashboard = () => {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isNewsletterModalOpen, setIsNewsletterModalOpen] = useState(false);
  const [isWeeklyShopModalOpen, setIsWeeklyShopModalOpen] = useState(false);
  const [isSeasonalityModalOpen, setIsSeasonalityModalOpen] = useState(false);
  const [generatedShoppingLists, setGeneratedShoppingLists] = useState([]);
  const [collectionDates, setCollectionDates] = useState([]);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [productReports, setProductReports] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [showModerationPanel, setShowModerationPanel] = useState(false);
  const [moderationLoading, setModerationLoading] = useState(false);
  const [moderationMessage, setModerationMessage] = useState("");
  const [showReportsPanel, setShowReportsPanel] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsMessage, setReportsMessage] = useState("");
  const [reportStatusFilter, setReportStatusFilter] = useState("open");
  const [reportNotes, setReportNotes] = useState({});
  const navigate = useNavigate();
  const { user } = useAuth(); // Get user from AuthContext

  // Function to extract first name from email or full name
  const getDisplayName = () => {
    if (!user) return "User";
    
    // If user has a name field, use it
    if (user.name) {
      return user.name.split(' ')[0]; // Get first name
    }
    
    // If user has email, extract name from email
    if (user.email) {
      const emailName = user.email.split('@')[0];
      // Convert email format like "mica.campi" to "Mica"
      const firstName = emailName.split('.')[0];
      return firstName.charAt(0).toUpperCase() + firstName.slice(1);
    }
    
    return "User";
  };

  const fetchPendingProducts = useCallback(async () => {
    setModerationLoading(true);
    setModerationMessage("");

    try {
      const products = await getPendingProducts();
      setPendingProducts(products);
      setShowModerationPanel(true);
    } catch (error) {
      if (error?.response?.status !== 403) {
        setShowModerationPanel(true);
        setModerationMessage(
          error?.response?.data?.error || "Could not load pending product submissions."
        );
      }
    } finally {
      setModerationLoading(false);
    }
  }, []);

  const fetchProductReports = useCallback(async () => {
    setReportsLoading(true);
    setReportsMessage("");

    try {
      const reports = await getProductReports(reportStatusFilter);
      setProductReports(reports);
      setShowReportsPanel(true);
    } catch (error) {
      if (error?.response?.status !== 403) {
        setShowReportsPanel(true);
        setReportsMessage(
          error?.response?.data?.error || "Could not load product reports."
        );
      }
    } finally {
      setReportsLoading(false);
    }
  }, [reportStatusFilter]);

  const fetchMySubmissions = useCallback(async () => {
    setSubmissionsLoading(true);

    try {
      const submissions = await getMyProductSubmissions();
      setMySubmissions(submissions);
    } catch (error) {
      console.error("Error fetching product submissions:", error);
      setMySubmissions([]);
    } finally {
      setSubmissionsLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchCollectionDates = async () => {
      try {
        const dates = await getCollectionDates();
        setCollectionDates(dates);
      } catch (error) {
        console.error('Error fetching collection dates:', error);
        const mockData = [
          { id: 1, name: "Aldi", last_updated: "2024-12-05" },
          { id: 2, name: "Dunnes Stores", last_updated: "2024-12-05" },
          { id: 3, name: "SuperValu", last_updated: "2024-12-05" },
          { id: 4, name: "Tesco", last_updated: "2024-12-05" },
        ];
        setCollectionDates(mockData);
      }
    };
    
    fetchCollectionDates();
    fetchMySubmissions();
    fetchPendingProducts();
  }, [fetchMySubmissions, fetchPendingProducts]);

  useEffect(() => {
    fetchProductReports();
  }, [fetchProductReports]);
  
  // Mock data (replace with API calls later)
  const userData = {
    name: getDisplayName(),
    watchlist: [],
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

  const handleGeneratedShoppingList = (listData) => {
    const newList = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      budget: listData.budget,
      totalCost: listData.totalCost,
      items: listData.items,
      supermarkets: listData.supermarkets
    };
    setGeneratedShoppingLists(prev => [newList, ...prev.slice(0, 4)]); // Keep only 5 most recent
  };

  const deleteShoppingList = (listId) => {
    setGeneratedShoppingLists(prev => prev.filter(list => list.id !== listId));
  };

  const handleModerationAction = async (productId, status) => {
    setModerationMessage("");

    try {
      await updateProductApproval(productId, {
        status,
        rejected_reason: status === "rejected" ? "Rejected from dashboard review." : "",
      });
      setPendingProducts((prev) => prev.filter((product) => product.id !== productId));
      setModerationMessage(`Product ${status}.`);
    } catch (error) {
      setModerationMessage(
        error?.response?.data?.error || `Failed to mark product as ${status}.`
      );
    }
  };

  const formatReportType = (type) => {
    const labels = {
      incorrect_price: "Incorrect price",
      incorrect_details: "Incorrect details",
      not_available: "Not available",
      duplicate: "Duplicate",
      other: "Other",
    };

    return labels[type] || "Product issue";
  };

  const handleReportNoteChange = (reportId, value) => {
    setReportNotes((prev) => ({
      ...prev,
      [reportId]: value,
    }));
  };

  const handleReportAction = async (reportId, status) => {
    setReportsMessage("");

    try {
      await updateProductReport(reportId, {
        status,
        admin_notes: reportNotes[reportId] || "",
      });

      setProductReports((prev) => prev.filter((report) => report.id !== reportId));
      setReportNotes((prev) => {
        const next = { ...prev };
        delete next[reportId];
        return next;
      });
      setReportsMessage(`Report marked as ${status}.`);
    } catch (error) {
      setReportsMessage(
        error?.response?.data?.error || `Failed to mark report as ${status}.`
      );
    }
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

      <section className="submissions-section">
        <div className="submissions-header">
          <h3>My Product Submissions</h3>
          <button
            type="button"
            className="refresh-submissions-btn"
            onClick={fetchMySubmissions}
            disabled={submissionsLoading}
          >
            <i className="bi bi-arrow-clockwise"></i>
            Refresh
          </button>
        </div>

        {submissionsLoading ? (
          <p>Loading your submissions...</p>
        ) : mySubmissions.length > 0 ? (
          <div className="submission-list">
            {mySubmissions.map((product) => (
              <div className="submission-card" key={product.id}>
                <div>
                  <strong>{product.name}</strong>
                  <span>{product.quantity} {product.unit} at {product.supermarket_name || "Unknown"}</span>
                </div>
                <div className="submission-meta">
                  <span>{formatEuro(product.price)}</span>
                  <span className={`submission-status ${product.approval_status}`}>
                    {product.approval_status}
                  </span>
                </div>
                {product.rejected_reason && (
                  <p className="submission-reason">{product.rejected_reason}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>You have not submitted any products yet.</p>
        )}
      </section>

      {/* Data Collection Dates */}
      <section className="data-collection-dates">
        <h3>Data Collection Dates</h3>
        <div className="dates-grid">
          {collectionDates.map((item) => (
            <div key={item.id} className="date-card">
              <span>{item.name}</span>
              <span>{new Date(item.last_updated).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </section>

      {showModerationPanel && (
        <section className="moderation-section">
          <div className="moderation-header">
            <h3>Pending Product Reviews</h3>
            <button
              type="button"
              className="refresh-moderation-btn"
              onClick={fetchPendingProducts}
              disabled={moderationLoading}
            >
              <i className="bi bi-arrow-clockwise"></i>
              Refresh
            </button>
          </div>

          {moderationMessage && (
            <p className="moderation-message">{moderationMessage}</p>
          )}

          {moderationLoading ? (
            <p>Loading pending products...</p>
          ) : pendingProducts.length > 0 ? (
            <div className="moderation-table-wrap">
              <table className="moderation-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Supermarket</th>
                    <th>Price</th>
                    <th>Submitted By</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingProducts.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <strong>{product.name}</strong>
                        <span>{product.quantity} {product.unit}</span>
                      </td>
                      <td>{product.supermarket_name || "Unknown"}</td>
                      <td>{formatEuro(product.price)}</td>
                      <td>{product.submitted_by_email || "Unknown"}</td>
                      <td>
                        <div className="moderation-actions">
                          <button
                            type="button"
                            className="approve-btn"
                            onClick={() => handleModerationAction(product.id, "approved")}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="reject-btn"
                            onClick={() => handleModerationAction(product.id, "rejected")}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No pending product submissions.</p>
          )}
        </section>
      )}

      {showReportsPanel && (
        <section className="reports-section">
          <div className="reports-header">
            <h3>Product Issue Reports</h3>
            <div className="reports-controls">
              <select
                value={reportStatusFilter}
                onChange={(event) => setReportStatusFilter(event.target.value)}
                aria-label="Filter product reports"
              >
                <option value="open">Open</option>
                <option value="reviewed">Reviewed</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
                <option value="all">All</option>
              </select>
              <button
                type="button"
                className="refresh-reports-btn"
                onClick={fetchProductReports}
                disabled={reportsLoading}
              >
                <i className="bi bi-arrow-clockwise"></i>
                Refresh
              </button>
            </div>
          </div>

          {reportsMessage && (
            <p className="reports-message">{reportsMessage}</p>
          )}

          {reportsLoading ? (
            <p>Loading product reports...</p>
          ) : productReports.length > 0 ? (
            <div className="reports-list">
              {productReports.map((report) => (
                <div className="report-card" key={report.id}>
                  <div className="report-card-main">
                    <div>
                      <span className={`report-status ${report.status}`}>{report.status}</span>
                      <h4>{report.product_name || "Deleted product"}</h4>
                      <p>
                        {report.supermarket_name || "Unknown supermarket"} - {report.quantity || "-"} {report.unit || ""}
                      </p>
                      <p className="report-message-text">{report.message}</p>
                    </div>
                    <div className="report-price-block">
                      <span>Current</span>
                      <strong>{formatEuro(report.current_price)}</strong>
                      {report.reported_price != null && (
                        <>
                          <span>Reported</span>
                          <strong>{formatEuro(report.reported_price)}</strong>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="report-meta">
                    <span>{formatReportType(report.report_type)}</span>
                    <span>By {report.reported_by_email || "Unknown"}</span>
                    <span>{new Date(report.created_at).toLocaleString()}</span>
                  </div>

                  <textarea
                    value={reportNotes[report.id] || ""}
                    onChange={(event) => handleReportNoteChange(report.id, event.target.value)}
                    placeholder="Admin note"
                    rows="2"
                  />

                  <div className="report-review-actions">
                    <button
                      type="button"
                      className="reviewed-btn"
                      onClick={() => handleReportAction(report.id, "reviewed")}
                    >
                      Reviewed
                    </button>
                    <button
                      type="button"
                      className="resolved-btn"
                      onClick={() => handleReportAction(report.id, "resolved")}
                    >
                      Resolved
                    </button>
                    <button
                      type="button"
                      className="dismiss-btn"
                      onClick={() => handleReportAction(report.id, "dismissed")}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No product reports for this filter.</p>
          )}
        </section>
      )}

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

      {/* My Generated Shopping Lists Section */}
      {generatedShoppingLists.length > 0 && (
        <section className="shopping-lists-section">
          <h3>My Generated Shopping Lists</h3>
          <div className="shopping-lists-grid">
            {generatedShoppingLists.map((list) => (
              <div className="shopping-list-card" key={list.id}>
                <div className="list-header">
                  <h4>Weekly Shop - {list.date}</h4>
                  <button 
                    className="delete-list-btn"
                    onClick={() => deleteShoppingList(list.id)}
                    title="Delete list"
                  >
                    ×
                  </button>
                </div>
                <div className="list-summary">
                  <p><strong>Budget:</strong> {formatEuro(list.budget)}</p>
                  <p><strong>Total Cost:</strong> {formatEuro(list.totalCost)}</p>
                  <p><strong>Savings:</strong> {formatEuro(list.budget - list.totalCost)}</p>
                </div>
                <div className="list-items">
                  <h5>Items ({list.items.length}):</h5>
                  <ul>
                    {list.items.slice(0, 3).map((item, index) => (
                      <li key={index}>
                        {item.name} - {formatEuro(item.price)} ({item.store})
                      </li>
                    ))}
                    {list.items.length > 3 && (
                      <li>...and {list.items.length - 3} more items</li>
                    )}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Cheapest Weekly Shop Modal */}
      <CheapestWeeklyShopModal
        isOpen={isWeeklyShopModalOpen}
        onClose={handleCloseWeeklyShop}
        onSave={handleWeeklyShopSave}
        onGenerateList={handleGeneratedShoppingList}
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
