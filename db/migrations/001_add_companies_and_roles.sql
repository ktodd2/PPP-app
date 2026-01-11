-- Migration: Add companies and user roles
-- This migration adds company management and role-based access control

-- Step 1: Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Step 2: Create user_role enum
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 3: Add role and company_id columns to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);

-- Step 4: Create index on company_id for better query performance
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);

-- Note: To create an admin user, run:
-- UPDATE users SET role = 'admin' WHERE username = 'your_username';
