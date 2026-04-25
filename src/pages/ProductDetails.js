import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getProductDetails } from "../services/api";
import "../styles/ProductDetails.css";
import cordialImg from "../assets/images/cordial.jpg";

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};

const formatPrice = (price) => {
  const value = Number(price);
  return Number.isFinite(value) ? `€${value.toFixed(2)}` : "Price unavailable";
};

function ProductDetails() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

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
      ? `€${(price / Number(product.quantity)).toFixed(2)}/${product.unit}`
      : "";

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
          {hasPromo && (
            <div className="promo-info">
              <span className="old-price">Was {formatPrice(originalPrice)},</span>
              <span className="new-price">Now {formatPrice(price)}</span>
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
          </div>
          <div className="product-price">
            <span className="main-price">{formatPrice(price)}</span>
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
    </div>
  );
}

export default ProductDetails;
