const mysql = require("mysql2");

const isProduction = process.env.NODE_ENV === "production";

const hostCandidate =
  process.env.DB_HOST ||
  process.env.MYSQLHOST ||
  process.env.MYSQL_HOST ||
  process.env.DATABASE_HOST ||
  "localhost";

let host =
  isProduction &&
  (process.env.DB_HOST ||
    process.env.MYSQLHOST ||
    process.env.MYSQL_HOST ||
    process.env.DATABASE_HOST)
    ? hostCandidate
    : hostCandidate === "localhost"
    ? "127.0.0.1"
    : hostCandidate;

let port = parseInt(
  process.env.DB_PORT ||
    process.env.MYSQLPORT ||
    process.env.MYSQL_PORT ||
    "3306",
  10
);

let user =
  process.env.DB_USER ||
  process.env.MYSQLUSER ||
  process.env.MYSQL_USER ||
  process.env.DATABASE_USER ||
  "root";

let password =
  process.env.DB_PASSWORD ||
  process.env.MYSQLPASSWORD ||
  process.env.MYSQL_PASSWORD ||
  process.env.DATABASE_PASSWORD ||
  "";

let database =
  process.env.DB_NAME ||
  process.env.MYSQLDATABASE ||
  process.env.MYSQL_DATABASE ||
  process.env.DATABASE_NAME ||
  "supermarket_price_comparer";

const rawDbUrlCandidates = [
  process.env.RAILWAY_DATABASE_URL,
  process.env.DATABASE_URL,
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
    console.log("Parsed database URL and applied to DB config");
  } catch (e) {
    console.warn("Failed to parse database URL:", e.message);
  }
} else if (rawDbUrlCandidates.length) {
  console.log("Database URL env present but not a full URL; using discrete MYSQL* variables");
}

if (isProduction && (host === "127.0.0.1" || host === "localhost")) {
  console.error(
    "Database host is not configured for production. Set MYSQLHOST/DB_HOST or RAILWAY_DATABASE_URL."
  );
  process.exit(1);
}

const dbConfig = {
  host,
  port,
  user,
  database,
};

console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("Env host flags:", {
  DB_HOST: !!process.env.DB_HOST,
  MYSQLHOST: !!process.env.MYSQLHOST,
  MYSQL_HOST: !!process.env.MYSQL_HOST,
  DATABASE_HOST: !!process.env.DATABASE_HOST,
  DATABASE_URL: !!process.env.DATABASE_URL,
  RAILWAY_DATABASE_URL: !!process.env.RAILWAY_DATABASE_URL,
});
console.log("Resolved DB config:", dbConfig);

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

const connection = pool;

const queryAsync = (query, params = []) =>
  new Promise((resolve, reject) => {
    connection.query(query, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

const closePool = () =>
  new Promise((resolve) => {
    pool.end((err) => {
      if (err) {
        console.warn("Error closing MySQL pool:", err.message);
      } else {
        console.log("MySQL pool closed");
      }
      resolve();
    });
  });

module.exports = {
  pool,
  connection,
  queryAsync,
  dbConfig,
  closePool,
};
