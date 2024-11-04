import React, { useState } from 'react';

function AddProductForm({ onProductSaved }) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [price, setPrice] = useState('');
  const [supermarket_id, setSupermarket] = useState('');
  const [product_date, setDate] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Create the new product object
    const newProduct = {
      name,
      quantity,
      unit,
      price,
      supermarket_id,
      product_date,
    };
    
    console.log("Submitting product:", newProduct);
    
    try {
      const response = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error adding product:", errorData);
        alert("Failed to add product. Please try again.");
        return;
      }

      const addedProduct = await response.json();
      console.log("Product added successfully:", addedProduct);
      onProductSaved(addedProduct);

      // Reset form fields
      setName('');
      setQuantity('');
      setUnit('');
      setPrice('');
      setSupermarket('');
      setDate('');
      
    } catch (error) {
      console.error("Error adding product:", error);
      alert("An error occurred while adding the product.");
    }
  };

  return (
    <form onSubmit={handleSave}>
      <input
        type="text"
        placeholder="Product Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        type="number"
        placeholder="Quantity"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Unit"
        value={unit}
        onChange={(e) => setUnit(e.target.value)}
        required
      />
      <input
        type="number"
        step="0.01"
        placeholder="Price"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Supermarket"
        value={supermarket_id}
        onChange={(e) => setSupermarket(e.target.value)}
        required
      />
      <input
        type="date"
        placeholder="Date"
        value={product_date}
        onChange={(e) => setDate(e.target.value)}
        required
      />
      <button type="submit">Save Product</button>
    </form>
  );
}

export default AddProductForm;
