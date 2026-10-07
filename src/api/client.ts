import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  getDocFromServer,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase.ts';
import {
  User,
  Customer,
  Item,
  ContainerType,
  Container,
  Order,
  OptimizationResult,
  OptimizationHistoryRun,
  DashboardData,
  ReportsData,
  OrderItemLine,
} from '../types/index.ts';
import {
  runOptimization as executeAlgorithm,
  OptimizerOrder,
  AvailableContainer,
} from '../services/optimizer.ts';

// Collections in Firestore
const USERS_COL = 'users';
const CUSTOMERS_COL = 'customers';
const ITEMS_COL = 'items';
const CONTAINER_TYPES_COL = 'container_types';
const CONTAINERS_COL = 'containers';
const ORDERS_COL = 'orders';
const RUNS_COL = 'optimization_runs';

// Verification check
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, USERS_COL, 'usr-admin-youssef'));
    return true;
  } catch (err: any) {
    if (err?.message?.includes('the client is offline')) {
      console.warn('Firestore offline warning:', err);
    }
    return false;
  }
}

export const api = {
  // --- AUTHENTICATION ---
  login: async (credentials: { email: string; password: string }): Promise<{ success: boolean; user: User }> => {
    try {
      const trimmedEmail = credentials.email.trim().toLowerCase();
      const trimmedPassword = credentials.password.trim();

      const snap = await getDocs(collection(db, USERS_COL));
      let foundUser: any = null;

      for (const d of snap.docs) {
        const u = d.data();
        if (u.email && u.email.trim().toLowerCase() === trimmedEmail) {
          if (u.password === trimmedPassword) {
            foundUser = { ...u, id: d.id };
            break;
          } else {
            throw new Error('Invalid corporate credentials. Please check your email and password.');
          }
        }
      }

      if (!foundUser) {
        throw new Error('Invalid corporate credentials. Account not found in directory.');
      }

      if (foundUser.status === 'deactivated') {
        throw new Error('Your account is deactivated. Please contact your administrator.');
      }

      const safeUser: User = {
        id: foundUser.id,
        name: foundUser.name || 'Youssef',
        email: foundUser.email,
        role: foundUser.role || 'admin',
        status: foundUser.status || 'active',
        created_at: foundUser.created_at || new Date().toISOString(),
      };

      return { success: true, user: safeUser };
    } catch (err: any) {
      if (err.message && err.message.includes('Invalid corporate credentials')) {
        throw err;
      }
      handleFirestoreError(err, OperationType.GET, USERS_COL);
    }
  },

  // --- USERS ---
  getUsers: async (): Promise<User[]> => {
    try {
      const snap = await getDocs(collection(db, USERS_COL));
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name || '',
          email: data.email || '',
          role: data.role || 'operator',
          status: (data.status as 'active' | 'deactivated') || 'active',
          created_at: data.created_at || '',
        };
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, USERS_COL);
    }
  },

  createUser: async (user: Partial<User & { password?: string }>): Promise<User> => {
    try {
      const id = user.id || `usr-${Date.now()}`;
      const record = {
        id,
        name: user.name || '',
        email: user.email || '',
        password: user.password || '20052005',
        role: user.role || 'operator',
        status: user.status || 'active',
        created_at: new Date().toISOString(),
      };
      await setDoc(doc(db, USERS_COL, id), record);
      return {
        id,
        name: record.name,
        email: record.email,
        role: record.role as 'admin' | 'operator',
        status: record.status as 'active' | 'deactivated',
        created_at: record.created_at,
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, USERS_COL);
    }
  },

  updateUser: async (id: string, user: Partial<User & { password?: string }>): Promise<User> => {
    try {
      const ref = doc(db, USERS_COL, id);
      const updates: any = {};
      if (user.name !== undefined) updates.name = user.name;
      if (user.email !== undefined) updates.email = user.email;
      if (user.role !== undefined) updates.role = user.role;
      if (user.status !== undefined) updates.status = user.status;
      if (user.password !== undefined) updates.password = user.password;
      await updateDoc(ref, updates);
      const snap = await getDoc(ref);
      const data = snap.data() || {};
      return {
        id,
        name: data.name || '',
        email: data.email || '',
        role: data.role || 'operator',
        status: (data.status as 'active' | 'deactivated') || 'active',
        created_at: data.created_at || '',
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${USERS_COL}/${id}`);
    }
  },

  deleteUser: async (id: string): Promise<{ success: boolean }> => {
    try {
      await deleteDoc(doc(db, USERS_COL, id));
      return { success: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${USERS_COL}/${id}`);
    }
  },

  // --- CUSTOMERS ---
  getCustomers: async (): Promise<Customer[]> => {
    try {
      const snap = await getDocs(collection(db, CUSTOMERS_COL));
      return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Customer));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, CUSTOMERS_COL);
    }
  },

  createCustomer: async (c: Partial<Customer>): Promise<Customer> => {
    try {
      const id = c.id || `cust-${Date.now()}`;
      const record: Customer = {
        id,
        company_name: c.company_name || '',
        contact_name: c.contact_name || '',
        email: c.email || '',
        phone: c.phone || '',
        address: c.address || '',
        city: c.city || 'Casablanca',
        priority: c.priority || 'Standard',
        notes: c.notes || '',
        created_at: new Date().toISOString(),
      };
      await setDoc(doc(db, CUSTOMERS_COL, id), record);
      return record;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, CUSTOMERS_COL);
    }
  },

  updateCustomer: async (id: string, c: Partial<Customer>): Promise<Customer> => {
    try {
      const ref = doc(db, CUSTOMERS_COL, id);
      await updateDoc(ref, c as any);
      const snap = await getDoc(ref);
      return { ...snap.data(), id } as Customer;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${CUSTOMERS_COL}/${id}`);
    }
  },

  deleteCustomer: async (id: string): Promise<{ success: boolean }> => {
    try {
      await deleteDoc(doc(db, CUSTOMERS_COL, id));
      return { success: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${CUSTOMERS_COL}/${id}`);
    }
  },

  // --- ITEMS ---
  getItems: async (): Promise<Item[]> => {
    try {
      const snap = await getDocs(collection(db, ITEMS_COL));
      return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Item));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, ITEMS_COL);
    }
  },

  createItem: async (it: Partial<Item>): Promise<Item> => {
    try {
      const id = it.id || `it-${Date.now()}`;
      const record: Item = {
        id,
        sku: it.sku || `SKU-${Date.now().toString().slice(-4)}`,
        name: it.name || '',
        description: it.description || '',
        category: it.category || 'General',
        weight_kg: Number(it.weight_kg || 0),
        volume_m3: Number(it.volume_m3 || 0),
        stock_quantity: Number(it.stock_quantity || 0),
        created_at: new Date().toISOString(),
      };
      await setDoc(doc(db, ITEMS_COL, id), record);
      return record;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, ITEMS_COL);
    }
  },

  updateItem: async (id: string, it: Partial<Item>): Promise<Item> => {
    try {
      const ref = doc(db, ITEMS_COL, id);
      await updateDoc(ref, it as any);
      const snap = await getDoc(ref);
      return { ...snap.data(), id } as Item;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${ITEMS_COL}/${id}`);
    }
  },

  deleteItem: async (id: string): Promise<{ success: boolean }> => {
    try {
      await deleteDoc(doc(db, ITEMS_COL, id));
      return { success: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${ITEMS_COL}/${id}`);
    }
  },

  // --- CONTAINER TYPES ---
  getContainerTypes: async (): Promise<ContainerType[]> => {
    try {
      const snap = await getDocs(collection(db, CONTAINER_TYPES_COL));
      return snap.docs.map((d) => ({ ...d.data(), id: d.id } as ContainerType));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, CONTAINER_TYPES_COL);
    }
  },

  createContainerType: async (ct: Partial<ContainerType>): Promise<ContainerType> => {
    try {
      const id = ct.id || `ct-${Date.now()}`;
      const record: ContainerType = {
        id,
        name: ct.name || '',
        description: ct.description || '',
        max_weight_kg: Number(ct.max_weight_kg || 1000),
        max_volume_m3: Number(ct.max_volume_m3 || 10),
        cost_mad: Number(ct.cost_mad || 500),
        internal_length_m: ct.internal_length_m ? Number(ct.internal_length_m) : undefined,
        internal_width_m: ct.internal_width_m ? Number(ct.internal_width_m) : undefined,
        internal_height_m: ct.internal_height_m ? Number(ct.internal_height_m) : undefined,
      };
      await setDoc(doc(db, CONTAINER_TYPES_COL, id), record);
      return record;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, CONTAINER_TYPES_COL);
    }
  },

  updateContainerType: async (id: string, ct: Partial<ContainerType>): Promise<ContainerType> => {
    try {
      const ref = doc(db, CONTAINER_TYPES_COL, id);
      await updateDoc(ref, ct as any);
      const snap = await getDoc(ref);
      return { ...snap.data(), id } as ContainerType;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${CONTAINER_TYPES_COL}/${id}`);
    }
  },

  deleteContainerType: async (id: string): Promise<{ success: boolean }> => {
    try {
      await deleteDoc(doc(db, CONTAINER_TYPES_COL, id));
      return { success: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${CONTAINER_TYPES_COL}/${id}`);
    }
  },

  // --- CONTAINERS (FLEET) ---
  getContainers: async (): Promise<Container[]> => {
    try {
      const snap = await getDocs(collection(db, CONTAINERS_COL));
      return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Container));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, CONTAINERS_COL);
    }
  },

  createContainer: async (c: Partial<Container>): Promise<Container> => {
    try {
      const id = c.id || `c-${Date.now()}`;
      const record: Container = {
        id,
        code: c.code || `TRK-${Date.now().toString().slice(-4)}`,
        type_id: c.type_id || '',
        type_name: c.type_name || 'Standard Vehicle',
        max_weight_kg: Number(c.max_weight_kg || 1000),
        max_volume_m3: Number(c.max_volume_m3 || 10),
        cost_mad: Number(c.cost_mad || 500),
        status: c.status || 'Available',
        current_location: c.current_location || 'Casablanca Hub',
        created_at: new Date().toISOString(),
      };
      await setDoc(doc(db, CONTAINERS_COL, id), record);
      return record;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, CONTAINERS_COL);
    }
  },

  updateContainer: async (id: string, c: Partial<Container>): Promise<Container> => {
    try {
      const ref = doc(db, CONTAINERS_COL, id);
      await updateDoc(ref, c as any);
      const snap = await getDoc(ref);
      return { ...snap.data(), id } as Container;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${CONTAINERS_COL}/${id}`);
    }
  },

  deleteContainer: async (id: string): Promise<{ success: boolean }> => {
    try {
      await deleteDoc(doc(db, CONTAINERS_COL, id));
      return { success: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${CONTAINERS_COL}/${id}`);
    }
  },

  // --- ORDERS ---
  getOrders: async (params?: { status?: string; date?: string }): Promise<Order[]> => {
    try {
      const snap = await getDocs(collection(db, ORDERS_COL));
      let orders = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Order));
      if (params?.status) {
        orders = orders.filter((o) => o.status === params.status);
      }
      if (params?.date) {
        orders = orders.filter((o) => o.order_date === params.date);
      }
      return orders;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, ORDERS_COL);
    }
  },

  getOrder: async (id: string): Promise<Order> => {
    try {
      const snap = await getDoc(doc(db, ORDERS_COL, id));
      if (!snap.exists()) {
        throw new Error(`Order ${id} not found`);
      }
      return { ...snap.data(), id: snap.id } as Order;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `${ORDERS_COL}/${id}`);
    }
  },

  createOrder: async (payload: {
    customer_id: string;
    priority: string;
    notes?: string;
    items: { item_id: string; quantity: number }[];
  }): Promise<Order> => {
    try {
      const id = `ord-${Date.now()}`;
      const orderNumber = `ORD-${Date.now().toString().slice(-4)}`;

      // Fetch customer
      let customerName = 'Enterprise Client';
      let customerCity = 'Casablanca';
      try {
        const custSnap = await getDoc(doc(db, CUSTOMERS_COL, payload.customer_id));
        if (custSnap.exists()) {
          const custData = custSnap.data() as Customer;
          customerName = custData.company_name;
          customerCity = custData.city;
        }
      } catch (e) {
        console.warn('Customer lookup warning:', e);
      }

      // Fetch all items to compute lines
      const itemsSnap = await getDocs(collection(db, ITEMS_COL));
      const itemsMap = new Map<string, Item>();
      itemsSnap.docs.forEach((d) => itemsMap.set(d.id, d.data() as Item));

      let totalWeight = 0;
      let totalVolume = 0;
      const orderLines: OrderItemLine[] = [];

      for (const reqItem of payload.items) {
        const itemData = itemsMap.get(reqItem.item_id);
        const unitWeight = itemData?.weight_kg || 0;
        const unitVolume = itemData?.volume_m3 || 0;
        const qty = Number(reqItem.quantity) || 1;
        const lineWeight = Math.round(qty * unitWeight * 100) / 100;
        const lineVolume = Math.round(qty * unitVolume * 1000) / 1000;

        totalWeight += lineWeight;
        totalVolume += lineVolume;

        orderLines.push({
          id: `line-${Date.now()}-${reqItem.item_id}`,
          item_id: reqItem.item_id,
          sku: itemData?.sku || 'SKU',
          item_name: itemData?.name || 'Item',
          item_category: itemData?.category || 'General',
          quantity: qty,
          unit_weight_kg: unitWeight,
          unit_volume_m3: unitVolume,
          total_weight_kg: lineWeight,
          total_volume_m3: lineVolume,
        });
      }

      const newOrder: Order = {
        id,
        order_number: orderNumber,
        customer_id: payload.customer_id,
        customer_name: customerName,
        customer_city: customerCity,
        order_date: new Date().toISOString().split('T')[0],
        status: 'Ready',
        priority: (payload.priority as any) || 'Standard',
        notes: payload.notes || '',
        total_weight_kg: Math.round(totalWeight * 100) / 100,
        total_volume_m3: Math.round(totalVolume * 1000) / 1000,
        item_lines_count: orderLines.length,
        total_units_count: orderLines.reduce((acc, l) => acc + l.quantity, 0),
        items: orderLines,
        created_at: new Date().toISOString(),
      };

      await setDoc(doc(db, ORDERS_COL, id), newOrder);
      return newOrder;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, ORDERS_COL);
    }
  },

  updateOrder: async (id: string, payload: Partial<Order>): Promise<Order> => {
    try {
      const ref = doc(db, ORDERS_COL, id);
      await updateDoc(ref, payload as any);
      const snap = await getDoc(ref);
      return { ...snap.data(), id } as Order;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${ORDERS_COL}/${id}`);
    }
  },

  deleteOrder: async (id: string): Promise<{ success: boolean }> => {
    try {
      await deleteDoc(doc(db, ORDERS_COL, id));
      return { success: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${ORDERS_COL}/${id}`);
    }
  },

  // --- OPTIMIZATION ENGINE ---
  runOptimization: async (payload: { orderIds?: string[]; allowSplitting: boolean }): Promise<OptimizationResult> => {
    try {
      const ordersSnap = await getDocs(collection(db, ORDERS_COL));
      let allOrders = ordersSnap.docs.map((d) => ({ ...d.data(), id: d.id } as Order));

      if (payload.orderIds && payload.orderIds.length > 0) {
        allOrders = allOrders.filter((o) => payload.orderIds!.includes(o.id));
      } else {
        allOrders = allOrders.filter((o) => o.status === 'Ready' || o.status === 'Pending');
      }

      const containersSnap = await getDocs(collection(db, CONTAINERS_COL));
      const availableContainers: AvailableContainer[] = containersSnap.docs
        .map((d) => ({ ...d.data(), id: d.id } as Container))
        .filter((c) => c.status === 'Available')
        .map((c) => ({
          id: c.id,
          code: c.code,
          typeId: c.type_id,
          typeName: c.type_name,
          maxWeightKg: c.max_weight_kg,
          maxVolumeM3: c.max_volume_m3,
          costMad: c.cost_mad,
        }));

      const optimizerOrders: OptimizerOrder[] = allOrders.map((o) => {
        const orderItems = (o.items || []).map((it) => ({
          orderId: o.id,
          orderNumber: o.order_number,
          customerId: o.customer_id,
          customerName: o.customer_name,
          priority: o.priority,
          itemId: it.item_id,
          itemSku: it.sku || 'SKU',
          itemName: it.item_name || 'Item',
          quantity: it.quantity,
          unitWeightKg: it.unit_weight_kg,
          unitVolumeM3: it.unit_volume_m3,
          totalWeightKg: it.total_weight_kg,
          totalVolumeM3: it.total_volume_m3,
        }));

        return {
          id: o.id,
          orderNumber: o.order_number,
          customerId: o.customer_id,
          customerName: o.customer_name,
          priority: o.priority,
          totalWeightKg: o.total_weight_kg,
          totalVolumeM3: o.total_volume_m3,
          items: orderItems,
        };
      });

      return executeAlgorithm(optimizerOrders, availableContainers, {
        allowSplitting: payload.allowSplitting,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, ORDERS_COL);
    }
  },

  saveOptimizationPlan: async (plan: any): Promise<{ success: boolean; runId: string; message: string }> => {
    try {
      const runId = plan.runId || `run-${Date.now()}`;
      const record: OptimizationHistoryRun = {
        id: runId,
        run_date: plan.runDate || new Date().toISOString(),
        allow_splitting: plan.allowSplitting ? 1 : 0,
        total_orders_count: plan.totalOrdersCount,
        total_items_count: plan.totalItemsCount,
        total_weight_kg: plan.totalWeightKg,
        total_volume_m3: plan.totalVolumeM3,
        containers_before: plan.containersBefore,
        cost_before_mad: plan.costBeforeMad,
        containers_after: plan.containersAfter,
        cost_after_mad: plan.costAfterMad,
        containers_saved: plan.containersSaved,
        cost_saved_mad: plan.costSavedMad,
        savings_percentage: plan.savingsPercentage,
        status: 'Confirmed',
        created_by_name: plan.userId || 'Logistics Operator',
        allocations: plan.allocations,
      };

      await setDoc(doc(db, RUNS_COL, runId), record);

      // Batch update containers and orders
      const batch = writeBatch(db);

      if (Array.isArray(plan.allocations)) {
        for (const alloc of plan.allocations) {
          if (alloc.containerId) {
            batch.update(doc(db, CONTAINERS_COL, alloc.containerId), { status: 'Allocated' });
          }
          if (Array.isArray(alloc.items)) {
            for (const it of alloc.items) {
              if (it.orderId) {
                batch.update(doc(db, ORDERS_COL, it.orderId), { status: 'Optimized' });
              }
            }
          }
        }
      }

      await batch.commit();
      return { success: true, runId, message: 'Optimization plan successfully saved' };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, RUNS_COL);
    }
  },

  dispatchOptimizationPlan: async (runId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const runRef = doc(db, RUNS_COL, runId);
      const runSnap = await getDoc(runRef);
      if (!runSnap.exists()) {
        throw new Error('Run record not found');
      }

      const runData = runSnap.data() as OptimizationHistoryRun;
      await updateDoc(runRef, { status: 'Dispatched' });

      const batch = writeBatch(db);
      if (Array.isArray(runData.allocations)) {
        for (const alloc of runData.allocations) {
          if (alloc.containerId) {
            batch.update(doc(db, CONTAINERS_COL, alloc.containerId), { status: 'Dispatched' });
          }
          if (Array.isArray(alloc.items)) {
            for (const it of alloc.items) {
              if (it.orderId) {
                batch.update(doc(db, ORDERS_COL, it.orderId), { status: 'Dispatched' });
              }
            }
          }
        }
      }
      await batch.commit();

      return { success: true, message: 'Fleet successfully dispatched and orders updated' };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${RUNS_COL}/${runId}`);
    }
  },

  getOptimizationHistory: async (): Promise<OptimizationHistoryRun[]> => {
    try {
      const snap = await getDocs(collection(db, RUNS_COL));
      const runs = snap.docs.map((d) => ({ ...d.data(), id: d.id } as OptimizationHistoryRun));
      runs.sort((a, b) => new Date(b.run_date).getTime() - new Date(a.run_date).getTime());
      return runs;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, RUNS_COL);
    }
  },

  getOptimizationRun: async (id: string): Promise<OptimizationHistoryRun> => {
    try {
      const snap = await getDoc(doc(db, RUNS_COL, id));
      if (!snap.exists()) {
        throw new Error('Optimization run not found');
      }
      return { ...snap.data(), id: snap.id } as OptimizationHistoryRun;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `${RUNS_COL}/${id}`);
    }
  },

  deleteOptimizationRun: async (id: string): Promise<{ success: boolean }> => {
    try {
      await deleteDoc(doc(db, RUNS_COL, id));
      return { success: true };
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${RUNS_COL}/${id}`);
    }
  },

  // --- DASHBOARD DATA ---
  getDashboard: async (): Promise<DashboardData> => {
    try {
      const [ordersSnap, containersSnap, runsSnap] = await Promise.all([
        getDocs(collection(db, ORDERS_COL)),
        getDocs(collection(db, CONTAINERS_COL)),
        getDocs(collection(db, RUNS_COL)),
      ]);

      const orders = ordersSnap.docs.map((d) => ({ ...d.data(), id: d.id } as Order));
      const containers = containersSnap.docs.map((d) => ({ ...d.data(), id: d.id } as Container));
      const runs = runsSnap.docs.map((d) => ({ ...d.data(), id: d.id } as OptimizationHistoryRun));

      const todayStr = new Date().toISOString().split('T')[0];
      const todayOrders = orders.filter((o) => o.order_date === todayStr).length;

      let totalItems = 0;
      let totalWeightKg = 0;
      let totalVolumeM3 = 0;

      const statusMap = new Map<string, number>();
      const priorityMap = new Map<string, number>();
      const cityMap = new Map<string, { count: number; weight: number }>();

      for (const o of orders) {
        totalWeightKg += o.total_weight_kg || 0;
        totalVolumeM3 += o.total_volume_m3 || 0;
        totalItems += o.total_units_count || (o.items ? o.items.reduce((s, it) => s + it.quantity, 0) : 0);

        statusMap.set(o.status, (statusMap.get(o.status) || 0) + 1);
        priorityMap.set(o.priority, (priorityMap.get(o.priority) || 0) + 1);

        const city = o.customer_city || 'Casablanca';
        const curr = cityMap.get(city) || { count: 0, weight: 0 };
        curr.count += 1;
        curr.weight += o.total_weight_kg || 0;
        cityMap.set(city, curr);
      }

      const availableContainers = containers.filter((c) => c.status === 'Available').length;
      const totalContainers = containers.length;

      // Optimization summary metrics
      let containersBefore = 0;
      let costBeforeMad = 0;
      let containersAfter = 0;
      let costAfterMad = 0;
      let containersSaved = 0;
      let costSavedMad = 0;

      runs.forEach((r) => {
        containersBefore += r.containers_before || 0;
        costBeforeMad += r.cost_before_mad || 0;
        containersAfter += r.containers_after || 0;
        costAfterMad += r.cost_after_mad || 0;
        containersSaved += r.containers_saved || 0;
        costSavedMad += r.cost_saved_mad || 0;
      });

      const savingsPercentage = costBeforeMad > 0 ? Math.round((costSavedMad / costBeforeMad) * 1000) / 10 : 0;

      // Recent orders sorted descending
      const recentOrders = [...orders]
        .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
        .slice(0, 5);

      const latestRun = runs.length > 0
        ? [...runs].sort((a, b) => new Date(b.run_date).getTime() - new Date(a.run_date).getTime())[0]
        : null;

      return {
        todayOrders,
        totalItems,
        totalWeightKg: Math.round(totalWeightKg * 10) / 10,
        totalVolumeM3: Math.round(totalVolumeM3 * 100) / 100,
        availableContainers,
        totalContainers,
        containersBefore,
        costBeforeMad,
        containersAfter,
        costAfterMad,
        containersSaved,
        costSavedMad,
        savingsPercentage,
        statusCounts: Array.from(statusMap.entries()).map(([status, count]) => ({ status, count })),
        priorityCounts: Array.from(priorityMap.entries()).map(([priority, count]) => ({ priority, count })),
        cityBreakdown: Array.from(cityMap.entries()).map(([city, data]) => ({
          city,
          order_count: data.count,
          total_weight: Math.round(data.weight * 10) / 10,
        })),
        recentOrders,
        hasRecentOptimization: runs.length > 0,
        latestRunId: latestRun ? latestRun.id : null,
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'dashboard');
    }
  },

  // --- REPORTS DATA ---
  getReports: async (params?: { period?: string; customerId?: string; containerTypeId?: string }): Promise<ReportsData> => {
    try {
      const [runsSnap, ordersSnap, cTypesSnap] = await Promise.all([
        getDocs(collection(db, RUNS_COL)),
        getDocs(collection(db, ORDERS_COL)),
        getDocs(collection(db, CONTAINER_TYPES_COL)),
      ]);

      const runs = runsSnap.docs.map((d) => ({ ...d.data(), id: d.id } as OptimizationHistoryRun));
      const orders = ordersSnap.docs.map((d) => ({ ...d.data(), id: d.id } as Order));
      const types = cTypesSnap.docs.map((d) => ({ ...d.data(), id: d.id } as ContainerType));

      let totalRuns = runs.length;
      let totalOrders = orders.length;
      let totalWeightKg = 0;
      let totalVolumeM3 = 0;
      let totalSavedMad = 0;
      let totalCostMad = 0;

      for (const r of runs) {
        totalSavedMad += r.cost_saved_mad || 0;
        totalCostMad += r.cost_after_mad || 0;
        totalWeightKg += r.total_weight_kg || 0;
        totalVolumeM3 += r.total_volume_m3 || 0;
      }

      const totalCostBefore = totalCostMad + totalSavedMad;
      const avgSavingsPct = totalCostBefore > 0 ? Math.round((totalSavedMad / totalCostBefore) * 1000) / 10 : 0;

      // Extract utilization stats from allocations
      let totalWUtil = 0;
      let totalVUtil = 0;
      let allocCount = 0;

      const typeStatMap = new Map<string, { used: number; spent: number; wUtilSum: number; vUtilSum: number }>();
      types.forEach((t) => typeStatMap.set(t.name, { used: 0, spent: 0, wUtilSum: 0, vUtilSum: 0 }));

      for (const r of runs) {
        if (Array.isArray(r.allocations)) {
          for (const a of r.allocations) {
            allocCount++;
            totalWUtil += a.weightUtilizationPct || 0;
            totalVUtil += a.volumeUtilizationPct || 0;

            const tName = a.containerTypeName || 'Standard Vehicle';
            const curr = typeStatMap.get(tName) || { used: 0, spent: 0, wUtilSum: 0, vUtilSum: 0 };
            curr.used += 1;
            curr.spent += a.costMad || 0;
            curr.wUtilSum += a.weightUtilizationPct || 0;
            curr.vUtilSum += a.volumeUtilizationPct || 0;
            typeStatMap.set(tName, curr);
          }
        }
      }

      const avgWeightUtil = allocCount > 0 ? Math.round((totalWUtil / allocCount) * 10) / 10 : 0;
      const avgVolUtil = allocCount > 0 ? Math.round((totalVUtil / allocCount) * 10) / 10 : 0;

      const typeStats = Array.from(typeStatMap.entries()).map(([name, stat]) => ({
        container_type_name: name,
        total_used: stat.used,
        avg_weight_util: stat.used > 0 ? Math.round((stat.wUtilSum / stat.used) * 10) / 10 : 0,
        avg_vol_util: stat.used > 0 ? Math.round((stat.vUtilSum / stat.used) * 10) / 10 : 0,
        total_spent: stat.spent,
      }));

      return {
        totalRuns,
        totalOrders,
        totalWeightKg: Math.round(totalWeightKg * 10) / 10,
        totalVolumeM3: Math.round(totalVolumeM3 * 100) / 100,
        totalSavedMad,
        totalCostMad,
        avgSavingsPct,
        avgWeightUtil,
        avgVolUtil,
        typeStats,
        runsHistory: runs,
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'reports');
    }
  },
};
