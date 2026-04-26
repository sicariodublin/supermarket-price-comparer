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
const NODE_ENV = process.env.NODE_ENV || "development";
const isDev = NODE_ENV !== "production";
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const { verifyToken } = require("./middleware/authMiddleware");
const { pool, connection, queryAsync, dbConfig, closePool } = require("./db");
const path = require("path");
const bodyParser = require("body-parser");
const { z } = require("zod");
const mailjet = require("node-mailjet").apiConnect(
  process.env.MJ_APIKEY_PUBLIC,
  process.env.MJ_APIKEY_PRIVATE
);

const app = express();

const configuredCorsOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:4000",
  "http://localhost:5001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:4000",
  "https://addandcompare.com",
  "https://www.addandcompare.com",
  ...configuredCorsOrigins,
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.replace(/\/+$/, "");
    const normalizedAllowedOrigins = allowedOrigins.map((u) => u.replace(/\/+$/, ""));
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalizedOrigin);
    const allowed = isLocalhost || normalizedAllowedOrigins.includes(normalizedOrigin);

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
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
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

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.API_RATE_LIMIT || 300),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT || 20),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many authentication attempts. Please try again later." },
});

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: Number(process.env.CONTACT_RATE_LIMIT || 10),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many messages submitted. Please try again later." },
});

app.use("/api", apiLimiter);

const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: "Invalid request data",
      details: result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  req.body = result.data;
  next();
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const textField = (max) => z.string().trim().min(1).max(max);
const passwordSchema = z
  .string()
  .min(8)
  .max(128)
  .regex(/^(?=.*[A-Z])(?=.*[£$%&*\/\\@-]).{8,}$/, {
    message:
      "Password must be at least 8 characters long, contain at least one uppercase letter, and one special character (£$%&*/@-).",
  });

const schemas = {
  contact: z.object({
    name: textField(100),
    email: z.string().trim().email().max(254),
    subject: z.string().trim().max(150).optional().default("New Contact Request"),
    message: textField(5000),
  }),
  feedback: z.object({
    message: textField(5000),
  }),
  register: z.object({
    username: textField(80),
    email: z.string().trim().email().max(254).toLowerCase(),
    password: passwordSchema,
  }),
  login: z.object({
    email: z.string().trim().email().max(254).toLowerCase(),
    password: z.string().min(1).max(128),
  }),
  product: z.object({
    name: textField(200),
    brand: z.string().trim().max(120).optional().default(""),
    quantity: z.coerce.number().positive().max(100000),
    unit: textField(30),
    price: z.coerce.number().nonnegative().max(100000),
    supermarket_id: z.coerce.number().int().positive().max(1000),
    product_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: "Product date must use YYYY-MM-DD format.",
    }),
  }),
  passwordReset: z.object({
    username: textField(80),
    email: z.string().trim().email().max(254).toLowerCase(),
  }),
  passwordResetConfirm: z.object({
    token: textField(2048),
    newPassword: passwordSchema,
  }),
  productApproval: z.object({
    status: z.enum(["approved", "rejected"]),
    rejected_reason: z.string().trim().max(500).optional().default(""),
  }),
  productReport: z.object({
    report_type: z
      .enum(["incorrect_price", "incorrect_details", "not_available", "duplicate", "other"])
      .optional()
      .default("incorrect_price"),
    reported_price: z.coerce.number().nonnegative().max(100000).optional().nullable(),
    message: textField(1000),
  }),
  productReportReview: z.object({
    status: z.enum(["reviewed", "resolved", "dismissed"]),
    admin_notes: z.string().trim().max(1000).optional().default(""),
  }),
};

app.use("/api/dashboard", dashboardExpress);

// Graceful shutdown for Railway
process.on("SIGTERM", async () => {
  console.log("Received SIGTERM, closing gracefully...");
  await closePool();
  process.exit(0);
});
process.on("SIGINT", async () => {
  console.log("Received SIGINT, closing gracefully...");
  await closePool();
  process.exit(0);
});

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
    console.log(`Connected to MySQL pool at ${dbConfig.host}:${dbConfig.port}`);
  }
});

app.get("/health", (req, res) => {
  connection.query("SELECT 1", (err) => {
    const ok = !err;
    res.json({ status: ok ? "healthy" : "degraded", db: ok });
  });
});

