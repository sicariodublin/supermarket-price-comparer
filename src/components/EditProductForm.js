import React, { useState } from 'react';

function EditProductForm({ product, onProductUpdated, onCancel }) {
  const [name, setName] = useState(product.name);
  const [quantity, setQuantity] = useState(product.quantity);
  const [unit, setUnit] = useState('');
  const [price, setPrice] = useState(product.price);
  const [supermarket_id, setSupermarket] = useState(product.supermarket_name);
  const [product_date, setDate] = useState(product.product_date);

  const handleUpdate = async () => {
    const response = await fetch(`http://localhost:5000/api/products/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, quantity, unit, price, supermarket_id, product_date }),
    });
    const updatedProduct = await response.json();
    onProductUpdated(updatedProduct);
  };

  return (
    <form onSubmit={handleUpdate}>
      <input
        type="text"
        placeholder="Product Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Quantity"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
      />
      <input
        type="text"
        placeholder="Unit"
        value={unit}
        onChange={(e) => setUnit(e.target.value)}   
      />
      <input
        type="text"
        placeholder="Price"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />
      <input
        type="text"
        placeholder="Supermarket"
        value={supermarket_id}
        onChange={(e) => setSupermarket(e.target.value)}
      />
      <input
        type="text"
        placeholder="Date"
        value={product_date}
        onChange={(e) => setDate(e.target.value)}
      />  
      <button type="submit">Update Product</button>
      <button onClick={onCancel}>Cancel</button>
    </form>
  );
}

export default EditProductForm;
