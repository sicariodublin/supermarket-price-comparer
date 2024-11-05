// server.js (Backend)
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
console.log("Mailjet Public API Key:", process.env.MJ_APIKEY_PUBLIC);
console.log("Mailjet Private API Key:", process.env.MJ_APIKEY_PRIVATE);


const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const jwt = require('jsonwebtoken'); // JWT para autenticação
const bcrypt = require('bcrypt'); 
/* const feedbackRoutes = require('../../routes/feedbackRoutes'); */
const mailjet = require('node-mailjet').apiConnect(process.env.MJ_APIKEY_PUBLIC, process.env.MJ_APIKEY_PRIVATE); // Configuração do Mailjet

const app = express();


// Rotas
app.use(cors());
app.use(express.json());


  // Rota para enviar contact form
app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;

  const emailOptions = {
    Messages: [
      {
        From: {
          Email: "fabioast47@hotmail.com", // Remetente do e-mail
          Name: "Contact Form",
        },
        To: [
          {
            Email: "addandcomparemessageus@hotmail.com", // Destinatário do e-mail
            Name: "Support Team",
          },
        ],
        Subject: subject || "New Contact Request",
        HTMLPart: `
          <h3>Contact Request from ${name}</h3>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong><br />${message}</p>
        `,
      },
    ],
  };

  try {
    const result = await mailjet.post("send", { version: "v3.1" }).request(emailOptions);
    console.log("Contact form message sent successfully:", result.body);
    res.status(200).json({ message: "Message sent successfully!" });
  } catch (error) {
    console.error("Error sending contact form message:", error);
    res.status(500).json({ message: "Failed to send message", error: error.message });
  }
});

  // Rota para enviar feedback
app.post('/api/feedback/sendFeedback', async (req, res) => {
  const { message } = req.body;

  const emailOptions = {
    Messages: [
      {
        From: {
          Email: "fabioast47@hotmail.com", // Seu e-mail
          Name: "Feedback System",
        },
        To: [
          {
            Email: "addandcomparemessageus@hotmail.com", // Para onde o feedback será enviado
            Name: "Admin",
          },
        ],
        Subject: "Website Feedback",
        HTMLPart: `<p>${message}</p>`,
      },
    ],
  };

  try {
    const result = await mailjet.post("send", { version: "v3.1" }).request(emailOptions);
    console.log("E-mail de feedback enviado com sucesso:", result.body);
    res.status(200).json({ message: "Feedback enviado com sucesso!" });
  } catch (error) {
    console.error("Erro ao enviar e-mail de feedback:", error);
    res.status(500).json({ message: "Falha ao enviar feedback", error: error.message });
  }
});

// Database connection configuration
const connection = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "supermarket",
});

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to the database: " + err.message);
    return;
  }
  console.log("Connected to the database.");
});

// Route for user registration
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;

  // Check if user already exists
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
      const hashedPassword = await bcrypt.hash(password, 10);
      const insertUserQuery = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
      connection.query(insertUserQuery, [username, email, hashedPassword], (err, result) => {
        if (err) {
          console.error("Error inserting user:", err);
          res.status(500).json({ error: 'Failed to register user' });
        } else {
          const token = jwt.sign({ id: result.insertId, username }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });
          res.json({ token });
        }
      });
    }
  });
});

// Route for user login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  const query = 'SELECT * FROM users WHERE email = ?';
  connection.query(query, [email], async (err, results) => {
    if (err) {
      console.error("Error during login:", err);
      res.status(500).json({ error: 'Server error' });
      return;
    }

    if (results.length > 0) {
      const user = results[0];
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (passwordMatch) {
        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });
        res.json({ token });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });
});

// Route to add a product
app.post('/api/products', (req, res) => {
  const { name, quantity, unit, price, supermarket_id, product_date } = req.body;
  console.log("Received product data:", req.body); // Log received data

  if (!name || !quantity || !unit || !price || !supermarket_id || !product_date) {
    console.log("Missing required fields.");
    return res.status(400).json({ error: "All fields are required." });
  }

  const query = "INSERT INTO products (name, quantity, unit, price, supermarket_id, product_date) VALUES (?, ?, ?, ?, ?, ?)";
  connection.query(query, [name, quantity, unit, price, supermarket_id, product_date], (err, result) => {
    if (err) {
      console.error('Error saving to database:', err);
      res.status(500).json({ error: 'Failed to save product' });
    } else {
      console.log('Product saved successfully:', result);
      res.json({ id: result.insertId });
    }
  });
});

// Route to get all products
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

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
