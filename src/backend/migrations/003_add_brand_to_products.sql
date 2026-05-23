-- Add brand column to products table.
-- Run this once against the MySQL database used by Add&Compare.
-- Safe to skip if the column already exists.

ALTER TABLE products
  ADD COLUMN brand VARCHAR(120) NOT NULL DEFAULT '' AFTER name;

CREATE INDEX idx_products_brand ON products (brand);
