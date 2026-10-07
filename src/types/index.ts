export type Role = 'admin' | 'operator';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  status?: 'active' | 'deactivated';
  created_at: string;
}

export interface Customer {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  priority: 'Standard' | 'High' | 'Urgent';
  notes?: string;
  order_count?: number;
  total_weight_kg?: number;
  created_at: string;
}

export interface Item {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  weight_kg: number;
  volume_m3: number;
  stock_quantity: number;
  created_at: string;
}

export interface ContainerType {
  id: string;
  name: string;
  description: string;
  max_weight_kg: number;
  max_volume_m3: number;
  cost_mad: number;
  internal_length_m?: number;
  internal_width_m?: number;
  internal_height_m?: number;
  container_count?: number;
  available_count?: number;
}

export interface Container {
  id: string;
  code: string;
  type_id: string;
  type_name: string;
  max_weight_kg: number;
  max_volume_m3: number;
  cost_mad: number;
  status: 'Available' | 'Allocated' | 'Prepared' | 'Dispatched' | 'Maintenance';
  current_location: string;
  created_at: string;
}

export type OrderStatus = 'Pending' | 'Ready' | 'Optimized' | 'Packed' | 'Dispatched' | 'Delivered' | 'Cancelled';
export type PriorityLevel = 'Standard' | 'High' | 'Urgent';

export interface OrderItemLine {
  id?: string;
  item_id: string;
  sku?: string;
  item_name?: string;
  item_category?: string;
  quantity: number;
  unit_weight_kg: number;
  unit_volume_m3: number;
  total_weight_kg: number;
  total_volume_m3: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_city?: string;
  order_date: string;
  status: OrderStatus;
  priority: PriorityLevel;
  notes?: string;
  total_weight_kg: number;
  total_volume_m3: number;
  item_lines_count?: number;
  total_units_count?: number;
  items?: OrderItemLine[];
  created_at: string;
}

export interface AllocationItem {
  orderId: string;
  orderNumber: string;
  customerName: string;
  itemId: string;
  itemName: string;
  itemSku: string;
  quantity: number;
  weightKg: number;
  volumeM3: number;
  isSplit: boolean;
}

export interface ContainerAllocation {
  containerId: string;
  containerCode: string;
  containerTypeName: string;
  maxWeightKg: number;
  maxVolumeM3: number;
  costMad: number;
  allocatedWeightKg: number;
  allocatedVolumeM3: number;
  weightUtilizationPct: number;
  volumeUtilizationPct: number;
  compositeUtilizationPct: number;
  limitingFactor: 'Weight' | 'Volume' | 'Balanced';
  assignedOrders: string[];
  items: AllocationItem[];
  status: 'Planned' | 'Prepared' | 'Dispatched';
  isManuallyModified: boolean;
}

export interface OptimizationWarning {
  type: 'IMPOSSIBLE_ITEM' | 'IMPOSSIBLE_ORDER' | 'FLEET_CAPACITY_EXCEEDED' | 'WARNING';
  orderNumber?: string;
  itemSku?: string;
  message: string;
}

export interface OptimizationResult {
  runId: string;
  runDate: string;
  allowSplitting: boolean;
  totalOrdersCount: number;
  totalItemsCount: number;
  totalWeightKg: number;
  totalVolumeM3: number;
  containersBefore: number;
  costBeforeMad: number;
  containersAfter: number;
  costAfterMad: number;
  containersSaved: number;
  costSavedMad: number;
  savingsPercentage: number;
  allocations: ContainerAllocation[];
  warnings: OptimizationWarning[];
  splitOrders: { orderNumber: string; containers: string[] }[];
  summary: {
    avgWeightUtilization: number;
    avgVolumeUtilization: number;
    highestUtilizedContainer: string;
  };
}

export interface OptimizationHistoryRun {
  id: string;
  run_date: string;
  allow_splitting: number;
  total_orders_count: number;
  total_items_count: number;
  total_weight_kg: number;
  total_volume_m3: number;
  containers_before: number;
  cost_before_mad: number;
  containers_after: number;
  cost_after_mad: number;
  containers_saved: number;
  cost_saved_mad: number;
  savings_percentage: number;
  status: 'Draft' | 'Confirmed' | 'Dispatched';
  created_by_name?: string;
  allocations?: any[];
}

export interface DashboardData {
  todayOrders: number;
  totalItems: number;
  totalWeightKg: number;
  totalVolumeM3: number;
  availableContainers: number;
  totalContainers: number;
  containersBefore: number;
  costBeforeMad: number;
  containersAfter: number;
  costAfterMad: number;
  containersSaved: number;
  costSavedMad: number;
  savingsPercentage: number;
  statusCounts: { status: string; count: number }[];
  priorityCounts: { priority: string; count: number }[];
  cityBreakdown: { city: string; order_count: number; total_weight: number }[];
  recentOrders: any[];
  hasRecentOptimization: boolean;
  latestRunId: string | null;
}

export interface ReportsData {
  totalRuns: number;
  totalOrders: number;
  totalWeightKg: number;
  totalVolumeM3: number;
  totalSavedMad: number;
  totalCostMad: number;
  avgSavingsPct: number;
  avgWeightUtil: number;
  avgVolUtil: number;
  typeStats: {
    container_type_name: string;
    total_used: number;
    avg_weight_util: number;
    avg_vol_util: number;
    total_spent: number;
  }[];
  runsHistory: any[];
}
