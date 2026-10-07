import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const dbPath = path.resolve(process.cwd(), 'logistics.db');
export const db = new DatabaseSync(dbPath);

// Enable foreign key constraints and WAL mode for reliability
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL CHECK(role IN ('admin', 'operator')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      company_name TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      priority TEXT NOT NULL CHECK(priority IN ('Standard', 'High', 'Urgent')),
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      sku TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      weight_kg REAL NOT NULL CHECK(weight_kg >= 0),
      volume_m3 REAL NOT NULL CHECK(volume_m3 >= 0),
      stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK(stock_quantity >= 0),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS container_types (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      max_weight_kg REAL NOT NULL CHECK(max_weight_kg > 0),
      max_volume_m3 REAL NOT NULL CHECK(max_volume_m3 > 0),
      cost_mad REAL NOT NULL CHECK(cost_mad >= 0),
      internal_length_m REAL,
      internal_width_m REAL,
      internal_height_m REAL
    );

    CREATE TABLE IF NOT EXISTS containers (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      type_id TEXT NOT NULL REFERENCES container_types(id) ON DELETE RESTRICT,
      status TEXT NOT NULL CHECK(status IN ('Available', 'Allocated', 'Prepared', 'Dispatched', 'Maintenance')),
      current_location TEXT NOT NULL DEFAULT 'Main Hub (Casablanca)',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT NOT NULL UNIQUE,
      customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
      order_date TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('Pending', 'Ready', 'Optimized', 'Packed', 'Dispatched', 'Delivered', 'Cancelled')),
      priority TEXT NOT NULL CHECK(priority IN ('Standard', 'High', 'Urgent')),
      notes TEXT,
      total_weight_kg REAL NOT NULL DEFAULT 0,
      total_volume_m3 REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      item_id TEXT NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
      quantity INTEGER NOT NULL CHECK(quantity > 0),
      unit_weight_kg REAL NOT NULL,
      unit_volume_m3 REAL NOT NULL,
      total_weight_kg REAL NOT NULL,
      total_volume_m3 REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS optimization_runs (
      id TEXT PRIMARY KEY,
      run_date TEXT NOT NULL,
      allow_splitting INTEGER NOT NULL DEFAULT 0,
      total_orders_count INTEGER NOT NULL,
      total_items_count INTEGER NOT NULL,
      total_weight_kg REAL NOT NULL,
      total_volume_m3 REAL NOT NULL,
      containers_before INTEGER NOT NULL,
      cost_before_mad REAL NOT NULL,
      containers_after INTEGER NOT NULL,
      cost_after_mad REAL NOT NULL,
      containers_saved INTEGER NOT NULL,
      cost_saved_mad REAL NOT NULL,
      savings_percentage REAL NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('Draft', 'Confirmed', 'Dispatched')),
      created_by TEXT REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS container_allocations (
      id TEXT PRIMARY KEY,
      optimization_run_id TEXT NOT NULL REFERENCES optimization_runs(id) ON DELETE CASCADE,
      container_id TEXT REFERENCES containers(id),
      container_code TEXT NOT NULL,
      container_type_name TEXT NOT NULL,
      max_weight_kg REAL NOT NULL,
      max_volume_m3 REAL NOT NULL,
      cost_mad REAL NOT NULL,
      allocated_weight_kg REAL NOT NULL,
      allocated_volume_m3 REAL NOT NULL,
      weight_utilization_pct REAL NOT NULL,
      volume_utilization_pct REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'Planned' CHECK(status IN ('Planned', 'Prepared', 'Dispatched')),
      is_manually_modified INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS allocation_items (
      id TEXT PRIMARY KEY,
      allocation_id TEXT NOT NULL REFERENCES container_allocations(id) ON DELETE CASCADE,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      order_number TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      item_id TEXT NOT NULL REFERENCES items(id),
      item_name TEXT NOT NULL,
      item_sku TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK(quantity > 0),
      weight_kg REAL NOT NULL,
      volume_m3 REAL NOT NULL,
      is_split INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_containers_status ON containers(status);
    CREATE INDEX IF NOT EXISTS idx_allocations_run ON container_allocations(optimization_run_id);
    CREATE INDEX IF NOT EXISTS idx_alloc_items_alloc ON allocation_items(allocation_id);
  `);

  try {
    const userCols = db.prepare('PRAGMA table_info(users)').all().map((c: any) => c.name);
    if (!userCols.includes('password')) {
      db.exec("ALTER TABLE users ADD COLUMN password TEXT NOT NULL DEFAULT ''");
    }
  } catch (err) {
    // Ignore if column already exists
  }
}
