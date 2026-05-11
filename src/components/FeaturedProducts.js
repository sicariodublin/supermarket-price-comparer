// FeaturedProducts.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getFeaturedProducts } from '../services/api';
import './FeaturedProducts.css';

import SaltedCaramelTruffleImg from '../assets/images/salted_caramel_truffle.jpg';
import DunnesViledaBucketImg from '../assets/images/dunnes_vileda_bucket.jpg';
import DunnesYellowCabernetImg from '../assets/images/dunnes_yellow_tail_cabernet_sauvignon_red_wine.jpg';
import PlaceholderProductImg from '../assets/images/logo4.png';
import {
  formatEuro,
  getApprovalLabel,
  getFreshnessLabel,
  getSourceLabel,
  getTrustClass,
} from '../utilities/productTrust';

const FeaturedProducts = ({ onProductClick }) => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
 // const [mockProduct, setMockProduct] = useState({});


  useEffect(() => {
    fetchFeaturedProducts();
    //mockProd(); // Call mockProd instead of fetchFeaturedProducts to test your mock data
  }, []);

  const fetchFeaturedProducts = async () => {
    const mockProduct = [
      {
        id: 1,
        name: "Salted Caramel Truffle",
        price: 4.99,
        original_price: 5.99,
        supermarket_name: "Tesco",
        discount_percentage: 25,
        featured: 1,
        image: SaltedCaramelTruffleImg,
        approval_status: "approved",
        source: "scraper",
        last_checked_at: new Date().toISOString(),
      },
      {
        id: 2,
        name: "Dunnes Vileda Bucket",
        price: 13.99,
        original_price: 19.99,
        supermarket_name: "Dunnes Stores",
        discount_percentage: 25,
        featured: 2,
        image: DunnesViledaBucketImg,
        approval_status: "approved",
        source: "scraper",
        last_checked_at: new Date().toISOString(),
      },
      {
        id: 3,
        name: "Dunnes Yellow Cabernet Sauvignon Red Wine",
        price: 19.99,
        original_price: 24.99,
        supermarket_name: "Dunnes Stores",
        discount_percentage: 20,
        featured: 3,
        image: DunnesYellowCabernetImg,
        approval_status: "approved",
        source: "scraper",
        last_checked_at: new Date().toISOString(),
      },
      {
        id: 4,
        name: "Salted Caramel Truffle",
        price: 4.99,
        original_price: 5.99,
        supermarket_name: "Tesco",
        discount_percentage: 25,
        featured: 1,
        image: SaltedCaramelTruffleImg,
        approval_status: "approved",
        source: "scraper",
        last_checked_at: new Date().toISOString(),
      },
      {
        id: 5,
        name: "Dunnes Vileda Bucket",
        price: 13.99,
        original_price: 19.99,
        supermarket_name: "Dunnes Stores",
        discount_percentage: 25,
        featured: 2,
        image: DunnesViledaBucketImg,
        approval_status: "approved",
        source: "scraper",
        last_checked_at: new Date().toISOString(),
      },
      {
        id: 6,
        name: "Dunnes Yellow Cabernet Sauvignon Red Wine",
        price: 19.99,
        original_price: 24.99,
        supermarket_name: "Dunnes Stores",
        discount_percentage: 20,
        featured: 3,
        image: DunnesYellowCabernetImg,
        approval_status: "approved",
        source: "scraper",
        last_checked_at: new Date().toISOString(),
      },
    ];

    try {
      const data = await getFeaturedProducts(6);
      if (Array.isArray(data) && data.length > 0) {
        setFeaturedProducts(data);
      } else {
        setFeaturedProducts(mockProduct);
      }
    } catch (error) {
      console.error('Error fetching featured products:', error);
      setFeaturedProducts(mockProduct);
    } finally {
      setLoading(false);
    }
  };

  /*
  const mockProd = () => {
    const mockProduct = {
      id: 1,
      name: "Salted Caramel Truffle",
      price: 4.99,
      original_price: 5.99,
      supermarket_name: "Tesco",
      discount_percentage: 25,
      featured: 1,
      image: SaltedCaramelTruffleImg,
    };
    
    setMockProduct([mockProduct]);
    setLoading(false);
  };
  */

  if (loading) {
    return (
      <section className="featured-products-section">
        <div className="container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading featured products...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="featured-products-section">
      <div className="container">
        <div className="section-header">
          <h2>Featured Products</h2>
          <p>Discover our handpicked selection of premium products at unbeatable prices!</p>
        </div>
        
        {featuredProducts.length === 0 ? (
          <div className="no-products-message">
            <div className="no-products-icon"><span role="img" aria-label="box">📦</span></div>
            <h3>No Featured Products Available</h3>
            <p>Check back soon for exciting featured deals!</p>
          </div>
        ) : (
          <div className="featured-products-grid">
            {featuredProducts.map((product) => (
              <div 
                key={product.id} 
                className="featured-product-card" 
                onClick={() => onProductClick && onProductClick(product)}
              >
                <div className="featured-product-image-container">
                  <img 
                    src={product.image_url || product.image || PlaceholderProductImg} 
                    alt={product.name}
                    className="featured-product-image"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = PlaceholderProductImg;
                    }}
                  />
                  {product.discount_percentage > 0 && (
                    <div className="featured-discount-badge">
                      -{product.discount_percentage}%
                    </div>
                  )}
                  {product.featured === 1 && (
                    <div className="featured-badge">
                      <span role="img" aria-label="star">⭐</span> Featured
                    </div>
                  )}
                </div>
                <div className="featured-product-info">
                  <h3 className="featured-product-name">{product.name}</h3>
                  <div className="featured-product-details">
                    {product.quantity && product.unit ? (
                      <span className="featured-product-quantity">{product.quantity} {product.unit}</span>
                    ) : (
                      <span className="featured-product-quantity">&nbsp;</span>
                    )}
                    <span className="featured-supermarket-name">
                      {product.supermarket_name || product.supermarket || "Unknown"}
                    </span>
                  </div>

                  <div className="trust-row">
                    <span className={`trust-pill ${getTrustClass(product.approval_status)}`}>
                      {getApprovalLabel(product.approval_status)}
                    </span>
                    <span className="trust-pill source">{getSourceLabel(product.source)}</span>
                    <span className="freshness-label">
                      {getFreshnessLabel(product.last_checked_at || product.product_date)}
                    </span>
                  </div>

                  <div className="featured-price-container">
                    <span className="featured-product-price">{formatEuro(product.price)}</span>
                    {Number(product.original_price) > Number(product.price) && (
                      <span className="featured-original-price">{formatEuro(product.original_price)}</span>
                    )}
                  </div>
                  <Link 
                    to={`/product/${product.id}`} 
                    className="view-product-btn"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;