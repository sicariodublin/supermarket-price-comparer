
// SearchPage.js (Component)
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AddProductForm from '../components/AddProductForm';
import EditProductForm from '../components/EditProductForm';
import { useAuth } from '../context/AuthContext';
import '../styles/SearchPage.css';

function SearchPage() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const { isAuthenticated } = useAuth(); 
  const [editProduct, setEditProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [sortOption, setSortOption] = useState('');

  useEffect(() => {
    // Fetch the products from your API
    fetch('http://localhost:5000/api/products')
      .then((response) => response.json())
      .then((data) => {
        setProducts(data);
        setFilteredProducts(data);
      });
  }, []);

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    filterAndSortProducts(term, sortOption);
  };

  const handleSortChange = (e) => {
    const option = e.target.value;
    setSortOption(option);
    filterAndSortProducts(searchTerm, option);
  };

  const filterAndSortProducts = (term, sort) => {
    let filtered = products.filter((product) =>
      product.name.toLowerCase().includes(term.toLowerCase())
    );

    if (sort === 'name') {
      filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'price') {
      filtered = filtered.sort((a, b) => a.price - b.price);
    } else if (sort === 'date') {
      filtered = filtered.sort((a, b) => new Date(a.product_date) - new Date(b.product_date));
    } else if (sort === 'supermarket') {
      filtered = filtered.sort((a, b) => a.supermarket_name.localeCompare(b.supermarket_name));
    }
    else if (sort === 'Lidl') {
      filtered = filtered.filter((product) => product.supermarket_name === 'Lidl');
    } else if (sort === 'SuperValue') {
      filtered = filtered.filter((product) => product.supermarket_name === 'SuperValue');
    } else if (sort === 'TESCO') {
      filtered = filtered.filter((product) => product.supermarket_name === 'TESCO');
    } else if (sort === 'Aldi') {
      filtered = filtered.filter((product) => product.supermarket_name === 'Aldi');
    } else if (sort === 'M&S') {
      filtered = filtered.filter((product) => product.supermarket_name === 'M&S');
    } else if (sort === 'Dunnes Stores') {
      filtered = filtered.filter((product) => product.supermarket_name === 'Dunnes Stores');
    }

    setFilteredProducts(filtered);
  };

  const handleEditClick = (product) => {
    setEditProduct(product);
  };

  const handleProductSaved = (newProduct) => {
    setProducts([...products, newProduct]);
    filterAndSortProducts(searchTerm, sortOption);
  };

  const handleProductUpdated = (updatedProduct) => {
    const updatedProducts = products.map((product) =>
      product.id === updatedProduct.id ? updatedProduct : product
    );
    setProducts(updatedProducts);
    setEditProduct(null);
    filterAndSortProducts(searchTerm, sortOption);
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
      <div className="sort-container">
        <label htmlFor="sort">Sort By: </label>
        <select id="sort" value={sortOption} onChange={handleSortChange}>
          <option value="">Select</option>
          <option value="name">Name</option>
          <option value="price">Price</option>
          <option value="date">Date</option>
          <option value="supermarket">Supermarket</option>
          <option value="Lidl">Lidl</option>
          <option value="SuperValue">SuperValue</option>
          <option value="TESCO">TESCO</option>
          <option value="Aldi">Aldi</option>
          <option value="M&S">M&S</option>
          <option value="Dunnes Stores">Dunnes Stores</option>
        </select>
      </div>

      <h1>Search Results for: {searchTerm || 'No search term provided'}</h1>
      {/* Render search results based on the searchTerm */}
      {/* ... */}

      {/* Render AddProductForm if user is authenticated */}
      {isAuthenticated && !editProduct && (
        <AddProductForm onProductSaved={handleProductSaved} />
      )}

      {/* Render EditProductForm if a product is being edited */}
      {isAuthenticated && editProduct && (
        <EditProductForm
          product={editProduct}
          onProductUpdated={handleProductUpdated}
          onCancel={() => setEditProduct(null)}
        />
      )}

      <div className="product-list">
        {filteredProducts.map((product) => (
          <div key={product.id} className="product-item">
            <h2>{product.name}</h2>
            <p><strong>Quantity:</strong> {product.quantity}</p>
            <p><strong>Unit:</strong> {product.unit}</p>
            <p><strong>Price:</strong> €{product.price}</p>
            <p><strong>Supermarket:</strong> {product.supermarket_name}</p>
            <p><strong>Date:</strong> {new Date(product.product_date).toLocaleDateString()}</p>
            {isAuthenticated && (
              <button onClick={() => handleEditClick(product)} className="edit-button">
                Edit
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SearchPage;
