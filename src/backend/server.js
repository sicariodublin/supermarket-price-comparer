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
const cookieParser = require("cookie-parser");
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
      contentSecurityPolicy: {
        directives: {
          defaultSrc:     ["'self'"],
          scriptSrc:      ["'self'"],
          styleSrc:       ["'self'", "'unsafe-inline'"], // React inlines critical styles
          imgSrc:         ["'self'", "data:", "blob:"],
          fontSrc:        ["'self'"],
          connectSrc:     ["'self'", "https://addandcompare.com", "https://www.addandcompare.com"],
          frameSrc:       ["'none'"],
          frameAncestors: ["'none'"],
          formAction:     ["'self'"],
          objectSrc:      ["'none'"],
          baseUri:        ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false, // keep off — may block legitimate embeds
    })
  );
  app.use(
    helmet.hsts({
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    })
  );
}

// HTTP Basic Auth protection (site-wide, skip CORS preflight)
const BASIC_AUTH_USER = process.env.BASIC_AUTH_USER || "";
const BASIC_AUTH_PASS = process.env.BASIC_AUTH_PASS || "";
const _basicAuthRequested = (process.env.BASIC_AUTH_ENABLED || "true").toLowerCase() === "true";

let BASIC_AUTH_ENABLED = _basicAuthRequested;
if (_basicAuthRequested && (!BASIC_AUTH_USER || !BASIC_AUTH_PASS)) {
  if (!isDev) {
    console.error(
      "FATAL: BASIC_AUTH_ENABLED is true but BASIC_AUTH_USER or BASIC_AUTH_PASS is not set. " +
      "Set these environment variables or set BASIC_AUTH_ENABLED=false."
    );
    process.exit(1);
  }
  console.warn("Basic Auth credentials not set — disabling Basic Auth in development. Set BASIC_AUTH_USER and BASIC_AUTH_PASS to enable it.");
  BASIC_AUTH_ENABLED = false;
}

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
  
  // Allow cookie-authenticated and Bearer-authenticated requests through
  if (req.cookies?.authToken || header.startsWith("Bearer ")) {
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

app.use(cookieParser());
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
    action: z.enum(["none", "apply_reported_price"]).optional().default("none"),
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

const recordPriceHistory = async (productId, price, source = "admin") => {
  try {
    await queryAsync(
      "INSERT INTO price_history (product_id, price, source) VALUES (?, ?, ?)",
      [productId, price, source]
    );
  } catch (err) {
    console.warn("Could not record price history (table may not exist yet):", err.message);
  }
};

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

// Returns the admin email list from env — used only for seeding, not runtime auth checks.
const getAdminEmails = () =>
  (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

// Runtime admin check uses the role column set in the DB.
const isAdminRequest = (req) => req.userRole === "admin";

const requireAdmin = (req, res, next) => {
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

  const allowedReportTypes = [
    "incorrect_price",
    "incorrect_details",
    "not_available",
    "duplicate",
    "other",
    "all",
  ];

  const reportType = allowedReportTypes.includes(req.query.report_type)
    ? req.query.report_type
    : "all";

  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const productId = Number.isFinite(Number(req.query.product_id))
    ? Number(req.query.product_id)
    : null;

  const limit = Math.max(1, Math.min(parseInt(req.query.limit, 10) || 100, 200));
  const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);

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

    if (reportType !== "all") {
      where.push("pr.report_type = ?");
      params.push(reportType);
    }

    if (productId != null && Number.isInteger(productId) && productId > 0) {
      where.push("pr.product_id = ?");
      params.push(productId);
    }

    if (q) {
      where.push("(pr.message LIKE ? OR p.name LIKE ? OR reporter.email LIKE ? OR s.name LIKE ?)");
      const like = `%${q}%`;
      params.push(like, like, like, like);
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
      LIMIT ? OFFSET ?
    `;

    const results = await queryAsync(query, [...params, limit, offset]);
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
    const { status, admin_notes, action } = req.body;

    try {
      const reportsEnabled = await ensureProductReportsTable();

      if (!reportsEnabled) {
        return res.status(400).json({
          error: "Product report table is not installed. Run src/backend/migrations/002_product_reports.sql.",
        });
      }

      let mergedNotes = admin_notes || "";
      let applied = null;

      if (status === "resolved" && action === "apply_reported_price") {
        await ensureProductSchemaLoaded();

        const reports = await queryAsync(
          `
            SELECT id, product_id, report_type, reported_price
            FROM product_reports
            WHERE id = ?
            LIMIT 1
          `,
          [id]
        );

        if (!reports.length) {
          return res.status(404).json({ error: "Product report not found" });
        }

        const report = reports[0];

        if (!report.product_id) {
          return res.status(400).json({ error: "Cannot apply changes because this report is not linked to a product." });
        }

        if (report.report_type !== "incorrect_price") {
          return res.status(400).json({ error: "This resolve action is only available for incorrect price reports." });
        }

        if (report.reported_price == null || Number.isNaN(Number(report.reported_price))) {
          return res.status(400).json({ error: "This report does not include a reported price to apply." });
        }

        const updates = ["price = ?"]; 
        const params = [Number(report.reported_price)];

        if (hasProductColumn("source")) updates.push("source = 'admin'");
        if (hasProductColumn("approval_status")) updates.push("approval_status = 'approved'");
        if (hasProductColumn("last_checked_at")) updates.push("last_checked_at = NOW()");
        else if (hasProductColumn("product_date")) updates.push("product_date = CURDATE()");

        params.push(report.product_id);

        const productResult = await queryAsync(
          `UPDATE products SET ${updates.join(", ")} WHERE id = ?`,
          params
        );

        if (productResult.affectedRows === 0) {
          return res.status(404).json({ error: "Product not found" });
        }

        await recordPriceHistory(report.product_id, Number(report.reported_price), "admin");
        const actionNote = `Applied reported price: ${Number(report.reported_price)}`;
        mergedNotes = [mergedNotes.trim(), actionNote].filter(Boolean).join("\n");
        applied = { type: "apply_reported_price", price: Number(report.reported_price) };
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
        [status, mergedNotes || null, req.userId, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Product report not found" });
      }

      res.json({ message: `Product report marked as ${status}.`, applied });
    } catch (error) {
      console.error("Error updating product report:", error);
      res.status(500).json({ error: "Failed to update product report" });
    }
  }
);

// Get collection dates endpoint
app.get("/api/collection-dates", async (req, res) => {
  try {
    const results = await queryAsync("SELECT id, name, last_updated FROM supermarkets ORDER BY name");
    res.json(results);
  } catch (err) {
    console.error("Error fetching collection dates:", err);
    res.status(500).json({ error: "Failed to fetch collection dates" });
  }
});

// Contact form
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

// Feedback
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
    console.log("Feedback email sent successfully:", result.body);
    res.status(200).json({ message: "Feedback submitted successfully!" });
  } catch (error) {
    console.error("Error sending feedback email:", error);
    res
      .status(500)
      .json({ message: "Failed to submit feedback", error: error.message });
  }
});

// Route for user registration
app.post("/api/register", authLimiter, validateBody(schemas.register), async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existing = await queryAsync("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const isDev = process.env.NODE_ENV !== "production";
    const result = await queryAsync(
      "INSERT INTO users (username, email, password, isVerified) VALUES (?, ?, ?, ?)",
      [username, email, hashedPassword, isDev]
    );
    const userId = result.insertId;

    if (isDev) {
      console.log(`[DEV] Auto-verified account for ${email}`);
      return res.status(200).json({ message: "Registration successful! You can log in now." });
    }

    const verificationToken = jwt.sign(
      { purpose: "email_verify", id: userId, email },
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
          From: { Email: "addandcomparemessageus@hotmail.com", Name: "Add&Compare" },
          To: [{ Email: email, Name: username }],
          Subject: "Please verify your Add&Compare account",
          TextPart: `Hi ${username},\n\nThanks for joining Add&Compare — Ireland's supermarket price comparison platform.\n\nPlease verify your email address by visiting the link below:\n${verificationUrl}\n\nThis link expires in 24 hours.\n\nIf you did not create this account, you can safely ignore this email.\n\nThe Add&Compare Team\naddandcompare.com`,
          HTMLPart: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f1f5f9;margin:0;padding:32px 16px;">
<div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#1e3a5f,#0f2440);padding:32px 36px;">
    <h1 style="color:#ffffff;margin:0;font-size:22px;">Add&amp;Compare</h1>
    <p style="color:#94a3b8;margin:6px 0 0;font-size:14px;">Ireland's supermarket price comparison</p>
  </div>
  <div style="padding:36px;">
    <h2 style="color:#1e3a5f;margin:0 0 12px;font-size:20px;">Hi ${username}, welcome!</h2>
    <p style="color:#475569;line-height:1.6;margin:0 0 24px;">Thanks for signing up. Please verify your email address to activate your account and start comparing prices.</p>
    <a href="${verificationUrl}" style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px;">Verify My Email</a>
    <p style="color:#94a3b8;font-size:13px;margin:24px 0 0;line-height:1.5;">This link expires in 24 hours. If you did not create an account, you can safely ignore this email.</p>
  </div>
  <div style="background:#f8fafc;padding:20px 36px;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">© ${new Date().getFullYear()} Add&amp;Compare · Dublin, Ireland</p>
  </div>
</div>
</body></html>`,
        },
      ],
    };

    const sendResult = await mailjet.post("send", { version: "v3.1" }).request(emailOptions);
    const msg = sendResult?.body?.Messages?.[0];
    if (!msg || msg.Status !== "success") {
      console.error("Verification email rejected by Mailjet:", sendResult?.body);
      return res.status(502).json({ error: "Failed to send verification email" });
    }

    const toInfo = msg.To?.[0];
    console.log("Verification email sent successfully:", {
      to: toInfo?.Email || email,
      messageId: toInfo?.MessageID || null,
    });

    return res.status(200).json({
      message: "Registration successful! Please verify your email.",
      ...(process.env.NODE_ENV === "production"
        ? {}
        : {
            verification_url: verificationUrl,
            mailjet_message_id: toInfo?.MessageID || null,
            mailjet_message_uuid: toInfo?.MessageUUID || null,
          }),
    });
  } catch (err) {
    console.error("Error during registration:", err);
    res.status(500).json({ error: "Failed to register user" });
  }
});

// Route for user login
app.post("/api/login", authLimiter, validateBody(schemas.login), async (req, res) => {
  const { email, password } = req.body;

  try {
    const results = await queryAsync("SELECT * FROM users WHERE email = ?", [email]);
    const user = results[0];

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in.",
      });
    }

    await queryAsync("UPDATE users SET isLoggedIn = 1 WHERE email = ?", [email]);

    const token = jwt.sign(
      { purpose: "auth", id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    console.log("User authenticated:", { id: user.id, email: user.email });

    res.cookie("authToken", token, {
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 60 * 60 * 1000, // 1 hour, matches JWT expiry
      path: "/",
    });

    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role || "user" },
    });
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ message: "Authentication failed" });
  }
});

// Route for user logout
app.post("/api/logout", async (req, res) => {
  const rawToken = req.cookies?.authToken || (() => {
    const h = req.headers.authorization || "";
    return h.startsWith("Bearer ") ? h.split(" ")[1] : null;
  })();

  const clearAuth = () => res.clearCookie("authToken", {
    httpOnly: true,
    secure: NODE_ENV === "production",
    sameSite: NODE_ENV === "production" ? "strict" : "lax",
    path: "/",
  });

  if (!rawToken) {
    clearAuth();
    return res.status(200).json({ message: "Logged out successfully" });
  }

  try {
    const decoded = jwt.verify(rawToken, process.env.JWT_SECRET);
    if (decoded.purpose === "auth") {
      await queryAsync("UPDATE users SET isLoggedIn = FALSE WHERE email = ?", [decoded.email]);
      console.log(`User ${decoded.email} logged out successfully.`);
    }
  } catch {
    // Invalid/expired token — still clear the cookie
  } finally {
    clearAuth();
  }

  return res.status(200).json({ message: "Logged out successfully" });
});

const DEFAULT_NEWSLETTER = { weeklyDeals: true, priceAlerts: false, newProducts: true, seasonalTips: false };

const parseUserData = (row) => ({
  watchlist: row?.watchlist ? JSON.parse(row.watchlist) : [],
  newsletterSettings: row?.newsletter_settings ? JSON.parse(row.newsletter_settings) : DEFAULT_NEWSLETTER,
  weeklyShopBudget: row?.weekly_shop_budget ?? 150,
  preferredSupermarkets: row?.preferred_supermarkets ? JSON.parse(row.preferred_supermarkets) : [],
});

app.get("/api/user/dashboard", verifyToken, async (req, res) => {
  try {
    const [profiles, prefs] = await Promise.all([
      queryAsync("SELECT id, username, email FROM users WHERE id = ?", [req.userId]),
      queryAsync("SELECT * FROM user_data WHERE user_id = ?", [req.userId]),
    ]);

    if (!profiles.length) return res.status(404).json({ error: "User not found" });

    res.json({ ...profiles[0], ...parseUserData(prefs[0]) });
  } catch (err) {
    console.error("Error fetching user dashboard:", err);
    res.status(500).json({ error: "Database error" });
  }
});

const userPrefsSchema = z.object({
  watchlist: z.array(z.coerce.number().int().positive()).max(100).optional(),
  newsletterSettings: z.object({
    weeklyDeals: z.boolean().optional(),
    priceAlerts: z.boolean().optional(),
    newProducts: z.boolean().optional(),
    seasonalTips: z.boolean().optional(),
  }).optional(),
  weeklyShopBudget: z.coerce.number().nonnegative().max(100000).optional(),
  preferredSupermarkets: z.array(z.string().trim().max(80)).max(20).optional(),
});

app.put("/api/user/dashboard", verifyToken, validateBody(userPrefsSchema), async (req, res) => {
  const { watchlist, newsletterSettings, weeklyShopBudget, preferredSupermarkets } = req.body;

  try {
    // Fetch existing row so we can merge partial updates
    const existing = await queryAsync("SELECT * FROM user_data WHERE user_id = ?", [req.userId]);
    const current = parseUserData(existing[0]);

    const merged = {
      watchlist: watchlist ?? current.watchlist,
      newsletter_settings: newsletterSettings
        ? { ...current.newsletterSettings, ...newsletterSettings }
        : current.newsletterSettings,
      weekly_shop_budget: weeklyShopBudget ?? current.weeklyShopBudget,
      preferred_supermarkets: preferredSupermarkets ?? current.preferredSupermarkets,
    };

    await queryAsync(
      `INSERT INTO user_data (user_id, watchlist, newsletter_settings, weekly_shop_budget, preferred_supermarkets)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         watchlist = VALUES(watchlist),
         newsletter_settings = VALUES(newsletter_settings),
         weekly_shop_budget = VALUES(weekly_shop_budget),
         preferred_supermarkets = VALUES(preferred_supermarkets),
         updated_at = NOW()`,
      [
        req.userId,
        JSON.stringify(merged.watchlist),
        JSON.stringify(merged.newsletter_settings),
        merged.weekly_shop_budget,
        JSON.stringify(merged.preferred_supermarkets),
      ]
    );

    res.json({ message: "Preferences saved.", ...merged });
  } catch (err) {
    console.error("Error saving user preferences:", err);
    res.status(500).json({ error: "Failed to save preferences" });
  }
});

// Route to add a product
app.post("/api/products", verifyToken, validateBody(schemas.product), async (req, res) => {
  const { name, brand, quantity, unit, price, supermarket_id, product_date } =
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

    const columns = ["name", "brand", "quantity", "unit", "price", "supermarket_id", "product_date"];
    const placeholders = ["?", "?", "?", "?", "?", "?", "?"];
    const values = [name, brand || "", quantity, unit, price, supermarket_id, product_date];

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
    await recordPriceHistory(result.insertId, price, "user");

    // Notify admins of new pending submission (fire-and-forget — never block the response)
    if (hasProductModeration()) {
      const adminEmails = getAdminEmails();
      if (adminEmails.length) {
        const frontendBase =
          process.env.FRONTEND_URL ||
          (process.env.NODE_ENV === "production" ? "https://www.addandcompare.com" : "http://localhost:4000");

        mailjet.post("send", { version: "v3.1" }).request({
          Messages: [{
            From: { Email: "addandcomparemessageus@hotmail.com", Name: "Add&Compare" },
            To: adminEmails.map((e) => ({ Email: e })),
            Subject: "New product submission pending review",
            HTMLPart: `
              <h3>New product pending review</h3>
              <p><strong>Product:</strong> ${escapeHtml(name)}${brand ? ` (${escapeHtml(brand)})` : ""}</p>
              <p><strong>Price:</strong> €${Number(price).toFixed(2)}</p>
              <p><strong>Submitted by:</strong> ${escapeHtml(req.userEmail)}</p>
              <p><a href="${frontendBase}/dashboard">Review in dashboard →</a></p>
            `,
          }],
        }).catch((err) => console.error("Admin notification email failed:", err.message));
      }
    }

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
  const supermarketId = req.query.supermarket_id ? parseInt(req.query.supermarket_id, 10) : null;
  const limit = Math.max(1, Math.min(parseInt(req.query.limit, 10) || 50, 200));
  const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);

  try {
    await ensureProductSchemaLoaded();

    let query = `
SELECT
  products.id,
  products.name,
  products.brand,
  products.quantity,
  products.unit,
  products.price,
  supermarkets.name AS supermarket_name,
  supermarkets.id AS supermarket_id,
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

    if (supermarketId && Number.isFinite(supermarketId) && supermarketId > 0) {
      where.push("products.supermarket_id = ?");
      queryParams.push(supermarketId);
    }

    if (where.length) {
      query += ` WHERE ${where.join(" AND ")}`;
    }

    query += ` ORDER BY products.name ASC LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);

    const results = await queryAsync(query, queryParams);
    res.json({ results, limit, offset });
  } catch (err) {
    console.error("Error searching products:", err);
    res.status(500).json({ error: "Failed to search products" });
  }
});

// API route to update a product
app.put("/api/products/:id", verifyToken, validateBody(schemas.product), async (req, res) => {
  const { id } = req.params;
  const { name, brand, quantity, unit, price, supermarket_id, product_date } =
    req.body;

  try {
    await ensureProductSchemaLoaded();

    const updates = [
      "name = ?",
      "brand = ?",
      "quantity = ?",
      "unit = ?",
      "price = ?",
      "supermarket_id = ?",
      "product_date = ?",
    ];
    const params = [name, brand || "", quantity, unit, price, supermarket_id, product_date];

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

    const source = isAdminRequest(req) ? "admin" : "user";
    await recordPriceHistory(id, price, source);

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

// Delete a product — admin can delete any; users can only delete their own pending submissions
app.delete("/api/products/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    await ensureProductSchemaLoaded();

    let query;
    let params;

    if (isAdminRequest(req)) {
      query = "DELETE FROM products WHERE id = ?";
      params = [id];
    } else if (hasProductModeration()) {
      // Regular users can only delete their own pending submissions
      query = "DELETE FROM products WHERE id = ? AND created_by_user_id = ? AND approval_status = 'pending'";
      params = [id, req.userId];
    } else {
      return res.status(403).json({ error: "You do not have permission to delete products." });
    }

    const result = await queryAsync(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: isAdminRequest(req)
          ? "Product not found."
          : "Product not found, or it has already been approved and cannot be deleted.",
      });
    }

    res.json({ message: "Product deleted successfully." });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ error: "Failed to delete product" });
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

      const recentReports = await queryAsync(
        `
          SELECT id
          FROM product_reports
          WHERE product_id = ?
            AND reported_by_user_id = ?
            AND report_type = ?
            AND created_at >= (NOW() - INTERVAL 5 MINUTE)
          ORDER BY created_at DESC
          LIMIT 1
        `,
        [id, req.userId, report_type]
      );

      if (recentReports.length) {
        return res.status(429).json({
          error: "You already sent a similar report recently. Please wait a few minutes and try again.",
        });
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

app.post("/api/resend-verification", authLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== "string") {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const users = await queryAsync(
      "SELECT id, username, email, isVerified FROM users WHERE email = ?",
      [email.trim().toLowerCase()]
    );

    // Always respond the same way to avoid leaking whether an email exists
    if (!users.length || users[0].isVerified) {
      return res.status(200).json({ message: "If that email exists and is unverified, a new link has been sent." });
    }

    const user = users[0];
    const verificationToken = jwt.sign(
      { purpose: "email_verify", id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const frontendBase =
      process.env.FRONTEND_URL ||
      (process.env.NODE_ENV === "production" ? "https://www.addandcompare.com" : "http://localhost:4000");
    const verificationUrl = `${frontendBase}/verify-email?token=${verificationToken}`;

    await mailjet.post("send", { version: "v3.1" }).request({
      Messages: [{
        From: { Email: "addandcomparemessageus@hotmail.com", Name: "Add&Compare" },
        To: [{ Email: user.email, Name: user.username }],
        Subject: "Your new verification link — Add&Compare",
        TextPart: `Hi ${user.username},\n\nHere is your new email verification link:\n${verificationUrl}\n\nThis link expires in 24 hours.\n\nIf you did not request this, you can safely ignore this email.\n\nThe Add&Compare Team`,
        HTMLPart: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f1f5f9;margin:0;padding:32px 16px;">
<div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#1e3a5f,#0f2440);padding:32px 36px;">
    <h1 style="color:#ffffff;margin:0;font-size:22px;">Add&amp;Compare</h1>
    <p style="color:#94a3b8;margin:6px 0 0;font-size:14px;">Ireland's supermarket price comparison</p>
  </div>
  <div style="padding:36px;">
    <h2 style="color:#1e3a5f;margin:0 0 12px;font-size:20px;">New verification link</h2>
    <p style="color:#475569;line-height:1.6;margin:0 0 24px;">Hi ${user.username}, here is your new email verification link. Click the button below to verify your account.</p>
    <a href="${verificationUrl}" style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px;">Verify My Email</a>
    <p style="color:#94a3b8;font-size:13px;margin:24px 0 0;line-height:1.5;">This link expires in 24 hours. If you did not request this, you can safely ignore this email.</p>
  </div>
  <div style="background:#f8fafc;padding:20px 36px;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">© ${new Date().getFullYear()} Add&amp;Compare · Dublin, Ireland</p>
  </div>
</div>
</body></html>`,
      }],
    });

    res.status(200).json({ message: "If that email exists and is unverified, a new link has been sent." });
  } catch (err) {
    console.error("Error resending verification email:", err);
    res.status(500).json({ message: "Failed to send verification email" });
  }
});

