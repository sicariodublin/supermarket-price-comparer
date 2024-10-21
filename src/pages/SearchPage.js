import React, { useState } from 'react';
import { getProducts } from '../services/api';

function SearchPage() {
  const [products, setProducts] = useState([]);

  const handleSearch = async (event) => {
    event.preventDefault();
    const query = event.target.query.value;
    try {
      const result = await getProducts(query);
      setProducts(result);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  return (
    <div>
      <form onSubmit={handleSearch}>
        <input type="text" name="query" placeholder="Product Name" />
        <button type="submit">Search</button>
      </form>
      <div>
        {products.map(product => (
          <div key={product.id}>{product.name} - ${product.price}</div>
        ))}
      </div>
    </div>
  );
}

export default SearchPage;
