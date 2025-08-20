// server.js (Backend)
// --- Polyfill missing Web File in Node 18 (must be first) ---
if (typeof globalThis.File === 'undefined') {
  const { Blob } = globalThis;
  globalThis.File = class File extends Blob {
    constructor(parts, name, opts = {}) {
      super(parts, opts);
      this.name = String(name);
      this.lastModified = opts.lastModified ?? Date.now();
    }
    get [Symbol.toStringTag]() { return 'File'; }
  };
}

require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env"),
});
// Verify environment variables are loaded
console.log("Environment variables loaded successfully");
const dashboardExpress = require("./routes/dashboardExpress");
const DataCollectionService = require('./services/dataCollectionService');
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { verifyToken } = require("./middleware/authMiddleware");
const bcrypt = require("bcrypt");
const path = require("path");
const bodyParser = require("body-parser");
const mailjet = require("node-mailjet").apiConnect(
  process.env.MJ_APIKEY_PUBLIC,
  process.env.MJ_APIKEY_PRIVATE
);

const app = express();

// Rotas
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use('/api/', dashboardExpress);

// Database connection configuration
const connection = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "supermarket",
  port: process.env.DB_PORT || 3306
});

// After database connection, add:
const dataCollectionService = new DataCollectionService(connection);

// Start scheduled data collection
dataCollectionService.scheduleDataCollection();

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to the database: " + err.message);
    // Implement proper error handling
    process.exit(1); // Exit with error code if database connection fails
  }
  console.log("Connected to the database.");
});

