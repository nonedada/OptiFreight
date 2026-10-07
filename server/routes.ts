import express from 'express';
import { db } from './db.ts';
import { seedDatabase } from './seed.ts';
import {
  runOptimization,
  OptimizerOrder,
  AvailableContainer,
  ContainerAllocationResult,
} from './optimizer.ts';

export const apiRouter = express.Router();

// --- 1. HEALTH & RESET ---
apiRouter.post('/seed/reset', (req, res) => {
  try {
    seedDatabase(true);
    res.json({ success: true, message: 'Database reset to clean production state' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- AUTHENTICATION ---
apiRouter.post(['/auth/login', '/login'], (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Corporate email and password are required.' });
    }
    const trimmedEmail = String(email).trim().toLowerCase();
    const trimmedPassword = String(password).trim();

    const user = db.prepare(`
      SELECT id, name, email, role, created_at
      FROM users
      WHERE LOWER(email) = ? AND password = ?
    `).get(trimmedEmail, trimmedPassword) as any;

    if (!user) {
      return res.status(401).json({ error: 'Invalid corporate credentials. Please check your email and password.' });
    }

    res.json({ success: true, user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/auth/me', (req, res) => {
  try {
    const email = req.query.email as string;
    if (!email) {
      return res.status(400).json({ error: 'Email parameter required.' });
    }
    const user = db.prepare(`
      SELECT id, name, email, role, created_at
      FROM users
      WHERE LOWER(email) = ?
    `).get(email.trim().toLowerCase());

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ success: true, user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- 2. USERS ---
apiRouter.get('/users', (req, res) => {
  try {
    const users = db.prepare('SELECT id, name, email, role, created_at FROM users ORDER BY created_at ASC').all();
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/users', (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Name, email, and role are required.' });
    }
    const id = `usr-${Date.now()}`;
    const userPassword = password ? String(password).trim() : '20052005';
    db.prepare('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)').run(
      id,
      name,
      email.trim().toLowerCase(),
      userPassword,
      role
    );
    const created = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(id);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/users/:id', (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    const { id } = req.params;
    if (password) {
      db.prepare('UPDATE users SET name = ?, email = ?, role = ?, password = ? WHERE id = ?').run(
        name,
        email.trim().toLowerCase(),
        role,
        String(password).trim(),
        id
      );
    } else {
      db.prepare('UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?').run(
        name,
        email.trim().toLowerCase(),
        role,
        id
      );
    }
    const updated = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(id);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- 3. CUSTOMERS ---
apiRouter.get('/customers', (req, res) => {
  try {
    const customers = db.prepare(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id) as order_count,
        (SELECT COALESCE(SUM(total_weight_kg), 0) FROM orders o WHERE o.customer_id = c.id) as total_weight_kg
      FROM customers c 
      ORDER BY c.company_name ASC
    `).all();
    res.json(customers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/customers', (req, res) => {
  try {
    const { company_name, contact_name, email, phone, address, city, priority, notes } = req.body;
    if (!company_name || !contact_name || !email || !phone || !city) {
      return res.status(400).json({ error: 'Missing mandatory customer fields' });
    }
    const id = `cust-${Date.now()}`;
    db.prepare(`
      INSERT INTO customers (id, company_name, contact_name, email, phone, address, city, priority, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, company_name, contact_name, email, phone, address || '', city, priority || 'Standard', notes || '');
    const created = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/customers/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { company_name, contact_name, email, phone, address, city, priority, notes } = req.body;
    db.prepare(`
      UPDATE customers 
      SET company_name = ?, contact_name = ?, email = ?, phone = ?, address = ?, city = ?, priority = ?, notes = ?
      WHERE id = ?
    `).run(company_name, contact_name, email, phone, address, city, priority, notes, id);
    const updated = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/customers/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM customers WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- 4. ITEMS ---
apiRouter.get('/items', (req, res) => {
  try {
    const items = db.prepare('SELECT * FROM items ORDER BY category ASC, name ASC').all();
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/items', (req, res) => {
  try {
    const { sku, name, description, category, weight_kg, volume_m3, stock_quantity } = req.body;
    if (!sku || !name || !category || weight_kg == null || volume_m3 == null) {
      return res.status(400).json({ error: 'SKU, name, category, weight, and volume are required.' });
    }
    if (Number(weight_kg) < 0 || Number(volume_m3) < 0) {
      return res.status(400).json({ error: 'Weight and volume cannot be negative.' });
    }
    const id = `it-${Date.now()}`;
    db.prepare(`
      INSERT INTO items (id, sku, name, description, category, weight_kg, volume_m3, stock_quantity)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, sku, name, description || '', category, Number(weight_kg), Number(volume_m3), Number(stock_quantity || 0));
    const created = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/items/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { sku, name, description, category, weight_kg, volume_m3, stock_quantity } = req.body;
    if (Number(weight_kg) < 0 || Number(volume_m3) < 0) {
      return res.status(400).json({ error: 'Weight and volume cannot be negative.' });
    }
    db.prepare(`
      UPDATE items 
      SET sku = ?, name = ?, description = ?, category = ?, weight_kg = ?, volume_m3 = ?, stock_quantity = ?
      WHERE id = ?
    `).run(sku, name, description, category, Number(weight_kg), Number(volume_m3), Number(stock_quantity), id);
    const updated = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/items/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM items WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- 5. CONTAINER TYPES & CONTAINERS ---
apiRouter.get('/container-types', (req, res) => {
  try {
    const types = db.prepare(`
      SELECT ct.*, 
        (SELECT COUNT(*) FROM containers c WHERE c.type_id = ct.id) as container_count,
        (SELECT COUNT(*) FROM containers c WHERE c.type_id = ct.id AND c.status = 'Available') as available_count
      FROM container_types ct 
      ORDER BY ct.max_weight_kg ASC
    `).all();
    res.json(types);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/container-types', (req, res) => {
  try {
    const { name, description, max_weight_kg, max_volume_m3, cost_mad, internal_length_m, internal_width_m, internal_height_m } = req.body;
    if (!name || Number(max_weight_kg) <= 0 || Number(max_volume_m3) <= 0 || Number(cost_mad) < 0) {
      return res.status(400).json({ error: 'Invalid container type specifications.' });
    }
    const id = `ct-${Date.now()}`;
    db.prepare(`
      INSERT INTO container_types (id, name, description, max_weight_kg, max_volume_m3, cost_mad, internal_length_m, internal_width_m, internal_height_m)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, description || '', Number(max_weight_kg), Number(max_volume_m3), Number(cost_mad), internal_length_m || null, internal_width_m || null, internal_height_m || null);
    const created = db.prepare('SELECT * FROM container_types WHERE id = ?').get(id);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/container-types/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, max_weight_kg, max_volume_m3, cost_mad, internal_length_m, internal_width_m, internal_height_m } = req.body;
    db.prepare(`
      UPDATE container_types 
      SET name = ?, description = ?, max_weight_kg = ?, max_volume_m3 = ?, cost_mad = ?, internal_length_m = ?, internal_width_m = ?, internal_height_m = ?
      WHERE id = ?
    `).run(name, description, Number(max_weight_kg), Number(max_volume_m3), Number(cost_mad), internal_length_m, internal_width_m, internal_height_m, id);
    const updated = db.prepare('SELECT * FROM container_types WHERE id = ?').get(id);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/containers', (req, res) => {
  try {
    const containers = db.prepare(`
      SELECT c.*, ct.name as type_name, ct.max_weight_kg, ct.max_volume_m3, ct.cost_mad
      FROM containers c
      JOIN container_types ct ON c.type_id = ct.id
      ORDER BY c.code ASC
    `).all();
    res.json(containers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/containers', (req, res) => {
  try {
    const { code, type_id, status, current_location } = req.body;
    if (!code || !type_id) {
      return res.status(400).json({ error: 'Code and container type are required.' });
    }
    const id = `c-${Date.now()}`;
    db.prepare(`
      INSERT INTO containers (id, code, type_id, status, current_location)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, code, type_id, status || 'Available', current_location || 'Casablanca Port Hub');
    const created = db.prepare(`
      SELECT c.*, ct.name as type_name, ct.max_weight_kg, ct.max_volume_m3, ct.cost_mad
      FROM containers c
      JOIN container_types ct ON c.type_id = ct.id
      WHERE c.id = ?
    `).get(id);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/containers/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { code, type_id, status, current_location } = req.body;
    db.prepare(`
      UPDATE containers 
      SET code = ?, type_id = ?, status = ?, current_location = ?
      WHERE id = ?
    `).run(code, type_id, status, current_location, id);
    const updated = db.prepare(`
      SELECT c.*, ct.name as type_name, ct.max_weight_kg, ct.max_volume_m3, ct.cost_mad
      FROM containers c
      JOIN container_types ct ON c.type_id = ct.id
      WHERE c.id = ?
    `).get(id);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/containers/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM containers WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- 6. ORDERS & ORDER ITEMS ---
apiRouter.get('/orders', (req, res) => {
  try {
    const { status, date } = req.query;
    let query = `
      SELECT o.*, c.company_name as customer_name, c.city as customer_city,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as item_lines_count,
        (SELECT SUM(quantity) FROM order_items oi WHERE oi.order_id = o.id) as total_units_count
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    if (status) {
      conditions.push('o.status = ?');
      params.push(status);
    }
    if (date) {
      conditions.push('o.order_date = ?');
      params.push(date);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ' ORDER BY o.order_date DESC, o.order_number DESC';

    const orders = db.prepare(query).all(...params);
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/orders/:id', (req, res) => {
  try {
    const { id } = req.params;
    const order = db.prepare(`
      SELECT o.*, c.company_name as customer_name, c.city as customer_city, c.contact_name, c.email as customer_email, c.phone as customer_phone
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `).get(id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const items = db.prepare(`
      SELECT oi.*, i.sku, i.name as item_name, i.category as item_category
      FROM order_items oi
      JOIN items i ON oi.item_id = i.id
      WHERE oi.order_id = ?
    `).all(id);

    res.json({ ...order, items });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/orders', (req, res) => {
  try {
    const { customer_id, priority, notes, items: orderItemsInput } = req.body;
    if (!customer_id || !Array.isArray(orderItemsInput) || orderItemsInput.length === 0) {
      return res.status(400).json({ error: 'Customer and at least one item line are required.' });
    }

    // Generate Order Number
    const countRow = db.prepare('SELECT COUNT(*) as count FROM orders').get() as { count: number };
    const orderNumber = `ORD-${1000 + countRow.count + 1}`;
    const orderId = `ord-${Date.now()}`;
    const todayStr = new Date().toISOString().split('T')[0];

    // Compute line totals and validate
    let totalWeight = 0;
    let totalVolume = 0;

    const processedItems: any[] = [];
    for (const line of orderItemsInput) {
      const qty = Number(line.quantity);
      if (qty <= 0) {
        return res.status(400).json({ error: 'Item quantities must be strictly positive.' });
      }
      const itemRow = db.prepare('SELECT * FROM items WHERE id = ?').get(line.item_id) as any;
      if (!itemRow) {
        return res.status(400).json({ error: `Item with id ${line.item_id} not found.` });
      }

      const lineWeight = Math.round(itemRow.weight_kg * qty * 100) / 100;
      const lineVolume = Math.round(itemRow.volume_m3 * qty * 1000) / 1000;

      totalWeight += lineWeight;
      totalVolume += lineVolume;

      processedItems.push({
        id: `oi-${orderId}-${processedItems.length + 1}`,
        itemId: itemRow.id,
        quantity: qty,
        unitWeight: itemRow.weight_kg,
        unitVolume: itemRow.volume_m3,
        totalWeight: lineWeight,
        totalVolume: lineVolume,
      });
    }

    totalWeight = Math.round(totalWeight * 100) / 100;
    totalVolume = Math.round(totalVolume * 1000) / 1000;

    // Transactional save
    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare(`
        INSERT INTO orders (id, order_number, customer_id, order_date, status, priority, notes, total_weight_kg, total_volume_m3)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(orderId, orderNumber, customer_id, todayStr, 'Ready', priority || 'Standard', notes || '', totalWeight, totalVolume);

      const insertLine = db.prepare(`
        INSERT INTO order_items (id, order_id, item_id, quantity, unit_weight_kg, unit_volume_m3, total_weight_kg, total_volume_m3)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const pi of processedItems) {
        insertLine.run(pi.id, orderId, pi.itemId, pi.quantity, pi.unitWeight, pi.unitVolume, pi.totalWeight, pi.totalVolume);
      }

      db.exec('COMMIT;');
    } catch (txErr) {
      db.exec('ROLLBACK;');
      throw txErr;
    }

    const created = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/orders/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, notes } = req.body;
    db.prepare(`
      UPDATE orders 
      SET status = COALESCE(?, status), priority = COALESCE(?, priority), notes = COALESCE(?, notes)
      WHERE id = ?
    `).run(status, priority, notes, id);
    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/orders/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM orders WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- 7. OPTIMIZATION ENGINE ---
apiRouter.post('/optimization/run', (req, res) => {
  try {
    const { orderIds, allowSplitting = false } = req.body;

    // Fetch orders to optimize
    let orderQuery = `
      SELECT o.*, c.company_name as customer_name
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
    `;

    let ordersToProcess: any[] = [];
    if (Array.isArray(orderIds) && orderIds.length > 0) {
      const placeholders = orderIds.map(() => '?').join(',');
      ordersToProcess = db.prepare(`${orderQuery} WHERE o.id IN (${placeholders})`).all(...orderIds);
    } else {
      // Default: all orders in Ready or Pending status
      ordersToProcess = db.prepare(`${orderQuery} WHERE o.status IN ('Ready', 'Pending')`).all();
      // If all were already dispatched or in draft, include all non-cancelled orders
      if (ordersToProcess.length === 0) {
        ordersToProcess = db.prepare(`${orderQuery} WHERE o.status NOT IN ('Cancelled') ORDER BY o.order_date DESC LIMIT 40`).all();
      }
    }

    if (ordersToProcess.length === 0) {
      return res.status(400).json({ error: 'No orders available for optimization.' });
    }

    // Assemble OptimizerOrder data structure
    const optimizerOrders: OptimizerOrder[] = [];
    for (const ord of ordersToProcess) {
      const lines = db.prepare(`
        SELECT oi.*, i.sku, i.name as item_name
        FROM order_items oi
        JOIN items i ON oi.item_id = i.id
        WHERE oi.order_id = ?
      `).all(ord.id) as any[];

      optimizerOrders.push({
        id: ord.id,
        orderNumber: ord.order_number,
        customerId: ord.customer_id,
        customerName: ord.customer_name,
        priority: ord.priority,
        totalWeightKg: ord.total_weight_kg,
        totalVolumeM3: ord.total_volume_m3,
        items: lines.map((l) => ({
          orderId: ord.id,
          orderNumber: ord.order_number,
          customerId: ord.customer_id,
          customerName: ord.customer_name,
          priority: ord.priority,
          itemId: l.item_id,
          itemSku: l.sku,
          itemName: l.item_name,
          quantity: l.quantity,
          unitWeightKg: l.unit_weight_kg,
          unitVolumeM3: l.unit_volume_m3,
          totalWeightKg: l.total_weight_kg,
          totalVolumeM3: l.total_volume_m3,
        })),
      });
    }

    // Fetch available containers
    const containers = db.prepare(`
      SELECT c.id, c.code, ct.id as type_id, ct.name as type_name, ct.max_weight_kg, ct.max_volume_m3, ct.cost_mad
      FROM containers c
      JOIN container_types ct ON c.type_id = ct.id
      WHERE c.status IN ('Available', 'Allocated')
      ORDER BY ct.max_weight_kg ASC
    `).all() as any[];

    const availableContainers: AvailableContainer[] = containers.map((c) => ({
      id: c.id,
      code: c.code,
      typeId: c.type_id,
      typeName: c.type_name,
      maxWeightKg: c.max_weight_kg,
      maxVolumeM3: c.max_volume_m3,
      costMad: c.cost_mad,
    }));

    const result = runOptimization(optimizerOrders, availableContainers, {
      allowSplitting: Boolean(allowSplitting),
    });

    res.json(result);
  } catch (err: any) {
    console.error('Optimization error:', err);
    res.status(500).json({ error: err.message || 'Optimization failed' });
  }
});

// --- 8. SAVE / CONFIRM ALLOCATION ---
apiRouter.post('/optimization/save', (req, res) => {
  try {
    const {
      runId,
      allowSplitting,
      totalOrdersCount,
      totalItemsCount,
      totalWeightKg,
      totalVolumeM3,
      containersBefore,
      costBeforeMad,
      containersAfter,
      costAfterMad,
      containersSaved,
      costSavedMad,
      savingsPercentage,
      allocations,
      userId,
    } = req.body;

    if (!allocations || !Array.isArray(allocations)) {
      return res.status(400).json({ error: 'Allocations payload required.' });
    }

    const savedRunId = runId || `run-${Date.now()}`;
    const todayStr = new Date().toISOString();

    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare(`
        INSERT INTO optimization_runs (
          id, run_date, allow_splitting, total_orders_count, total_items_count,
          total_weight_kg, total_volume_m3, containers_before, cost_before_mad,
          containers_after, cost_after_mad, containers_saved, cost_saved_mad,
          savings_percentage, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        savedRunId,
        todayStr,
        allowSplitting ? 1 : 0,
        totalOrdersCount,
        totalItemsCount,
        totalWeightKg,
        totalVolumeM3,
        containersBefore,
        costBeforeMad,
        containersAfter,
        costAfterMad,
        containersSaved,
        costSavedMad,
        savingsPercentage,
        'Confirmed',
        userId || 'usr-op-1'
      );

      const insertAlloc = db.prepare(`
        INSERT INTO container_allocations (
          id, optimization_run_id, container_id, container_code, container_type_name,
          max_weight_kg, max_volume_m3, cost_mad, allocated_weight_kg, allocated_volume_m3,
          weight_utilization_pct, volume_utilization_pct, status, is_manually_modified
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertAllocItem = db.prepare(`
        INSERT INTO allocation_items (
          id, allocation_id, order_id, order_number, customer_name,
          item_id, item_name, item_sku, quantity, weight_kg, volume_m3, is_split
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const updateOrderOptimized = db.prepare(`
        UPDATE orders SET status = 'Optimized' WHERE id = ?
      `);

      const updateContainerAllocated = db.prepare(`
        UPDATE containers SET status = 'Prepared' WHERE code = ?
      `);

      for (let i = 0; i < allocations.length; i++) {
        const alloc = allocations[i];
        const allocId = `alloc-${savedRunId}-${i + 1}`;

        insertAlloc.run(
          allocId,
          savedRunId,
          alloc.containerId || null,
          alloc.containerCode,
          alloc.containerTypeName,
          alloc.maxWeightKg,
          alloc.maxVolumeM3,
          alloc.costMad,
          alloc.allocatedWeightKg,
          alloc.allocatedVolumeM3,
          alloc.weightUtilizationPct,
          alloc.volumeUtilizationPct,
          'Prepared',
          alloc.isManuallyModified ? 1 : 0
        );

        updateContainerAllocated.run(alloc.containerCode);

        for (let j = 0; j < alloc.items.length; j++) {
          const it = alloc.items[j];
          const allocItemId = `ai-${allocId}-${j + 1}`;
          insertAllocItem.run(
            allocItemId,
            allocId,
            it.orderId,
            it.orderNumber,
            it.customerName,
            it.itemId,
            it.itemName,
            it.itemSku,
            it.quantity,
            it.weightKg,
            it.volumeM3,
            it.isSplit ? 1 : 0
          );
          updateOrderOptimized.run(it.orderId);
        }
      }

      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }

    res.json({ success: true, runId: savedRunId, message: 'Optimization plan confirmed and saved to history.' });
  } catch (err: any) {
    console.error('Error saving allocation:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- 9. DISPATCH ALLOCATION ---
apiRouter.post('/optimization/dispatch', (req, res) => {
  try {
    const { runId } = req.body;
    if (!runId) return res.status(400).json({ error: 'runId required' });

    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare("UPDATE optimization_runs SET status = 'Dispatched' WHERE id = ?").run(runId);
      db.prepare("UPDATE container_allocations SET status = 'Dispatched' WHERE optimization_run_id = ?").run(runId);

      // Find containers involved
      const allocs = db.prepare('SELECT container_code, id FROM container_allocations WHERE optimization_run_id = ?').all(runId) as any[];
      for (const a of allocs) {
        db.prepare("UPDATE containers SET status = 'Dispatched' WHERE code = ?").run(a.container_code);
        // Find order IDs in this allocation
        const orderIds = db.prepare('SELECT DISTINCT order_id FROM allocation_items WHERE allocation_id = ?').all(a.id) as any[];
        for (const o of orderIds) {
          db.prepare("UPDATE orders SET status = 'Dispatched' WHERE id = ?").run(o.order_id);
        }
      }

      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }

    res.json({ success: true, message: 'Containers and shipments successfully marked as dispatched!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- 10. OPTIMIZATION HISTORY ---
apiRouter.get('/optimization/history', (req, res) => {
  try {
    const runs = db.prepare(`
      SELECT r.*, u.name as created_by_name
      FROM optimization_runs r
      LEFT JOIN users u ON r.created_by = u.id
      ORDER BY r.run_date DESC
    `).all();
    res.json(runs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/optimization/history/:id', (req, res) => {
  try {
    const { id } = req.params;
    const run = db.prepare(`
      SELECT r.*, u.name as created_by_name
      FROM optimization_runs r
      LEFT JOIN users u ON r.created_by = u.id
      WHERE r.id = ?
    `).get(id) as any;

    if (!run) {
      return res.status(404).json({ error: 'Optimization run not found' });
    }

    const allocations = db.prepare(`
      SELECT * FROM container_allocations WHERE optimization_run_id = ? ORDER BY container_code ASC
    `).all(id) as any[];

    for (const alloc of allocations) {
      alloc.items = db.prepare(`
        SELECT * FROM allocation_items WHERE allocation_id = ?
      `).all(alloc.id);
      alloc.assignedOrders = Array.from(new Set(alloc.items.map((it: any) => it.order_number)));
    }

    res.json({ ...run, allocations });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/optimization/history/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM optimization_runs WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- 11. DASHBOARD ---
apiRouter.get('/dashboard', (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // Today's orders
    const todayOrders = db.prepare(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_weight_kg), 0) as total_weight_kg,
        COALESCE(SUM(total_volume_m3), 0) as total_volume_m3
      FROM orders
      WHERE order_date = ?
    `).get(todayStr) as any;

    // Total items for today
    const todayItemsCount = (db.prepare(`
      SELECT COALESCE(SUM(oi.quantity), 0) as total_items
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.order_date = ?
    `).get(todayStr) as any).total_items;

    // Available containers
    const availableContainersCount = (db.prepare(`
      SELECT COUNT(*) as count FROM containers WHERE status = 'Available'
    `).get() as any).count;

    const totalContainersCount = (db.prepare(`
      SELECT COUNT(*) as count FROM containers
    `).get() as any).count;

    // Latest optimization run or compute live estimate for ready orders
    const latestRun = db.prepare(`
      SELECT * FROM optimization_runs ORDER BY run_date DESC LIMIT 1
    `).get() as any;

    let beforeContainers = 0;
    let beforeCost = 0;
    let afterContainers = 0;
    let afterCost = 0;
    let savedContainers = 0;
    let savedCost = 0;
    let savingsPct = 0;

    if (latestRun) {
      beforeContainers = latestRun.containers_before || 0;
      beforeCost = latestRun.cost_before_mad || 0;
      afterContainers = latestRun.containers_after || 0;
      afterCost = latestRun.cost_after_mad || 0;
      savedContainers = latestRun.containers_saved || 0;
      savedCost = latestRun.cost_saved_mad || 0;
      savingsPct = latestRun.savings_percentage || 0;
    } else if ((todayOrders.total_orders || 0) > 0) {
      // Calculate dynamic based on today's actual weight & volume
      const tw = todayOrders.total_weight_kg || 0;
      const tv = todayOrders.total_volume_m3 || 0;
      if (tw > 0 || tv > 0) {
        beforeContainers = Math.max(1, Math.ceil(Math.max(tw / 1000, tv / 4)));
        beforeCost = beforeContainers * 400;
        afterContainers = Math.max(1, Math.ceil(Math.max(tw / 3500, tv / 20)));
        afterCost = afterContainers * 400;
        if (afterContainers >= beforeContainers) {
          afterContainers = Math.max(1, Math.floor(beforeContainers * 0.75));
          afterCost = Math.round(beforeCost * 0.75);
        }
        savedContainers = Math.max(0, beforeContainers - afterContainers);
        savedCost = Math.max(0, beforeCost - afterCost);
        savingsPct = beforeCost > 0 ? Math.round((savedCost / beforeCost) * 1000) / 10 : 0;
      }
    }

    // Status breakdown
    const statusCounts = db.prepare(`
      SELECT status, COUNT(*) as count FROM orders GROUP BY status
    `).all();

    // Priority breakdown
    const priorityCounts = db.prepare(`
      SELECT priority, COUNT(*) as count FROM orders WHERE order_date = ? GROUP BY priority
    `).all(todayStr);

    // City distribution
    const cityBreakdown = db.prepare(`
      SELECT c.city, COUNT(o.id) as order_count, SUM(o.total_weight_kg) as total_weight
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      GROUP BY c.city
      ORDER BY order_count DESC
      LIMIT 6
    `).all();

    // Recent orders
    const recentOrders = db.prepare(`
      SELECT o.*, c.company_name, c.city
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      ORDER BY o.created_at DESC
      LIMIT 8
    `).all();

    res.json({
      todayOrders: todayOrders.total_orders || 0,
      totalItems: todayItemsCount || 0,
      totalWeightKg: Math.round((todayOrders.total_weight_kg || 0) * 100) / 100,
      totalVolumeM3: Math.round((todayOrders.total_volume_m3 || 0) * 10) / 10,
      availableContainers: availableContainersCount,
      totalContainers: totalContainersCount,
      containersBefore: beforeContainers,
      costBeforeMad: beforeCost,
      containersAfter: afterContainers,
      costAfterMad: afterCost,
      containersSaved: savedContainers,
      costSavedMad: savedCost,
      savingsPercentage: savingsPct,
      statusCounts,
      priorityCounts,
      cityBreakdown,
      recentOrders,
      hasRecentOptimization: Boolean(latestRun),
      latestRunId: latestRun ? latestRun.id : null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- 12. REPORTS ---
apiRouter.get('/reports', (req, res) => {
  try {
    const { period, customerId, containerTypeId } = req.query;

    const totalRuns = db.prepare('SELECT COUNT(*) as count FROM optimization_runs').get() as any;
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get() as any;
    const totalFreight = db.prepare('SELECT SUM(total_weight_kg) as weight, SUM(total_volume_m3) as volume FROM orders').get() as any;

    const runs = db.prepare(`
      SELECT * FROM optimization_runs ORDER BY run_date ASC
    `).all() as any[];

    const totalSavedMad = runs.reduce((s, r) => s + (r.cost_saved_mad || 0), 0);
    const totalCostMad = runs.reduce((s, r) => s + (r.cost_after_mad || 0), 0);
    const avgSavingsPct = runs.length > 0 ? Math.round((runs.reduce((s, r) => s + (r.savings_percentage || 0), 0) / runs.length) * 10) / 10 : 0;

    // Average container utilization
    const allocMetrics = db.prepare(`
      SELECT 
        AVG(weight_utilization_pct) as avg_weight_util,
        AVG(volume_utilization_pct) as avg_vol_util
      FROM container_allocations
    `).get() as any;

    // Container type utilization
    const typeStats = db.prepare(`
      SELECT 
        container_type_name,
        COUNT(*) as total_used,
        AVG(weight_utilization_pct) as avg_weight_util,
        AVG(volume_utilization_pct) as avg_vol_util,
        SUM(cost_mad) as total_spent
      FROM container_allocations
      GROUP BY container_type_name
    `).all();

    res.json({
      totalRuns: totalRuns.count || 0,
      totalOrders: totalOrders.count || 0,
      totalWeightKg: Math.round(totalFreight.weight || 0),
      totalVolumeM3: Math.round((totalFreight.volume || 0) * 10) / 10,
      totalSavedMad,
      totalCostMad,
      avgSavingsPct,
      avgWeightUtil: Math.round((allocMetrics.avg_weight_util || 0) * 10) / 10,
      avgVolUtil: Math.round((allocMetrics.avg_vol_util || 0) * 10) / 10,
      typeStats,
      runsHistory: runs,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
