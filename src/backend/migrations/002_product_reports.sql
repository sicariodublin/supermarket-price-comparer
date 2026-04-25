CREATE TABLE IF NOT EXISTS product_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NULL,
  reported_by_user_id INT NULL,
  report_type ENUM('incorrect_price', 'incorrect_details', 'not_available', 'duplicate', 'other') NOT NULL DEFAULT 'incorrect_price',
  reported_price DECIMAL(10, 2) NULL,
  message TEXT NOT NULL,
  status ENUM('open', 'reviewed', 'resolved', 'dismissed') NOT NULL DEFAULT 'open',
  admin_notes TEXT NULL,
  reviewed_by_user_id INT NULL,
  reviewed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_product_reports_product_id (product_id),
  INDEX idx_product_reports_reported_by_user_id (reported_by_user_id),
  INDEX idx_product_reports_status (status),
  INDEX idx_product_reports_created_at (created_at)
);
