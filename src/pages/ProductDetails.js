import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProductDetails, reportProductIssue } from "../services/api";
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
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};

function ProductDetails() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
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

  if (loading) {
    return <div className="product-details-page">Loading product details...</div>;
  }

  if (!product) {
    return <div className="product-details-page">Product not found.</div>;
  }

  const price = Number(product.price);
  const originalPrice = Number(product.original_price);
  const hasPromo = Number.isFinite(originalPrice) && originalPrice > price;
  const unitPrice =
    product.quantity && product.unit && Number.isFinite(price)
      ? `${formatEuro(price / Number(product.quantity))}/${product.unit}`
      : "";

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
    <div className="product-details-page">
      <div className="product-details-main">
        <div className="product-image-section">
          <img src={product.image_url || cordialImg} alt={product.name} className="product-image" />
          <button className="cart-btn" type="button">
            <span role="img" aria-label="shopping cart">🛒</span>
          </button>
        </div>
        <div className="product-info-section">
          <span className="supermarket-badge">{product.supermarket_name}</span>
          <h2>{product.name}</h2>
          <div className="product-trust-panel">
            <span className={`trust-pill ${getTrustClass(product.approval_status)}`}>
              {getApprovalLabel(product.approval_status)}
            </span>
            <span className="trust-pill source">{getSourceLabel(product.source)}</span>
            <span className="freshness-label">
              {getFreshnessLabel(product.last_checked_at || product.product_date)}
            </span>
          </div>
          {hasPromo && (
            <div className="promo-info">
              <span className="old-price">Was {formatEuro(originalPrice)},</span>
              <span className="new-price">Now {formatEuro(price)}</span>
              {product.promotion_end_date && (
                <div className="promo-dates">
                  Offer ends {new Date(product.promotion_end_date).toLocaleDateString()}
                </div>
              )}
            </div>
          )}
          <div>
            <span>{product.available === false ? "Out of Stock" : "In Stock"}</span>
          </div>
          <button type="button" className="see-more-link">See More Info...</button>
          <div className="product-actions">
            <button className="btn btn-primary" type="button">Watchlist</button>
            <button className="btn btn-primary" type="button">View Pricing History</button>
            <button className="btn btn-secondary report-issue-btn" type="button" onClick={openReportModal}>
              Report Issue
            </button>
          </div>
          <div className="product-price">
            <span className="main-price">{formatEuro(price)}</span>
            <span className="unit-price">{unitPrice}</span>
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", margin: "32px 0" }}>
        <button
          className="btn btn-secondary"
          onClick={scrollToTop}
          style={{ padding: "8px 24px", fontSize: "1rem" }}
          type="button"
        >
          Back to Top
        </button>
      </div>

      {isReportOpen && (
        <div className="report-modal-overlay">
          <form className="report-modal" onSubmit={handleReportSubmit}>
            <div className="report-modal-header">
              <h3>Report Product Issue</h3>
              <button type="button" className="report-close-btn" onClick={closeReportModal}>
                x
              </button>
            </div>

            <label htmlFor="report-type">Issue type</label>
            <select
              id="report-type"
              value={reportType}
              onChange={(event) => setReportType(event.target.value)}
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
              onChange={(event) => setReportedPrice(event.target.value)}
              placeholder="Optional"
            />

            <label htmlFor="report-message">Note</label>
            <textarea
              id="report-message"
              value={reportMessage}
              onChange={(event) => setReportMessage(event.target.value)}
              rows="4"
              maxLength="1000"
              placeholder="What should we check?"
            />

            {reportFeedback && <p className="report-feedback">{reportFeedback}</p>}

            <div className="report-actions">
              <button className="btn btn-secondary" type="button" onClick={closeReportModal}>
                Close
              </button>
              <button className="btn btn-primary" type="submit" disabled={reportSubmitting}>
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
