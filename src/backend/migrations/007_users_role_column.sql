-- Add role column to users table.
-- After running, manually seed your admin account:
--   UPDATE users SET role = 'admin' WHERE email = 'your@email.com';

ALTER TABLE users
  ADD COLUMN role ENUM('user', 'admin') NOT NULL DEFAULT 'user';

CREATE INDEX idx_users_role ON users (role);
