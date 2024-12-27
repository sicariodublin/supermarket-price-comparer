const jwt = require('jsonwebtoken');
const mysql = require("mysql2");

// Create database connection
const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'supermarket_db'
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
      process.env.JWT_SECRET || "00398223828992005933"
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
