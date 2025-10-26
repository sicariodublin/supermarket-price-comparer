const jwt = require('jsonwebtoken');
const mysql = require("mysql2");

// Top-level MySQL connection used by auth middleware
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

if (isProduction && (host === "127.0.0.1" || host === "localhost")) {
  console.error(
    "Database host is not configured for production. Set MYSQLHOST/DB_HOST in Railway."
  );
  process.exit(1);
}

const connection = mysql.createConnection({
  host,
  port,
  user,
  password,
  database,
});

connection.connect((err) => {
  if (err) {
    console.error("Failed to connect to MySQL (auth middleware):", err);
    process.exit(1);
  }
  console.log(`Auth middleware connected to MySQL at ${host}:${port}`);
});

const updateLoginStatus = (email, status) => {
  return new Promise((resolve, reject) => {
    connection.query(
      'UPDATE users SET isLoggedIn = ? WHERE email = ?',
      [status, email],
      (err, result) => {
        if (err) {
          console.error('Error updating login status:', err);
          reject(err);
        } else {
          console.log(`Updated isLoggedIn for ${email}`);
          resolve(result);
        }
      }
    );
  });
};

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('Missing or invalid Authorization header');
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    console.log("Token verification:", {
      decoded,
      hasId: !!decoded.id,
      hasEmail: !!decoded.email
    });

    if (!decoded.email) {
      return res.status(401).json({ message: "Invalid token format" });
    }

    connection.query(
      'SELECT id, email, isLoggedIn FROM users WHERE email = ?',
      [decoded.email],
      async (err, results) => {
        if (err) {
          console.error("Database query failed:", err);
          return res.status(500).json({ message: "Database error" });
        }

        if (!results.length) {
          return res.status(401).json({ message: "User not found" });
        }

        // Update login status if needed
        if (!results[0].isLoggedIn) {
          await updateLoginStatus(decoded.email, 1);
        }

        req.userId = results[0].id;
        req.userEmail = decoded.email;
        req.user = {
          id: results[0].id,
          email: decoded.email,
          isLoggedIn: 1
        };

        console.log("User verified:", req.user);
        next();
      }
    );

  } catch (error) {
    console.error("Token verification failed:", {
      name: error.name,
      message: error.message
    });
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = { verifyToken, updateLoginStatus };
