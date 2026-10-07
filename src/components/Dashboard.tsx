import React from 'react';
import {
  Package,
  Layers,
  Scale,
  Box,
  Truck,
  TrendingDown,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  MapPin,
  Plus,
} from 'lucide-react';
import { DashboardData } from '../types/index.ts';
import { formatMAD, formatWeight, formatVolume, formatNumber } from '../utils/formatters.ts';

interface DashboardProps {
  data: DashboardData;
  onNavigateToOptimization: () => void;
  onNavigateToOrders: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  data,
  onNavigateToOptimization,
  onNavigateToOrders,
}) => {
  const hasOrders = data.todayOrders > 0;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Top Banner: Today's Shipment Overview & Key Value Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Operational Metrics Matrix */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Today's Manifest
                </span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                  Daily Freight Demand
                </h2>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>Fleet:</span>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                  {data.availableContainers} / {data.totalContainers} Available
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-5">
              <div className="p-3 sm:p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                  <Package className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">Orders</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 truncate">
                  {formatNumber(data.todayOrders)}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 truncate">Intake today</div>
              </div>

              <div className="p-3 sm:p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                  <Layers className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span className="truncate">Total Items</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 truncate">
                  {formatNumber(data.totalItems)}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 truncate">Units/cartons</div>
              </div>

              <div className="p-3 sm:p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                  <Scale className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="truncate">Gross Weight</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 truncate">
                  {formatWeight(data.totalWeightKg)}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 truncate">Payload mass</div>
              </div>

              <div className="p-3 sm:p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                  <Box className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">Cube Volume</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 truncate">
                  {formatVolume(data.totalVolumeM3)}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 truncate">Displacement</div>
              </div>
            </div>
          </div>

          {/* Quick status chips / pipeline */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-slate-500 font-medium">Pipeline:</span>
              {data.statusCounts && data.statusCounts.length > 0 ? (
                data.statusCounts.map((sc) => (
                  <span key={sc.status} className="flex items-center gap-1.5 font-mono text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-slate-700">{sc.status}:</span>
                    <strong className="text-slate-900">{sc.count}</strong>
                  </span>
                ))
              ) : (
                <span className="text-slate-400 font-mono text-[11px]">No active consignments</span>
              )}
            </div>
            <button
              onClick={onNavigateToOrders}
              className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1 text-xs self-start sm:self-auto cursor-pointer"
            >
              <span>Inspect registry</span> <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Container & Cost Optimization Card */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 text-white rounded-xl p-4 sm:p-5 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-blue-500/20 text-blue-400 rounded border border-blue-400/30">
                  <Sparkles className="w-4 h-4" />
                </span>
                <span className="text-xs font-mono tracking-wider uppercase text-blue-300 font-semibold">
                  Optimization Value Metric
                </span>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                {data.savingsPercentage > 0 ? `-${data.savingsPercentage}% Cost` : '0% Base'}
              </span>
            </div>

            <h3 className="text-base font-bold text-white mt-3">Transportation Cost Reduction</h3>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Distributes order packages into the minimum number of transport units while respecting container limits.
            </p>

            {/* Before vs After comparison display */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/60">
                <div className="text-[10px] font-mono uppercase text-slate-400">Before Optimization</div>
                <div className="text-lg sm:text-xl font-mono font-bold text-slate-200 mt-1 truncate">
                  {data.containersBefore}{' '}
                  <span className="text-xs font-normal text-slate-400">containers</span>
                </div>
                <div className="text-xs font-mono text-slate-400 mt-0.5 truncate">
                  Cost: <strong className="text-slate-300">{formatMAD(data.costBeforeMad)}</strong>
                </div>
              </div>

              <div className="bg-blue-900/40 rounded-lg p-3 border border-blue-600/50">
                <div className="text-[10px] font-mono uppercase text-blue-300">After Optimization</div>
                <div className="text-lg sm:text-xl font-mono font-bold text-emerald-400 mt-1 truncate">
                  {data.containersAfter}{' '}
                  <span className="text-xs font-normal text-slate-300">containers</span>
                </div>
                <div className="text-xs font-mono text-blue-200 mt-0.5 truncate">
                  Cost: <strong className="text-white">{formatMAD(data.costAfterMad)}</strong>
                </div>
              </div>
            </div>

            {/* Savings Callout */}
            <div className="mt-4 p-3 bg-emerald-950/40 rounded-lg border border-emerald-800/50 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <TrendingDown className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[11px] text-emerald-300 uppercase font-mono font-bold truncate">
                    Estimated Net Savings
                  </div>
                  <div className="text-xs text-slate-300 truncate">
                    {data.containersSaved > 0 ? (
                      <>
                        Eliminates <strong className="text-emerald-400">{data.containersSaved} containers</strong>
                      </>
                    ) : (
                      'Calculated automatically upon run'
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-base sm:text-lg font-bold font-mono text-emerald-400">
                  {formatMAD(data.costSavedMad)}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onNavigateToOptimization}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 px-4 rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <span>Open Optimization Studio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Middle Section: Regional Distribution & Dispatch Readiness */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* City/Regional Distribution */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-600" />
              Regional Destination Hubs
            </h3>
            <span className="text-xs text-slate-400">Freight Routing</span>
          </div>

          <div className="space-y-3">
            {data.cityBreakdown && data.cityBreakdown.length > 0 ? (
              data.cityBreakdown.map((city) => {
                const weightPct = Math.min(
                  100,
                  Math.round((city.total_weight / (data.totalWeightKg || 1)) * 100)
                );
                return (
                  <div key={city.city} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{city.city}</span>
                      <div className="font-mono text-slate-500 text-[11px]">
                        {city.order_count} orders &bull; {formatWeight(city.total_weight)}
                      </div>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${Math.max(8, weightPct)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                <MapPin className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                No destination consignments recorded today.
              </div>
            )}
          </div>
        </div>

        {/* Priority breakdown & Preparation status */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-700 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-purple-600" />
                Dispatch Readiness &amp; Priority
              </h3>
              <span className="text-xs text-slate-400">Schedule Status</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mb-4">
              {['Standard', 'High', 'Urgent'].map((prio) => {
                const found = data.priorityCounts?.find((p) => p.priority === prio);
                const count = found ? found.count : 0;
                const isUrgent = prio === 'Urgent';
                const isHigh = prio === 'High';

                return (
                  <div
                    key={prio}
                    className={`p-2.5 sm:p-3 rounded-lg border text-center ${
                      isUrgent
                        ? 'bg-red-50/50 border-red-200 text-red-900'
                        : isHigh
                        ? 'bg-amber-50/50 border-amber-200 text-amber-900'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="text-[10px] font-mono uppercase font-bold text-slate-500">
                      {prio}
                    </div>
                    <div className="text-lg sm:text-xl font-bold font-mono mt-1">{count}</div>
                    <div className="text-[10px] text-slate-400">orders</div>
                  </div>
                );
              })}
            </div>

            <div className="p-3.5 bg-blue-50/50 rounded-lg border border-blue-100 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-blue-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  Dual-Constraint Engine Status:
                </span>
                <span className="font-mono text-blue-700 font-bold text-[11px]">ACTIVE</span>
              </div>
              <p className="text-xs text-blue-800 leading-relaxed">
                Weight (kg) and Cube Volume (m³) verified against container inventory with cost minimization.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between font-mono text-[11px]">
            <span>Dispatch Protocol: Active</span>
            <span className="text-emerald-700 font-semibold">Ready for Packing</span>
          </div>
        </div>
      </div>

      {/* Today's Intake Orders Queue */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Today's Intake Orders Queue</h3>
            <p className="text-xs text-slate-500">Active consignments ready for allocation</p>
          </div>
          <button
            onClick={onNavigateToOrders}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 border border-blue-200 transition-colors self-start sm:self-auto cursor-pointer"
          >
            View Full Registry
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[640px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-mono text-[11px]">
              <tr>
                <th className="px-4 py-2.5">Order ID</th>
                <th className="px-4 py-2.5">Customer</th>
                <th className="px-4 py-2.5">Destination</th>
                <th className="px-4 py-2.5">Priority</th>
                <th className="px-4 py-2.5 text-right">Weight (kg)</th>
                <th className="px-4 py-2.5 text-right">Volume (m³)</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.recentOrders && data.recentOrders.length > 0 ? (
                data.recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-2.5 font-mono font-bold text-blue-600">{ord.order_number}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-900">{ord.company_name}</td>
                    <td className="px-4 py-2.5 text-slate-600">{ord.city}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          ord.priority === 'Urgent'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : ord.priority === 'High'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {ord.priority}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-800">
                      {formatWeight(ord.total_weight_kg)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-800">
                      {formatVolume(ord.total_volume_m3)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          ord.status === 'Ready'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : ord.status === 'Optimized'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : ord.status === 'Dispatched'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <div>No intake orders registered for today.</div>
                    <button
                      onClick={onNavigateToOrders}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Create New Consignment
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