const productSchema = {
  loaded: false,
  columns: new Set(),
};

const productReportsSchema = {
  loaded: false,
  exists: false,
};

const loadProductSchema = async () => {
  const rows = await queryAsync(
    `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'products'
    `
  );

  productSchema.columns = new Set(rows.map((row) => row.COLUMN_NAME));
  productSchema.loaded = true;
  console.log("Product schema capabilities loaded:", {
    moderation: hasProductModeration(),
    columns: Array.from(productSchema.columns).filter((column) =>
      [
        "source",
        "approval_status",
        "created_by_user_id",
        "approved_by_user_id",
        "approved_at",
        "last_checked_at",
        "rejected_reason",
      ].includes(column)
    ),
  });
};

const ensureProductSchemaLoaded = async () => {
  if (!productSchema.loaded) {
    await loadProductSchema();
  }
};

const loadProductReportsSchema = async () => {
  const rows = await queryAsync(
    `
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'product_reports'
      LIMIT 1
    `
  );

  productReportsSchema.exists = rows.length > 0;
  productReportsSchema.loaded = true;
  console.log("Product reports capability loaded:", {
    enabled: productReportsSchema.exists,
  });
};

const ensureProductReportsTable = async () => {
  if (!productReportsSchema.loaded) {
    await loadProductReportsSchema();
  }

  return productReportsSchema.exists;
};

const hasProductColumn = (column) => productSchema.columns.has(column);

function hasProductModeration() {
  return (
    hasProductColumn("source") &&
    hasProductColumn("approval_status") &&
    hasProductColumn("created_by_user_id") &&
    hasProductColumn("approved_by_user_id") &&
    hasProductColumn("approved_at") &&
    hasProductColumn("last_checked_at") &&
    hasProductColumn("rejected_reason")
  );
}

const moderationSelectFields = (alias = "products") => {
  const fields = [];

  if (hasProductColumn("source")) fields.push(`${alias}.source`);
  if (hasProductColumn("approval_status")) fields.push(`${alias}.approval_status`);
  if (hasProductColumn("created_by_user_id")) fields.push(`${alias}.created_by_user_id`);
  if (hasProductColumn("approved_by_user_id")) fields.push(`${alias}.approved_by_user_id`);
  if (hasProductColumn("approved_at")) fields.push(`${alias}.approved_at`);
  if (hasProductColumn("last_checked_at")) fields.push(`${alias}.last_checked_at`);
  if (hasProductColumn("rejected_reason")) fields.push(`${alias}.rejected_reason`);

  return fields.length ? `,\n  ${fields.join(",\n  ")}` : "";
};

const publicApprovalClause = (alias = "products") =>
  hasProductColumn("approval_status")
    ? `(${alias}.approval_status = 'approved' OR ${alias}.approval_status IS NULL)`
    : "";

loadProductSchema().catch((error) => {
  console.warn("Could not load product schema capabilities:", error.message);
});

loadProductReportsSchema().catch((error) => {
  console.warn("Could not load product reports capability:", error.message);
});

// Instantiate DataCollectionService with the pooled connection
const dataCollectionService = new DataCollectionService(connection);

// Start scheduled data collection
dataCollectionService.scheduleDataCollection();

// Database connection is already established via pool
// No need to call connect() on the pool

