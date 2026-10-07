import React, { useState } from 'react';
import { History, Eye, Trash2, Calendar, TrendingDown, Truck, X, Layers, Box, Scale } from 'lucide-react';
import { OptimizationHistoryRun } from '../types/index.ts';
import { formatMAD, formatWeight, formatVolume, formatNumber } from '../utils/formatters.ts';

interface HistoryPageProps {
  historyRuns: OptimizationHistoryRun[];
  onInspectRun: (id: string) => Promise<OptimizationHistoryRun>;
  onDeleteRun: (id: string) => Promise<void>;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  historyRuns,
  onInspectRun,
  onDeleteRun,
}) => {
  const [selectedRun, setSelectedRun] = useState<OptimizationHistoryRun | null>(null);
  const [loadingRunId, setLoadingRunId] = useState<string | null>(null);

  const handleInspect = async (id: string) => {
    try {
      setLoadingRunId(id);
      const detailed = await onInspectRun(id);
      setSelectedRun(detailed);
    } catch (err: any) {
      alert('Failed to load run details: ' + err.message);
    } finally {
      setLoadingRunId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Optimization Run Archive</h2>
          <p className="text-xs text-slate-500">
            Historical optimization plans, allocations, cost savings, and dispatch manifests
          </p>
        </div>
        <div className="font-mono text-xs text-slate-500">
          Total archived runs: <strong className="text-slate-900">{historyRuns.length}</strong>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-mono text-[11px]">
              <tr>
                <th className="px-4 py-3">Run ID & Date</th>
                <th className="px-4 py-3 text-center">Orders Packed</th>
                <th className="px-4 py-3 text-right">Payload Weight</th>
                <th className="px-4 py-3 text-right">Payload Volume</th>
                <th className="px-4 py-3 text-center">Containers Used</th>
                <th className="px-4 py-3 text-right">Cost (Before &rarr; After)</th>
                <th className="px-4 py-3 text-right">Net Savings</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {historyRuns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No past optimization runs recorded yet. Run a daily optimization to begin tracking history.
                  </td>
                </tr>
              ) : (
                historyRuns.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-blue-600">{r.id}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {new Date(r.run_date).toLocaleDateString()} &bull; {new Date(r.run_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-slate-800">
                      {r.total_orders_count}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-800">
                      {formatWeight(r.total_weight_kg)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-800">
                      {formatVolume(r.total_volume_m3)}
                    </td>
                    <td className="px-4 py-3 text-center font-mono">
                      <span className="font-bold text-blue-700">{r.containers_after}</span>{' '}
                      <span className="text-slate-400 text-[10px]">({r.containers_before} orig)</span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      <span className="text-slate-400 line-through text-[11px] mr-1">
                        {formatMAD(r.cost_before_mad)}
                      </span>
                      <span className="font-bold text-slate-900">{formatMAD(r.cost_after_mad)}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-600 font-bold">
                      +{formatMAD(r.cost_saved_mad)} ({r.savings_percentage}%)
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          r.status === 'Dispatched'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleInspect(r.id)}
                          disabled={loadingRunId === r.id}
                          className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors"
                          title="Inspect Allocations"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteRun(r.id)}
                          className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 transition-colors"
                          title="Delete History Entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSPECT RUN MODAL */}
      {selectedRun && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-base text-blue-600">{selectedRun.id}</span>
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-mono font-bold uppercase">
                    {selectedRun.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Executed on {new Date(selectedRun.run_date).toLocaleString()} &bull; Created by {selectedRun.created_by_name || 'System Dispatcher'}
                </p>
              </div>
              <button
                onClick={() => setSelectedRun(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Summary KPIs */}
              <div className="grid grid-cols-4 gap-3 p-3 bg-slate-50 rounded border border-slate-200 text-center font-mono text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Containers</div>
                  <div className="text-base font-bold text-slate-900">
                    {selectedRun.containers_after} / {selectedRun.containers_before}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Gross Weight</div>
                  <div className="text-base font-bold text-slate-900">
                    {formatWeight(selectedRun.total_weight_kg)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Cube Volume</div>
                  <div className="text-base font-bold text-slate-900">
                    {formatVolume(selectedRun.total_volume_m3)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Cost Savings</div>
                  <div className="text-base font-bold text-emerald-600">
                    {formatMAD(selectedRun.cost_saved_mad)}
                  </div>
                </div>
              </div>

              {/* Allocations breakdown */}
              <div>
                <h4 className="text-xs font-mono uppercase font-bold text-slate-700 mb-2">
                  Allocated Containers Manifest ({selectedRun.allocations?.length || 0})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedRun.allocations?.map((alloc: any, idx: number) => (
                    <div key={idx} className="p-3 rounded border border-slate-200 bg-white shadow-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <span className="font-mono font-bold text-sm text-slate-900">
                          {alloc.container_code}
                        </span>
                        <span className="font-mono text-xs font-semibold text-blue-600">
                          {formatMAD(alloc.cost_mad)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">{alloc.container_type_name}</div>

                      <div className="mt-3 space-y-2 text-xs font-mono">
                        <div>
                          <div className="flex justify-between text-[11px]">
                            <span>Weight:</span>
                            <strong>
                              {alloc.allocated_weight_kg} / {alloc.max_weight_kg} kg ({alloc.weight_utilization_pct}%)
                            </strong>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 rounded-full mt-0.5 overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${Math.min(100, alloc.weight_utilization_pct)}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px]">
                            <span>Volume:</span>
                            <strong>
                              {alloc.allocated_volume_m3} / {alloc.max_volume_m3} m³ ({alloc.volume_utilization_pct}%)
                            </strong>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 rounded-full mt-0.5 overflow-hidden">
                            <div
                              className="h-full bg-emerald-600 rounded-full"
                              style={{ width: `${Math.min(100, alloc.volume_utilization_pct)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 text-[11px]">
                        <span className="text-slate-400">Assigned Orders: </span>
                        <span className="font-mono font-semibold text-slate-700">
                          {alloc.assignedOrders?.join(', ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedRun(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded"
              >
                Close Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
