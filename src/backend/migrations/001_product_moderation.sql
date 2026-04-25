-- Product moderation fields for user-submitted prices.
-- Run this once against the MySQL database used by Add&Compare.
-- If a column already exists, skip that ALTER statement.

ALTER TABLE products
  ADD COLUMN source ENUM('user', 'scraper', 'api', 'admin') NOT NULL DEFAULT 'admin';

ALTER TABLE products
  ADD COLUMN approval_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved';

ALTER TABLE products
  ADD COLUMN created_by_user_id INT NULL;

ALTER TABLE products
  ADD COLUMN approved_by_user_id INT NULL;

ALTER TABLE products
  ADD COLUMN approved_at DATETIME NULL;

ALTER TABLE products
  ADD COLUMN last_checked_at DATETIME NULL;

ALTER TABLE products
  ADD COLUMN rejected_reason VARCHAR(500) NULL;

CREATE INDEX idx_products_approval_status ON products (approval_status);
CREATE INDEX idx_products_source ON products (source);
CREATE INDEX idx_products_created_by_user_id ON products (created_by_user_id);
CREATE INDEX idx_products_last_checked_at ON products (last_checked_at);
