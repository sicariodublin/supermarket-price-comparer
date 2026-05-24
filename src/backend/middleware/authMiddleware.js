const jwt = require("jsonwebtoken");
const { queryAsync } = require("../db");

const updateLoginStatus = (email, status) => {
  return queryAsync("UPDATE users SET isLoggedIn = ? WHERE email = ?", [
    status,
    email,
  ]).then((result) => {
    console.log(`Updated isLoggedIn for ${email}`);
    return result;
  });
};

const verifyToken = async (req, res, next) => {
  // Prefer HttpOnly cookie (XSS-safe); fall back to Bearer header for API clients
  const cookieToken = req.cookies?.authToken;
  const authHeader = req.headers.authorization;

  let rawToken;
  if (cookieToken) {
    rawToken = cookieToken;
  } else if (authHeader?.startsWith("Bearer ")) {
    rawToken = authHeader.split(" ")[1];
  } else {
    return res.status(401).json({ message: "No token provided" });
  }

  let decoded;
  try {
    decoded = jwt.verify(rawToken, process.env.JWT_SECRET);
  } catch (error) {
    console.error("Token verification failed:", {
      name: error.name,
      message: error.message,
    });
    return res.status(401).json({ message: "Invalid token" });
  }

  if (!decoded.email || decoded.purpose !== "auth") {
    return res.status(401).json({ message: "Invalid token" });
  }

  try {
    const results = await queryAsync(
      "SELECT id, email, role, isLoggedIn FROM users WHERE email = ?",
      [decoded.email]
    );

    if (!results.length) {
      return res.status(401).json({ message: "User not found" });
    }

    if (!results[0].isLoggedIn) {
      await updateLoginStatus(decoded.email, 1);
    }

    req.userId    = results[0].id;
    req.userEmail = decoded.email;
    req.userRole  = results[0].role || "user";
    req.user = {
      id:        results[0].id,
      email:     decoded.email,
      role:      results[0].role || "user",
      isLoggedIn: 1,
    };

    next();
  } catch (error) {
    console.error("Database query failed during token verification:", error);
    return res.status(500).json({ message: "Database error" });
  }
};

module.exports = { verifyToken, updateLoginStatus };
