// SearchPage.js (Component)
import React, { useEffect, useState } from 'react';
import '../styles/SearchPage.css';

function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    // Fetch the products from your API
    fetch('http://localhost:5000/api/products')
      .then((response) => response.json())
      .then((data) => {
        setProducts(data);
        setFilteredProducts(data); // Initialize filtered products
      });
  }, []);

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    setFilteredProducts(
      term
        ? products.filter((product) =>
            product.name.toLowerCase().includes(term.toLowerCase())
          )
        : products
    );
  };

  return (
    <div className="search-page">
      <h1>Search to Compare Prices</h1>
      <input
        type="text"
        placeholder="Search products..."
        value={searchTerm}
        onChange={handleSearchChange}
        className="search-input"
      />
      <div className="product-list">
        {filteredProducts.map((product) => (
          <div key={product.id} className="product-item">
            <h2>{product.name}</h2>
            <p><strong>Quantity:</strong> {product.quantity}</p>
            <p><strong>Unit:</strong> {product.unit}</p>
            <p><strong>Price:</strong> €{product.price}</p>
            <p><strong>Supermarket:</strong> {product.supermarket_name}</p>
            <p><strong>Date:</strong> {new Date(product.product_date).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SearchPage;
