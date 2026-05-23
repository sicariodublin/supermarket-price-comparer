-- User preferences table — stores per-user settings, watchlist, and budget preferences.
-- Run this once against the MySQL database used by Add&Compare.
-- Compatible with MySQL 5.7+

CREATE TABLE IF NOT EXISTS user_data (
  id                      INT AUTO_INCREMENT PRIMARY KEY,
  user_id                 INT NOT NULL UNIQUE,
  watchlist               TEXT NULL,
  newsletter_settings     TEXT NULL,
  weekly_shop_budget      DECIMAL(10,2) DEFAULT 150.00,
  preferred_supermarkets  TEXT NULL,
  created_at              DATETIME DEFAULT NOW(),
  updated_at              DATETIME DEFAULT NOW() ON UPDATE NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_data_user_id ON user_data (user_id);
