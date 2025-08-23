import React, { useState, useEffect } from 'react';
import { getCostComparisons } from '../services/api';
import './CostComparison.css';

const CostComparison = ({ onProductClick }) => {
  const [comparisons, setComparisons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCostComparisons();
  }, []);

  const fetchCostComparisons = async () => {
    try {
      let data;
      if (typeof getCostComparisons === 'function') {
        data = await getCostComparisons();
      }
      // fallback to mock data if API returns nothing or fails
      if (!data || !Array.isArray(data) || data.length === 0) {
        data = [
          {
            product_name: "Milk",
            category: "Dairy",
            price_variations: [
              { id: 1, price: 1.36, unit: "L", supermarket_name: "Aldi", supermarket_id: 1 },
              { id: 2, price: 1.57, unit: "L", supermarket_name: "Dunnes Stores", supermarket_id: 2 },
              { id: 3, price: 1.75, unit: "L", supermarket_name: "SuperValu", supermarket_id: 3 },
              { id: 4, price: 1.78, unit: "L", supermarket_name: "Tesco", supermarket_id: 4 },
              // { id: 5, price: 1.25, unit: "per", supermarket_name: "Lidl", supermarket_id: 5 },
            ],
            min_price: 1.36,
            max_price: 1.78,
            savings_percentage: "23.6"
          },
          {
            product_name: "Eggs",
            category: "Dairy",
            price_variations: [
              { id: 5, price: 0.33, unit: "per", supermarket_name: "Aldi", supermarket_id: 1 },
              { id: 6, price: 0.35, unit: "per", supermarket_name: "Dunnes Stores", supermarket_id: 2 },
              { id: 7, price: 0.36, unit: "per", supermarket_name: "SuperValu", supermarket_id: 3 },
              { id: 8, price: 0.31, unit: "per", supermarket_name: "Tesco", supermarket_id: 4 }
            ],
            min_price: 0.31,
            max_price: 0.36,
            savings_percentage: "13.9"
          }
        ];
      }
      setComparisons(data);
      setLoading(false);
    } catch (error) {
      // fallback to mock data on error
      setComparisons([
        {
          product_name: "Milk",
          category: "Dairy",
          price_variations: [
            { id: 1, price: 1.36, unit: "L", supermarket_name: "Aldi", supermarket_id: 1 },
            { id: 2, price: 1.57, unit: "L", supermarket_name: "Dunnes Stores", supermarket_id: 2 },
            { id: 3, price: 1.75, unit: "L", supermarket_name: "SuperValu", supermarket_id: 3 },
            { id: 4, price: 1.78, unit: "L", supermarket_name: "Tesco",
              supermarket_id: 4
            },
            
          ],
          min_price: 1.36,
          max_price: 1.78,
          savings_percentage: "23.6"
        },
        {
          product_name: "Eggs",
          category: "Dairy",
          price_variations: [
            { id: 5, price: 0.33, unit: "per", supermarket_name: "Aldi", supermarket_id: 1 },
            { id: 6, price: 0.35, unit: "per", supermarket_name: "Dunnes Stores", supermarket_id: 2 },
            { id: 7, price: 0.36, unit: "per", supermarket_name: "SuperValu", supermarket_id: 3 },
            { id: 8, price: 0.31, unit: "per", supermarket_name: "Tesco", supermarket_id: 4 }
          ],
          min_price: 0.31,
          max_price: 0.36,
          savings_percentage: "13.9"
        }
      ]);
      setLoading(false);
      console.error('Error fetching cost comparisons:', error);
    }
  };

  if (loading) {
    return (
      <section className="cost-comparison-section">
        <div className="container">
          <div className="loading-spinner">Loading cost comparisons...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="cost-comparison-section">
      <div className="container">
        <div className="section-header">
          <h2>Cost Comparison</h2>
          <p>See how some of the most commonly bought products compare across supermarkets! Price fluctuations shown are for the average prices since the end of last week.</p>
        </div>
        
        <div className="comparison-grid">
          {comparisons.map((comparison, index) => (
            <div key={index} className="comparison-card">
              <div className="comparison-header">
                <h3 className="product-name">{comparison.product_name}</h3>
                <div className="savings-indicator">
                  <span className="savings-text">0% -</span>
                </div>
              </div>
              
              <div className="price-bars">
                {comparison.price_variations.map((variation, idx) => (
                  <div 
                    key={idx} 
                    className="price-bar"
                    onClick={() => onProductClick && onProductClick(variation)}
                  >
                    <div className="supermarket-info">
                      <div className="supermarket-badge">
                        <span className="supermarket-name">{variation.supermarket_name}</span>
                      </div>
                    </div>
                    
                    <div className="price-bar-container">
                      <div 
                        className="price-fill"
                        style={{
                          width: `${((variation.price - comparison.min_price) / (comparison.max_price - comparison.min_price)) * 100}%`
                        }}
                      />
                    </div>
                    
                    <div className="price-display">
                      <span className="price">€{variation.price.toFixed(2)}</span>
                      <span className="unit">/{variation.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="expand-indicator">
                <button className="expand-btn">▼</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CostComparison;