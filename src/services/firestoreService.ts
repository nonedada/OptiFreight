import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase.ts';
import {
  Customer,
  Item,
  Container,
  ContainerType,
  Order,
  OptimizationHistoryRun,
  OptimizationResult,
  User,
} from '../types/index.ts';

// Collections constants
const USERS_COL = 'users';
const CUSTOMERS_COL = 'customers';
const ITEMS_COL = 'items';
const CONTAINER_TYPES_COL = 'container_types';
const CONTAINERS_COL = 'containers';
const ORDERS_COL = 'orders';
const RUNS_COL = 'optimization_runs';

export const firestoreService = {
  // 1. Check & Seed Firestore if empty
  async initializeAndSeed(seedData: {
    users: User[];
    customers: Customer[];
    items: Item[];
    containerTypes: ContainerType[];
    containers: Container[];
    orders: Order[];
  }): Promise<boolean> {
    try {
      const snap = await getDocs(collection(db, ITEMS_COL));
      if (!snap.empty) {
        return false; // Already populated
      }

      console.log('Seeding initial data directly into Firestore...');
      const batch = writeBatch(db);

      // Seed Users
      for (const u of seedData.users) {
        const ref = doc(db, USERS_COL, u.id);
        batch.set(ref, u);
      }

      // Seed Customers
      for (const c of seedData.customers) {
        const ref = doc(db, CUSTOMERS_COL, c.id);
        batch.set(ref, c);
      }

      // Seed Items
      for (const it of seedData.items) {
        const ref = doc(db, ITEMS_COL, it.id);
        batch.set(ref, it);
      }

      // Seed Container Types
      for (const ct of seedData.containerTypes) {
        const ref = doc(db, CONTAINER_TYPES_COL, ct.id);
        batch.set(ref, ct);
      }

      // Seed Containers
      for (const c of seedData.containers) {
        const ref = doc(db, CONTAINERS_COL, c.id);
        batch.set(ref, c);
      }

      // Seed Orders
      for (const ord of seedData.orders) {
        const ref = doc(db, ORDERS_COL, ord.id);
        batch.set(ref, ord);
      }

      await batch.commit();
      console.log('Firestore seed completed successfully.');
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'seed');
    }
  },

  // 2. Users
  async getUsers(): Promise<User[]> {
    try {
      const snap = await getDocs(collection(db, USERS_COL));
      return snap.docs.map((d) => d.data() as User);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, USERS_COL);
    }
  },

  async createUser(user: Partial<User>): Promise<User> {
    try {
      const id = user.id || `usr-${Date.now()}`;
      const fullUser: User = {
        id,
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'operator',
        created_at: new Date().toISOString(),
      };
      await setDoc(doc(db, USERS_COL, id), fullUser);
      return fullUser;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, USERS_COL);
    }
  },

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    try {
      await updateDoc(doc(db, USERS_COL, id), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${USERS_COL}/${id}`);
    }
  },

  async deleteUser(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, USERS_COL, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${USERS_COL}/${id}`);
    }
  },

  // 3. Customers
  async getCustomers(): Promise<Customer[]> {
    try {
      const snap = await getDocs(collection(db, CUSTOMERS_COL));
      return snap.docs.map((d) => d.data() as Customer);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, CUSTOMERS_COL);
    }
  },

  async createCustomer(c: Partial<Customer>): Promise<Customer> {
    try {
      const id = c.id || `cust-${Date.now()}`;
      const fullCust: Customer = {
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
      await setDoc(doc(db, CUSTOMERS_COL, id), fullCust);
      return fullCust;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, CUSTOMERS_COL);
    }
  },

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<void> {
    try {
      await updateDoc(doc(db, CUSTOMERS_COL, id), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${CUSTOMERS_COL}/${id}`);
    }
  },

  async deleteCustomer(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, CUSTOMERS_COL, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${CUSTOMERS_COL}/${id}`);
    }
  },

  // 4. Items
  async getItems(): Promise<Item[]> {
    try {
      const snap = await getDocs(collection(db, ITEMS_COL));
      return snap.docs.map((d) => d.data() as Item);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, ITEMS_COL);
    }
  },

  async createItem(it: Partial<Item>): Promise<Item> {
    try {
      const id = it.id || `it-${Date.now()}`;
      const fullItem: Item = {
        id,
        sku: it.sku || `SKU-${Date.now()}`,
        name: it.name || '',
        description: it.description || '',
        category: it.category || 'General',
        weight_kg: Number(it.weight_kg || 0),
        volume_m3: Number(it.volume_m3 || 0),
        stock_quantity: Number(it.stock_quantity || 0),
        created_at: new Date().toISOString(),
      };
      await setDoc(doc(db, ITEMS_COL, id), fullItem);
      return fullItem;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, ITEMS_COL);
    }
  },

  async updateItem(id: string, updates: Partial<Item>): Promise<void> {
    try {
      await updateDoc(doc(db, ITEMS_COL, id), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${ITEMS_COL}/${id}`);
    }
  },

  async deleteItem(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, ITEMS_COL, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${ITEMS_COL}/${id}`);
    }
  },

  // 5. Container Types & Containers
  async getContainerTypes(): Promise<ContainerType[]> {
    try {
      const snap = await getDocs(collection(db, CONTAINER_TYPES_COL));
      return snap.docs.map((d) => d.data() as ContainerType);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, CONTAINER_TYPES_COL);
    }
  },

  async createContainerType(ct: Partial<ContainerType>): Promise<ContainerType> {
    try {
      const id = ct.id || `ct-${Date.now()}`;
      const fullCt: ContainerType = {
        id,
        name: ct.name || '',
        description: ct.description || '',
        max_weight_kg: Number(ct.max_weight_kg || 1000),
        max_volume_m3: Number(ct.max_volume_m3 || 10),
        cost_mad: Number(ct.cost_mad || 500),
      };
      await setDoc(doc(db, CONTAINER_TYPES_COL, id), fullCt);
      return fullCt;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, CONTAINER_TYPES_COL);
    }
  },

  async getContainers(): Promise<Container[]> {
    try {
      const snap = await getDocs(collection(db, CONTAINERS_COL));
      return snap.docs.map((d) => d.data() as Container);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, CONTAINERS_COL);
    }
  },

  async createContainer(c: Partial<Container>): Promise<Container> {
    try {
      const id = c.id || `c-${Date.now()}`;
      const fullContainer: Container = {
        id,
        code: c.code || `C-${Date.now()}`,
        type_id: c.type_id || '',
        type_name: c.type_name || '',
        max_weight_kg: Number(c.max_weight_kg || 1000),
        max_volume_m3: Number(c.max_volume_m3 || 10),
        cost_mad: Number(c.cost_mad || 500),
        status: c.status || 'Available',
        current_location: c.current_location || 'Casablanca Hub',
        created_at: new Date().toISOString(),
      };
      await setDoc(doc(db, CONTAINERS_COL, id), fullContainer);
      return fullContainer;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, CONTAINERS_COL);
    }
  },

  async updateContainer(id: string, updates: Partial<Container>): Promise<void> {
    try {
      await updateDoc(doc(db, CONTAINERS_COL, id), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${CONTAINERS_COL}/${id}`);
    }
  },

  async deleteContainer(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, CONTAINERS_COL, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${CONTAINERS_COL}/${id}`);
    }
  },

  // 6. Orders
  async getOrders(): Promise<Order[]> {
    try {
      const snap = await getDocs(collection(db, ORDERS_COL));
      return snap.docs.map((d) => d.data() as Order);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, ORDERS_COL);
    }
  },

  async createOrder(ord: Partial<Order>): Promise<Order> {
    try {
      const id = ord.id || `ord-${Date.now()}`;
      const fullOrder: Order = {
        id,
        order_number: ord.order_number || `ORD-${Date.now()}`,
        customer_id: ord.customer_id || '',
        customer_name: ord.customer_name || '',
        customer_city: ord.customer_city || '',
        order_date: ord.order_date || new Date().toISOString().split('T')[0],
        status: ord.status || 'Ready',
        priority: ord.priority || 'Standard',
        notes: ord.notes || '',
        total_weight_kg: Number(ord.total_weight_kg || 0),
        total_volume_m3: Number(ord.total_volume_m3 || 0),
        items: ord.items || [],
        created_at: new Date().toISOString(),
      };
      await setDoc(doc(db, ORDERS_COL, id), fullOrder);
      return fullOrder;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, ORDERS_COL);
    }
  },

  async updateOrder(id: string, updates: Partial<Order>): Promise<void> {
    try {
      await updateDoc(doc(db, ORDERS_COL, id), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${ORDERS_COL}/${id}`);
    }
  },

  async deleteOrder(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, ORDERS_COL, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${ORDERS_COL}/${id}`);
    }
  },

  // 7. Optimization Runs (History)
  async getOptimizationHistory(): Promise<OptimizationHistoryRun[]> {
    try {
      const snap = await getDocs(collection(db, RUNS_COL));
      return snap.docs.map((d) => d.data() as OptimizationHistoryRun);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, RUNS_COL);
    }
  },

  async saveOptimizationRun(plan: any): Promise<void> {
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
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, RUNS_COL);
    }
  },

  async deleteOptimizationRun(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, RUNS_COL, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${RUNS_COL}/${id}`);
    }
  },
};
