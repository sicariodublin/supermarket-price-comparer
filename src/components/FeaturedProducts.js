// FeaturedProducts.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getFeaturedProducts } from '../services/api';
import './FeaturedProducts.css';

import SaltedCaramelTruffleImg from '../assets/images/salted_caramel_truffle.jpg';
import DunnesViledaBucketImg from '../assets/images/dunnes_vileda_bucket.jpg';
import DunnesYellowCabernetImg from '../assets/images/dunnes_yellow_tail_cabernet_sauvignon_red_wine.jpg';  


const FeaturedProducts = ({ onProductClick }) => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
 // const [mockProduct, setMockProduct] = useState({});


  useEffect(() => {
    fetchFeaturedProducts();
    //mockProd(); // Call mockProd instead of fetchFeaturedProducts to test your mock data
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      // Mock data for now - will be replaced with real API
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
        },
        {
          id: 2,
          name: "Dunnes Vileda Bucket",
          price: 13.99,
          original_price: 19.99,
          supermarket_name: "Dunnes Stores",
          discount_percentage: 25,
          featured: 2,
          image: DunnesViledaBucketImg
        },
        {
          id: 3,
          name: "Dunnes Yellow Cabernet Sauvignon Red Wine",
          price: 19.99,
          original_price: 29.99,
          supermarket_name: "Dunnes Stores",
          discount_percentage: 25,
          featured: 3,
          image: DunnesYellowCabernetImg
        },
        {
          id: 4,
          name: "Dunnes Vileda Bucket",
          price: 13.99,
          original_price: 19.99,
          supermarket_name: "Dunnes Stores",
          discount_percentage: 25,
          featured: 2,
          image: DunnesViledaBucketImg
        },
        {
          id: 5,
          name: "Dunnes Vileda Bucket",
          price: 13.99,
          original_price: 19.99,
          supermarket_name: "Dunnes Stores",
          discount_percentage: 25,
          featured: 2,
          image: DunnesViledaBucketImg
        },
        {
          id: 6,
          name: "Dunnes Vileda Bucket",
          price: 13.99,
          original_price: 19.99,
          supermarket_name: "Dunnes Stores",
          discount_percentage: 25,
          featured: 2,
          image: DunnesViledaBucketImg
        },
      ];

      setFeaturedProducts(mockProduct);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching featured products:', error);
      setFeaturedProducts([]);
      setLoading(false);
    }
  };
  
  
  // const fetchFeaturedProducts = async () => {
  //   try {
  //     let products = await getFeaturedProducts(6);
  //     console.log("Featured products API returned:", products);
  //     if (!Array.isArray(products)) products = [];
  //     setFeaturedProducts(products);
  //     setLoading(false);
  //   } catch (error) {
  //     console.error('Error fetching featured products:', error);
  //     setFeaturedProducts([]);
  //     setLoading(false);
  //   }
  // };

  const handleProductClick = (product) => {
    if (onProductClick) {
      onProductClick(product);
    }
  };

  return (
    <section className="featured-products-section">
      <div className="container">
        <div className="section-header">
          <h2>Featured Products</h2>
          <p>Discover our handpicked selection of products with the best deals and discounts</p>
        </div>
        
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading featured products...</p>
          </div>
        ) : (
          <div className="featured-products-grid">
            {featuredProducts.length === 0 ? (
              <div className="no-products-message">
                <div className="no-products-icon">🛒</div>
                <h3>No featured products available</h3>
                <p>Check back soon for exciting deals and featured items!</p>
              </div>
            ) : (
              featuredProducts.map((product) => (
                <div
                  key={product.id}
                  className="featured-product-card"
                  onClick={() => handleProductClick(product)}
                >
                  <div className="product-image-container">
                    <img 
                      src={product.image || '/assets/salted_caramel_truffle.jpg'}
                      alt={product.name} 
                      className="product-image"
                      onError={(e) => {
                        e.target.src = '/assets/salted_caramel_truffle.jpg';
                      }}
                    />
                    {product.discount_percentage > 0 && (
                      <div className="discount-badge">
                        -{product.discount_percentage}%
                      </div>
                    )}
                    {product.featured === 1 && (
                      <div className="featured-badge">
                        ⭐ Featured
                      </div>
                    )}
                  </div>
                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    <div className="product-details">
                      <span className="product-quantity">{product.quantity} {product.unit}</span>
                      <span className="supermarket-name">{product.supermarket_name}</span>
                    </div>
                    <div className="price-container">
                      <span className="product-price">€{product.price}</span>
                      {product.discount_percentage > 0 && (
                        <span className="original-price">
                          €{(product.price / (1 - product.discount_percentage / 100)).toFixed(2)}
                        </span>
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
              ))
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;