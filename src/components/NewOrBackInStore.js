import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './NewOrBackInStore.css';

// ✅ Import your local image
import BionaGarlicImg from '../assets/images/Biona-Organic-Garlic-Paste.jpg';
import TescoFinestBasmatiRiceImg from '../assets/images/Tesco-Finest-Basmati-Rice.jpg';
import HeinzFruitYogurtPorridgeImg from '../assets/images/Heinz-Fruit&Yogurt-Porridge.jpg';
import AvonmoreFreshMilkImg from '../assets/images/Avonmore-Fresh-Milk-1L.jpg';
import KelloggsCornflakesImg from '../assets/images/Kelloggs-Cornflakes-500g.jpg';
import DunnesCloveCordialImg from '../assets/images/cordial.jpg';

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
          image: TescoFinestBasmatiRiceImg,
          isNew: true,
          discount: 25
        },
        {
          id: 2,
          name: "Biona Organic Garlic Paste 130g",
          price: 4.20,
          supermarket: "SuperValu",
          image: BionaGarlicImg,
          isNew: true
        },
        {
          id: 3,
          name: "Heinz Fruit & Yogurt Porridge 125g",
          price: 3.00,
          originalPrice: 3.50,
          supermarket: "Dunnes Stores",
          image: HeinzFruitYogurtPorridgeImg,
          isBackInStock: true,
          discount: 14
        },
        {
          id: 4,
          name: "Avonmore Fresh Milk 1L",
          price: 1.25,
          supermarket: "Tesco",
          image: AvonmoreFreshMilkImg,
          isNew: true
        },
        {
          id: 5,
          name: "Kellogg's Cornflakes 500g",
          price: 3.99,
          originalPrice: 4.99,
          supermarket: "Tesco",
          image: KelloggsCornflakesImg,
          isBackInStock: true,
          discount: 20
        },
        {
          id: 6,
          name: "Dunnes Stores Simply Better Warm & Spicy Clove Cordial 500ml",
          price: 4.99,
          originalPrice: 2.00,
          supermarket: "Dunnes Stores",
          image: DunnesCloveCordialImg,
          isNew: true,
          discount: 25
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
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  className="product-card"
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
                </Link>
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