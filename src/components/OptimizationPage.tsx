import React, { useState } from 'react';
import {
  Zap,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Layers,
  Scale,
  Box,
  Truck,
  RotateCcw,
  Sliders,
  Send,
  MoveRight,
  Split,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
} from 'lucide-react';
import {
  OptimizationResult,
  ContainerAllocation,
  AllocationItem,
  Order,
  Container,
} from '../types/index.ts';
import { formatMAD, formatWeight, formatVolume, formatNumber } from '../utils/formatters.ts';

interface OptimizationPageProps {
  orders: Order[];
  containers: Container[];
  activeResult: OptimizationResult | null;
  isRunning: boolean;
  onRunOptimization: (allowSplitting: boolean) => Promise<void>;
  onConfirmPlan: (plan: OptimizationResult) => Promise<void>;
  onDispatchPlan: (runId: string) => Promise<void>;
  isSaving: boolean;
  isDispatching: boolean;
  onNavigateToOrders?: () => void;
}

export const OptimizationPage: React.FC<OptimizationPageProps> = ({
  orders,
  containers,
  activeResult,
  isRunning,
  onRunOptimization,
  onConfirmPlan,
  onDispatchPlan,
  isSaving,
  isDispatching,
  onNavigateToOrders,
}) => {
  const [allowSplitting, setAllowSplitting] = useState(false);
  const [expandedContainer, setExpandedContainer] = useState<string | null>(null);

  // Manual Adjustment State
  const [editableAllocations, setEditableAllocations] = useState<ContainerAllocation[] | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedItemToMove, setSelectedItemToMove] = useState<{
    sourceContainerIndex: number;
    itemIndex: number;
    item: AllocationItem;
  } | null>(null);
  const [targetContainerIndex, setTargetContainerIndex] = useState<number>(0);
  const [moveQuantity, setMoveQuantity] = useState<number>(1);
  const [hasManualModifications, setHasManualModifications] = useState(false);
  const [validationAlert, setValidationAlert] = useState<string | null>(null);

  // Sync editable allocations when activeResult arrives
  const currentAllocations = editableAllocations || activeResult?.allocations || [];

  const handleStartRun = async () => {
    if (orders.length === 0) {
      setValidationAlert('No pending orders available in the queue. Create or import orders first.');
      return;
    }
    setValidationAlert(null);
    setEditableAllocations(null);
    setHasManualModifications(false);
    await onRunOptimization(allowSplitting);
  };

  // Open manual adjust modal
  const handleOpenManualModal = (
    sourceIndex: number,
    itemIndex: number,
    item: AllocationItem
  ) => {
    if (!editableAllocations && activeResult) {
      setEditableAllocations(JSON.parse(JSON.stringify(activeResult.allocations)));
    }
    setSelectedItemToMove({ sourceContainerIndex: sourceIndex, itemIndex, item });
    setMoveQuantity(item.quantity);
    const defaultTarget = sourceIndex === 0 ? 1 : 0;
    setTargetContainerIndex(defaultTarget);
    setIsManualModalOpen(true);
  };

  // Execute the item move
  const handleExecuteMove = () => {
    if (!selectedItemToMove || !activeResult) return;

    const list: ContainerAllocation[] = JSON.parse(
      JSON.stringify(editableAllocations || activeResult.allocations)
    );
    const { sourceContainerIndex, itemIndex, item } = selectedItemToMove;

    if (sourceContainerIndex === targetContainerIndex) {
      setIsManualModalOpen(false);
      return;
    }

    const source = list[sourceContainerIndex];
    const target = list[targetContainerIndex];

    const qtyToMove = Math.min(moveQuantity, item.quantity);
    const singleWeight = item.weightKg / item.quantity;
    const singleVolume = item.volumeM3 / item.quantity;
    const weightToMove = Math.round(singleWeight * qtyToMove * 100) / 100;
    const volumeToMove = Math.round(singleVolume * qtyToMove * 1000) / 1000;

    // Deduct from source
    if (qtyToMove >= item.quantity) {
      source.items.splice(itemIndex, 1);
    } else {
      item.quantity -= qtyToMove;
      item.weightKg = Math.round((item.weightKg - weightToMove) * 100) / 100;
      item.volumeM3 = Math.round((item.volumeM3 - volumeToMove) * 1000) / 1000;
      source.items[itemIndex] = { ...item };
    }

    // Add to target
    target.items.push({
      ...item,
      quantity: qtyToMove,
      weightKg: weightToMove,
      volumeM3: volumeToMove,
      isSplit: true,
    });

    // Recalculate source container
    source.allocatedWeightKg = Math.round(source.items.reduce((s, it) => s + it.weightKg, 0) * 100) / 100;
    source.allocatedVolumeM3 = Math.round(source.items.reduce((s, it) => s + it.volumeM3, 0) * 1000) / 1000;
    source.weightUtilizationPct = Math.round((source.allocatedWeightKg / source.maxWeightKg) * 1000) / 10;
    source.volumeUtilizationPct = Math.round((source.allocatedVolumeM3 / source.maxVolumeM3) * 1000) / 10;
    source.compositeUtilizationPct = Math.max(source.weightUtilizationPct, source.volumeUtilizationPct);
    source.assignedOrders = Array.from(new Set(source.items.map((it) => it.orderNumber)));
    source.isManuallyModified = true;

    // Recalculate target container
    target.allocatedWeightKg = Math.round(target.items.reduce((s, it) => s + it.weightKg, 0) * 100) / 100;
    target.allocatedVolumeM3 = Math.round(target.items.reduce((s, it) => s + it.volumeM3, 0) * 1000) / 1000;
    target.weightUtilizationPct = Math.round((target.allocatedWeightKg / target.maxWeightKg) * 1000) / 10;
    target.volumeUtilizationPct = Math.round((target.allocatedVolumeM3 / target.maxVolumeM3) * 1000) / 10;
    target.compositeUtilizationPct = Math.max(target.weightUtilizationPct, target.volumeUtilizationPct);
    target.assignedOrders = Array.from(new Set(target.items.map((it) => it.orderNumber)));
    target.isManuallyModified = true;

    setEditableAllocations(list);
    setHasManualModifications(true);
    setIsManualModalOpen(false);
  };

  const handleSaveConfirmedPlan = () => {
    if (!activeResult) return;
    const finalAllocations = editableAllocations || activeResult.allocations;
    const finalCost = finalAllocations.reduce((s, a) => s + a.costMad, 0);
    const finalCostSaved = Math.max(0, activeResult.costBeforeMad - finalCost);
    const finalPct = activeResult.costBeforeMad > 0 ? Math.round((finalCostSaved / activeResult.costBeforeMad) * 1000) / 10 : 0;

    onConfirmPlan({
      ...activeResult,
      allocations: finalAllocations,
      containersAfter: finalAllocations.length,
      costAfterMad: finalCost,
      costSavedMad: finalCostSaved,
      savingsPercentage: finalPct,
    });
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Control Configuration Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            Multi-Dimensional Solver
          </span>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
            Container Allocation Engine
          </h2>
          <p className="text-xs text-slate-500">
            Enforces dual constraints: Gross Weight &le; Max kg &amp; Cube Volume &le; Max m³.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Order Splitting Toggle */}
          <div className="flex items-center justify-between sm:justify-start gap-3 bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-200">
            <div className="text-left">
              <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Split className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Allow Order Splitting</span>
              </div>
              <div className="text-[10px] text-slate-500">
                {allowSplitting ? 'Permit items across multiple units' : 'Consolidate whole order in 1 unit'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAllowSplitting(!allowSplitting)}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
                allowSplitting ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  allowSplitting ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={handleStartRun}
            disabled={isRunning}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer min-h-[40px] shrink-0"
          >
            <Zap className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Optimizing Fleet...' : 'Run Daily Optimization'}</span>
          </button>
        </div>
      </div>

      {/* Validation Alert */}
      {validationAlert && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{validationAlert}</span>
          </div>
          {onNavigateToOrders && (
            <button
              onClick={onNavigateToOrders}
              className="font-bold underline text-blue-700 hover:text-blue-800 cursor-pointer shrink-0"
            >
              Go to Shipment Orders &rarr;
            </button>
          )}
        </div>
      )}

      {/* Warnings & Impossible Items Banner */}
      {activeResult && activeResult.warnings && activeResult.warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase font-mono">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Optimization Diagnostics ({activeResult.warnings.length})</span>
          </div>
          <div className="space-y-1.5 text-xs text-amber-950">
            {activeResult.warnings.map((w, idx) => (
              <div key={idx} className="flex items-start gap-2 bg-white/70 p-2 rounded-lg border border-amber-200/80">
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 uppercase shrink-0">
                  {w.type}
                </span>
                <span className="font-medium">{w.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Split Orders Alert */}
      {activeResult && activeResult.splitOrders && activeResult.splitOrders.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-blue-900">
            <Split className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>{activeResult.splitOrders.length} orders</strong> were distributed across multiple units to maximize density:
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] flex-wrap">
            {activeResult.splitOrders.slice(0, 4).map((so) => (
              <span key={so.orderNumber} className="bg-white px-2 py-0.5 rounded border border-blue-200 text-blue-700 font-bold">
                {so.orderNumber} &rarr; [{so.containers.join(', ')}]
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Optimization Result Comparison Card */}
      {activeResult && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold uppercase">
                  Optimal Solution Converged
                </span>
                {hasManualModifications && (
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-mono font-bold uppercase">
                    Manually Modified
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-slate-900 mt-1">
                Before vs. After Optimization Efficiency Analysis
              </h3>
            </div>

            {/* Workflow Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleSaveConfirmedPlan}
                disabled={isSaving}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Confirming...' : 'Confirm & Prepare Containers'}</span>
              </button>

              <button
                onClick={() => onDispatchPlan(activeResult.runId)}
                disabled={isDispatching}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isDispatching ? 'Dispatching...' : 'Dispatch Fleet'}</span>
              </button>
            </div>
          </div>

          {/* 4 KPI Grid Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 border-b border-slate-200">
            {/* Containers Saved */}
            <div className="p-4 sm:p-5">
              <div className="text-[11px] font-mono uppercase text-slate-400">Containers Utilized</div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-slate-900">
                  {currentAllocations.length}
                </span>
                {activeResult.containersBefore > 0 && (
                  <span className="text-xs text-slate-400 line-through">
                    {activeResult.containersBefore} orig
                  </span>
                )}
              </div>
              <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5 shrink-0" />
                <span>Saved {Math.max(0, activeResult.containersBefore - currentAllocations.length)} units</span>
              </div>
            </div>

            {/* Cost Before vs After */}
            <div className="p-4 sm:p-5">
              <div className="text-[11px] font-mono uppercase text-slate-400">Transportation Cost</div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-slate-900">
                  {formatMAD(currentAllocations.reduce((s, a) => s + a.costMad, 0))}
                </span>
                {activeResult.costBeforeMad > 0 && (
                  <span className="text-xs text-slate-400 line-through">
                    {formatMAD(activeResult.costBeforeMad)}
                  </span>
                )}
              </div>
              <div className="text-xs text-emerald-600 font-semibold mt-1">
                -{activeResult.savingsPercentage}% Net Cost Reduction
              </div>
            </div>

            {/* Weight Utilization */}
            <div className="p-4 sm:p-5">
              <div className="text-[11px] font-mono uppercase text-slate-400">Avg Weight Utilization</div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                {activeResult.summary?.avgWeightUtilization || 0}%
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {formatWeight(activeResult.totalWeightKg)} total gross
              </div>
            </div>

            {/* Volume Utilization */}
            <div className="p-4 sm:p-5">
              <div className="text-[11px] font-mono uppercase text-slate-400">Avg Cube Utilization</div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                {activeResult.summary?.avgVolumeUtilization || 0}%
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {formatVolume(activeResult.totalVolumeM3)} packed cube
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommended Container Allocations Section */}
      {currentAllocations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recommended Container Allocations</h3>
              <p className="text-xs text-slate-500">
                Packed transport units with dynamic weight/volume gauges and order manifests
              </p>
            </div>
            <div className="text-xs font-mono text-slate-400">
              {currentAllocations.length} allocated units
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentAllocations.map((alloc, idx) => {
              const isOverWeight = alloc.allocatedWeightKg > alloc.maxWeightKg;
              const isOverVol = alloc.allocatedVolumeM3 > alloc.maxVolumeM3;
              const isViolated = isOverWeight || isOverVol;
              const isNearCapacity = alloc.compositeUtilizationPct >= 85 && !isViolated;
              const isExpanded = expandedContainer === alloc.containerCode;

              return (
                <div
                  key={idx}
                  className={`bg-white rounded-xl border transition-all overflow-hidden ${
                    isViolated
                      ? 'border-red-500 shadow-md ring-1 ring-red-500'
                      : isNearCapacity
                      ? 'border-amber-300 shadow-xs'
                      : 'border-slate-200 shadow-xs'
                  }`}
                >
                  {/* Container Header */}
                  <div className="p-4 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-base text-slate-900">
                          {alloc.containerCode}
                        </span>
                        {alloc.isManuallyModified && (
                          <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                            Modified
                          </span>
                        )}
                        {isViolated && (
                          <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                            Over Capacity!
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {formatMAD(alloc.costMad)}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                      <span className="truncate">{alloc.containerTypeName}</span>
                      <span className="font-mono text-[11px] text-slate-400 shrink-0">
                        {alloc.assignedOrders.length} orders &bull; {alloc.items.length} items
                      </span>
                    </div>
                  </div>

                  {/* Utilization Gauges */}
                  <div className="p-4 space-y-3.5 bg-slate-50/50">
                    {/* Weight Utilization */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-600 flex items-center gap-1">
                          <Scale className="w-3.5 h-3.5 text-slate-400" /> Weight Utilization
                        </span>
                        <span
                          className={`font-mono font-bold ${
                            isOverWeight
                              ? 'text-red-600'
                              : alloc.weightUtilizationPct >= 85
                              ? 'text-amber-600'
                              : 'text-slate-800'
                          }`}
                        >
                          {alloc.weightUtilizationPct}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isOverWeight
                              ? 'bg-red-500'
                              : alloc.weightUtilizationPct >= 85
                              ? 'bg-amber-500'
                              : 'bg-blue-600'
                          }`}
                          style={{ width: `${Math.min(100, alloc.weightUtilizationPct)}%` }}
                        />
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-1 flex justify-between">
                        <span>{formatWeight(alloc.allocatedWeightKg)} loaded</span>
                        <span>{formatWeight(alloc.maxWeightKg)} limit</span>
                      </div>
                    </div>

                    {/* Volume Utilization */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-600 flex items-center gap-1">
                          <Box className="w-3.5 h-3.5 text-slate-400" /> Cube Volume Utilization
                        </span>
                        <span
                          className={`font-mono font-bold ${
                            isOverVol
                              ? 'text-red-600'
                              : alloc.volumeUtilizationPct >= 85
                              ? 'text-amber-600'
                              : 'text-slate-800'
                          }`}
                        >
                          {alloc.volumeUtilizationPct}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isOverVol
                              ? 'bg-red-500'
                              : alloc.volumeUtilizationPct >= 85
                              ? 'bg-amber-500'
                              : 'bg-purple-600'
                          }`}
                          style={{ width: `${Math.min(100, alloc.volumeUtilizationPct)}%` }}
                        />
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-1 flex justify-between">
                        <span>{formatVolume(alloc.allocatedVolumeM3)} packed</span>
                        <span>{formatVolume(alloc.maxVolumeM3)} limit</span>
                      </div>
                    </div>
                  </div>

                  {/* Orders In Container Header */}
                  <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      onClick={() =>
                        setExpandedContainer(isExpanded ? null : alloc.containerCode)
                      }
                      className="text-slate-700 font-semibold hover:text-blue-600 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Assigned Orders ({alloc.assignedOrders.length})</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <div className="flex items-center gap-1 font-mono text-[10px]">
                      {alloc.assignedOrders.slice(0, 3).map((on) => (
                        <span
                          key={on}
                          className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200"
                        >
                          {on}
                        </span>
                      ))}
                      {alloc.assignedOrders.length > 3 && (
                        <span className="text-slate-400">+{alloc.assignedOrders.length - 3}</span>
                      )}
                    </div>
                  </div>

                  {/* Expandable items details with manual adjust button */}
                  {isExpanded && (
                    <div className="p-3 bg-slate-50/70 border-t border-slate-100 space-y-2 text-xs">
                      {alloc.items.map((it, itIdx) => (
                        <div
                          key={itIdx}
                          className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 gap-2"
                        >
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-800 truncate">{it.itemName}</div>
                            <div className="text-[10px] text-slate-400 font-mono truncate">
                              {it.orderNumber} &bull; {it.quantity} pcs ({it.weightKg} kg, {it.volumeM3} m³)
                            </div>
                          </div>
                          <button
                            onClick={() => handleOpenManualModal(idx, itIdx, it)}
                            className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 px-2 py-1 rounded bg-blue-50 border border-blue-200 shrink-0 cursor-pointer"
                          >
                            Move &rarr;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State before running */}
      {!activeResult && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs">
          <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Optimization Plan Generated Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
            Configure order splitting preferences above and click <strong>"Run Daily Optimization"</strong> to compute the minimal container allocation for today's shipments.
          </p>
          <div className="mt-5 flex justify-center">
            <button
              onClick={handleStartRun}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              Launch Daily Packing Engine
            </button>
          </div>
        </div>
      )}

      {/* MANUAL ADJUSTMENT MODAL */}
      {isManualModalOpen && selectedItemToMove && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Manually Move Cargo</h3>
                <p className="text-xs text-slate-500">
                  Transfer package units to a different transport container
                </p>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div className="font-bold text-slate-900">{selectedItemToMove.item.itemName}</div>
                <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                  Order: {selectedItemToMove.item.orderNumber} &bull; SKU: {selectedItemToMove.item.itemSku}
                </div>
                <div className="text-slate-500 font-mono text-[11px]">
                  Available: {selectedItemToMove.item.quantity} units (
                  {selectedItemToMove.item.weightKg} kg &bull; {selectedItemToMove.item.volumeM3} m³)
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantity to Move
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedItemToMove.item.quantity}
                  value={moveQuantity}
                  onChange={(e) => setMoveQuantity(parseInt(e.target.value) || 1)}
                  className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Destination Container
                </label>
                <select
                  value={targetContainerIndex}
                  onChange={(e) => setTargetContainerIndex(parseInt(e.target.value))}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
                >
                  {currentAllocations.map((alloc, idx) => (
                    <option
                      key={idx}
                      value={idx}
                      disabled={idx === selectedItemToMove.sourceContainerIndex}
                    >
                      {alloc.containerCode} - {alloc.containerTypeName} (Weight: {alloc.weightUtilizationPct}%, Volume: {alloc.volumeUtilizationPct}%)
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 leading-relaxed">
                Moving items dynamically recalculates payload weights, cubic space, and trip costs. If capacity limits are exceeded, the container will be flagged with a red alert.
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteMove}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
              >
                Execute Move &amp; Recalculate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
