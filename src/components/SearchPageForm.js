// SearchPageForm.js
import React, { useEffect, useState } from 'react';

const supermarkets = [
  { id: 1, name: 'Lidl' },
  { id: 2, name: 'SuperValu' },
  { id: 3, name: 'TESCO' },
  { id: 4, name: 'Aldi' },
  { id: 5, name: 'M&S' },
  { id: 6, name: 'Dunnes Stores' },
];

function SearchPageForm({ isEditing, productToEdit, onProductSaved, onProductUpdated, onCancel }) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [price, setPrice] = useState('');
  const [supermarket_id, setSupermarket] = useState('');
  const [product_date, setDate] = useState('');

  // Populate form if editing an existing product
  useEffect(() => {
    if (isEditing && productToEdit) {
      setName(productToEdit.name);
      setQuantity(productToEdit.quantity);
      setUnit(productToEdit.unit);
      setPrice(productToEdit.price);
      setSupermarket(productToEdit.supermarket_id);
      setDate(productToEdit.product_date ? new Date(productToEdit.product_date).toISOString().split('T')[0] : '');
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
    const updatedProduct = {
      id: isEditing && productToEdit ? productToEdit.id : null,
      name,
      quantity,
      unit,
      price,
      supermarket_id,
      product_date,
    };

    console.log("Form Submission:", updatedProduct); // Debug log

    if (isEditing) {
      onProductUpdated(updatedProduct);
    } else {
      onProductSaved(updatedProduct);
    }
    resetForm();
  };

  return (
    <div className="add-form-container">
      <h2>{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label>Product Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Quantity:</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Unit:</label>
          <input
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Price:</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Supermarket:</label>
          <select
            value={supermarket_id}
            onChange={(e) => setSupermarket(e.target.value)}
            required
          >
            <option value="">Select Supermarket</option>
            {supermarkets.map((supermarket) => (
              <option key={supermarket.id} value={supermarket.id}>
                {supermarket.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Date:</label>
          <input type="date" value={product_date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <button type="submit">{isEditing ? 'Update Product' : 'Save Product'}</button>
        {isEditing && <button type="button" onClick={onCancel}>Cancel</button>}
      </form>
    </div>
  );
}

export default SearchPageForm;
