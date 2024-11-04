// SearchPageForm.js
import React, { useEffect, useState } from 'react';

function SearchPageForm({ isEditing, productToEdit, onProductSaved, onProductUpdated, onCancel }) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [price, setPrice] = useState('');
  const [supermarket, setSupermarket] = useState('');
  const [date, setDate] = useState('');

  // If editing, populate form with product details
  useEffect(() => {
    if (isEditing && productToEdit) {
      setName(productToEdit.name);
      setQuantity(productToEdit.quantity);
      setUnit(productToEdit.unit);
      setPrice(productToEdit.price);
      setSupermarket(productToEdit.supermarket_name);
      setDate(productToEdit.product_date);
    } else {
      resetForm();
    }
  }, [isEditing, productToEdit]);

  const resetForm = () => {
    setName('');
    setQuantity('');
    setUnit('');
    setPrice('');
    setSupermarket('');
    setDate('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newProduct = { name, quantity, unit, price, supermarket, date };

    if (isEditing) {
      onProductUpdated({ ...productToEdit, ...newProduct });
    } else {
      onProductSaved(newProduct);
    }
    resetForm();
  };

  return (
    <div className="form-container">
      <h2>{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Product Name:</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Quantity:</label>
          <input type="text" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Unit:</label>
          <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Price:</label>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Supermarket:</label>
          <input type="text" value={supermarket} onChange={(e) => setSupermarket(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Date:</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <button type="submit">{isEditing ? 'Update Product' : 'Save Product'}</button>
        {isEditing && <button type="button" onClick={onCancel}>Cancel</button>}
      </form>
    </div>
  );
}

export default SearchPageForm;
