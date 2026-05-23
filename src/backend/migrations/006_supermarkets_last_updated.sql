-- Add last_updated column to supermarkets table.
-- Tracks when price data was last scraped for each supermarket.
-- Run this once against the MySQL database used by Add&Compare.

ALTER TABLE supermarkets
  ADD COLUMN last_updated DATETIME NULL;
