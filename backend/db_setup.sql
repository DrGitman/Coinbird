-- ============================================================
-- COINBIRD - BUDGET PLANNER
-- Database Setup Guide
-- ============================================================
-- 
-- PREREQUISITES:
--   1. PostgreSQL 14+ installed
--   2. psql CLI available
--
-- STEPS TO CREATE DATABASE:
--
--   1. Open terminal and connect to PostgreSQL:
--      psql -U postgres
--
--   2. Create the database:
--      CREATE DATABASE coinbird;
--
--   3. Connect to it:
--      \c coinbird
--
--   4. Run this file:
--      \i db_setup.sql
--
--   OR run everything in one command:
--      psql -U postgres -c "CREATE DATABASE coinbird;" && psql -U postgres -d coinbird -f db_setup.sql
--
-- ============================================================

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  timezone VARCHAR(50) DEFAULT 'UTC',
  theme VARCHAR(20) DEFAULT 'light',
  notif_email BOOLEAN DEFAULT true,
  notif_budget_alerts BOOLEAN DEFAULT true,
  notif_push BOOLEAN DEFAULT false,
  notif_budget_warning BOOLEAN DEFAULT true,
  notif_budget_exceeded BOOLEAN DEFAULT true,
  notif_overspending BOOLEAN DEFAULT true,
  notif_reminders BOOLEAN DEFAULT true,
  notif_monthly_summary BOOLEAN DEFAULT true,
  notif_milestones BOOLEAN DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50) DEFAULT 'tag',
  color VARCHAR(20) DEFAULT '#4ade80',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(12, 2) NOT NULL,
  description VARCHAR(255),
  merchant VARCHAR(150),
  payment_method VARCHAR(50),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Budgets Table
CREATE TABLE IF NOT EXISTS budgets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  monthly_limit DECIMAL(12, 2) NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, category_id, month, year)
);

-- Savings Goals Table
CREATE TABLE IF NOT EXISTS savings_goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  target_amount DECIMAL(12, 2) NOT NULL,
  current_amount DECIMAL(12, 2) DEFAULT 0,
  target_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month, year);
CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);

-- ============================================================
-- DEFAULT CATEGORIES (inserted when a user registers)
-- These are seeded per user by the backend on registration.
-- Below is a reference of default category names & icons:
--
--   Groceries      -> shopping_bag
--   Housing        -> home
--   Transport      -> car
--   Leisure        -> gamepad
--   Well-being     -> heart_pulse
--   Dining         -> utensils
--   Utilities      -> zap
--   Income         -> briefcase
--   Healthcare     -> stethoscope
--   Education      -> book_open
--   Shopping       -> shopping_cart
--   Other          -> tag
-- ============================================================

-- Trigger to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_savings_goals_updated_at BEFORE UPDATE ON savings_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(100),
  title VARCHAR(150),
  message TEXT,
  action_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Push Subscriptions Table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT UNIQUE NOT NULL,
  p256dh VARCHAR(255) NOT NULL,
  auth VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER update_push_subscriptions_updated_at BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Badges (Metadata)
CREATE TABLE IF NOT EXISTS badges (
  id SERIAL PRIMARY KEY,
  badge_key VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  category VARCHAR(50)
);

-- User Badges (Achievements)
CREATE TABLE IF NOT EXISTS user_badges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  badge_id INTEGER REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP DEFAULT NOW(),
  progress INTEGER DEFAULT 100,
  UNIQUE(user_id, badge_id)
);

-- ============================================================
-- VERIFY SETUP
-- Run these to confirm tables were created:
--   \dt
--   SELECT * FROM categories LIMIT 5;
-- ============================================================

\echo '✅ Coinbird database setup complete!'
\echo '📋 Tables created: users, categories, transactions, budgets, savings_goals'
\echo '🚀 Now copy backend/.env.example to backend/.env and update DATABASE_URL'
