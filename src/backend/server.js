const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Database connection configuration
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Sicario/2016",
  database: "supermarket",
});

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to the database: " + err.message);
    return;
  }
  console.log("Connected to the database.");
});

app.get("/api/products", (req, res) => {
    const query = `
      SELECT 
        products.id, 
        products.name, 
        products.quantity, 
        products.unit, 
        products.price, 
        products.product_date, 
        supermarkets.name AS supermarket
      FROM products
      JOIN supermarkets ON products.supermarket_id = supermarkets.id;
    `;
  
    connection.query(query, (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(results);
    });
  });
  

// API route to add a product
app.post('/api/products', (req, res) => {
  const { name, quantity, unit, price, supermarket_id } = req.body;
  const query = "INSERT INTO products (name, quantity, unit, price, supermarket_id) VALUES (?, ?, ?, ?, ?)";
  connection.query(query, [name, quantity, unit, price, supermarket_id], (err, result) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.json({ id: result.insertId });
    }
  });
});

// API route to update a product
app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const { name, quantity, unit, price, supermarket_id } = req.body;
  const query = "UPDATE products SET name = ?, quantity = ?, unit = ?, price = ?, supermarket_id = ? WHERE id = ?";
  connection.query(query, [name, quantity, unit, price, supermarket_id, id], (err, result) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.json({ message: 'Product updated successfully' });
    }
  });
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
