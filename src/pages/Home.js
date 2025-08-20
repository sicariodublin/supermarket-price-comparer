import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, getFeaturedProducts } from '../services/api';
import NewOrBackInStore from '../components/NewOrBackInStore';
// Comment out these imports temporarily until we create the components
// import CostComparison from '../components/CostComparison';
// import WeeklySales from '../components/WeeklySales';
// import ProductDetailModal from '../components/ProductDetailModal';
import '../styles/Home.css';

function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [priceComparisons, setPriceComparisons] = useState([]); // ADD THIS LINE
  const [collectionDates, setCollectionDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);

  useEffect(() => {
    fetchFeaturedData();
  }, []);

  const fetchFeaturedData = async () => {
    try {
      const products = await getFeaturedProducts(6);
      setFeaturedProducts(products);
      
      // Create price comparison data by grouping products by name
      const allProducts = await getProducts('');
      const productGroups = {};
      allProducts.forEach(product => {
        const productName = product.name.toLowerCase();
        if (!productGroups[productName]) {
          productGroups[productName] = [];
        }
        productGroups[productName].push(product);
      });
      
      // Get top 4 products with multiple supermarket entries for comparison
      const comparisons = Object.entries(productGroups)
        .filter(([name, products]) => products.length > 1)
        .slice(0, 4)
        .map(([name, products]) => ({
          name: products[0].name,
          products: products.sort((a, b) => a.price - b.price)
        }));
      
      setPriceComparisons(comparisons);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    setSelectedProduct(null);
  };

  const calculateSavings = (products) => {
    if (products.length < 2) return 0;
    const cheapest = Math.min(...products.map(p => p.price));
    const expensive = Math.max(...products.map(p => p.price));
    return ((expensive - cheapest) / expensive * 100).toFixed(1);
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Smart Shopping Starts Here</h1>
            <p className="hero-subtitle">
              Compare supermarket prices across Ireland and save money on your weekly shop
            </p>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">€50+</span>
                <span className="stat-label">Average Monthly Savings</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">6</span>
                <span className="stat-label">Major Supermarkets</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">1000+</span>
                <span className="stat-label">Products Tracked</span>
              </div>
            </div>
            <div className="hero-actions">
              <Link to="/search" className="btn btn-primary">
                Start Comparing Prices
              </Link>
              <Link to="/register" className="btn btn-secondary">
                Join Free Today
              </Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="price-preview-card">
              <h3>Live Price Comparison</h3>
              <div className="price-item">
                <span className="product-name">Milk 1L</span>
                <div className="price-range">
                  <span className="price-low">€1.18</span>
                  <span className="price-separator">-</span>
                  <span className="price-high">€1.78</span>
                </div>
                <span className="savings-badge">Save 34%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEW QUIDU-STYLE COMPONENTS */}
      <NewOrBackInStore onProductClick={handleProductClick} />
      
      {/* Temporarily comment out until components are created */}
      {/* <CostComparison onProductClick={handleProductClick} /> */}
      {/* <WeeklySales onProductClick={handleProductClick} /> */}

      {/* Existing Price Comparison Tables */}
      <section className="comparison-section">
        <div className="container">
          <h2>Today's Best Price Comparisons</h2>
          <p className="section-subtitle">
            See how much you can save by choosing the right supermarket
          </p>
          
          {loading ? (
            <div className="loading-spinner">Loading price comparisons...</div>
          ) : (
            <div className="comparison-grid">
              {priceComparisons.map((comparison, index) => (
                <div key={index} className="comparison-card">
                  <h3 className="product-title">{comparison.name}</h3>
                  <div className="price-comparison-table">
                    {comparison.products.map((product, idx) => (
                      <div key={idx} className={`price-row ${idx === 0 ? 'best-price' : ''}`}>
                        <div className="supermarket-info">
                          <span className="supermarket-name">{product.supermarket_name}</span>
                          {idx === 0 && <span className="best-badge">Best Price</span>}
                        </div>
                        <div className="price-info">
                          <span className="price">€{product.price}</span>
                          <span className="unit">/{product.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="savings-info">
                    <span className="savings-text">
                      Save up to {calculateSavings(comparison.products)}% by choosing wisely
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2>Why Choose AddAndCompare?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Real-Time Prices</h3>
              <p>Get up-to-date pricing information from all major Irish supermarkets</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3>Smart Savings</h3>
              <p>Our algorithms help you find the best deals and maximize your savings</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Mobile Friendly</h3>
              <p>Compare prices on the go with our responsive mobile design</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔔</div>
              <h3>Price Alerts</h3>
              <p>Get notified when your favorite products go on sale</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Start Saving?</h2>
            <p>Join thousands of smart shoppers who save money every week</p>
            <Link to="/register" className="btn btn-primary btn-large">
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* Product Detail Modal - temporarily commented out */}
      {/* {showProductModal && selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={closeProductModal}
        />
      )} */}
    </div>
  );
}

export default Home;
