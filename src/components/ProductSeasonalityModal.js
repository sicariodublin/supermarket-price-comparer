// components/ProductSeasonalityModal.js
import React, { useState } from 'react';
import "../styles/Dashboard.css";

function ProductSeasonalityModal({ isOpen, onClose }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Mock seasonal data - would come from API
  const seasonalData = {
    0: { // January
      inSeason: ['Oranges', 'Lemons', 'Cabbage', 'Brussels Sprouts', 'Parsnips'],
      outOfSeason: ['Strawberries', 'Tomatoes', 'Corn', 'Peaches'],
      tips: 'Winter citrus fruits are at their peak. Root vegetables are abundant and affordable.'
    },
    1: { // February
      inSeason: ['Oranges', 'Grapefruit', 'Leeks', 'Cauliflower', 'Turnips'],
      outOfSeason: ['Berries', 'Stone fruits', 'Zucchini', 'Peppers'],
      tips: 'Last month for winter citrus. Start planning for spring vegetables.'
    },
    2: { // March
      inSeason: ['Asparagus', 'Artichokes', 'Peas', 'Spinach', 'Lettuce'],
      outOfSeason: ['Winter squash', 'Citrus fruits ending', 'Root vegetables ending'],
      tips: 'Spring vegetables begin to appear. Asparagus season starts.'
    },
    3: { // April
      inSeason: ['Asparagus', 'Peas', 'Radishes', 'Spring onions', 'New potatoes'],
      outOfSeason: ['Winter vegetables', 'Stored apples ending'],
      tips: 'Peak asparagus season. Fresh spring vegetables are most affordable.'
    },
    4: { // May
      inSeason: ['Strawberries', 'Rhubarb', 'Lettuce', 'Spinach', 'Peas'],
      outOfSeason: ['Winter storage crops', 'Imported summer fruits'],
      tips: 'First strawberries appear. Leafy greens are at their best.'
    },
    5: { // June
      inSeason: ['Strawberries', 'Cherries', 'New potatoes', 'Broad beans', 'Courgettes'],
      outOfSeason: ['Stored winter vegetables', 'Late spring crops ending'],
      tips: 'Berry season begins. Summer vegetables start appearing.'
    },
    6: { // July
      inSeason: ['Berries', 'Tomatoes', 'Corn', 'Peppers', 'Cucumbers'],
      outOfSeason: ['Spring vegetables ending', 'Winter storage crops'],
      tips: 'Peak summer produce. Tomatoes and berries are most affordable.'
    },
    7: { // August
      inSeason: ['Tomatoes', 'Corn', 'Peaches', 'Plums', 'Courgettes'],
      outOfSeason: ['Early spring vegetables', 'Winter crops'],
      tips: 'Height of summer. Stone fruits and vegetables are abundant.'
    },
    8: { // September
      inSeason: ['Apples', 'Pears', 'Grapes', 'Squash', 'Pumpkins'],
      outOfSeason: ['Summer berries ending', 'Peak summer vegetables ending'],
      tips: 'Autumn harvest begins. Apples and pears are freshest.'
    },
    9: { // October
      inSeason: ['Apples', 'Pears', 'Pumpkins', 'Winter squash', 'Brussels sprouts'],
      outOfSeason: ['Summer fruits', 'Tender summer vegetables'],
      tips: 'Apple season peaks. Winter vegetables start appearing.'
    },
    10: { // November
      inSeason: ['Cranberries', 'Pomegranates', 'Sweet potatoes', 'Turnips', 'Parsnips'],
      outOfSeason: ['Summer produce', 'Stone fruits'],
      tips: 'Root vegetables are at their best. Holiday produce appears.'
    },
    11: { // December
      inSeason: ['Citrus fruits', 'Pomegranates', 'Winter squash', 'Brussels sprouts', 'Cabbage'],
      outOfSeason: ['Summer fruits', 'Fresh summer vegetables'],
      tips: 'Winter citrus season begins. Stored root vegetables are affordable.'
    }
  };

  if (!isOpen) return null;

  const currentData = seasonalData[selectedMonth] || seasonalData[0];

  return (
    <div className="modal-overlay">
      <div className="modal-content seasonality-modal">
        <h2>Product Seasonality Guide</h2>
        
        <div className="month-selector">
          <label>
            Select Month:
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {months.map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="seasonality-content">
          <div className="seasonal-section">
           <h4><span role="img" aria-label="in season">🌱</span> In Season (Best Prices)</h4>
            <ul className="product-list in-season">
              {currentData.inSeason.map((product, index) => (
                <li key={index}>{product}</li>
              ))}
            </ul>
          </div>

          <div className="seasonal-section">
            <h4><span role="img" aria-label="out of season">❄️</span> Out of Season (Higher Prices)</h4>
            <ul className="product-list out-season">
              {currentData.outOfSeason.map((product, index) => (
                <li key={index}>{product}</li>
              ))}
            </ul>
          </div>

          <div className="seasonal-tips">
            <h4><span role="img" aria-label="shopping tips">💡</span> Shopping Tips for {months[selectedMonth]}</h4>
            <p>{currentData.tips}</p>
          </div>
        </div>

        <div className="button-container">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductSeasonalityModal;