// AddProduct.js (Component)
import axios from 'axios';
import React, { useState } from 'react';

function AddProduct() {
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [price, setPrice] = useState('');
  const [supermarket, setSupermarket] = useState('');
  const [date, setDate] = useState('');

  const handleAddProduct = async  (e) => {
    e.preventDefault();
    try {
        const newProduct = {
            name: productName,
            quantity,
            unit,
            price,
            supermarket,
            date,
        };
        
    await axios.post('http://localhost:5000/api/products', newProduct);
    alert('Product added successfully!');
    // Reset form fields after successful submission
    setProductName('');
    setQuantity('');
    setUnit('un');
    setPrice('');
    setSupermarket('');
    setDate('');
  } catch (error) {
    console.error('Error adding product:', error);
  }
};

  return (
    <form onSubmit={handleAddProduct}>
      <input type="text" placeholder="Product Name" value={productName} onChange={(e) => setProductName(e.target.value)} />
      <input type="number" placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
      <input type="text" placeholder="Unit" value={unit} onChange={(e) => setUnit(e.target.value)} />
      <input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} />
      <select value={supermarket} onChange={(e) => setSupermarket(e.target.value)}>
        <option value="">Select Supermarket</option>
        <option value="1">Lidl </option>
        <option value="2">SuperValue </option>
        <option value="3">TESCO </option>
        <option value="4">Aldi </option>
        <option value="5">M&S </option>
        <option value="6">Dunnes Stores </option>
        {/* You could dynamically populate this with a map function if you have the supermarkets in an array */}
    </select>
      <input type='date' placeholder='Product Date' value={date} onChange={(e) => setDate(e.target.value)} />
      <button type="submit">Add Product</button>
    </form>
  );
}

export default AddProduct;
