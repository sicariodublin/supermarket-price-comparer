import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../styles/ProductDetails.css";
import cordialImg from "../assets/images/cordial.jpg";

// Function to scroll to top smoothly
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};

function ProductDetails() {
  const { productId } = useParams();

  useEffect(() => { 
    scrollToTop();
    console.log("ProductDetails page loaded for productId:", productId);
    // Replace with real API call
    setProduct({
      id: productId,
      name: "Dunnes Stores Simply Better Warm & Spicy Clove Cordial 500ml",
      image: cordialImg,
      supermarket: "Dunnes Stores",
      price: 4.99,
      pricePerUnit: "€9.98/L",
      inStock: true,
      vegetarian: true,
      promo: {
        oldPrice: 4.99,
        newPrice: 1.0,
        perUnit: "€2.00/L",
        dates: "15/07/25 - 19/09/25"
      }
    });
    setSimilarProducts([
      {
        supermarket: "Tesco",
        name: "Bottlegreen Elderflower Cordial 50Cl",
        price: 3.89,
        pricePerUnit: "€7.78/L",
        promo: "€3.00 with Clubcard"
      },
      {
        supermarket: "SuperValu",
        name: "Bottlegreen Elderflower Cordial (500 ml)",
        price: 3.25,
        pricePerUnit: "€6.50/L"
      },
      {
        supermarket: "SuperValu",
        name: "Bottlegreen Spiced Berry Cordial Bottle (500 ml)",
        price: 3.25,
        pricePerUnit: "€6.50/L"
      }
    ]);
  }, [productId]);

  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);

  return (
    <div className="product-details-page">
      <div className="product-details-main">
        <div className="product-image-section">
          <img src={product?.imageUrl} alt={product?.name} className="product-image" />
          <button className="cart-btn"><span role="img" aria-label="shopping cart">🛒</span></button>
        </div>
        <div className="product-info-section">
          <span className="supermarket-badge">{product?.supermarket}</span>
          <h2>{product?.name}</h2>
          {product?.promo && (
            <div className="promo-info">
              <span className="old-price">Was €{product.promo.oldPrice},</span>
              <span className="new-price">Now €{product.promo.newPrice} ({product.promo.perUnit})</span>
              <div className="promo-dates">{product.promo.dates}</div>
            </div>
          )}
          <div>
            <span>{product?.inStock ? "In Stock" : "Out of Stock"}</span>
          </div>
          <div>
            <span>{product?.vegetarian ? "Suitable for Vegetarians" : ""}</span>
          </div>
          <a href="#" className="see-more-link">See More Info...</a>
          <div className="product-actions">
            <button className="btn btn-primary">Watchlist</button>
            <button className="btn btn-primary">View Pricing History</button>
          </div>
          <div className="product-price">
            <span className="main-price">€{product?.price}</span>
            <span className="unit-price">{product?.pricePerUnit}</span>
          </div>
        </div>
      </div>
      <div className="similar-products-section">
        <h3>More like this...</h3>
        <table className="similar-products-table">
          <tbody>
            <tr>
              <th>Supermarket</th>
              <th>Product</th>
              <th>Price</th>
            </tr>
            {similarProducts.map((sp, idx) => (
              <tr key={idx}>
                <td>{sp.supermarket}</td>
                <td>{sp.name} {sp.promo && <span className="promo">{sp.promo}</span>}</td>
                <td>
                  €{sp.price}
                  <span className="unit-price">{sp.pricePerUnit}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ textAlign: "center", margin: "32px 0" }}>
        <button
          className="btn btn-secondary"
          onClick={scrollToTop}
          style={{ padding: "8px 24px", fontSize: "1rem" }}
        >
          Back to Top
        </button>
      </div>
    </div>
  );
}

export default ProductDetails;
