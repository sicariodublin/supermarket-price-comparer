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
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  let decoded;
  try {
    decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
  } catch (error) {
    console.error("Token verification failed:", {
      name: error.name,
      message: error.message,
    });
    return res.status(401).json({ message: "Invalid token" });
  }

  if (!decoded.email) {
    return res.status(401).json({ message: "Invalid token format" });
  }

  try {
    const results = await queryAsync(
      "SELECT id, email, isLoggedIn FROM users WHERE email = ?",
      [decoded.email]
    );

    if (!results.length) {
      return res.status(401).json({ message: "User not found" });
    }

    if (!results[0].isLoggedIn) {
      await updateLoginStatus(decoded.email, 1);
    }

    req.userId = results[0].id;
    req.userEmail = decoded.email;
    req.user = {
      id: results[0].id,
      email: decoded.email,
      isLoggedIn: 1,
    };

    next();
  } catch (error) {
    console.error("Database query failed during token verification:", error);
    return res.status(500).json({ message: "Database error" });
  }
};

module.exports = { verifyToken, updateLoginStatus };
