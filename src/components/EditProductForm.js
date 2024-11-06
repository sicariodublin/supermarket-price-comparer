import React, { useState } from 'react';

function EditProductForm({ product, onProductUpdated, onCancel }) {
  const [name, setName] = useState(product.name || '');
  const [quantity, setQuantity] = useState(product.quantity || '');
  const [unit, setUnit] = useState(product.unit || '');
  const [price, setPrice] = useState(product.price || '');
  const [supermarket_id, setSupermarket] = useState(product.supermarket_id || '');
  const [product_date, setDate] = useState(product.product_date ? new Date(product.product_date).toISOString().split('T')[0] : '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const updatedProduct = {
      id: product.id,
      name,
      quantity,
      unit,
      price,
      supermarket_id,
      product_date,
    };

    console.log("Attempting to update product:", updatedProduct);

    try {
      const response = await fetch(`http://localhost:5000/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct),
      });

      if (!response.ok) {
        throw new Error(`Failed to update product: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Product successfully updated:", result);
      onProductUpdated(result);
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
      <input type="text" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
      <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} required />
      <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
      <select value={supermarket_id} onChange={(e) => setSupermarket(e.target.value)} required>
        {/* Add options for supermarkets */}
      </select>
      <input type="date" value={product_date} onChange={(e) => setDate(e.target.value)} required />
      <button type="submit">Update Product</button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </form>
  );
}

export default EditProductForm;
