// ProductList.js (Component)
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { supermarkets } from '../utilities/supermarketsData';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Fetch products from your API
    axios
      .get('http://localhost:5000/api/products')
      .then((response) => {
        setProducts(response.data);
      })
      .catch((error) => {
        console.error("Error fetching products: ", error);
      });
  }, []);

  // Function to get supermarket name by ID
  const getSupermarketName = (id) => {
    const supermarket = supermarkets.find((s) => s.id === id);
    return supermarket ? supermarket.name : 'Unknown';
  };

  // Filter products by search term
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="product-list">
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      {filteredProducts.map((product) => (
        <div key={product.id} className="product-item">
          <h3>{product.name}</h3>
          <p>Quantity: {product.quantity}</p>
          <p>Unit: {product.unit}</p>
          <p>Price: ${product.price}</p>
          <p>Supermarket: {getSupermarketName(product.supermarket_id)}</p>
          <p>Date: {new Date(product.product_date).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  );
}

export default ProductList;