const getAdminEmails = () =>
  (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const isAdminRequest = (req) => {
  const adminEmails = getAdminEmails();
  const email = (req.userEmail || req.user?.email || "").toLowerCase();
  return adminEmails.length > 0 && adminEmails.includes(email);
};

const requireAdmin = (req, res, next) => {
  const adminEmails = getAdminEmails();

  if (!adminEmails.length) {
    return res.status(403).json({
      error: "Admin access is not configured. Set ADMIN_EMAILS in the server environment.",
    });
  }

  if (!isAdminRequest(req)) {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
};

// Add manual trigger endpoint
app.post("/api/admin/collect-data/:supermarketId", verifyToken, requireAdmin, async (req, res) => {
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

app.get("/api/admin/products/pending", verifyToken, requireAdmin, async (req, res) => {
  try {
    await ensureProductSchemaLoaded();

    if (!hasProductModeration()) {
      return res.status(400).json({
        error: "Product moderation columns are not installed. Run src/backend/migrations/001_product_moderation.sql.",
      });
    }

    const query = `
      SELECT
        p.id,
        p.name,
        p.quantity,
        p.unit,
        p.price,
        p.product_date,
        p.source,
        p.approval_status,
        p.created_by_user_id,
        p.rejected_reason,
        s.name AS supermarket_name,
        u.email AS submitted_by_email
      FROM products p
      LEFT JOIN supermarkets s ON p.supermarket_id = s.id
      LEFT JOIN users u ON p.created_by_user_id = u.id
      WHERE p.approval_status = 'pending'
      ORDER BY p.id DESC
      LIMIT 100
    `;

    const results = await queryAsync(query);
    res.json(results);
  } catch (error) {
    console.error("Error fetching pending products:", error);
    res.status(500).json({ error: "Failed to fetch pending products" });
  }
});

app.put(
  "/api/admin/products/:id/approval",
  verifyToken,
  requireAdmin,
  validateBody(schemas.productApproval),
  async (req, res) => {
    const { id } = req.params;
    const { status, rejected_reason } = req.body;

    try {
      await ensureProductSchemaLoaded();

      if (!hasProductModeration()) {
        return res.status(400).json({
          error: "Product moderation columns are not installed. Run src/backend/migrations/001_product_moderation.sql.",
        });
      }

      const query = `
        UPDATE products
        SET approval_status = ?,
            approved_by_user_id = ?,
            approved_at = ?,
            rejected_reason = ?
        WHERE id = ?
      `;

      const approvedAt = status === "approved" ? new Date() : null;
      const reason = status === "rejected" ? rejected_reason || null : null;
      const result = await queryAsync(query, [
        status,
        req.userId,
        approvedAt,
        reason,
        id,
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json({ message: `Product ${status}.` });
    } catch (error) {
      console.error("Error updating product approval:", error);
      res.status(500).json({ error: "Failed to update product approval" });
    }
  }
);

app.get("/api/admin/product-reports", verifyToken, requireAdmin, async (req, res) => {
  const allowedStatuses = ["open", "reviewed", "resolved", "dismissed", "all"];
  const status = allowedStatuses.includes(req.query.status)
    ? req.query.status
    : "open";

  try {
    await ensureProductSchemaLoaded();
    const reportsEnabled = await ensureProductReportsTable();

    if (!reportsEnabled) {
      return res.status(400).json({
        error: "Product report table is not installed. Run src/backend/migrations/002_product_reports.sql.",
      });
    }

    const where = [];
    const params = [];

    if (status !== "all") {
      where.push("pr.status = ?");
      params.push(status);
    }

    const query = `
      SELECT
        pr.id,
        pr.product_id,
        pr.report_type,
        pr.reported_price,
        pr.message,
        pr.status,
        pr.admin_notes,
        pr.created_at,
        pr.updated_at,
        pr.reviewed_at,
        p.name AS product_name,
        p.quantity,
        p.unit,
        p.price AS current_price,
        p.product_date,
        ${hasProductColumn("source") ? "p.source" : "NULL"} AS source,
        ${hasProductColumn("approval_status") ? "p.approval_status" : "NULL"} AS approval_status,
        ${hasProductColumn("last_checked_at") ? "p.last_checked_at" : "NULL"} AS last_checked_at,
        s.name AS supermarket_name,
        reporter.email AS reported_by_email,
        reviewer.email AS reviewed_by_email
      FROM product_reports pr
      LEFT JOIN products p ON pr.product_id = p.id
      LEFT JOIN supermarkets s ON p.supermarket_id = s.id
      LEFT JOIN users reporter ON pr.reported_by_user_id = reporter.id
      LEFT JOIN users reviewer ON pr.reviewed_by_user_id = reviewer.id
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY pr.created_at DESC
      LIMIT 100
    `;

    const results = await queryAsync(query, params);
    res.json(results);
  } catch (error) {
    console.error("Error fetching product reports:", error);
    res.status(500).json({ error: "Failed to fetch product reports" });
  }
});

app.put(
  "/api/admin/product-reports/:id",
  verifyToken,
  requireAdmin,
  validateBody(schemas.productReportReview),
  async (req, res) => {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    try {
      const reportsEnabled = await ensureProductReportsTable();

      if (!reportsEnabled) {
        return res.status(400).json({
          error: "Product report table is not installed. Run src/backend/migrations/002_product_reports.sql.",
        });
      }

      const result = await queryAsync(
        `
          UPDATE product_reports
          SET status = ?,
              admin_notes = ?,
              reviewed_by_user_id = ?,
              reviewed_at = NOW()
          WHERE id = ?
        `,
        [status, admin_notes || null, req.userId, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Product report not found" });
      }

      res.json({ message: `Product report marked as ${status}.` });
    } catch (error) {
      console.error("Error updating product report:", error);
      res.status(500).json({ error: "Failed to update product report" });
    }
  }
);

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
app.post("/api/contact", contactLimiter, validateBody(schemas.contact), async (req, res) => {
  const { name, email, subject, message } = req.body;
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeSubject = escapeHtml(subject || "New Contact Request");
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");

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
        Subject: safeSubject,
        HTMLPart: `
        <h3>Contact Request from ${safeName}</h3>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Subject:</strong> ${safeSubject}</p>
        <p><strong>Message:</strong><br />${safeMessage}</p>
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
app.post("/api/feedback/sendFeedback", contactLimiter, validateBody(schemas.feedback), async (req, res) => {
  const { message } = req.body;
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");

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
        HTMLPart: `<p>${safeMessage}</p>`,
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
app.post("/api/register", authLimiter, validateBody(schemas.register), async (req, res) => {
  const { username, email, password } = req.body;

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

            const frontendBase =
              process.env.FRONTEND_URL ||
              (process.env.NODE_ENV === "production"
                ? "https://www.addandcompare.com"
                : "http://localhost:4000");
            const verificationUrl = `${frontendBase}/verify-email?token=${verificationToken}`;

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
            <a href="${verificationUrl}">Verify Email</a>
          `,
                },
              ],
            };

            (async () => {
              try {
                const sendResult = await mailjet
                  .post("send", { version: "v3.1" })
                  .request(emailOptions);

                const msg = sendResult?.body?.Messages?.[0];
                if (!msg || msg.Status !== "success") {
                  console.error(
                    "Verification email rejected by Mailjet:",
                    sendResult?.body
                  );
                  return res
                    .status(502)
                    .json({ error: "Failed to send verification email" });
                }

                const toInfo = msg.To?.[0];
                const messageId = toInfo?.MessageID || null;
                const messageUuid = toInfo?.MessageUUID || null;

                console.log("Verification email sent successfully:", {
                  to: toInfo?.Email || email,
                  messageId,
                  messageUuid,
                });

                return res.status(200).json({
                  message: "Registration successful! Please verify your email.",
                  ...(process.env.NODE_ENV === "production"
                    ? {}
                    : {
                        verification_url: verificationUrl,
                        mailjet_message_id: messageId,
                        mailjet_message_uuid: messageUuid,
                      }),
                });
              } catch (emailErr) {
                console.error("Error sending verification email:", emailErr);
                return res
                  .status(500)
                  .json({ error: "Failed to send verification email" });
              }
            })();
          }
        }
      );
    }
  });
});