// Add manual trigger endpoint
app.post('/api/admin/collect-data/:supermarketId', async (req, res) => {
  const { supermarketId } = req.params;
  
  try {
    await dataCollectionService.updateProductPrices(parseInt(supermarketId));
    res.json({ message: `Data collection completed for supermarket ${supermarketId}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get collection dates endpoint
app.get('/api/collection-dates', (req, res) => {
  const query = `
    SELECT id, name, last_updated 
    FROM supermarkets 
    ORDER BY name
  `;
  
  connection.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Failed to fetch collection dates' });
    } else {
      res.json(results);
    }
  });
});

// Rota para enviar contact form
app.post("/api/contact", async (req, res) => {
  const { name, email, subject, message } = req.body;

  const emailOptions = {
    Messages: [
      {
        From: {
          Email: "fabioast47@hotmail.com",
          Name: "Contact Form",
        },
        To: [
          {
            Email: "addandcomparemessageus@hotmail.com",
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
    const result = await mailjet
      .post("send", { version: "v3.1" })
      .request(emailOptions);
    console.log("Contact form message sent successfully:", result.body);
    res.status(200).json({ message: "Message sent successfully!" });
  } catch (error) {
    console.error("Error sending contact form message:", error);
    res
      .status(500)
      .json({ message: "Failed to send message", error: error.message });
  }
});

// Rota para enviar feedback
app.post("/api/feedback/sendFeedback", async (req, res) => {
  const { message } = req.body;

  const emailOptions = {
    Messages: [
      {
        From: {
          Email: "fabioast47@hotmail.com",
          Name: "Feedback System",
        },
        To: [
          {
            Email: "addandcomparemessageus@hotmail.com",
            Name: "Admin",
          },
        ],
        Subject: "Website Feedback",
        HTMLPart: `<p>${message}</p>`,
      },
    ],
  };

  try {
    const result = await mailjet
      .post("send", { version: "v3.1" })
      .request(emailOptions);
    console.log("E-mail de feedback enviado com sucesso:", result.body);
    res.status(200).json({ message: "Feedback enviado com sucesso!" });
  } catch (error) {
    console.error("Erro ao enviar e-mail de feedback:", error);
    res
      .status(500)
      .json({ message: "Falha ao enviar feedback", error: error.message });
  }
});

// Route for user registration
app.post("/api/register", async (req, res) => {
  const { username, email, password } = req.body;

  // Password validation
  const passwordRegex = /^(?=.*[A-Z])(?=.*[£$%&*\/\\@-]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      error:
        "Password must be at least 8 characters long, contain at least one uppercase letter, and one special character (£$%&*//* \\@-).",
    });
  }

  // Check if user already exists
  const checkUserQuery = "SELECT * FROM users WHERE email = ?";
  connection.query(checkUserQuery, [email], async (err, results) => {
    if (err) {
      console.error("Error during registration:", err);
      res.status(500).json({ error: "Server error" });
      return;
    }

    if (results.length > 0) {
      res.status(400).json({ error: "User already exists" });
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const insertUserQuery =
        "INSERT INTO users (username, email, password, isVerified) VALUES (?, ?, ?, FALSE)";
      connection.query(
        insertUserQuery,
        [username, email, hashedPassword, false],
        (err, result) => {
          if (err) {
            console.error("Error inserting user:", err);
            res.status(500).json({ error: "Failed to register user" });
          } else {
            const userId = result.insertId;

            // Generate the verification token
            const verificationToken = jwt.sign(
              { id: userId, email },
              process.env.JWT_SECRET,
              { expiresIn: "1d" }
            );

            // Use FRONTEND_URL for the verification link
            const frontendUrl = "http://localhost:4000";
            const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

            const emailOptions = {
              Messages: [
                {
                  From: {
                    Email: "addandcomparemessageus@hotmail.com",
                    Name: "Support Team",
                  },
                  To: [
                    {
                      Email: email,
                      Name: username,
                    },
                  ],
                  Subject: "Verify Your Email",
                  HTMLPart: `
            <h3>Welcome, ${username}!</h3>
            <p>Please verify your email by clicking the link below:</p>
            <a href="${verificationUrl}">Verify Email</a>
          `,
                },
              ],
            };

            mailjet
              .post("send", { version: "v3.1" })
              .request(emailOptions)
              .then(() => {
                console.log("Verification email sent successfully!");
                res.status(200).json({
                  message: "Registration successful! Please verify your email.",
                });
              })
              .catch((emailErr) => {
                console.error("Error sending verification email:", emailErr);
                res
                  .status(500)
                  .json({ error: "Failed to send verification email" });
              });
          }
        }
      );
    }
  });
});

// Route for user login
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  // Validate request body
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  // Query database for user
  connection.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "Internal server error" });
      }

      const user = results[0];
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      try {
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          return res.status(401).json({ message: "Invalid credentials" });
        }

        // Update isLoggedIn status
        connection.query(
          "UPDATE users SET isLoggedIn = ? WHERE email = ?",
          [1, email],
          (updateErr) => {
            if (updateErr) {
              console.error("Error updating login status:", updateErr);
            }
          }
        );

        // Generate token with user ID and email
        const token = jwt.sign(
          {
            id: user.id,
            email: user.email
          },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );

        // Log for debugging
        console.log("User authenticated:", { id: user.id, email: user.email });
        console.log("Generated token payload:", jwt.decode(token));

        // Send response
        res.json({
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name
          }
        });
      } catch (error) {
        console.error("Authentication error:", error);
        res.status(500).json({ message: "Authentication failed" });
      }
    }
  );
});


// Route for user logout
app.post("/api/logout", (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error("Authorization Header Missing or Invalid:", authHeader);
    return res
      .status(400)
      .json({ message: "Invalid token or Authorization header missing" });
  }

  const token = authHeader.split(" ")[1]; // Extract token
  console.log("Token received during logout:", token);

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );
    const email = decoded.email;

    const query = "UPDATE users SET isLoggedIn = FALSE WHERE email = ?";
    connection.query(query, [email], (err) => {
      // Removed `result`
      if (err) {
        console.error("Database error during logout:", err);
        return res
          .status(500)
          .json({ message: "Database error during logout" });
      }
      console.log(`User ${email} logged out successfully.`);
      return res.status(200).json({ message: "Logged out successfully" });
    });
  } catch (error) {
    console.error("Token verification failed during logout:", error);
    return res.status(400).json({ message: "Invalid token" });
  }
});

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token is missing or invalid' });
  }

  const token = authHeader.split(' ')[1]; // Extract the token from "Bearer <token>"
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    req.user = user; // Attach the user payload to the request
    next();
  });
};

app.get('/api/user/dashboard', authenticateToken, (req, res) => {
  const userId = req.user.id; // Extracted from the decoded JWT

  const query = `
    SELECT * FROM user_data WHERE user_id = ?;
  `;
  connection.query(query, [userId], (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Database error' });
    } else {
      res.json({ userData: results });
    }
  });
});

// Route to add a product
app.post("/api/products", (req, res) => {
  const { name, quantity, unit, price, supermarket_id, product_date } =
    req.body;
  console.log("Received product data:", req.body);

  if (
    !name ||
    !quantity ||
    !unit ||
    !price ||
    !supermarket_id ||
    !product_date
  ) {
    console.log("Missing required fields.");
    return res.status(400).json({ error: "All fields are required." });
  }

  const query =
    "INSERT INTO products (name, quantity, unit, price, supermarket_id, product_date) VALUES (?, ?, ?, ?, ?, ?)";
  connection.query(
    query,
    [name, quantity, unit, price, supermarket_id, product_date],
    (err, result) => {
      if (err) {
        console.error("Error saving to database:", err);
        res.status(500).json({ error: "Failed to save product" });
      } else {
        console.log("Product saved successfully:", result);
        res.json({ id: result.insertId });
      }
    }
  );
});

// Route to get all products
app.get("/api/products", (req, res) => {
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
      console.error("Error retrieving products:", err);
      res.status(500).json({ error: "Failed to retrieve products" });
    } else {
      res.json(results);
    }
  });
});

// Route to search products by name
app.get("/api/products/search", (req, res) => {
  const searchName = req.query.name || "";
  
  let query = `
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

  let queryParams = [];

  if (searchName) {
    query += " WHERE products.name LIKE ?";
    queryParams.push(`%${searchName}%`);
  }

  connection.query(query, queryParams, (err, results) => {
    if (err) {
      console.error("Error searching products:", err);
      res.status(500).json({ error: "Failed to search products" });
    } else {
      res.json(results);
    }
  });
});

// API route to update a product
app.put("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const { name, quantity, unit, price, supermarket_id, product_date } =
    req.body;

  const query =
    "UPDATE products SET name = ?, quantity = ?, unit = ?, price = ?, supermarket_id = ?, product_date = ? WHERE id = ?";
  connection.query(
    query,
    [name, quantity, unit, price, supermarket_id, product_date, id],
    (err, result) => {
      if (err) {
        console.error("Error updating product:", err);
        res.status(500).send(err.message);
      } else {
        res.json({ message: "Product updated successfully" });
      }
    }
  );
});

app.get("/api/verify-email", (req, res) => {
  const token = req.query.token;

  if (!token) {
    return res.status(400).json({ message: "Token is required" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );
    const userId = decoded.id;

    const updateQuery = "UPDATE users SET isVerified = TRUE WHERE id = ?";
    connection.query(updateQuery, [userId], (err, result) => {
      if (err) {
        console.error("Database error during verification:", err);
        return res
          .status(500)
          .json({ message: "Database error during verification" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "Email verified successfully. You can now log in." });
    });
  } catch (err) {
    console.error("Token verification failed:", err);
    res.status(400).json({ message: "Invalid or expired token" });
  }
});

app.post('/api/password-reset', async (req, res) => {
  const { username, email } = req.body;

  if (!username || !email) {
    return res.status(400).json({ message: 'Username and email are required' });
  }

  try {
    const user = await findUserInDatabase(username, email); // Replace with your DB logic
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    const resetUrl = `http://localhost:4000/password-reset?token=${token}`;

    // Email Logic
    const emailOptions = {
      Messages: [
        {
          From: {
            Email: 'addandcomparemessageus@hotmail.com',
            Name: 'Add and Compare',
          },
          To: [{ Email: email }],
          Subject: 'Password Reset Request',
          HTMLPart: `
            <p>Hi ${username},</p>
            <p>You requested to reset your password. Please click the link below to reset it:</p>
            <a href="${resetUrl}">Reset Password</a>
            <p>If you did not request this, please ignore this email.</p>
          `,
        },
      ],
    };
    await mailjet.post('send', { version: 'v3.1' }).request(emailOptions);

    res.status(200).json({ message: 'Password reset email sent successfully.' });
  } catch (error) {
    console.error('Error handling password reset:', error);
    res.status(500).json({ message: 'Failed to handle password reset request.' });
  }
});

app.post('/api/password-reset/confirm', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token and new password are required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const query = 'UPDATE users SET password = ? WHERE id = ?';
    connection.query(query, [hashedPassword, userId], (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Failed to reset password.' });
      }

      res.status(200).json({ message: 'Password reset successfully.' });
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Invalid or expired token.' });
  }
});

// Helper function to find a user in the database
function findUserInDatabase(username, email) {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM users WHERE username = ? AND email = ?';
    connection.query(query, [username, email], (err, results) => {
      if (err) {
        return reject(err);
      }
      if (results.length === 0) {
        return resolve(null); // No user found
      }
      resolve(results[0]); // Return the first matched user
    });
  });
}

let users = [
  { id: "user-id-placeholder", username: "Fsteyer", email: "fsteyer@example.com" },
];  

// Delete Account Endpoint
app.delete('/api/delete-account', verifyToken, (req, res) => {

  console.log("Full request headers:", req.headers);
  console.log("Full decoded token:", req.user);
  console.log("UserID from request:", req.userId);

  const userId = req.userId; // Extracted from the token
  if (!userId) {
    console.error("UserID is undefined");
    return res.status(400).json({ message: "Invalid user ID" });
  }

  connection.query('DELETE FROM users WHERE id = ?', [userId], (err, result) => {
    if (err) {
      console.error('Error deleting user from database:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (result.affectedRows === 0) {
      console.log("No user found with ID:", userId); // Log if no user is found
      return res.status(404).json({ message: 'User not found' });
    }

    console.log("Deleted user with ID:", userId); // Log success
    return res.status(200).json({ message: 'Account deleted successfully' });
  });
});

// Serve React build files
app.use(express.static(path.join(__dirname, "../../build")));

// Fallback for React routing
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../build", "index.html"));
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// ... existing code ...

// Route to get new or back in stock products
app.get('/api/products/new-or-back', async (req, res) => {
  try {
    const query = `
      SELECT p.*, s.name as supermarket_name, 
             CASE 
               WHEN p.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 'new'
               WHEN p.back_in_stock_date >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 'back'
               ELSE NULL
             END as status,
             p.discount_percentage
      FROM products p
      JOIN supermarkets s ON p.supermarket_id = s.id
      WHERE (p.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) 
             OR p.back_in_stock_date >= DATE_SUB(NOW(), INTERVAL 7 DAY))
      ORDER BY p.created_at DESC, p.back_in_stock_date DESC
      LIMIT 10
    `;
    
    const [results] = await db.execute(query);
    res.json(results);
  } catch (error) {
    console.error('Error fetching new/back in stock products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Route to get cost comparison data
app.get('/api/products/cost-comparison', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 4;
    
    const query = `
      SELECT 
        p1.name as product_name,
        p1.category,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', p2.id,
            'price', p2.price,
            'unit', p2.unit,
            'supermarket_name', s.name,
            'supermarket_id', s.id
          ) ORDER BY p2.price ASC
        ) as price_variations
      FROM products p1
      JOIN products p2 ON LOWER(TRIM(p1.name)) = LOWER(TRIM(p2.name))
      JOIN supermarkets s ON p2.supermarket_id = s.id
      WHERE p1.id IN (
        SELECT MIN(id) 
        FROM products 
        GROUP BY LOWER(TRIM(name))
        HAVING COUNT(*) > 1
      )
      GROUP BY p1.name, p1.category
      ORDER BY RAND()
      LIMIT ?
    `;
    
    const [results] = await db.execute(query, [limit]);
    
    // Parse JSON and calculate savings
    const processedResults = results.map(item => {
      const variations = JSON.parse(item.price_variations);
      const minPrice = Math.min(...variations.map(v => v.price));
      const maxPrice = Math.max(...variations.map(v => v.price));
      const savingsPercentage = maxPrice > 0 ? ((maxPrice - minPrice) / maxPrice * 100).toFixed(1) : 0;
      
      return {
        ...item,
        price_variations: variations,
        min_price: minPrice,
        max_price: maxPrice,
        savings_percentage: savingsPercentage
      };
    });
    
    res.json(processedResults);
  } catch (error) {
    console.error('Error fetching cost comparisons:', error);
    res.status(500).json({ error: 'Failed to fetch cost comparisons' });
  }
});

// Route to get weekly sales/promotions
app.get('/api/products/weekly-sales', async (req, res) => {
  try {
    const query = `
      SELECT p.*, s.name as supermarket_name,
             p.original_price,
             p.discount_percentage,
             p.promotion_end_date
      FROM products p
      JOIN supermarkets s ON p.supermarket_id = s.id
      WHERE p.discount_percentage > 0 
        AND (p.promotion_end_date IS NULL OR p.promotion_end_date >= CURDATE())
      ORDER BY p.discount_percentage DESC, p.created_at DESC
      LIMIT 8
    `;
    
    const [results] = await db.execute(query);
    res.json(results);
  } catch (error) {
    console.error('Error fetching weekly sales:', error);
    res.status(500).json({ error: 'Failed to fetch weekly sales' });
  }
});

// Route to get product pricing history
app.get('/api/products/:id/pricing-history', async (req, res) => {
  try {
    const productId = req.params.id;
    
    const query = `
      SELECT ph.*, p.name as product_name, s.name as supermarket_name
      FROM price_history ph
      JOIN products p ON ph.product_id = p.id
      JOIN supermarkets s ON p.supermarket_id = s.id
      WHERE ph.product_id = ?
      ORDER BY ph.recorded_date DESC
      LIMIT 30
    `;
    
    const [results] = await db.execute(query, [productId]);
    res.json(results);
  } catch (error) {
    console.error('Error fetching pricing history:', error);
    res.status(500).json({ error: 'Failed to fetch pricing history' });
  }
});

// Route to get detailed product information
app.get('/api/products/:id/details', async (req, res) => {
  try {
    const productId = req.params.id;
    
    const query = `
      SELECT p.*, s.name as supermarket_name, s.logo_url as supermarket_logo,
             AVG(ph.price) as avg_price_30_days,
             MIN(ph.price) as lowest_price_30_days,
             MAX(ph.price) as highest_price_30_days
      FROM products p
      JOIN supermarkets s ON p.supermarket_id = s.id
      LEFT JOIN price_history ph ON p.id = ph.product_id 
        AND ph.recorded_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      WHERE p.id = ?
      GROUP BY p.id
    `;
    
    const [results] = await db.execute(query, [productId]);
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(results[0]);
  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).json({ error: 'Failed to fetch product details' });
  }
});

// Route to get featured products
app.get('/api/products/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    
    const query = `
      SELECT p.*, s.name as supermarket_name
      FROM products p
      JOIN supermarkets s ON p.supermarket_id = s.id
      WHERE p.featured = 1 OR p.discount_percentage > 0
      ORDER BY p.featured DESC, p.discount_percentage DESC, p.created_at DESC
      LIMIT ?
    `;
    
    const [results] = await db.execute(query, [limit]);
    res.json(results);
  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.status(500).json({ error: 'Failed to fetch featured products' });
  }
});




