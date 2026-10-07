import React, { useState } from 'react';
import { BarChart3, TrendingDown, Scale, Box, Truck, DollarSign, Calendar, Filter, Users } from 'lucide-react';
import { ReportsData, Customer, ContainerType } from '../types/index.ts';
import { formatMAD, formatWeight, formatVolume, formatNumber } from '../utils/formatters.ts';

interface ReportsPageProps {
  reportsData: ReportsData;
  customers: Customer[];
  containerTypes: ContainerType[];
  onFilterChange: (filters: { period?: string; customerId?: string; containerTypeId?: string }) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  reportsData,
  customers,
  containerTypes,
  onFilterChange,
}) => {
  const [period, setPeriod] = useState('ALL');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedTypeId, setSelectedTypeId] = useState('');

  const handlePeriodChange = (val: string) => {
    setPeriod(val);
    onFilterChange({
      period: val === 'ALL' ? undefined : val,
      customerId: selectedCustomerId || undefined,
      containerTypeId: selectedTypeId || undefined,
    });
  };

  const handleCustomerChange = (val: string) => {
    setSelectedCustomerId(val);
    onFilterChange({
      period: period === 'ALL' ? undefined : period,
      customerId: val || undefined,
      containerTypeId: selectedTypeId || undefined,
    });
  };

  const handleTypeChange = (val: string) => {
    setSelectedTypeId(val);
    onFilterChange({
      period: period === 'ALL' ? undefined : period,
      customerId: selectedCustomerId || undefined,
      containerTypeId: val || undefined,
    });
  };

  const avgCostPerOrder = reportsData.totalOrders > 0
    ? Math.round(reportsData.totalCostMad / reportsData.totalOrders)
    : 0;

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700">Horizon:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded border border-slate-200 text-xs">
            {['TODAY', 'WEEK', 'MONTH', 'ALL'].map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                  period === p
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
          <div className="flex items-center gap-1.5 text-xs flex-1">
            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedCustomerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
            >
              <option value="">All Accounts ({customers.length})</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <Truck className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedTypeId}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
            >
              <option value="">All Container Models</option>
              {containerTypes.map((ct) => (
                <option key={ct.id} value={ct.id}>
                  {ct.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Matrix Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[10px] font-mono uppercase text-slate-400">Total Shipments</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {formatNumber(reportsData.totalOrders)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Orders processed</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[10px] font-mono uppercase text-slate-400">Total Gross Weight</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {formatWeight(reportsData.totalWeightKg)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Physical payload</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[10px] font-mono uppercase text-slate-400">Cube Freight Volume</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {formatVolume(reportsData.totalVolumeM3)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Displaced cube</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[10px] font-mono uppercase text-slate-400">Avg Utilization</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {reportsData.avgWeightUtil}%
          </div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Vol: {reportsData.avgVolUtil}%</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[10px] font-mono uppercase text-slate-400">Net Spend</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {formatMAD(reportsData.totalCostMad)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Avg/Order: {formatMAD(avgCostPerOrder)}</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-emerald-300 bg-emerald-50/30 shadow-xs">
          <div className="text-[10px] font-mono uppercase text-emerald-800 font-bold">Total Savings</div>
          <div className="text-xl font-bold font-mono text-emerald-600 mt-1">
            {formatMAD(reportsData.totalSavedMad)}
          </div>
          <div className="text-[10px] text-emerald-700 mt-0.5 font-semibold">
            {reportsData.avgSavingsPct}% reduction rate
          </div>
        </div>
      </div>

      {/* Container Type Performance Breakdown */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900">Container Type Allocation Performance</h3>
          <p className="text-xs text-slate-500">Utilization and expenditure breakdown by transport model</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-mono text-[11px]">
              <tr>
                <th className="px-4 py-3">Container Model</th>
                <th className="px-4 py-3 text-center">Allocations Deployed</th>
                <th className="px-4 py-3 text-right">Avg Weight Load</th>
                <th className="px-4 py-3 text-right">Avg Cube Load</th>
                <th className="px-4 py-3 text-right">Total Expenditure</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {reportsData.typeStats.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400 font-sans">
                    No completed allocations recorded in this filter horizon.
                  </td>
                </tr>
              ) : (
                reportsData.typeStats.map((ts, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-sans font-bold text-slate-900">
                      {ts.container_type_name}
                    </td>
                    <td className="px-4 py-3 text-center text-blue-700 font-bold">
                      {ts.total_used} units
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={ts.avg_weight_util >= 85 ? 'text-amber-600 font-bold' : 'text-slate-800'}>
                        {ts.avg_weight_util ? ts.avg_weight_util.toFixed(1) : 0}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={ts.avg_vol_util >= 85 ? 'text-amber-600 font-bold' : 'text-slate-800'}>
                        {ts.avg_vol_util ? ts.avg_vol_util.toFixed(1) : 0}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      {formatMAD(ts.total_spent)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
