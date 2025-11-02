// server.js (Backend)
// --- Polyfill missing Web File in Node 18 (must be first) ---
if (typeof globalThis.File === "undefined") {
  const { Blob } = globalThis;
  globalThis.File = class File extends Blob {
    constructor(parts, name, opts = {}) {
      super(parts, opts);
      this.name = String(name);
      this.lastModified = opts.lastModified ?? Date.now();
    }
    get [Symbol.toStringTag]() {
      return "File";
    }
  };
}

let helmet;
try {
  helmet = require("helmet");
} catch (_) {
  console.warn("helmet not installed; skipping security headers");
  helmet = null;
}

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({
    path: require("path").resolve(__dirname, "../../.env"),
  });
  console.log("Environment variables loaded from .env (development)");
} else {
  console.log("Environment variables from Railway (production)");
}
// Verify environment variables are loaded
console.log("Environment variables loaded successfully");
const dashboardExpress = require("./routes/dashboardExpress");
const DataCollectionService = require("./services/dataCollectionService");
const express = require("express");
const bcrypt = require("bcryptjs");
const mysql = require("mysql2");
const NODE_ENV = process.env.NODE_ENV || "development";
const isDev = NODE_ENV !== "production";
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { verifyToken } = require("./middleware/authMiddleware");
const path = require("path");
const bodyParser = require("body-parser");
const mailjet = require("node-mailjet").apiConnect(
  process.env.MJ_APIKEY_PUBLIC,
  process.env.MJ_APIKEY_PRIVATE
);

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:4000",
  "http://localhost:5001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:4000",
  "https://addandcompare.com",
  "https://www.addandcompare.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const o = origin.replace(/\/+$/, "");
      const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o);
      const allowed = isLocalhost || allowedOrigins.map(u => u.replace(/\/+$/, "")).includes(o);

      // In development, allow unknown origins (e.g., embedded preview)
      if (!allowed && isDev) {
        console.warn(`Dev CORS allowed temporarily: ${origin}`);
        return callback(null, true);
      }

      if (allowed) {
        return callback(null, true);
      }

      console.warn(`CORS blocked origin: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.options("*", cors());
if (helmet) {
  app.use(
    helmet({
      contentSecurityPolicy: false, // keep off unless CSP configured
    })
  );
  app.use(
    helmet.hsts({
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    })
  );
}

// HTTP Basic Auth protection (site-wide, skip CORS preflight)
const BASIC_AUTH_ENABLED = (process.env.BASIC_AUTH_ENABLED || "true").toLowerCase() === "true";
const BASIC_AUTH_USER = process.env.BASIC_AUTH_USER || "admin";
const BASIC_AUTH_PASS = process.env.BASIC_AUTH_PASS || "changeme";

app.use((req, res, next) => {
  if (!BASIC_AUTH_ENABLED) return next();
  if (req.method === "OPTIONS") return next(); // allow CORS preflight

  // Allow public/static assets and health endpoint without auth
  const PUBLIC_PATHS = new Set([
    "/",
    "/index.html",
    "/manifest.json",
    "/favicon.ico",
    "/logo192.png",
    "/logo512.png",
    "/robots.txt",
    "/health",
    "/asset-manifest.json",
    "/service-worker.js"
  ]);
  const isStatic = req.path.startsWith("/static/");
  if (PUBLIC_PATHS.has(req.path) || isStatic) return next();

  const header = req.headers.authorization || "";
  
  // Allow Bearer tokens to bypass Basic challenge (for JWT-protected endpoints)
  if (header.startsWith("Bearer ")) {
    return next();
  }
  
  if (!header.startsWith("Basic ")) {
    res.set("WWW-Authenticate", 'Basic realm="Private Site"');
    return res.status(401).send("Authentication required");
  }

  const encoded = header.slice(6);
  let creds = "";
  try {
    creds = Buffer.from(encoded, "base64").toString();
  } catch {
    res.set("WWW-Authenticate", 'Basic realm="Private Site"');
    return res.status(401).send("Invalid authorization header");
  }

  const [user, pass] = creds.split(":");
  if (user !== BASIC_AUTH_USER || pass !== BASIC_AUTH_PASS) {
    res.set("WWW-Authenticate", 'Basic realm="Private Site"');
    return res.status(401).send("Access denied");
  }

  return next();
});

app.use(express.json());
app.use(bodyParser.json());
app.use("/api/dashboard", dashboardExpress);

// Database connection configuration
// MySQL connection setup (use Railway vars if available, otherwise DB_*)
const isProduction = process.env.NODE_ENV === "production";

const hostCandidate =
  process.env.DB_HOST ||
  process.env.MYSQLHOST ||
  process.env.MYSQL_HOST ||
  process.env.DATABASE_HOST ||
  "localhost";

const host =
  isProduction &&
  (process.env.DB_HOST ||
    process.env.MYSQLHOST ||
    process.env.MYSQL_HOST ||
    process.env.DATABASE_HOST)
    ? hostCandidate
    : hostCandidate === "localhost"
    ? "127.0.0.1"
    : hostCandidate;

const port = parseInt(
  process.env.DB_PORT ||
    process.env.MYSQLPORT ||
    process.env.MYSQL_PORT ||
    "3306",
  10
);

const user =
  process.env.DB_USER ||
  process.env.MYSQLUSER ||
  process.env.MYSQL_USER ||
  process.env.DATABASE_USER ||
  "root";

const password =
  process.env.DB_PASSWORD ||
  process.env.MYSQLPASSWORD ||
  process.env.MYSQL_PASSWORD ||
  process.env.DATABASE_PASSWORD ||
  "";

const database =
  process.env.DB_NAME ||
  process.env.MYSQLDATABASE ||
  process.env.MYSQL_DATABASE ||
  process.env.DATABASE_NAME ||
  "supermarket_price_comparer";

// Support Railway-style single connection URL if present
const rawDbUrlCandidates = [
  process.env.RAILWAY_DATABASE_URL,
  process.env.DATABASE_URL
].filter(Boolean);

const parseableDbUrl = rawDbUrlCandidates.find(
  (u) => typeof u === "string" && u.includes("://")
);

if (parseableDbUrl) {
  try {
    const url = new URL(parseableDbUrl);
    host = url.hostname || host;
    port = parseInt(url.port || port, 10) || port;
    user = url.username || user;
    password = url.password || password;
    const pathDb = (url.pathname || "").replace(/^\//, "");
    database = pathDb || database;
    console.log("Parsed database URL and applied to config");
  } catch (e) {
    console.warn("Failed to parse database URL:", e.message);
  }
} else if (rawDbUrlCandidates.length) {
  // One of the DB URL env vars exists but isn't a full URL; use discrete MYSQL* vars without logging warnings
  console.log("Database URL env present but not a full URL; using discrete MYSQL* variables");
}
// ... existing code ...
if (isProduction && (host === "127.0.0.1" || host === "localhost")) {
  console.warn(
    "Database host appears local in production. Verify MYSQLHOST/DB_HOST or RAILWAY_DATABASE_URL is set via Variable Reference on the Node service."
  );
}

// Debug: show resolved DB config and env flags
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("Env host flags:", {
  DB_HOST: !!process.env.DB_HOST,
  MYSQLHOST: !!process.env.MYSQLHOST,
  MYSQL_HOST: !!process.env.MYSQL_HOST,
  DATABASE_HOST: !!process.env.DATABASE_HOST,
  DATABASE_URL: !!process.env.DATABASE_URL,
  RAILWAY_DATABASE_URL: !!process.env.RAILWAY_DATABASE_URL,
});
console.log("Resolved DB config (server.js):", { host, port, user, database });

if (isProduction && (host === "127.0.0.1" || host === "localhost")) {
  console.error(
    "Database host is not configured for production. Set MYSQLHOST/DB_HOST in Railway."
  );
  process.exit(1);
}

// Graceful shutdown for Railway
process.on("SIGTERM", () => {
  console.log("Received SIGTERM, closing gracefully...");
  try {
    pool.end(() => console.log("MySQL pool closed"));
  } catch (e) {
    console.warn("Error closing MySQL pool:", e.message);
  }
  process.exit(0);
});
process.on("SIGINT", () => {
  console.log("Received SIGINT, closing gracefully...");
  try {
    pool.end(() => console.log("MySQL pool closed"));
  } catch (e) {
    console.warn("Error closing MySQL pool:", e.message);
  }
  process.exit(0);
});

// Replace single connection with a pooled connection
const pool = mysql.createPool({
  host,
  port,
  user,
  password,
  database,
  waitForConnections: true,
  connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT || 10),
  queueLimit: 0,
  connectTimeout: Number(process.env.MYSQL_CONNECT_TIMEOUT || 10000),
});

// Keep the original variable name so all existing code continues to work
const connection = pool;

// Keep-alive ping every minute to prevent idle disconnects
setInterval(() => {
  pool.query("SELECT 1", (err) => {
    if (err) console.warn("DB keepalive failed:", err.message);
  });
}, 60000);

console.log("DB pool created; performing initial ping...");
pool.query("SELECT 1", (err) => {
  if (err) {
    console.error("Initial DB ping failed:", err);
  } else {
    console.log(`Connected to MySQL pool at ${host}:${port}`);
  }
});

app.get("/health", (req, res) => {
  connection.query("SELECT 1", (err) => {
    const ok = !err;
    res.json({ status: ok ? "healthy" : "degraded", db: ok });
  });
});

// Instantiate DataCollectionService with the pooled connection
const dataCollectionService = new DataCollectionService(connection);

// Start scheduled data collection
dataCollectionService.scheduleDataCollection();

// Database connection is already established via pool
// No need to call connect() on the pool

// Add manual trigger endpoint
app.post("/api/admin/collect-data/:supermarketId", async (req, res) => {
  const { supermarketId } = req.params;

  try {
    await dataCollectionService.updateProductPrices(parseInt(supermarketId));
    res.json({
      message: `Data collection completed for supermarket ${supermarketId}`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get collection dates endpoint
app.get("/api/collection-dates", (req, res) => {
  const query = `
    SELECT id, name, last_updated 
    FROM supermarkets 
    ORDER BY name
  `;

  connection.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: "Failed to fetch collection dates" });
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
            <a href="${
              process.env.FRONTEND_URL || "http://localhost:4000"
            }/verify-email?token=${verificationToken}">Verify Email</a>
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
            email: user.email,
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
            name: user.name,
          },
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Access token is missing or invalid" });
  }

  const token = authHeader.split(" ")[1]; // Extract the token from "Bearer <token>"
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    req.user = user; // Attach the user payload to the request
    next();
  });
};

app.get("/api/user/dashboard", authenticateToken, (req, res) => {
  const userId = req.user.id; // Extracted from the decoded JWT

  const query = `
    SELECT * FROM user_data WHERE user_id = ?;
  `;
  connection.query(query, [userId], (err, results) => {
    if (err) {
      res.status(500).json({ error: "Database error" });
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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

app.post("/api/password-reset", async (req, res) => {
  const { username, email } = req.body;

  if (!username || !email) {
    return res.status(400).json({ message: "Username and email are required" });
  }

  try {
    const user = await findUserInDatabase(username, email); // Replace with your DB logic
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    const frontendBase =
      process.env.FRONTEND_URL ||
      (process.env.NODE_ENV === "production" ? "https://www.addandcompare.com" : "http://localhost:4000");
    const resetUrl = `${frontendBase}/password-reset?token=${token}`;

    // Email Logic
    const emailOptions = {
      Messages: [
        {
          From: {
            Email: "addandcomparemessageus@hotmail.com",
            Name: "Add and Compare",
          },
          To: [{ Email: email }],
          Subject: "Password Reset Request",
          HTMLPart: `
            <p>Hi ${username},</p>
            <p>You requested to reset your password. Please click the link below to reset it:</p>
            <a href="${resetUrl}">Reset Password</a>
            <p>If you did not request this, please ignore this email.</p>
          `,
        },
      ],
    };
    await mailjet.post("send", { version: "v3.1" }).request(emailOptions);

    res
      .status(200)
      .json({ message: "Password reset email sent successfully." });
  } catch (error) {
    console.error("Error handling password reset:", error);
    res
      .status(500)
      .json({ message: "Failed to handle password reset request." });
  }
});

app.post("/api/password-reset/confirm", async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res
      .status(400)
      .json({ message: "Token and new password are required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const query = "UPDATE users SET password = ? WHERE id = ?";
    connection.query(query, [hashedPassword, userId], (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to reset password." });
      }

      res.status(200).json({ message: "Password reset successfully." });
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Invalid or expired token." });
  }
});

// Helper function to find a user in the database
function findUserInDatabase(username, email) {
  return new Promise((resolve, reject) => {
    const query = "SELECT * FROM users WHERE username = ? AND email = ?";
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
  {
    id: "user-id-placeholder",
    username: "Fsteyer",
    email: "fsteyer@example.com",
  },
];

// Delete Account Endpoint
app.delete("/api/delete-account", verifyToken, (req, res) => {
  console.log("Full request headers:", req.headers);
  console.log("Full decoded token:", req.user);
  console.log("UserID from request:", req.userId);

  const userId = req.userId; // Extracted from the token
  if (!userId) {
    console.error("UserID is undefined");
    return res.status(400).json({ message: "Invalid user ID" });
  }

  connection.query(
    "DELETE FROM users WHERE id = ?",
    [userId],
    (err, result) => {
      if (err) {
        console.error("Error deleting user from database:", err);
        return res.status(500).json({ message: "Internal server error" });
      }

      if (result.affectedRows === 0) {
        console.log("No user found with ID:", userId); // Log if no user is found
        return res.status(404).json({ message: "User not found" });
      }

      console.log("Deleted user with ID:", userId); // Log success
      return res.status(200).json({ message: "Account deleted successfully" });
    }
  );
});

// Serve React build files
app.use(express.static(path.join(__dirname, "../../build")));

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Route to get new or back in stock products
app.get("/api/products/new-or-back", async (req, res) => {
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

    // Change this line:
    const [results] = await connection.query(query);
    res.json(results);
  } catch (error) {
    console.error("Error fetching new/back in stock products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Route to get cost comparison data
app.get("/api/products/cost-comparison", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 4;

    const query = `
      SELECT 
        p1.name as product_name,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', p2.id,
            'price', p2.price,
            'unit', p2.unit,
            'supermarket_name', s.name,
            'supermarket_id', s.id
          )
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
      GROUP BY p1.name
      ORDER BY RAND()
      LIMIT ?
    `;

    connection.query(query, [limit], (err, results) => {
      if (err) {
        console.error("Error fetching cost comparisons:", err);
        return res
          .status(500)
          .json({ error: "Failed to fetch cost comparisons" });
      }

      // Process results without JSON.parse since they're already objects
      const processedResults = results.map((item) => {
        let variations = item.price_variations;

        // Handle case where variations might be a string or already an object
        if (typeof variations === "string") {
          try {
            variations = JSON.parse(variations);
          } catch (e) {
            console.error("Error parsing variations:", e);
            variations = [];
          }
        }

        // Ensure variations is an array
        if (!Array.isArray(variations)) {
          variations = [];
        }

        // Sort variations by price in JavaScript
        variations.sort((a, b) => a.price - b.price);

        const prices = variations.map((v) => v.price).filter((p) => !isNaN(p));
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
        const savingsPercentage =
          maxPrice > 0
            ? (((maxPrice - minPrice) / maxPrice) * 100).toFixed(1)
            : 0;

        return {
          ...item,
          price_variations: variations,
          min_price: minPrice,
          max_price: maxPrice,
          savings_percentage: savingsPercentage,
        };
      });

      res.json(processedResults);
    });
  } catch (error) {
    console.error("Error in cost comparison endpoint:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Route to get weekly sales/promotions
app.get("/api/products/weekly-sales", async (req, res) => {
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

    // Change this line:
    const [results] = await connection.query(query);
    res.json(results);
  } catch (error) {
    console.error("Error fetching weekly sales:", error);
    res.status(500).json({ error: "Failed to fetch weekly sales" });
  }
});

// Route to get product pricing history
app.get("/api/products/:id/pricing-history", async (req, res) => {
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

    // Change this line:
    const [results] = await connection.query(query, [productId]);
    res.json(results);
  } catch (error) {
    console.error("Error fetching pricing history:", error);
    res.status(500).json({ error: "Failed to fetch pricing history" });
  }
});

// Route to get detailed product information
app.get("/api/products/:id/details", async (req, res) => {
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

    // Change this line:
    const [results] = await connection.query(query, [productId]);

    if (results.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(results[0]);
  } catch (error) {
    console.error("Error fetching product details:", error);
    res.status(500).json({ error: "Failed to fetch product details" });
  }
});

// Route to get featured products
app.get("/api/products/featured", (req, res) => {
  const query = `
    SELECT 
      p.id,
      p.name,
      p.quantity,
      p.unit,
      p.price,
      p.original_price,
      p.discount_percentage,
      p.promotion_end_date,
      p.featured,
      s.name AS supermarket
    FROM products p
    LEFT JOIN supermarkets s ON p.supermarket_id = s.id
    WHERE p.featured = 1 OR (p.discount_percentage IS NOT NULL AND p.discount_percentage > 0)
    ORDER BY COALESCE(p.discount_percentage, 0) DESC, p.id DESC
    LIMIT 20;
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching featured products:", err);
      return res
        .status(500)
        .json({ error: "Failed to fetch featured products" });
    }
    res.json(results);
  });
});

// Fallback for React routing
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../build", "index.html"));
});
