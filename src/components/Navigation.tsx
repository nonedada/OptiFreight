import React from 'react';
import {
  LayoutDashboard,
  PackageSearch,
  Boxes,
  Users,
  Truck,
  Zap,
  History,
  BarChart3,
  UserCheck,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  PanelLeft,
} from 'lucide-react';
import { User } from '../types/index.ts';

export type TabType =
  | 'dashboard'
  | 'orders'
  | 'items'
  | 'customers'
  | 'containers'
  | 'optimization'
  | 'history'
  | 'reports'
  | 'users';

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  currentUser: User;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  isMobileOpen,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
  onLogout,
}) => {
  const navItems = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders' as TabType, label: 'Shipment Orders', icon: PackageSearch },
    { id: 'items' as TabType, label: 'Items & SKU Catalog', icon: Boxes },
    { id: 'customers' as TabType, label: 'Customers', icon: Users },
    { id: 'containers' as TabType, label: 'Fleet & Containers', icon: Truck },
    { id: 'optimization' as TabType, label: 'Daily Optimization', icon: Zap, highlight: true },
    { id: 'history' as TabType, label: 'Optimization History', icon: History },
    { id: 'reports' as TabType, label: 'Analytics & Reports', icon: BarChart3 },
    ...(currentUser.role === 'admin'
      ? [{ id: 'users' as TabType, label: 'User Management', icon: UserCheck }]
      : []),
  ];

  const handleSelectTab = (tab: TabType) => {
    setActiveTab(tab);
    onCloseMobile();
  };

  const renderContent = (isMobileView = false) => {
    const collapsed = !isMobileView && isCollapsed;

    return (
      <aside
        className={`${
          collapsed ? 'w-18' : 'w-64'
        } bg-[#0F172A] text-slate-300 flex flex-col h-full select-none border-r border-slate-800 transition-all duration-200 ease-in-out`}
      >
        {/* Brand Header */}
        <div
          className={`h-16 flex items-center ${
            collapsed ? 'justify-center px-2' : 'justify-between px-3.5 sm:px-4'
          } border-b border-slate-800 shrink-0`}
        >
          {!collapsed ? (
            <>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm font-bold tracking-wider shrink-0">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-white text-base tracking-tight truncate">
                    OptiFreight
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                    <span className="truncate">Fleet Operations</span>
                  </div>
                </div>
              </div>

              {/* Toggle / Close Buttons */}
              {isMobileView ? (
                <button
                  onClick={onCloseMobile}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                  aria-label="Close navigation"
                  title="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={onToggleCollapse}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
                  aria-label="Collapse sidebar"
                  title="Collapse sidebar"
                >
                  <PanelLeftClose className="w-4 h-4 text-slate-400 hover:text-white" />
                </button>
              )}
            </>
          ) : (
            <button
              onClick={onToggleCollapse}
              className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm hover:bg-blue-500 cursor-pointer transition-all"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <Truck className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-3 px-2 sm:px-2.5 space-y-1 overflow-y-auto">
          {!collapsed && (
            <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Operations Core
            </div>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center relative ${
                  collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3 py-2.5'
                } rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                } ${item.highlight && !isActive ? 'text-blue-300 bg-blue-950/40 border border-blue-800/50' : ''}`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-white' : item.highlight ? 'text-blue-400' : 'text-slate-400'
                  }`}
                />
                {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                {!collapsed && isActive && (
                  <ChevronRight className="w-3.5 h-3.5 text-blue-200 shrink-0" />
                )}
                {item.highlight && !isActive && (
                  <span
                    className={`w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0 ${
                      collapsed ? 'absolute top-2 right-2' : ''
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Production User Profile Card & Logout */}
        <div className="p-3 border-t border-slate-800 bg-[#0B1120] shrink-0">
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-300 text-xs shrink-0"
                title={`${currentUser.name} (${currentUser.role})`}
              >
                {currentUser.name ? currentUser.name[0] : 'U'}
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-300 text-xs shrink-0">
                  {currentUser.name
                    ? currentUser.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                    : 'U'}
                </div>
                <div className="truncate flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white truncate">{currentUser.name}</div>
                  <div className="text-[11px] text-slate-400 truncate font-mono">{currentUser.email}</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold truncate ${
                    currentUser.role === 'admin'
                      ? 'bg-purple-900/50 text-purple-300 border border-purple-700/50'
                      : 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50'
                  }`}
                >
                  {currentUser.role === 'admin' ? 'Admin' : 'Operator'}
                </span>

                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-red-400 text-xs font-medium px-2 py-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Sign out of platform"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    );
  };

  return (
    <>
      {/* Desktop Persistent Sidebar (Stretches 100% full height) */}
      <div className="hidden md:flex h-full h-[100dvh] shrink-0 overflow-hidden">
        {renderContent(false)}
      </div>

      {/* Mobile Slide-Over Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex h-screen h-[100dvh]">
          {/* Backdrop with Click-to-Close */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity cursor-pointer"
            onClick={onCloseMobile}
            aria-label="Close sidebar overlay"
          />
          {/* Drawer content (full height) */}
          <div className="relative z-10 h-full h-[100dvh] w-64 max-w-[85vw] shadow-2xl overflow-hidden">
            {renderContent(true)}
          </div>
        </div>
      )}
    </>
  );
};

export const Header: React.FC<{
  title: string;
  subtitle?: string;
  currentUser: User;
  onOpenMobileMenu: () => void;
  onToggleSidebarCollapse?: () => void;
  isSidebarCollapsed?: boolean;
  onRunOptimizationClick?: () => void;
  onLogout: () => void;
}> = ({
  title,
  subtitle,
  currentUser,
  onOpenMobileMenu,
  onToggleSidebarCollapse,
  isSidebarCollapsed,
  onRunOptimizationClick,
  onLogout,
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-5 flex items-center justify-between shrink-0 gap-2">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile menu trigger */}
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 shrink-0 cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop sidebar toggle button */}
        {onToggleSidebarCollapse && (
          <button
            onClick={onToggleSidebarCollapse}
            className="hidden md:flex p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 shrink-0 cursor-pointer transition-colors"
            title={isSidebarCollapsed ? 'Open / Expand Sidebar' : 'Close / Collapse Sidebar'}
            aria-label="Toggle sidebar"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}

        <div className="min-w-0">
          <h1 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 leading-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[11px] sm:text-xs text-slate-500 font-normal truncate hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-mono font-semibold shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="hidden sm:inline">Online</span>
        </span>

        {onRunOptimizationClick && (
          <button
            onClick={onRunOptimizationClick}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg shadow-xs transition-all shrink-0 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Run Optimization</span>
            <span className="md:hidden">Optimize</span>
          </button>
        )}

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* User Identity Pill */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0">
            {currentUser.name
              ? currentUser.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
              : 'U'}
          </div>
          <div className="text-left hidden lg:block">
            <div className="text-xs font-bold text-slate-800 truncate max-w-[120px]">{currentUser.name}</div>
            <div className="text-[10px] text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{currentUser.role === 'admin' ? 'Admin' : 'Operator'}</span>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          title="Sign out"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
};
