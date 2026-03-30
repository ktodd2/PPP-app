-- Add approved column to users table for manual approval workflow
ALTER TABLE users ADD COLUMN approved BOOLEAN NOT NULL DEFAULT false;

-- Approve all existing users
UPDATE users SET approved = true;
