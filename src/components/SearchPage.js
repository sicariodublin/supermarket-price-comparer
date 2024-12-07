// SearchPage.js
import React, { useEffect, useState } from "react";
import { useAuth } from '../context/AuthContext';
import "../styles/SearchPage.css";
import SearchPageForm from "./SearchPageForm";

function SearchPage() {
  const { isAuthenticated } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);

  const fetchProducts = async (searchTerm = "", sortOption = "") => {
    try {
      const query = searchTerm ? `?name=${encodeURIComponent(searchTerm)}` : "";
      const response = await fetch(
        `http://localhost:5000/api/products${query}`
      );
      const data = await response.json();
      setProducts(data);
      filterAndSortProducts(searchTerm, sortOption, data); // Apply initial filter/sort if necessary
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    if (searchTerm || sortOption) {
      fetchProducts(searchTerm, sortOption);
    }
  }, [searchTerm, sortOption]);

  const handleProductSaved = async (newProduct) => {
    if (!isAuthenticated) return; // Prevent saving if not authenticated

    try {
      const response = await fetch("http://localhost:5000/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct),
      });

      if (response.ok) {
        const savedProduct = await response.json();
        setProducts((prev) => [...prev, savedProduct]);
        filterAndSortProducts(searchTerm, sortOption, [
          ...products,
          savedProduct,
        ]);
      }
    } catch (error) {
      console.error("Error saving product:", error);
    }
  };

  const handleProductUpdated = async (updatedProduct) => {
    if (!isAuthenticated) return; // Prevent updating if not authenticated

    try {
      const response = await fetch(
        `http://localhost:5000/api/products/${updatedProduct.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedProduct),
        }
      );

      if (response.ok) {
        const updatedProducts = products.map((product) =>
          product.id === updatedProduct.id ? updatedProduct : product
        );
        setProducts(updatedProducts);
        filterAndSortProducts(searchTerm, sortOption, updatedProducts);
        setIsEditing(false); // Close the edit form
      }
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setProductToEdit(null);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSortChange = (e) => {
    const selectedSort = e.target.value;
    setSortOption(selectedSort);

    if (selectedSort === "") {
      setSearchTerm(""); // Clear search term when "Select" is chosen
      setFilteredProducts([]); // Reset filtered products
    } else {
      filterAndSortProducts(searchTerm, selectedSort);
    }
  };

  const filterAndSortProducts = (term, sort, productList = products) => {
    let filtered = productList;

    if (term) {
      filtered = filtered.filter((product) =>
        product.name?.toLowerCase().includes(term.toLowerCase())
      );
    }

    if (sort === "name") {
      filtered = filtered.sort((a, b) =>
        (a.name || "").localeCompare(b.name || "")
      );
    } else if (sort === "price") {
      filtered = filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sort === "date") {
      filtered = filtered.sort(
        (a, b) => new Date(a.product_date) - new Date(b.product_date)
      );
    } else if (sort === "supermarket") {
      filtered = filtered.sort((a, b) =>
        (a.supermarket_name || "").localeCompare(b.supermarket_name || "")
      );
    } else if (sort === "Lidl") {
      filtered = filtered.filter(
        (product) => product.supermarket_name === "Lidl"
      );
    } else if (sort === "SuperValu") {
      filtered = filtered.filter(
        (product) => product.supermarket_name === "SuperValu"
      );
    } else if (sort === "TESCO") {
      filtered = filtered.filter(
        (product) => product.supermarket_name === "TESCO"
      );
    } else if (sort === "Aldi") {
      filtered = filtered.filter(
        (product) => product.supermarket_name === "Aldi"
      );
    } else if (sort === "M&S") {
      filtered = filtered.filter(
        (product) => product.supermarket_name === "M&S"
      );
    } else if (sort === "Dunnes Stores") {
      filtered = filtered.filter(
        (product) => product.supermarket_name === "Dunnes Stores"
      );
    }

    setFilteredProducts(filtered);
  };

  const handleEditClick = (product) => {
    if (isAuthenticated) {
      // Allow editing only if authenticated
      setIsEditing(true);
      setProductToEdit(product);
    } else {
      alert("Please log in to edit products.");
    }
  };

  return (
    <div className="page-container">
      <div className="left-column">
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
          <p className="disclaimer">
          Disclaimer: Displayed results may not always be perfectly accurate.
          Product availability may vary depending on your location.
        </p>
        </div>

        {filteredProducts.length > 0 && (
          <>
            <div className="search-results">
              <h2>
                Search Results for: {searchTerm} ({filteredProducts.length} items found)
              </h2>
            </div>
            <div className="product-list">
              {filteredProducts.map((product) => (
                <div key={product.id} className="product-item">
                  <h2>{product.name}</h2>
                  <p>Quantity: {product.quantity}</p>
                  <p>Unit: {product.unit}</p>
                  <p>Price: €{product.price}</p>
                  <p>Supermarket: {product.supermarket_name}</p>
                  <p>
                    Date: {new Date(product.product_date).toLocaleDateString()}
                  </p>
                  {isAuthenticated && (
                    <button onClick={() => handleEditClick(product)}>
                      Edit
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="right-column">
        {isAuthenticated && (
          <SearchPageForm
            isEditing={isEditing}
            productToEdit={productToEdit}
            onProductSaved={handleProductSaved}
            onProductUpdated={handleProductUpdated}
            onCancel={handleCancelEdit}
          />
        )}
      </div>
    </div>
  );
}

export default SearchPage;
