import React, { useState } from 'react';

const supermarkets = [
  { id: 1, name: 'Lidl' },
  { id: 2, name: 'SuperValu' },
  { id: 3, name: 'TESCO' },
  // Add other supermarkets here
];

function AddProductForm({ onProductSaved }) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [price, setPrice] = useState('');
  const [supermarket_id, setSupermarket] = useState('');
  const [product_date, setDate] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    
    const newProduct = {
      name,
      quantity,
      unit,
      price,
      supermarket_id,  // This should be the ID corresponding to the selected supermarket
      product_date,
    };

    console.log("Attempting to submit new product:", newProduct);

    try {
      const response = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });

      if (!response.ok) {
        throw new Error(`Failed to add product: ${response.statusText}`);
      }

      const savedProduct = await response.json();
      console.log("Product successfully saved to backend:", savedProduct);

      onProductSaved(savedProduct);

      setName('');
      setQuantity('');
      setUnit('');
      setPrice('');
      setSupermarket('');
      setDate('');
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  return (
    <form onSubmit={handleSave}>
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
      <select
        value={supermarket_id}
        onChange={(e) => setSupermarket(e.target.value)}
      >
        <option value="">Select Supermarket</option>
        {supermarkets.map((supermarket) => (
          <option key={supermarket.id} value={supermarket.id}>
            {supermarket.name}
          </option>
        ))}
      </select>
      <input
        type="date"
        placeholder="Date"
        value={product_date}
        onChange={(e) => setDate(e.target.value)}
      />
      <button type="submit">Save Product</button>
    </form>
  );
}

export default AddProductForm;
