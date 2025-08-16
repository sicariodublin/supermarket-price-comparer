// components/CheapestWeeklyShopModal.js
import React, { useState } from 'react';
import "../styles/Dashboard.css";

function CheapestWeeklyShopModal({ isOpen, onClose, onSave, currentBudget, preferredSupermarkets }) {
  const [budget, setBudget] = useState(currentBudget || 100);
  const [selectedSupermarkets, setSelectedSupermarkets] = useState(preferredSupermarkets || []);
  const [shoppingList, setShoppingList] = useState(['']);

  const supermarkets = ['Aldi', 'Tesco', 'SuperValu', 'Dunnes Stores', 'Lidl'];

  if (!isOpen) return null;

  const handleSupermarketToggle = (supermarket) => {
    setSelectedSupermarkets(prev => 
      prev.includes(supermarket)
        ? prev.filter(s => s !== supermarket)
        : [...prev, supermarket]
    );
  };

  const handleAddItem = () => {
    setShoppingList(prev => [...prev, '']);
  };

  const handleRemoveItem = (index) => {
    setShoppingList(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, value) => {
    setShoppingList(prev => prev.map((item, i) => i === index ? value : item));
  };

  const handleSave = () => {
    const data = {
      budget,
      preferredSupermarkets: selectedSupermarkets,
      shoppingList: shoppingList.filter(item => item.trim() !== '')
    };
    onSave(data);
  };

  const generateWeeklyShop = () => {
    // Mock function - would call API to generate optimized shopping list
    alert(`Generating cheapest weekly shop for €${budget} budget across ${selectedSupermarkets.join(', ')}`);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content weekly-shop-modal">
        <h2>Cheapest Weekly Shop</h2>
        
        <div className="budget-section">
          <label>
            Weekly Budget: €
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              min="10"
              max="1000"
            />
          </label>
        </div>

        <div className="supermarket-selection">
          <h4>Preferred Supermarkets:</h4>
          {supermarkets.map(supermarket => (
            <label key={supermarket} className="supermarket-option">
              <input
                type="checkbox"
                checked={selectedSupermarkets.includes(supermarket)}
                onChange={() => handleSupermarketToggle(supermarket)}
              />
              {supermarket}
            </label>
          ))}
        </div>

        <div className="shopping-list-section">
          <h4>Shopping List (Optional):</h4>
          {shoppingList.map((item, index) => (
            <div key={index} className="shopping-item">
              <input
                type="text"
                value={item}
                onChange={(e) => handleItemChange(index, e.target.value)}
                placeholder="Enter product name"
              />
              {shoppingList.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => handleRemoveItem(index)}
                  className="remove-item-btn"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={handleAddItem} className="add-item-btn">
            + Add Item
          </button>
        </div>

        <div className="button-container">
          <button className="btn btn-primary" onClick={generateWeeklyShop}>
            Generate Weekly Shop
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Save Preferences
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheapestWeeklyShopModal;