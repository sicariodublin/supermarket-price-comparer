import React, { useEffect, useState } from 'react';
import { getProducts } from '../services/api';
import {
  getApprovalLabel,
  getFreshnessLabel,
  getSourceLabel,
} from '../utilities/productTrust';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Fetch products with supermarket names from your API
    const fetchProducts = async () => {
      try {
        const data = await getProducts(searchTerm);
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products: ", error);
      }
    };
    
    fetchProducts();
  }, [searchTerm]);

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
          <p>Price: €{product.price}</p>
          <p>Supermarket: {product.supermarket_name}</p> {/* Use supermarket_name here */}
          <p>Date: {new Date(product.product_date).toLocaleDateString()}</p>
          <p>
            {getApprovalLabel(product.approval_status)} | {getSourceLabel(product.source)} |{' '}
            {getFreshnessLabel(product.last_checked_at || product.product_date)}
          </p>
        </div>
      ))}
    </div>
  );
}

export default ProductList;
