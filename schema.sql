-- Users table for storing Google OAuth user info
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  usage_count INTEGER NOT NULL DEFAULT 0,
  -- 额度和会员相关字段
  credits_remaining INTEGER NOT NULL DEFAULT 5,  -- 剩余额度，新用户默认5次
  daily_usage_count INTEGER NOT NULL DEFAULT 0,  -- 今日使用次数
  daily_usage_reset_date TEXT,                   -- 每日额度重置日期 (YYYY-MM-DD)
  membership_type TEXT NOT NULL DEFAULT 'free',  -- 会员类型: free/premium/vip
  membership_expires_at DATETIME,                -- 会员到期时间
  total_credits_purchased INTEGER NOT NULL DEFAULT 0  -- 累计购买额度
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_membership ON users(membership_type, membership_expires_at);

-- Usage history table for tracking each background removal operation
CREATE TABLE IF NOT EXISTS usage_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action_type TEXT NOT NULL DEFAULT 'remove_bg',  -- 操作类型
  credits_used INTEGER NOT NULL DEFAULT 1,         -- 消耗额度
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  image_size INTEGER,                              -- 图片大小（字节）
  status TEXT NOT NULL DEFAULT 'success',          -- success/failed
  error_message TEXT,                              -- 错误信息（如果失败）
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_usage_history_user ON usage_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_history_created ON usage_history(created_at DESC);

-- Unauthenticated users daily usage tracking (by IP)
CREATE TABLE IF NOT EXISTS anonymous_usage (
  id TEXT PRIMARY KEY,
  ip_address TEXT NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,
  usage_date TEXT NOT NULL,  -- YYYY-MM-DD
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_anonymous_usage_ip_date ON anonymous_usage(ip_address, usage_date);

-- Credit pack purchases and transactions
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  transaction_type TEXT NOT NULL,  -- credit_pack/membership_upgrade
  amount_usd REAL NOT NULL,        -- Amount in USD
  credits_added INTEGER,           -- Credits added (for credit packs)
  membership_type TEXT,            -- New membership type (for upgrades)
  membership_duration_days INTEGER, -- Duration in days (for upgrades)
  status TEXT NOT NULL DEFAULT 'pending',  -- pending/completed/failed
  payment_method TEXT,             -- stripe/paypal/etc (placeholder for now)
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- Auth.js v5 / @auth/d1-adapter required tables
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT NOT NULL,
  userId TEXT NOT NULL,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  providerAccountId TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  oauth_token_secret TEXT,
  oauth_token TEXT,
  PRIMARY KEY (provider, providerAccountId)
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT NOT NULL PRIMARY KEY,
  sessionToken TEXT NOT NULL UNIQUE,
  userId TEXT NOT NULL,
  expires DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires DATETIME NOT NULL,
  PRIMARY KEY (identifier, token)
);

