-- Price history table — records price changes over time for each product.
-- Run this once against the MySQL database used by Add&Compare.

CREATE TABLE IF NOT EXISTS price_history (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  product_id    INT NOT NULL,
  price         DECIMAL(10,2) NOT NULL,
  source        VARCHAR(20) NOT NULL DEFAULT 'admin',
  recorded_at   DATETIME NOT NULL DEFAULT NOW(),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX idx_price_history_product_id ON price_history (product_id);
CREATE INDEX idx_price_history_recorded_at ON price_history (recorded_at);