// Route for user login
app.post("/api/login", authLimiter, validateBody(schemas.login), (req, res) => {
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

        if (!user.isVerified) {
          return res.status(403).json({
            message: "Please verify your email before logging in.",
          });
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

        console.log("User authenticated:", { id: user.id, email: user.email });

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
app.post("/api/products", verifyToken, validateBody(schemas.product), async (req, res) => {
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

  try {
    await ensureProductSchemaLoaded();

    const columns = ["name", "quantity", "unit", "price", "supermarket_id", "product_date"];
    const placeholders = ["?", "?", "?", "?", "?", "?"];
    const values = [name, quantity, unit, price, supermarket_id, product_date];

    if (hasProductModeration()) {
      columns.push("source", "approval_status", "created_by_user_id");
      placeholders.push("?", "?", "?");
      values.push("user", "pending", req.userId);
    }

    if (hasProductColumn("last_checked_at")) {
      columns.push("last_checked_at");
      placeholders.push("NOW()");
    }

    const query = `INSERT INTO products (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`;
    const result = await queryAsync(query, values);

    console.log("Product saved successfully:", result);
    res.json({
      id: result.insertId,
      approval_status: hasProductModeration() ? "pending" : "approved",
      message: hasProductModeration()
        ? "Product submitted for review."
        : "Product added successfully.",
    });
  } catch (err) {
    console.error("Error saving to database:", err);
    res.status(500).json({ error: "Failed to save product" });
  }
});

// Route to get all products
app.get("/api/products", async (req, res) => {
  try {
    await ensureProductSchemaLoaded();
    const where = [];
    const approvalClause = publicApprovalClause("products");
    if (approvalClause) where.push(approvalClause);

    let query = `
SELECT 
  products.id, 
  products.name, 
  products.quantity, 
  products.unit, 
  products.price, 
  supermarkets.name AS supermarket_name, 
  products.product_date
  ${moderationSelectFields("products")}
FROM products
LEFT JOIN supermarkets ON products.supermarket_id = supermarkets.id
`;

    if (where.length) {
      query += ` WHERE ${where.join(" AND ")}`;
    }

    const results = await queryAsync(query);
    res.json(results);
  } catch (err) {
    console.error("Error retrieving products:", err);
    res.status(500).json({ error: "Failed to retrieve products" });
  }
});

// Route to search products by name
app.get("/api/products/search", async (req, res) => {
  const searchName = req.query.name || "";

  try {
    await ensureProductSchemaLoaded();

    let query = `
SELECT 
  products.id, 
  products.name, 
  products.quantity, 
  products.unit, 
  products.price, 
  supermarkets.name AS supermarket_name, 
  products.product_date
  ${moderationSelectFields("products")}
FROM products
LEFT JOIN supermarkets ON products.supermarket_id = supermarkets.id
`;

    const where = [];
    const queryParams = [];
    const approvalClause = publicApprovalClause("products");
    if (approvalClause) where.push(approvalClause);

    if (searchName) {
      where.push("products.name LIKE ?");
      queryParams.push(`%${searchName}%`);
    }

    if (where.length) {
      query += ` WHERE ${where.join(" AND ")}`;
    }

    const results = await queryAsync(query, queryParams);
    res.json(results);
  } catch (err) {
    console.error("Error searching products:", err);
    res.status(500).json({ error: "Failed to search products" });
  }
});

// API route to update a product
app.put("/api/products/:id", verifyToken, validateBody(schemas.product), async (req, res) => {
  const { id } = req.params;
  const { name, quantity, unit, price, supermarket_id, product_date } =
    req.body;

  try {
    await ensureProductSchemaLoaded();

    const updates = [
      "name = ?",
      "quantity = ?",
      "unit = ?",
      "price = ?",
      "supermarket_id = ?",
      "product_date = ?",
    ];
    const params = [name, quantity, unit, price, supermarket_id, product_date];

    if (hasProductModeration() && !isAdminRequest(req)) {
      updates.push("approval_status = 'pending'");
      if (hasProductColumn("approved_by_user_id")) updates.push("approved_by_user_id = NULL");
      if (hasProductColumn("approved_at")) updates.push("approved_at = NULL");
      if (hasProductColumn("rejected_reason")) updates.push("rejected_reason = NULL");
    }

    let query = `UPDATE products SET ${updates.join(", ")} WHERE id = ?`;
    params.push(id);

    if (hasProductModeration() && !isAdminRequest(req)) {
      query += " AND created_by_user_id = ?";
      params.push(req.userId);
    }

    const result = await queryAsync(query, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: hasProductModeration() && !isAdminRequest(req)
          ? "Product not found or you do not own this submission."
          : "Product not found.",
      });
    }

    res.json({
      message: hasProductModeration() && !isAdminRequest(req)
        ? "Product updated and submitted for review."
        : "Product updated successfully",
    });
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({ error: "Failed to update product" });
  }
});

app.post(
  "/api/products/:id/reports",
  verifyToken,
  contactLimiter,
  validateBody(schemas.productReport),
  async (req, res) => {
    const { id } = req.params;
    const { report_type, reported_price, message } = req.body;

    try {
      await ensureProductSchemaLoaded();
      const reportsEnabled = await ensureProductReportsTable();

      if (!reportsEnabled) {
        return res.status(400).json({
          error: "Product report table is not installed. Run src/backend/migrations/002_product_reports.sql.",
        });
      }

      const where = ["id = ?"];
      const params = [id];
      const approvalClause = publicApprovalClause("products");
      if (approvalClause) where.push(approvalClause);

      const products = await queryAsync(
        `SELECT id FROM products WHERE ${where.join(" AND ")} LIMIT 1`,
        params
      );

      if (!products.length) {
        return res.status(404).json({ error: "Product not found" });
      }

      const result = await queryAsync(
        `
          INSERT INTO product_reports (
            product_id,
            reported_by_user_id,
            report_type,
            reported_price,
            message
          )
          VALUES (?, ?, ?, ?, ?)
        `,
        [
          id,
          req.userId,
          report_type,
          reported_price ?? null,
          message,
        ]
      );

      res.status(201).json({
        id: result.insertId,
        message: "Thanks. Your report was sent for admin review.",
      });
    } catch (err) {
      console.error("Error creating product report:", err);
      res.status(500).json({ error: "Failed to submit product report" });
    }
  }
);

app.get("/api/user/products/submissions", verifyToken, async (req, res) => {
  try {
    await ensureProductSchemaLoaded();

    if (!hasProductModeration()) {
      return res.json([]);
    }

    const query = `
      SELECT
        p.id,
        p.name,
        p.quantity,
        p.unit,
        p.price,
        p.product_date,
        p.source,
        p.approval_status,
        p.rejected_reason,
        p.created_by_user_id,
        p.approved_at,
        s.name AS supermarket_name
      FROM products p
      LEFT JOIN supermarkets s ON p.supermarket_id = s.id
      WHERE p.created_by_user_id = ?
      ORDER BY p.id DESC
      LIMIT 100
    `;

    const results = await queryAsync(query, [req.userId]);
    res.json(results);
  } catch (err) {
    console.error("Error fetching user product submissions:", err);
    res.status(500).json({ error: "Failed to fetch your product submissions" });
  }
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

app.post("/api/password-reset", authLimiter, validateBody(schemas.passwordReset), async (req, res) => {
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

app.post("/api/password-reset/confirm", authLimiter, validateBody(schemas.passwordResetConfirm), async (req, res) => {
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
    await ensureProductSchemaLoaded();

    const hasCreatedAt = hasProductColumn("created_at");
    const hasBackInStock = hasProductColumn("back_in_stock_date");
    const hasProductDate = hasProductColumn("product_date");

    if (!hasCreatedAt && !hasProductDate && !hasBackInStock) {
      return res.json([]);
    }

    const dateCol = hasCreatedAt ? "p.created_at" : "p.product_date";

    const freshnessClauses = [];
    if (hasCreatedAt || hasProductDate) {
      freshnessClauses.push(`${dateCol} >= DATE_SUB(NOW(), INTERVAL 7 DAY)`);
    }
    if (hasBackInStock) {
      freshnessClauses.push(
        `p.back_in_stock_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
      );
    }

    const where = [`(${freshnessClauses.join(" OR ")})`];
    const approvalClause = publicApprovalClause("p");
    if (approvalClause) where.push(approvalClause);

    const statusCases = [];
    if (hasCreatedAt || hasProductDate) {
      statusCases.push(
        `WHEN ${dateCol} >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 'new'`
      );
    }
    if (hasBackInStock) {
      statusCases.push(
        `WHEN p.back_in_stock_date >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 'back'`
      );
    }

    const orderParts = [];
    if (hasCreatedAt || hasProductDate) orderParts.push(`${dateCol} DESC`);
    if (hasBackInStock) orderParts.push(`p.back_in_stock_date DESC`);
    if (!orderParts.length) orderParts.push("p.id DESC");

    const query = `
      SELECT p.*, s.name as supermarket_name,
             CASE
               ${statusCases.join("\n               ")}
               ELSE NULL
             END as status
      FROM products p
      JOIN supermarkets s ON p.supermarket_id = s.id
      WHERE ${where.join(" AND ")}
      ORDER BY ${orderParts.join(", ")}
      LIMIT 10
    `;

    const results = await queryAsync(query);
    res.json(results);
  } catch (error) {
    console.error("Error fetching new/back in stock products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Route to get cost comparison data
app.get("/api/products/cost-comparison", async (req, res) => {
  try {
    await ensureProductSchemaLoaded();
    const limit = parseInt(req.query.limit) || 4;
    const approvalP1 = publicApprovalClause("p1");
    const approvalP2 = publicApprovalClause("p2");
    const subqueryApproval = publicApprovalClause("products");
    const where = [
      approvalP1,
      approvalP2,
      `p1.id IN (
        SELECT MIN(id) 
        FROM products 
        ${subqueryApproval ? `WHERE ${subqueryApproval}` : ""}
        GROUP BY LOWER(TRIM(name))
        HAVING COUNT(*) > 1
      )`,
    ].filter(Boolean);

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
      WHERE ${where.join(" AND ")}
      GROUP BY p1.name
      ORDER BY RAND()
      LIMIT ?
    `;

    const results = await queryAsync(query, [limit]);

    const processedResults = results.map((item) => {
      let variations = item.price_variations;

      if (typeof variations === "string") {
        try {
          variations = JSON.parse(variations);
        } catch (e) {
          console.error("Error parsing variations:", e);
          variations = [];
        }
      }

      if (!Array.isArray(variations)) {
        variations = [];
      }

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
  } catch (error) {
    console.error("Error in cost comparison endpoint:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Route to get weekly sales/promotions
app.get("/api/products/weekly-sales", async (req, res) => {
  try {
    await ensureProductSchemaLoaded();
    const approvalClause = publicApprovalClause("p");
    const query = `
      SELECT p.*, s.name as supermarket_name,
             p.original_price,
             p.discount_percentage,
             p.promotion_end_date
      FROM products p
      JOIN supermarkets s ON p.supermarket_id = s.id
      WHERE p.discount_percentage > 0 
        AND (p.promotion_end_date IS NULL OR p.promotion_end_date >= CURDATE())
        ${approvalClause ? `AND ${approvalClause}` : ""}
      ORDER BY p.discount_percentage DESC, p.created_at DESC
      LIMIT 8
    `;

    const results = await queryAsync(query);
    res.json(results);
  } catch (error) {
    console.error("Error fetching weekly sales:", error);
    res.status(500).json({ error: "Failed to fetch weekly sales" });
  }
});

// Route to get product pricing history
app.get("/api/products/:id/pricing-history", async (req, res) => {
  try {
    await ensureProductSchemaLoaded();
    const productId = req.params.id;
    const approvalClause = publicApprovalClause("p");

    const query = `
      SELECT ph.*, p.name as product_name, s.name as supermarket_name
      FROM price_history ph
      JOIN products p ON ph.product_id = p.id
      JOIN supermarkets s ON p.supermarket_id = s.id
      WHERE ph.product_id = ?
        ${approvalClause ? `AND ${approvalClause}` : ""}
      ORDER BY ph.recorded_date DESC
      LIMIT 30
    `;

    const results = await queryAsync(query, [productId]);
    res.json(results);
  } catch (error) {
    console.error("Error fetching pricing history:", error);
    res.status(500).json({ error: "Failed to fetch pricing history" });
  }
});

// Route to get detailed product information
app.get("/api/products/:id/details", async (req, res) => {
  try {
    await ensureProductSchemaLoaded();
    const productId = req.params.id;
    const approvalClause = publicApprovalClause("p");

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
        ${approvalClause ? `AND ${approvalClause}` : ""}
      GROUP BY p.id
    `;

    const results = await queryAsync(query, [productId]);

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
app.get("/api/products/featured", async (req, res) => {
  try {
    await ensureProductSchemaLoaded();
    const approvalClause = publicApprovalClause("p");
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
    WHERE (p.featured = 1 OR (p.discount_percentage IS NOT NULL AND p.discount_percentage > 0))
      ${approvalClause ? `AND ${approvalClause}` : ""}
    ORDER BY COALESCE(p.discount_percentage, 0) DESC, p.id DESC
    LIMIT 20;
  `;

    const results = await queryAsync(query);
    res.json(results);
  } catch (err) {
    console.error("Error fetching featured products:", err);
    res.status(500).json({ error: "Failed to fetch featured products" });
  }
});

// Fallback for React routing
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../build", "index.html"));
});
