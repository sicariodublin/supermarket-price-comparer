import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getProductDetails,
  getProductPricingHistory,
  getUserDashboard,
  reportProductIssue,
  saveUserPreferences,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import cordialImg from "../assets/images/cordial.jpg";
import "../styles/ProductDetails.css";
import {
  formatEuro,
  getApprovalLabel,
  getFreshnessLabel,
  getSourceLabel,
  getTrustClass,
} from "../utilities/productTrust";

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

function ProductDetails() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const [inWatchlist, setInWatchlist] = useState(false);
  const [userWatchlist, setUserWatchlist] = useState([]);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [watchlistMsg, setWatchlistMsg] = useState(null);

  const [pricingHistory, setPricingHistory] = useState(null);
  const [showPricingHistory, setShowPricingHistory] = useState(false);
  const [pricingHistoryLoading, setPricingHistoryLoading] = useState(false);

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportType, setReportType] = useState("incorrect_price");
  const [reportedPrice, setReportedPrice] = useState("");
  const [reportMessage, setReportMessage] = useState("");
  const [reportFeedback, setReportFeedback] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      scrollToTop();
      setLoading(true);
      try {
        const productDetails = await getProductDetails(productId);
        setProduct(productDetails);
      } catch (error) {
        console.error("Error loading product details:", error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchWatchlist = async () => {
      try {
        const data = await getUserDashboard();
        const list = data.watchlist || [];
        setUserWatchlist(list);
        setInWatchlist(list.includes(Number(productId)));
      } catch {
        // non-critical
      }
    };
    fetchWatchlist();
  }, [isAuthenticated, productId]);

  if (loading) {
    return (
      <div className="pd-loading">
        <div className="pd-spinner"></div>
        <p>Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return <div className="pd-not-found">Product not found.</div>;
  }

  const price = Number(product.price);
  const originalPrice = Number(product.original_price);
  const hasPromo = Number.isFinite(originalPrice) && originalPrice > price;
  const unitPrice =
    product.quantity && product.unit && Number.isFinite(price)
      ? `${formatEuro(price / Number(product.quantity))}/${product.unit}`
      : "";

  const handleWatchlistToggle = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setWatchlistLoading(true);
    setWatchlistMsg(null);
    try {
      const numId = Number(productId);
      const newList = inWatchlist
        ? userWatchlist.filter((id) => id !== numId)
        : [...userWatchlist, numId];
      await saveUserPreferences({ watchlist: newList });
      setUserWatchlist(newList);
      setInWatchlist(!inWatchlist);
      setWatchlistMsg(inWatchlist ? "Removed from watchlist" : "Added to watchlist!");
      setTimeout(() => setWatchlistMsg(null), 3000);
    } catch {
      setWatchlistMsg("Could not update watchlist. Please try again.");
    } finally {
      setWatchlistLoading(false);
    }
  };

  const handleViewPricingHistory = async () => {
    if (pricingHistory !== null) {
      setShowPricingHistory((prev) => !prev);
      return;
    }
    setPricingHistoryLoading(true);
    setShowPricingHistory(true);
    try {
      const history = await getProductPricingHistory(productId);
      setPricingHistory(history);
    } catch {
      setPricingHistory([]);
    } finally {
      setPricingHistoryLoading(false);
    }
  };

  const openReportModal = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setReportFeedback("");
    setIsReportOpen(true);
  };

  const closeReportModal = () => {
    setIsReportOpen(false);
    setReportFeedback("");
  };

  const handleReportSubmit = async (event) => {
    event.preventDefault();
    const trimmedMessage = reportMessage.trim();
    if (!trimmedMessage) {
      setReportFeedback("Please add a short note about the issue.");
      return;
    }
    setReportSubmitting(true);
    setReportFeedback("");
    try {
      await reportProductIssue(productId, {
        report_type: reportType,
        reported_price: reportedPrice === "" ? null : Number(reportedPrice),
        message: trimmedMessage,
      });
      setReportFeedback("Report sent for admin review.");
      setReportType("incorrect_price");
      setReportedPrice("");
      setReportMessage("");
    } catch (error) {
      setReportFeedback(
        error?.response?.data?.error || "Could not send this report. Please try again."
      );
    } finally {
      setReportSubmitting(false);
    }
  };

  return (
    <div className="pd-page">

      {/* Hero */}
      <div className="pd-hero">
        <div className="pd-hero-inner">
          <span className="pd-supermarket-badge">{product.supermarket_name}</span>
          <h1 className="pd-product-name">{product.name}</h1>
          <div className="pd-trust-row">
            <span className={`pd-pill ${getTrustClass(product.approval_status)}`}>
              {getApprovalLabel(product.approval_status)}
            </span>
            <span className="pd-pill pd-pill-source">{getSourceLabel(product.source)}</span>
            <span className="pd-freshness">
              {getFreshnessLabel(product.last_checked_at || product.product_date)}
            </span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pd-container">

        {/* Product card */}
        <div className="pd-card">
          <div className="pd-image-wrap">
            <img
              src={product.image_url || cordialImg}
              alt={product.name}
              className="pd-image"
            />
          </div>

          <div className="pd-info">
            <div className="pd-price-block">
              <span className={`pd-main-price${hasPromo ? " pd-promo-price" : ""}`}>
                {formatEuro(price)}
              </span>
              {unitPrice && <span className="pd-unit-price">{unitPrice}</span>}
            </div>

            {hasPromo && (
              <div className="pd-promo-block">
                <span className="pd-old-price">Was {formatEuro(originalPrice)}</span>
                <span className="pd-save-badge">Save {formatEuro(originalPrice - price)}</span>
                {product.promotion_end_date && (
                  <span className="pd-promo-dates">
                    Offer ends {new Date(product.promotion_end_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}

            <div>
              <span className={`pd-stock-badge ${product.available === false ? "pd-out-of-stock" : "pd-in-stock"}`}>
                {product.available === false ? "Out of Stock" : "In Stock"}
              </span>
            </div>

            {watchlistMsg && (
              <p className={`pd-wl-msg ${watchlistMsg.includes("Could") ? "pd-wl-msg-error" : watchlistMsg.includes("Removed") ? "pd-wl-msg-remove" : "pd-wl-msg-add"}`}>
                <i className={`bi ${watchlistMsg.includes("Could") ? "bi-exclamation-circle" : "bi-check-circle"}`}></i>
                {" "}{watchlistMsg}
              </p>
            )}

            <div className="pd-actions">
              <button
                className={`pd-btn pd-btn-watchlist${inWatchlist ? " pd-btn-in-watchlist" : ""}`}
                type="button"
                onClick={handleWatchlistToggle}
                disabled={watchlistLoading}
              >
                <i className={`bi ${inWatchlist ? "bi-heart-fill" : "bi-heart"}`}></i>
                {watchlistLoading ? "Updating..." : inWatchlist ? "In Watchlist" : "Add to Watchlist"}
              </button>

              <button
                className={`pd-btn pd-btn-history${showPricingHistory ? " pd-btn-history-active" : ""}`}
                type="button"
                onClick={handleViewPricingHistory}
                disabled={pricingHistoryLoading}
              >
                <i className="bi bi-graph-up"></i>
                {pricingHistoryLoading ? "Loading..." : showPricingHistory ? "Hide History" : "Price History"}
              </button>

              <button className="pd-btn pd-btn-report" type="button" onClick={openReportModal}>
                <i className="bi bi-flag"></i>
                Report Issue
              </button>
            </div>
          </div>
        </div>

        {/* Pricing history panel */}
        {showPricingHistory && (
          <div className="pd-history-panel">
            <h3 className="pd-history-title">
              <i className="bi bi-graph-up"></i> Price History
            </h3>
            {pricingHistoryLoading ? (
              <p className="pd-history-empty">Loading price history...</p>
            ) : pricingHistory && pricingHistory.length > 0 ? (
              <div className="pd-history-table-wrap">
                <table className="pd-history-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Price</th>
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricingHistory.map((record) => (
                      <tr key={record.id}>
                        <td>
                          {new Date(record.recorded_at).toLocaleDateString("en-IE", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="pd-history-price">{formatEuro(record.price)}</td>
                        <td>{record.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="pd-history-empty">No price history available for this product yet.</p>
            )}
          </div>
        )}

        <div className="pd-back-to-top">
          <button className="pd-back-btn" onClick={scrollToTop} type="button">
            <i className="bi bi-arrow-up"></i> Back to Top
          </button>
        </div>
      </div>

      {/* Report modal */}
      {isReportOpen && (
        <div className="pd-modal-overlay">
          <form className="pd-modal" onSubmit={handleReportSubmit}>
            <div className="pd-modal-header">
              <h3>Report Product Issue</h3>
              <button type="button" className="pd-modal-close" onClick={closeReportModal}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <label htmlFor="report-type">Issue type</label>
            <select
              id="report-type"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="incorrect_price">Incorrect price</option>
              <option value="incorrect_details">Incorrect details</option>
              <option value="not_available">Not available in store</option>
              <option value="duplicate">Duplicate product</option>
              <option value="other">Other issue</option>
            </select>

            <label htmlFor="reported-price">Price you found</label>
            <input
              id="reported-price"
              type="number"
              min="0"
              step="0.01"
              value={reportedPrice}
              onChange={(e) => setReportedPrice(e.target.value)}
              placeholder="Optional"
            />

            <label htmlFor="report-message">Note</label>
            <textarea
              id="report-message"
              value={reportMessage}
              onChange={(e) => setReportMessage(e.target.value)}
              rows="4"
              maxLength="1000"
              placeholder="What should we check?"
            />

            {reportFeedback && (
              <p className={`pd-report-feedback ${reportFeedback.includes("sent") ? "pd-feedback-success" : "pd-feedback-error"}`}>
                {reportFeedback}
              </p>
            )}

            <div className="pd-modal-actions">
              <button className="pd-btn pd-btn-cancel" type="button" onClick={closeReportModal}>
                Close
              </button>
              <button className="pd-btn pd-btn-submit" type="submit" disabled={reportSubmitting}>
                {reportSubmitting ? "Sending..." : "Send Report"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default ProductDetails;
