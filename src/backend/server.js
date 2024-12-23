// server.js (Backend)
require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env"),
});
console.log("Mailjet Public API Key:", process.env.MJ_APIKEY_PUBLIC);
console.log("Mailjet Private API Key:", process.env.MJ_APIKEY_PRIVATE);
const dashboardExpress = require("./routes/dashboardExpress");
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const jwt = require("jsonwebtoken");
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
});

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to the database: " + err.message);
    return;
  }
  console.log("Connected to the database.");
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
              { id: userId, email }, // Replace `userId` with the appropriate variable holding the user's ID
              process.env.JWT_SECRET || "00398223828992005933",
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

  const query = "SELECT * FROM users WHERE email = ?";
  connection.query(query, [email], async (err, results) => {
    if (err) {
      console.error("Error during login:", err);
      res.status(500).json({ error: "Server error" });
      return;
    }

    if (results.length > 0) {
      const user = results[0];

      // Check if email is verified
      if (!user.isVerified) {
        return res
          .status(401)
          .json({ error: "Please verify your email before logging in." });
      }

      // Check if the user is already logged in
      if (user.isLoggedIn) {
        console.log(`User ${email} is already logged in.`);
        return res.status(401).json({ error: "User is already logged in." });
      } else {
        console.log(`User ${email} is not logged in. Proceeding to log in.`);
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (passwordMatch) {
        const token = jwt.sign(
          { id: user.id, email: user.email },
          process.env.JWT_SECRET || "00398223828992005933",
          { expiresIn: "1h" }
        );
        console.log("Generated token:", token); // Debug log
        res.json({ token });
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }

      // Update isLoggedIn to TRUE
      const updateQuery = "UPDATE users SET isLoggedIn = 1 WHERE email = ?";
      connection.query(updateQuery, [email], (err, result) => {
        if (err) {
          console.error("Error updating isLoggedIn:", err);
        } else {
          console.log(`Updated isLoggedIn for ${email}.`);
        }
      });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });
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
      process.env.JWT_SECRET || "00398223828992005933"
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
  jwt.verify(token, process.env.JWT_SECRET || '00398223828992005933', (err, user) => {
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
      process.env.JWT_SECRET || "00398223828992005933"
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

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'defaultSecret', {
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'defaultSecret');
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
app.delete("/api/delete-account", (req, res) => {
  const { userId } = req.body; // User ID from client

  if (!userId) {
    return res.status(400).json({ message: "User ID is required." });
  }

  db.query("DELETE FROM users WHERE id = ?", [userId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Error deleting account.", error: err });
    }
    return res.status(200).json({ message: "Account deleted successfully." });
  });
});

// Serve React build files
app.use(express.static(path.join(__dirname, "../../build")));

// Fallback for React routing
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../build", "index.html"));
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
