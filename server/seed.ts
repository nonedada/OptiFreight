import { db } from './db.ts';

export function seedDatabase(force = false) {
  // Check if users exist
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
  if (userCount > 0 && !force) {
    return;
  }

  // Clear existing if force
  if (force) {
    db.exec('PRAGMA foreign_keys = OFF;');
    db.exec(`
      DELETE FROM allocation_items;
      DELETE FROM container_allocations;
      DELETE FROM optimization_runs;
      DELETE FROM order_items;
      DELETE FROM orders;
      DELETE FROM containers;
      DELETE FROM items;
      DELETE FROM customers;
      DELETE FROM users;
    `);
    db.exec('PRAGMA foreign_keys = ON;');
  }

  // Insert production admin user: youssef@truck.com / 20052005
  const insertUser = db.prepare('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)');
  insertUser.run('usr-admin-youssef', 'Youssef', 'youssef@truck.com', '20052005', 'admin');

  // Standard Container Model Specifications (Available for vehicle registration)
  const typeCount = (db.prepare('SELECT COUNT(*) as count FROM container_types').get() as { count: number }).count;
  if (typeCount === 0) {
    const insertType = db.prepare(`
      INSERT INTO container_types (id, name, description, max_weight_kg, max_volume_m3, cost_mad, internal_length_m, internal_width_m, internal_height_m)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertType.run('ct-van-5t', 'Urban Cargo Van (3.5T)', 'Ideal for rapid urban distribution and low-density deliveries', 1200, 9.5, 380, 3.2, 1.7, 1.75);
    insertType.run('ct-truck-10t', 'Rigid Truck (10T)', 'Standard distribution truck for medium intercity freight', 3800, 24.0, 750, 6.2, 2.4, 2.3);
    insertType.run('ct-box-20ft', '20ft Intermodal Container', 'Heavy-capacity maritime and highway freight box', 8500, 33.2, 1400, 5.9, 2.35, 2.39);
    insertType.run('ct-semi-40ft', '40ft High-Cube Semi-Trailer', 'High-volume linehaul trailer for national trunk routes', 18500, 76.4, 2450, 12.0, 2.45, 2.6);
  }

  console.log('Production database initialized with clean state and admin user youssef@truck.com.');
}