app.get("/api/verify-email", async (req, res) => {
  const token = req.query.token;

  if (!token) {
    return res.status(400).json({ message: "Token is required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose !== "email_verify") {
      return res.status(400).json({ message: "Invalid or expired token" });
    }
    const result = await queryAsync("UPDATE users SET isVerified = TRUE WHERE id = ?", [decoded.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Email verified successfully. You can now log in." });
  } catch (err) {
    console.error("Email verification error:", err);
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

    const token = jwt.sign({ purpose: "password_reset", userId: user.id }, process.env.JWT_SECRET, {
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
    if (decoded.purpose !== "password_reset" || !decoded.userId) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await queryAsync("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, decoded.userId]);
    res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Invalid or expired token." });
  }
});

async function findUserInDatabase(username, email) {
  const results = await queryAsync(
    "SELECT * FROM users WHERE username = ? AND email = ?",
    [username, email]
  );
  return results[0] || null;
}

// Delete Account Endpoint
app.delete("/api/delete-account", verifyToken, async (req, res) => {
  try {
    const result = await queryAsync("DELETE FROM users WHERE id = ?", [req.userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Deleted user with ID:", req.userId);
    return res.status(200).json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
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
      SELECT ph.id, ph.price, ph.source, ph.recorded_at,
             p.name as product_name, s.name as supermarket_name
      FROM price_history ph
      JOIN products p ON ph.product_id = p.id
      JOIN supermarkets s ON p.supermarket_id = s.id
      WHERE ph.product_id = ?
        ${approvalClause ? `AND ${approvalClause}` : ""}
      ORDER BY ph.recorded_at DESC
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
        AND ph.recorded_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
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
    const limit = Math.max(1, Math.min(parseInt(req.query.limit, 10) || 20, 50));

    const selectParts = [
      "p.id",
      "p.name",
      "p.quantity",
      "p.unit",
      "p.price",
      "p.original_price",
      "p.discount_percentage",
      "p.promotion_end_date",
      "p.featured",
      "s.name AS supermarket_name",
    ];

    if (hasProductColumn("approval_status")) selectParts.push("p.approval_status");
    if (hasProductColumn("source")) selectParts.push("p.source");
    if (hasProductColumn("last_checked_at")) selectParts.push("p.last_checked_at");
    if (hasProductColumn("product_date")) selectParts.push("p.product_date");
    if (hasProductColumn("image_url")) selectParts.push("p.image_url");

    const query = `
      SELECT 
        ${selectParts.join(",\n        ")}
      FROM products p
      LEFT JOIN supermarkets s ON p.supermarket_id = s.id
      WHERE (p.featured = 1 OR (p.discount_percentage IS NOT NULL AND p.discount_percentage > 0))
        ${approvalClause ? `AND ${approvalClause}` : ""}
      ORDER BY COALESCE(p.discount_percentage, 0) DESC, p.id DESC
      LIMIT ?;
    `;

    const results = await queryAsync(query, [limit]);
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
