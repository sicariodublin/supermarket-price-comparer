import React, { useState, useEffect } from 'react';
import './NewOrBackInStore.css';

const NewOrBackInStore = ({ onProductClick }) => {
  const [newProducts, setNewProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchNewProducts();
  }, []);

  const fetchNewProducts = async () => {
    try {
      // Mock data for now - will be replaced with real API
      const mockProducts = [
        {
          id: 1,
          name: "Tesco Finest Basmati Rice 250g",
          price: 1.50,
          originalPrice: 2.00,
          supermarket: "Tesco",
          image: "/api/placeholder/150/150",
          isNew: true,
          discount: 25
        },
        {
          id: 2,
          name: "Biona Organic Garlic Paste 130g",
          price: 4.20,
          supermarket: "SuperValu",
          image: "/api/placeholder/150/Biona-Organic-Garlic-Paste.jpg",
          isNew: true
        },
        {
          id: 3,
          name: "Heinz Fruit & Yogurt Porridge 125g",
          price: 3.00,
          originalPrice: 3.50,
          supermarket: "Dunnes Stores",
          image: "/api/placeholder/150/150",
          isBackInStock: true,
          discount: 14
        },
        {
          id: 4,
          name: "Avonmore Fresh Milk 1L",
          price: 1.25,
          supermarket: "Aldi",
          image: "/api/placeholder/150/150",
          isNew: true
        },
        {
          id: 5,
          name: "Kellogg's Cornflakes 500g",
          price: 3.99,
          originalPrice: 4.99,
          supermarket: "Tesco",
          image: "/api/placeholder/150/150",
          isBackInStock: true,
          discount: 20
        }
      ];
      
      setNewProducts(mockProducts);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching new products:', error);
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === newProducts.length - 4 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? newProducts.length - 4 : prevIndex - 1
    );
  };

  if (loading) {
    return (
      <section className="new-or-back-section">
        <div className="container">
          <div className="loading-spinner">Loading new products...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="new-or-back-section">
      <div className="container">
        <div className="section-header">
          <h2>New or Back in Stock</h2>
          <p>Discover the latest additions and restocked items showcased across our website!</p>
        </div>
        
        <div className="products-carousel">
          <button className="carousel-btn prev-btn" onClick={prevSlide}>
            ‹
          </button>
          
          <div className="products-container">
            <div 
              className="products-track"
              style={{ transform: `translateX(-${currentIndex * 25}%)` }}
            >
              {newProducts.map((product) => (
                <div 
                  key={product.id} 
                  className="product-card"
                  onClick={() => onProductClick && onProductClick(product)}
                >
                  <div className="product-image-container">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="product-image"
                    />
                    {product.isNew && (
                      <span className="product-badge new-badge">NEW</span>
                    )}
                    {product.isBackInStock && (
                      <span className="product-badge back-badge">BACK</span>
                    )}
                    {product.discount && (
                      <span className="discount-badge">-{product.discount}%</span>
                    )}
                  </div>
                  
                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    <div className="price-container">
                      <span className="current-price">€{product.price}</span>
                      {product.originalPrice && (
                        <span className="original-price">€{product.originalPrice}</span>
                      )}
                    </div>
                    <div className="supermarket-info">
                      <span className="supermarket-name">{product.supermarket}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <button className="carousel-btn next-btn" onClick={nextSlide}>
            ›
          </button>
        </div>
        
        <div className="carousel-indicators">
          {Array.from({ length: Math.max(1, newProducts.length - 3) }).map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewOrBackInStore;