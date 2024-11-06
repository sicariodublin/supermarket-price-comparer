
// SearchPage.js (Component)
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import SearchPageForm from '../components/SearchPageForm';
import { useAuth } from '../context/AuthContext';
import '../styles/SearchPage.css';


function SearchPage() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const { isAuthenticated } = useAuth();

  const [editProduct, setEditProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('term') || '');
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [sortOption, setSortOption] = useState('');
  
  
   // Fetch products and apply initial filter
   useEffect(() => {
    // Define an async function to fetch products
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/products');
        const data = await response.json();
        setProducts(data);
        applyInitialFilter(searchParams.get('term') || '', data); // Apply initial filter based on URL term
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
  
    fetchProducts();
  
    // Only run this effect once when the component mounts
  }, []); // Empty dependency array to ensure this only runs once

    // Function to apply initial filter based on URL search term
  const applyInitialFilter = (term, data) => {
    setSearchTerm(term);
    const filtered = data.filter((product) =>
      product.name.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredProducts(filtered);
  };

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


  const handleProductUpdated = (updatedProduct) => { 
    const updatedProducts = products.map((product) =>
      product.id === updatedProduct.id ? updatedProduct : product
    );
    setProducts(updatedProducts);
    setEditProduct(null); // Close the edit form
  };

  
  // Filter and sort products based on search term and sort option
  const filterAndSortProducts = (term, sort, productList = products) => {
    let filtered = productList;

    if (term) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(term.toLowerCase())
      );
    }

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
    } else if (sort === 'SuperValu') {
      filtered = filtered.filter((product) => product.supermarket_name === 'SuperValu');
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

  const handleProductSaved = async (newProduct) => {
    try {
      // Optionally, add new product to the backend
      const response = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });
      
      if (response.ok) {
        console.log("Product successfully saved on the backend.");
        // Fetch updated products from backend
        fetchProducts();
      } else {
        throw new Error('Failed to save product on backend');
      }
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };
  
  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products');
      const data = await response.json();
      setProducts(data);
      filterAndSortProducts(searchTerm, sortOption, data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };
  
  useEffect(() => {
    fetchProducts();
  }, [location.search]);
  

  // Define a mensagem de resultados com o totalizador
  const resultMessage = `Search Results for: ${
    searchTerm || sortOption || 'No search term provided'
  } (${filteredProducts.length} items found)`;

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
          <option value="SuperValu">SuperValu</option>
          <option value="TESCO">TESCO</option>
          <option value="Aldi">Aldi</option>
          <option value="M&S">M&S</option>
          <option value="Dunnes Stores">Dunnes Stores</option>
        </select>
      </div>

      <h1>{resultMessage}</h1>

      {/* Display a message if there are no results */}
      {filteredProducts.length === 0 ? (
        <p>No products found for "{searchTerm}"</p>
      ) : (
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
      )}

      {/* Render Add/Edit Form based on state */}
      {isAuthenticated && (
        <SearchPageForm
          isEditing={!!editProduct}
          productToEdit={editProduct}
          onProductSaved={handleProductSaved}
          onProductUpdated={handleProductUpdated}
          onCancel={() => setEditProduct(null)}
        />
      )}
    </div>
  );
}

export default SearchPage;
