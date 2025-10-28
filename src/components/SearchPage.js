// SearchPage.js
import React, { useEffect, useState } from "react";
import { useAuth } from '../context/AuthContext';
import { getProducts, addProduct, updateProduct } from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import "../styles/SearchPage.css";
import SearchPageForm from "./SearchPageForm";

function SearchPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Handle URL query parameters from quick search
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const queryFromUrl = queryParams.get('q');
    
    if (queryFromUrl && queryFromUrl !== searchTerm) {
      setSearchTerm(queryFromUrl);
    }
  }, [location.search]);

  const fetchProducts = async (searchTerm = "", sortOption = "") => {
    try {
      const data = await getProducts(searchTerm);
      setProducts(data);
      filterAndSortProducts(searchTerm, sortOption, data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    if (searchTerm || sortOption) {
      fetchProducts(searchTerm, sortOption);
    }
  }, [searchTerm, sortOption]);

  const handleProductSaved = async (newProduct) => {
    if (!isAuthenticated) return;

    try {
      const savedProduct = await addProduct(newProduct);
      setProducts((prev) => [...prev, savedProduct]);
      filterAndSortProducts(searchTerm, sortOption, [
        ...products,
        savedProduct,
      ]);
    } catch (error) {
      console.error("Error saving product:", error);
    }
  };

  const handleProductUpdated = async (updatedProduct) => {
    if (!isAuthenticated) return;

    try {
      const result = await updateProduct(updatedProduct.id, updatedProduct);
      const updatedProducts = products.map((product) =>
        product.id === updatedProduct.id ? updatedProduct : product
      );
      setProducts(updatedProducts);
      filterAndSortProducts(searchTerm, sortOption, updatedProducts);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setProductToEdit(null);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSortChange = (e) => {
    const selectedSort = e.target.value;
    setSortOption(selectedSort);

    if (selectedSort === "") {
      setSearchTerm("");
      setFilteredProducts([]);
    } else {
      filterAndSortProducts(searchTerm, selectedSort);
    }
  };

  const filterAndSortProducts = (term, sort, productList = products) => {
    let filtered = Array.isArray(productList) ? productList : [];

    if (term) {
      filtered = filtered.filter((product) =>
        product.name?.toLowerCase().includes(term.toLowerCase())
      );
    }

    if (sort === "name") {
      filtered = filtered.sort((a, b) =>
        (a.name || "").localeCompare(b.name || "")
      );
    } else if (sort === "price") {
      filtered = filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sort === "date") {
      filtered = filtered.sort((a, b) => {
        const dateA = a.product_date ? new Date(a.product_date).getTime() : 0;
        const dateB = b.product_date ? new Date(b.product_date).getTime() : 0;
        return dateB - dateA;
      });
    } else if (sort === "supermarket") {
      filtered = filtered.sort((a, b) =>
        (a.supermarket_name || "").localeCompare(b.supermarket_name || "")
      );
    } else if (["Lidl", "SuperValu", "TESCO", "Aldi", "M&S", "Dunnes Stores"].includes(sort)) {
      filtered = filtered.filter(
        (product) => product.supermarket_name === sort
      );
    }

    setFilteredProducts(filtered);
  };

  const handleEditClick = (product) => {
    if (isAuthenticated) {
      setIsEditing(true);
      setProductToEdit(product);
    } else {
      setShowAuthPrompt(true);
    }
  };

  const handleAddProductClick = () => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
    }
  };

  const handleAuthChoice = (choice) => {
    setShowAuthPrompt(false);
    if (choice === 'login') {
      navigate('/login');
    } else if (choice === 'register') {
      navigate('/register');
    }
  };

  const getSupermarketLogo = (supermarketName) => {
    const logos = {
      'Lidl': '🛒',
      'SuperValu': '🏪',
      'TESCO': '🏬',
      'Aldi': '🛍️',
      'M&S': '🏢',
      'Dunnes Stores': '🏪'
    };
    return logos[supermarketName] || '🏪';
  };

  const getBestPrice = () => {
    if (filteredProducts.length === 0) return null;
    return Math.min(...filteredProducts.map(p => p.price));
  };

  const bestPrice = getBestPrice();

  return (
    <div className="search-page">
      {/* Hero Section */}
      <div className="search-hero">
        <div className="search-hero-content">
          <h1>Compare Prices Across Ireland's Top Supermarkets</h1>
          <p className="search-subtitle">Find the best deals and save money on your grocery shopping</p>
          
          <div className="search-container">
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="Search for products (e.g., eggs, milk, bread)..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="modern-search-input"
              />
              <button className="search-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="search-filters">
            <div className="filter-group">
              <label>Sort By:</label>
              <select value={sortOption} onChange={handleSortChange} className="modern-select">
                <option value="">All Products</option>
                <option value="name">Name</option>
                <option value="price">Price (Low to High)</option>
                <option value="date">Date Added</option>
                <option value="supermarket">Supermarket</option>
                <option value="Lidl">Lidl</option>
                <option value="SuperValu">SuperValu</option>
                <option value="TESCO">TESCO</option>
                <option value="Aldi">Aldi</option>
                <option value="M&S">M&S</option>
                <option value="Dunnes Stores">Dunnes Stores</option>
              </select>
            </div>
            
            <div className="view-toggle">
              <button 
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h7v7h-7v-7z"/>
                </svg>
              </button>
              <button 
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="search-content">
        <div className="search-main">
          {/* Results Section */}
          {filteredProducts.length > 0 && (
            <>
              <div className="results-header">
                <h2>Results for '{searchTerm}' ({filteredProducts.length} results)</h2>
                {bestPrice && (
                  <div className="best-price-badge">
                    <span>Best Price: €{bestPrice.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className={`products-grid ${viewMode}`}>
                {filteredProducts.map((product) => (
                  <div key={product.id} className="product-card">
                    <div className="product-header">
                      <div className="supermarket-badge">
                        <span className="supermarket-logo">{getSupermarketLogo(product.supermarket_name)}</span>
                        <span className="supermarket-name">{product.supermarket_name}</span>
                      </div>
                      {product.price === bestPrice && (
                        <div className="best-deal-badge">Best Deal</div>
                      )}
                    </div>
                    
                    <div className="product-info">
                      <h3 className="product-name">{product.name}</h3>
                      <div className="product-details">
                        <span className="quantity">{product.quantity} {product.unit}</span>
                        <span className="date">{new Date(product.product_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="product-footer">
                      <div className="price-section">
                        <span className="price">€{product.price}</span>
                        <span className="price-per-unit">€{(product.price / product.quantity).toFixed(2)}/{product.unit}</span>
                      </div>
                      
                      {isAuthenticated && (
                        <button 
                          className="edit-btn"
                          onClick={() => handleEditClick(product)}
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {filteredProducts.length === 0 && searchTerm && (
            <div className="no-results">
              <div className="no-results-icon">🔍</div>
              <h3>No products found for "{searchTerm}"</h3>
              <p>Try searching for different keywords or check your spelling</p>
            </div>
          )}

          {filteredProducts.length === 0 && !searchTerm && (
            <div className="search-placeholder">
              <div className="placeholder-icon">🛒</div>
              <h3>Start searching to compare prices</h3>
              <p>Enter a product name above to find the best deals across Irish supermarkets</p>
            </div>
          )}
        </div>

        {/* Add Product Section */}
        <div className="search-sidebar">
          {isAuthenticated ? (
            <SearchPageForm
              isEditing={isEditing}
              productToEdit={productToEdit}
              onProductSaved={handleProductSaved}
              onProductUpdated={handleProductUpdated}
              onCancel={handleCancelEdit}
            />
          ) : (
            <div className="auth-prompt-card">
              <h3>Add Your Own Products</h3>
              <p>Help the community by adding product prices you've found in stores.</p>
              <div className="auth-benefits">
                <div className="benefit-item">
                  <span className="benefit-icon">✅</span>
                  <span>Add product prices</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">✅</span>
                  <span>Edit your submissions</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">✅</span>
                  <span>Help others save money</span>
                </div>
              </div>
              <button className="auth-cta-btn" onClick={handleAddProductClick}>
                Sign Up to Add Products
              </button>
              <p className="auth-login-text">
                Already have an account? <button className="link-btn" onClick={() => navigate('/login')}>Sign In</button>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Authentication Modal */}
      {showAuthPrompt && (
        <div className="auth-modal-overlay">
          <div className="auth-modal">
            <h3>Account Required</h3>
            <p>You need an account to add or edit products. This helps us maintain quality and prevent spam.</p>
            <div className="auth-modal-actions">
              <button className="btn btn-primary" onClick={() => handleAuthChoice('register')}>
                Create Account
              </button>
              <button className="btn btn-secondary" onClick={() => handleAuthChoice('login')}>
                Sign In
              </button>
              <button className="btn btn-text" onClick={() => setShowAuthPrompt(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="disclaimer">
        <p>💡 Disclaimer: Displayed results may not always be perfectly accurate. Product availability may vary depending on your location.</p>
      </div>
    </div>
  );
}

export default SearchPage;
