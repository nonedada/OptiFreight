import React, { useState, useEffect, useCallback } from 'react';
import { api, testFirestoreConnection } from './api/client.ts';
import {
  User,
  Customer,
  Item,
  ContainerType,
  Container,
  Order,
  OrderStatus,
  PriorityLevel,
  OptimizationResult,
  OptimizationHistoryRun,
  DashboardData,
  ReportsData,
} from './types/index.ts';
import { Sidebar, Header, TabType } from './components/Navigation.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { OrdersPage } from './components/OrdersPage.tsx';
import { ItemsPage } from './components/ItemsPage.tsx';
import { CustomersPage } from './components/CustomersPage.tsx';
import { ContainersPage } from './components/ContainersPage.tsx';
import { OptimizationPage } from './components/OptimizationPage.tsx';
import { HistoryPage } from './components/HistoryPage.tsx';
import { ReportsPage } from './components/ReportsPage.tsx';
import { UsersPage } from './components/UsersPage.tsx';
import { LoginPage } from './components/LoginPage.tsx';
import { Loader2, AlertCircle } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('optifreight_session_user') || sessionStorage.getItem('optifreight_session_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.email === 'youssef@truck.com') {
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const stored = localStorage.getItem('optifreight_session_user') || sessionStorage.getItem('optifreight_session_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.email === 'youssef@truck.com') {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return {
      id: 'usr-admin-youssef',
      name: 'Youssef',
      email: 'youssef@truck.com',
      role: 'admin',
      created_at: new Date().toISOString(),
    };
  });

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Core Data
  const [users, setUsers] = useState<User[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [containerTypes, setContainerTypes] = useState<ContainerType[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [historyRuns, setHistoryRuns] = useState<OptimizationHistoryRun[]>([]);
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);

  // Selected Order for Detail Modal
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  // Active Optimization Result (In-Memory Run)
  const [activeOptimization, setActiveOptimization] = useState<OptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Initial Data Fetch
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const [
        dashRes,
        usersRes,
        custRes,
        itemsRes,
        cTypesRes,
        containersRes,
        ordersRes,
        historyRes,
        reportsRes,
      ] = await Promise.all([
        api.getDashboard().catch(() => ({
          todayOrders: 0,
          totalItems: 0,
          totalWeightKg: 0,
          totalVolumeM3: 0,
          availableContainers: 0,
          totalContainers: 0,
          containersBefore: 0,
          costBeforeMad: 0,
          containersAfter: 0,
          costAfterMad: 0,
          containersSaved: 0,
          costSavedMad: 0,
          savingsPercentage: 0,
          statusCounts: [],
          priorityCounts: [],
          cityBreakdown: [],
          recentOrders: [],
          hasRecentOptimization: false,
          latestRunId: null,
        })),
        api.getUsers().catch(() => []),
        api.getCustomers().catch(() => []),
        api.getItems().catch(() => []),
        api.getContainerTypes().catch(() => []),
        api.getContainers().catch(() => []),
        api.getOrders().catch(() => []),
        api.getOptimizationHistory().catch(() => []),
        api.getReports().catch(() => null),
      ]);

      setDashboardData(dashRes);
      setUsers(usersRes);
      setCustomers(custRes);
      setItems(itemsRes);
      setContainerTypes(cTypesRes);
      setContainers(containersRes);
      setOrders(ordersRes);
      setHistoryRuns(historyRes);
      if (reportsRes) setReportsData(reportsRes);
    } catch (err: any) {
      console.error('Failed to load application data:', err);
      setErrorMessage(err.message || 'Unable to connect to service. Please retry.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Validate connection to Firestore on initial boot
  useEffect(() => {
    testFirestoreConnection().catch(console.warn);
  }, []);

  // Fetch users initially
  useEffect(() => {
    api.getUsers().then(setUsers).catch(console.warn);
  }, []);

  // When authenticated, load full operational data
  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
    }
  }, [isAuthenticated, loadInitialData]);

  // Handle Login Success
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    if (user.role === 'operator' && activeTab === 'users') {
      setActiveTab('dashboard');
    }
  };

  // Handle Logout
  const handleLogout = () => {
    try {
      localStorage.removeItem('optifreight_session_user');
      sessionStorage.removeItem('optifreight_session_user');
    } catch (e) {
      console.warn('Could not remove session item', e);
    }
    setIsAuthenticated(false);
    setActiveTab('dashboard');
    setActiveOptimization(null);
  };

  // Role Protection: If Operator tries to access Users tab, fallback
  useEffect(() => {
    if (currentUser.role === 'operator' && activeTab === 'users') {
      setActiveTab('dashboard');
    }
  }, [currentUser.role, activeTab]);

  // Handler: Run Daily Optimization
  const handleRunOptimization = async (allowSplitting: boolean) => {
    try {
      setIsOptimizing(true);
      const result = await api.runOptimization({ allowSplitting });
      setActiveOptimization(result);
    } catch (err: any) {
      alert('Optimization error: ' + err.message);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Handler: Confirm & Prepare Containers
  const handleConfirmPlan = async (plan: OptimizationResult) => {
    try {
      setIsSavingPlan(true);
      await api.saveOptimizationPlan({
        ...plan,
        userId: currentUser.id,
      });

      // Sync updated containers and runs
      await loadInitialData();
      alert('Optimization plan confirmed! Transport units marked as Prepared.');
      setActiveTab('history');
    } catch (err: any) {
      alert('Failed to save allocation: ' + err.message);
    } finally {
      setIsSavingPlan(false);
    }
  };

  // Handler: Dispatch Containers
  const handleDispatchPlan = async (runId: string) => {
    if (!runId) return;
    try {
      setIsDispatching(true);
      await api.dispatchOptimizationPlan(runId);
      await loadInitialData();
      alert('Fleet successfully dispatched! Associated consignments marked as Dispatched.');
    } catch (err: any) {
      alert('Failed to dispatch fleet: ' + err.message);
    } finally {
      setIsDispatching(false);
    }
  };

  // Order CRUD
  const handleCreateOrder = async (payload: {
    customer_id: string;
    priority: PriorityLevel;
    notes?: string;
    items: { item_id: string; quantity: number }[];
  }) => {
    await api.createOrder(payload);
    await loadInitialData();
  };

  const handleUpdateOrderStatus = async (id: string, status: OrderStatus) => {
    await api.updateOrder(id, { status });
    await loadInitialData();
  };

  const handleDeleteOrder = async (id: string) => {
    await api.deleteOrder(id);
    await loadInitialData();
  };

  const handleSelectOrderDetail = async (id: string) => {
    const detailed = await api.getOrder(id);
    setSelectedOrderDetails(detailed);
  };

  // Customer CRUD
  const handleCreateCustomer = async (c: Partial<Customer>) => {
    await api.createCustomer(c);
    await loadInitialData();
  };

  const handleUpdateCustomer = async (id: string, c: Partial<Customer>) => {
    await api.updateCustomer(id, c);
    await loadInitialData();
  };

  const handleDeleteCustomer = async (id: string) => {
    await api.deleteCustomer(id);
    await loadInitialData();
  };

  // Items CRUD
  const handleCreateItem = async (it: Partial<Item>) => {
    await api.createItem(it);
    await loadInitialData();
  };

  const handleUpdateItem = async (id: string, it: Partial<Item>) => {
    await api.updateItem(id, it);
    await loadInitialData();
  };

  const handleDeleteItem = async (id: string) => {
    await api.deleteItem(id);
    await loadInitialData();
  };

  // Containers CRUD
  const handleCreateContainer = async (c: Partial<Container>) => {
    await api.createContainer(c);
    await loadInitialData();
  };

  const handleUpdateContainer = async (id: string, c: Partial<Container>) => {
    await api.updateContainer(id, c);
    await loadInitialData();
  };

  const handleDeleteContainer = async (id: string) => {
    await api.deleteContainer(id);
    await loadInitialData();
  };

  const handleCreateContainerType = async (ct: Partial<ContainerType>) => {
    await api.createContainerType(ct);
    await loadInitialData();
  };

  const handleUpdateContainerType = async (id: string, ct: Partial<ContainerType>) => {
    await api.updateContainerType(id, ct);
    await loadInitialData();
  };

  const handleDeleteContainerType = async (id: string) => {
    await api.deleteContainerType(id);
    await loadInitialData();
  };

  // History Actions
  const handleInspectRun = async (id: string) => {
    return await api.getOptimizationRun(id);
  };

  const handleDeleteRun = async (id: string) => {
    await api.deleteOptimizationRun(id);
    await loadInitialData();
  };

  // Reports Filter Handler
  const handleReportsFilter = async (filters: {
    period?: string;
    customerId?: string;
    containerTypeId?: string;
  }) => {
    const updated = await api.getReports(filters);
    setReportsData(updated);
  };

  // Users CRUD (Admin Only)
  const handleCreateUser = async (u: Partial<User>) => {
    await api.createUser(u);
    await loadInitialData();
  };

  const handleUpdateUser = async (id: string, u: Partial<User>) => {
    await api.updateUser(id, u);
    await loadInitialData();
  };

  const handleDeleteUser = async (id: string) => {
    await api.deleteUser(id);
    await loadInitialData();
  };

  // If not authenticated, always show dedicated Login Page
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Titles mapping
  const titlesMap: Record<TabType, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Logistics Operations Dashboard',
      subtitle: "Daily freight manifest intake, available fleet capacity, and optimization value metric",
    },
    orders: {
      title: 'Consignment Orders Registry',
      subtitle: 'Manage client shipping orders, quantities, and auto-computed payload weights & cubic volumes',
    },
    items: {
      title: 'SKU Inventory & Product Catalog',
      subtitle: 'Physical weight (kg) and cubic volume (m³) specifications used by packing algorithms',
    },
    customers: {
      title: 'Customer Directory & Accounts',
      subtitle: 'Client facilities, destinations, regional delivery routes, and priority requirements',
    },
    containers: {
      title: 'Fleet & Container Inventory',
      subtitle: 'Active transport units, cargo vans, rigid trucks, and 20ft/40ft containers',
    },
    optimization: {
      title: 'Daily Packing & Allocation Studio',
      subtitle: 'Dual-constraint algorithm minimizing container count and transportation cost (MAD)',
    },
    history: {
      title: 'Optimization Audit History',
      subtitle: 'Historical runs, verified allocations, dispatched fleets, and verified cost savings',
    },
    reports: {
      title: 'Logistics Analytics & KPI Reports',
      subtitle: 'Expenditure savings, payload utilization rates, and fleet performance horizons',
    },
    users: {
      title: 'Personnel & Security Management',
      subtitle: 'Platform user accounts and role-based permissions (Admin vs Logistics Operator)',
    },
  };

  return (
    <div className="h-screen h-[100dvh] w-full flex flex-col md:flex-row overflow-hidden bg-slate-100 antialiased text-slate-800 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        onLogout={handleLogout}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <Header
          title={titlesMap[activeTab].title}
          subtitle={titlesMap[activeTab].subtitle}
          currentUser={currentUser}
          onOpenMobileMenu={() => setIsMobileNavOpen(true)}
          onToggleSidebarCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          isSidebarCollapsed={isSidebarCollapsed}
          onRunOptimizationClick={
            activeTab !== 'optimization' ? () => setActiveTab('optimization') : undefined
          }
          onLogout={handleLogout}
        />

        {/* Dynamic Page Content View */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6">
          {isLoading && !dashboardData ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <div className="text-xs font-mono">Connecting to Freight Services...</div>
            </div>
          ) : errorMessage ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div>
                  <strong>Operational Notice:</strong> {errorMessage}
                </div>
              </div>
              <button
                onClick={() => loadInitialData()}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-xs shrink-0 cursor-pointer self-start sm:self-auto"
              >
                Retry Connection
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && dashboardData && (
                <Dashboard
                  data={dashboardData}
                  onNavigateToOptimization={() => setActiveTab('optimization')}
                  onNavigateToOrders={() => setActiveTab('orders')}
                />
              )}

              {activeTab === 'orders' && (
                <OrdersPage
                  orders={orders}
                  customers={customers}
                  items={items}
                  onCreateOrder={handleCreateOrder}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  onDeleteOrder={handleDeleteOrder}
                  onSelectOrderDetail={handleSelectOrderDetail}
                  selectedOrderDetails={selectedOrderDetails}
                  onCloseOrderDetail={() => setSelectedOrderDetails(null)}
                />
              )}

              {activeTab === 'items' && (
                <ItemsPage
                  items={items}
                  onCreateItem={handleCreateItem}
                  onUpdateItem={handleUpdateItem}
                  onDeleteItem={handleDeleteItem}
                />
              )}

              {activeTab === 'customers' && (
                <CustomersPage
                  customers={customers}
                  onCreateCustomer={handleCreateCustomer}
                  onUpdateCustomer={handleUpdateCustomer}
                  onDeleteCustomer={handleDeleteCustomer}
                />
              )}

              {activeTab === 'containers' && (
                <ContainersPage
                  containers={containers}
                  containerTypes={containerTypes}
                  onCreateContainer={handleCreateContainer}
                  onUpdateContainer={handleUpdateContainer}
                  onDeleteContainer={handleDeleteContainer}
                  onCreateContainerType={handleCreateContainerType}
                  onUpdateContainerType={handleUpdateContainerType}
                  onDeleteContainerType={handleDeleteContainerType}
                />
              )}

              {activeTab === 'optimization' && (
                <OptimizationPage
                  orders={orders}
                  containers={containers}
                  activeResult={activeOptimization}
                  isRunning={isOptimizing}
                  onRunOptimization={handleRunOptimization}
                  onConfirmPlan={handleConfirmPlan}
                  onDispatchPlan={handleDispatchPlan}
                  isSaving={isSavingPlan}
                  isDispatching={isDispatching}
                  onNavigateToOrders={() => setActiveTab('orders')}
                />
              )}

              {activeTab === 'history' && (
                <HistoryPage
                  historyRuns={historyRuns}
                  onInspectRun={handleInspectRun}
                  onDeleteRun={handleDeleteRun}
                />
              )}

              {activeTab === 'reports' && reportsData && (
                <ReportsPage
                  reportsData={reportsData}
                  customers={customers}
                  containerTypes={containerTypes}
                  onFilterChange={handleReportsFilter}
                />
              )}

              {activeTab === 'users' && currentUser.role === 'admin' && (
                <UsersPage
                  users={users}
                  onCreateUser={handleCreateUser}
                  onUpdateUser={handleUpdateUser}
                  onDeleteUser={handleDeleteUser}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
