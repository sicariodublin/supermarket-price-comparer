// server.js (Backend)
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const jwt = require('jsonwebtoken'); // JWT para autenticação
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(express.json());

// Database connection configuration
const connection = mysql.createConnection({
  host: "localhost",
  user: "root", // Use a more secure user in production
  password: "Sicario/2016", // Ensure your password is securely handled
  database: "supermarket",
});

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to the database: " + err.message);
    return;
  }
  console.log("Connected to the database.");
});

// Rota para registro de usuário
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;

  // Verifica se o usuário já existe
  const checkUserQuery = 'SELECT * FROM users WHERE email = ?';
  connection.query(checkUserQuery, [email], async (err, results) => {
    if (err) {
      console.error("Error during registration:", err);
      res.status(500).json({ error: 'Server error' });
      return;
    }

    if (results.length > 0) {
      res.status(400).json({ error: 'User already exists' });
    } else {
      // Gera um hash para a senha
      const hashedPassword = await bcrypt.hash(password, 10);
      const insertUserQuery = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
      connection.query(insertUserQuery, [username, email, hashedPassword], (err, result) => {
        if (err) {
          console.error("Error inserting user:", err);
          res.status(500).json({ error: 'Failed to register user' });
        } else {
          const token = jwt.sign({ id: result.insertId, username }, process.env.JWT_SECRET || 'your_jwt_secret', {
            expiresIn: '1h',
          });
          res.json({ token });
        }
      });
    }
  });
});

// Rota para login de usuário
app.post('/api/login', (req, res) => {
  const { email, password } = req.body; // Altere para email se você estiver usando o e-mail para login
  console.log("Received email:", email); // Debug
  console.log("Received password:", password); // Debug

  // Ajuste a consulta para procurar pelo email
  const query = 'SELECT * FROM users WHERE email = ?';
  connection.query(query, [email], async (err, results) => {
    if (err) {
      console.error("Error during login:", err);
      res.status(500).json({ error: 'Server error' });
      return;
    }

    if (results.length > 0) {
      const user = results[0];
      
      // Verifica a senha usando bcrypt
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (passwordMatch) {
        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'your_jwt_secret', {
          expiresIn: '1h',
        });
        res.json({ token });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });
});


// Assuming you have an Express route for /api/products
app.get('/api/products', (req, res) => {
  const query = `
    SELECT 
      products.id, 
      products.name, 
      products.quantity, 
      products.unit, 
      products.price, 
      supermarkets.name AS supermarket_name, 
      products.product_date
    FROM products
    LEFT JOIN supermarkets ON products.supermarket_id = supermarkets.id
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error retrieving products:', err);
      res.status(500).json({ error: 'Failed to retrieve products' });
    } else {
      res.json(results);
    }
  });
});

// API route to add a product
app.post('/api/products', (req, res) => {
  const { name, quantity, unit, price, supermarket_id } = req.body;
  const query = "INSERT INTO products (name, quantity, unit, price, supermarket_id, product_date) VALUES (?, ?, ?, ?, ?, ?)";
  connection.query(query, [name, quantity, unit, price, supermarket_id, product_date], (err, result) => {
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
  const { name, quantity, unit, price, supermarket_id, product_date } = req.body;
  const query = "UPDATE products SET name = ?, quantity = ?, unit = ?, price = ?, supermarket_id, product_date = ? WHERE id = ?";
  connection.query(query, [name, quantity, unit, price, supermarket_id, product_date, id], (err, result) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.json({ message: 'Product updated successfully' });
    }
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
