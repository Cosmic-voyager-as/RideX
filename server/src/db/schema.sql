-- RideX Database Schema
-- SQLite3 with strict constraints and foreign keys

PRAGMA foreign_keys = ON;

-- 1. Users Table (Customer, Driver, Admin)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK(role IN ('CUSTOMER', 'DRIVER', 'ADMIN')),
  department TEXT, -- Admin specific
  license_number TEXT, -- Driver specific
  status TEXT DEFAULT 'OFFLINE' CHECK(status IN ('OFFLINE', 'ONLINE', 'ON_TRIP')), -- Driver specific
  current_lat REAL, -- Driver real-time coordinate
  current_lng REAL,
  current_address TEXT,
  earnings REAL DEFAULT 0.0 CHECK(earnings >= 0),
  rating_average REAL DEFAULT 0.0,
  rating_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. Vehicles Table
CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  driver_id TEXT UNIQUE,
  plate_number TEXT UNIQUE NOT NULL,
  model TEXT NOT NULL,
  color TEXT NOT NULL,
  seating_capacity INTEGER NOT NULL CHECK(seating_capacity > 0),
  vehicle_type TEXT NOT NULL CHECK(vehicle_type IN ('BIKE', 'AUTO', 'MINI', 'SEDAN', 'SUV', 'PREMIUM')),
  year INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 3. Wallets Table
CREATE TABLE IF NOT EXISTS wallets (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  balance REAL NOT NULL DEFAULT 0.0 CHECK(balance >= 0.0),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Wallet Transactions Table (Audit ledger for encapsulated wallet balance changes)
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id TEXT PRIMARY KEY,
  wallet_id TEXT NOT NULL,
  amount REAL NOT NULL CHECK(amount > 0),
  type TEXT NOT NULL CHECK(type IN ('CREDIT', 'DEBIT')),
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
);

-- 5. Saved Places Table (Customer saved destinations)
CREATE TABLE IF NOT EXISTS saved_places (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  address TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Promo Codes Table
CREATE TABLE IF NOT EXISTS promo_codes (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK(discount_type IN ('PERCENTAGE', 'FLAT')),
  discount_value REAL NOT NULL CHECK(discount_value > 0),
  max_discount REAL,
  min_fare REAL DEFAULT 0.0,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0, 1)),
  usage_count INTEGER DEFAULT 0,
  max_usage INTEGER DEFAULT 100,
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 7. Rides Table
CREATE TABLE IF NOT EXISTS rides (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  driver_id TEXT,
  vehicle_id TEXT,
  vehicle_type TEXT NOT NULL,
  pickup_lat REAL NOT NULL,
  pickup_lng REAL NOT NULL,
  pickup_address TEXT NOT NULL,
  dropoff_lat REAL NOT NULL,
  dropoff_lng REAL NOT NULL,
  dropoff_address TEXT NOT NULL,
  distance_km REAL NOT NULL CHECK(distance_km >= 0),
  duration_minutes REAL NOT NULL CHECK(duration_minutes >= 0),
  estimated_fare REAL NOT NULL CHECK(estimated_fare >= 0),
  final_fare REAL CHECK(final_fare >= 0),
  status TEXT NOT NULL DEFAULT 'REQUESTED' CHECK(status IN ('REQUESTED', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  promo_code_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  FOREIGN KEY (customer_id) REFERENCES users(id),
  FOREIGN KEY (driver_id) REFERENCES users(id),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id)
);

-- 8. Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  ride_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  amount REAL NOT NULL CHECK(amount >= 0),
  method TEXT NOT NULL CHECK(method IN ('WALLET', 'CARD', 'CASH')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')),
  transaction_ref TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (ride_id) REFERENCES rides(id),
  FOREIGN KEY (customer_id) REFERENCES users(id)
);

-- 9. Ratings Table
CREATE TABLE IF NOT EXISTS ratings (
  id TEXT PRIMARY KEY,
  ride_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  driver_id TEXT NOT NULL,
  score INTEGER NOT NULL CHECK(score BETWEEN 1 AND 5),
  comment TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (ride_id) REFERENCES rides(id),
  FOREIGN KEY (customer_id) REFERENCES users(id),
  FOREIGN KEY (driver_id) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_rides_customer ON rides(customer_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver ON rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet ON wallet_transactions(wallet_id);

