import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getNewOrBackInStockProducts } from '../services/api';
import './NewOrBackInStore.css';

import BionaGarlicImg from '../assets/images/Biona-Organic-Garlic-Paste.jpg';
import TescoFinestBasmatiRiceImg from '../assets/images/Tesco-Finest-Basmati-Rice.jpg';
import HeinzFruitYogurtPorridgeImg from '../assets/images/Heinz-Fruit&Yogurt-Porridge.jpg';
import AvonmoreFreshMilkImg from '../assets/images/Avonmore-Fresh-Milk-1L.jpg';
import KelloggsCornflakesImg from '../assets/images/Kelloggs-Cornflakes-500g.jpg';
import DunnesCloveCordialImg from '../assets/images/cordial.jpg';

const fallbackImages = [
  TescoFinestBasmatiRiceImg,
  BionaGarlicImg,
  HeinzFruitYogurtPorridgeImg,
  AvonmoreFreshMilkImg,
  KelloggsCornflakesImg,
  DunnesCloveCordialImg,
];

const formatPrice = (price) => {
  const value = Number(price);
  return Number.isFinite(value) ? `€${value.toFixed(2)}` : 'Price unavailable';
};

const NewOrBackInStore = ({ onProductClick }) => {
  const [newProducts, setNewProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchNewProducts = async () => {
      try {
        const products = await getNewOrBackInStockProducts();
        const normalizedProducts = products.map((product, index) => ({
          id: product.id,
          name: product.name,
          price: product.price,
          originalPrice: product.original_price,
          supermarket: product.supermarket_name,
          image: product.image_url || fallbackImages[index % fallbackImages.length],
          isNew: product.status === 'new',
          isBackInStock: product.status === 'back',
          discount: product.discount_percentage,
        }));

        setNewProducts(normalizedProducts);
      } catch (error) {
        console.error('Error fetching new products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNewProducts();
  }, []);

  const maxIndex = Math.max(0, newProducts.length - 4);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex === maxIndex ? 0 : prevIndex + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? maxIndex : prevIndex - 1));
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

  if (!newProducts.length) {
    return null;
  }

  return (
    <section className="new-or-back-section">
      <div className="container">
        <div className="section-header">
          <h2>New or Back in Stock</h2>
          <p>Latest products and restocked items from the current product database.</p>
        </div>

        <div className="products-carousel">
          <button className="carousel-btn prev-btn" onClick={prevSlide} aria-label="Previous products">
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
                  className="new-or-back-product-card"
                  onClick={() => onProductClick?.(product)}
                >
                  <div className="new-or-back-product-image-container">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="new-or-back-product-image"
                    />
                    {product.isNew && (
                      <span className="product-badge new-badge">NEW</span>
                    )}
                    {product.isBackInStock && (
                      <span className="product-badge back-badge">BACK</span>
                    )}
                    {product.discount && (
                      <span className="new-or-back-discount-badge">-{product.discount}%</span>
                    )}
                  </div>

                  <div className="new-or-back-product-info">
                    <h3 className="new-or-back-product-name">{product.name}</h3>
                    <div className="new-or-back-price-container">
                      <span className="current-price">Now {formatPrice(product.price)}</span>
                      {product.originalPrice && (
                        <span className="original-price">Was {formatPrice(product.originalPrice)}</span>
                      )}
                    </div>
                    <div className="supermarket-info">
                      <span className="new-or-back-supermarket-name">{product.supermarket}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <button className="carousel-btn next-btn" onClick={nextSlide} aria-label="Next products">
            ›
          </button>
        </div>

        <div className="carousel-indicators">
          {Array.from({ length: Math.max(1, newProducts.length - 3) }).map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Show product page ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewOrBackInStore;
