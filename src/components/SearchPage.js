import React, { useEffect, useState } from 'react';
import ProductList from '../components/ProductList'; // Import ProductList component
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
    setSearchTerm(e.target.value);
    if (e.target.value.trim() === '') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(
        products.filter((product) =>
          product.name.toLowerCase().includes(e.target.value.toLowerCase())
        )
      );
    }
  };

  return (
    <div className="search-page">
      <h1>Search to Compare Prices</h1>
      {/* Remove the search input and filtered products list */}
      <ProductList products={products} />
    </div>
  );
}

export default SearchPage;
