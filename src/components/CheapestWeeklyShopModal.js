// components/CheapestWeeklyShopModal.js
import React, { useState } from 'react';
import "../styles/Dashboard.css";

function CheapestWeeklyShopModal({ isOpen, onClose, onSave, onGenerateList, currentBudget, preferredSupermarkets }) {
  const [budget, setBudget] = useState(currentBudget || 100);
  const [selectedSupermarkets, setSelectedSupermarkets] = useState(preferredSupermarkets || []);
  const [shoppingList, setShoppingList] = useState(['']);
  const [generatedList, setGeneratedList] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

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

  const generateWeeklyShop = async () => {
    setIsGenerating(true);
    
    // Mock API call - replace with actual API
    setTimeout(() => {
      const mockGeneratedList = {
        budget: budget,
        totalCost: Math.min(budget * 0.85, budget - 10), // Always under budget
        items: [
          { name: 'Bread', price: 1.20, store: 'Aldi' },
          { name: 'Milk (2L)', price: 1.45, store: 'Aldi' },
          { name: 'Chicken Breast (1kg)', price: 6.99, store: 'Tesco' },
          { name: 'Rice (1kg)', price: 2.50, store: 'Aldi' },
          { name: 'Bananas (1kg)', price: 1.89, store: 'Tesco' },
          { name: 'Pasta (500g)', price: 0.89, store: 'Aldi' },
          { name: 'Tomatoes (500g)', price: 2.20, store: 'SuperValu' },
          { name: 'Cheese (200g)', price: 3.50, store: 'Tesco' }
        ],
        supermarkets: selectedSupermarkets
      };
      
      setGeneratedList(mockGeneratedList);
      setIsGenerating(false);
    }, 2000);
  };

  const saveGeneratedList = () => {
    if (generatedList && onGenerateList) {
      onGenerateList(generatedList);
      setGeneratedList(null);
      onClose();
    }
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

        {/* Generated Shopping List Display */}
        {generatedList && (
          <div className="generated-list-section">
            <h4>
              <i className="bi bi-check-circle-fill" style={{color: '#28a745'}}></i>
              Generated Shopping List
            </h4>
            {generatedList.items.map((item, index) => (
              <div key={index} className="generated-list-item">
                <div className="item-details">
                  <div className="item-name">{item.name}</div>
                  <div className="item-store">{item.store}</div>
                </div>
                <div className="item-price">€{item.price}</div>
              </div>
            ))}
            <div className="total-cost">
              Total: €{generatedList.totalCost.toFixed(2)} / €{generatedList.budget}
            </div>
          </div>
        )}

        <div className="button-container">
          {!generatedList ? (
            <>
              <button 
                className="btn btn-primary" 
                onClick={generateWeeklyShop}
                disabled={isGenerating || selectedSupermarkets.length === 0}
              >
                {isGenerating ? 'Generating...' : 'Generate Weekly Shop'}
              </button>
              <button className="btn btn-primary" onClick={handleSave}>
                Save Preferences
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-primary" onClick={saveGeneratedList}>
                Save Shopping List
              </button>
              <button className="btn btn-secondary" onClick={() => setGeneratedList(null)}>
                Generate New List
              </button>
            </>
          )}
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheapestWeeklyShopModal;