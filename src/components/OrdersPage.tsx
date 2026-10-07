import React, { useState, useMemo } from 'react';
import {
  PackageSearch,
  Plus,
  Search,
  Filter,
  Trash2,
  Eye,
  CheckCircle2,
  Calendar,
  Layers,
  Scale,
  Box,
  X,
  AlertTriangle,
} from 'lucide-react';
import { Order, Customer, Item, OrderStatus, PriorityLevel } from '../types/index.ts';
import { formatWeight, formatVolume } from '../utils/formatters.ts';

interface OrdersPageProps {
  orders: Order[];
  customers: Customer[];
  items: Item[];
  onCreateOrder: (payload: {
    customer_id: string;
    priority: PriorityLevel;
    notes?: string;
    items: { item_id: string; quantity: number }[];
  }) => Promise<void>;
  onUpdateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  onDeleteOrder: (id: string) => Promise<void>;
  onSelectOrderDetail: (id: string) => Promise<void>;
  selectedOrderDetails: Order | null;
  onCloseOrderDetail: () => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({
  orders,
  customers,
  items,
  onCreateOrder,
  onUpdateOrderStatus,
  onDeleteOrder,
  onSelectOrderDetail,
  selectedOrderDetails,
  onCloseOrderDetail,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Order Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('Standard');
  const [notes, setNotes] = useState('');
  const [orderLines, setOrderLines] = useState<{ itemId: string; quantity: number }[]>([
    { itemId: '', quantity: 1 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        o.order_number.toLowerCase().includes(search.toLowerCase()) ||
        o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        (o.customer_city && o.customer_city.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  // Live calculation of new order total weight and volume
  const liveCalculation = useMemo(() => {
    let weight = 0;
    let volume = 0;
    let units = 0;

    for (const line of orderLines) {
      if (!line.itemId || line.quantity <= 0) continue;
      const it = items.find((i) => i.id === line.itemId);
      if (it) {
        weight += it.weight_kg * line.quantity;
        volume += it.volume_m3 * line.quantity;
        units += line.quantity;
      }
    }

    return {
      weight: Math.round(weight * 100) / 100,
      volume: Math.round(volume * 1000) / 1000,
      units,
    };
  }, [orderLines, items]);

  const handleAddLine = () => {
    setOrderLines([...orderLines, { itemId: '', quantity: 1 }]);
  };

  const handleRemoveLine = (idx: number) => {
    if (orderLines.length === 1) return;
    setOrderLines(orderLines.filter((_, i) => i !== idx));
  };

  const handleLineChange = (idx: number, field: 'itemId' | 'quantity', val: any) => {
    const updated = [...orderLines];
    updated[idx] = { ...updated[idx], [field]: val };
    setOrderLines(updated);
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedCustomerId) {
      setFormError('Please select a customer for this order.');
      return;
    }

    const validLines = orderLines.filter((l) => l.itemId && l.quantity > 0);
    if (validLines.length === 0) {
      setFormError('Please add at least one valid item with a quantity greater than zero.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onCreateOrder({
        customer_id: selectedCustomerId,
        priority,
        notes,
        items: validLines.map((l) => ({ item_id: l.itemId, quantity: Number(l.quantity) })),
      });
      setIsCreateModalOpen(false);
      // Reset form
      setSelectedCustomerId('');
      setPriority('Standard');
      setNotes('');
      setOrderLines([{ itemId: '', quantity: 1 }]);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search order #, customer name, destination..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-blue-600 transition-colors"
          />
        </div>

        {/* Status Filters & Create Button */}
        <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-start">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs overflow-x-auto max-w-full">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1 shrink-0" />
            {['ALL', 'Ready', 'Pending', 'Optimized', 'Dispatched'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
                  statusFilter === status
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Consignment</span>
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[760px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-mono text-[11px]">
              <tr>
                <th className="px-4 py-3">Order #</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3 text-center">Items</th>
                <th className="px-4 py-3 text-right">Gross Weight</th>
                <th className="px-4 py-3 text-right">Cube Volume</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    <PackageSearch className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <div>No orders matching filter criteria.</div>
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add New Consignment
                    </button>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">
                      <button
                        onClick={() => onSelectOrderDetail(ord.id)}
                        className="hover:underline flex items-center gap-1 cursor-pointer text-left"
                      >
                        {ord.order_number}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{ord.customer_name}</div>
                      <div className="text-[11px] text-slate-500">{ord.customer_city || 'Casablanca'}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">{ord.order_date}</td>
                    <td className="px-4 py-3">
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
                    <td className="px-4 py-3 text-center font-mono">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {ord.item_lines_count || 1} lines ({ord.total_units_count || ord.item_lines_count} pcs)
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-slate-900">
                      {formatWeight(ord.total_weight_kg)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-slate-900">
                      {formatVolume(ord.total_volume_m3)}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={ord.status}
                        onChange={(e) => onUpdateOrderStatus(ord.id, e.target.value as OrderStatus)}
                        className={`text-[11px] font-mono font-semibold px-2 py-1 rounded border focus:outline-none cursor-pointer ${
                          ord.status === 'Ready'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : ord.status === 'Optimized'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : ord.status === 'Packed'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : ord.status === 'Dispatched'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : ord.status === 'Delivered'
                            ? 'bg-teal-50 text-teal-700 border-teal-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Ready">Ready</option>
                        <option value="Optimized">Optimized</option>
                        <option value="Packed">Packed</option>
                        <option value="Dispatched">Dispatched</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onSelectOrderDetail(ord.id)}
                          className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                          title="Inspect Order Items"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteOrder(ord.id)}
                          className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete Order"
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

      {/* CREATE ORDER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Create New Freight Consignment</h3>
                <p className="text-xs text-slate-500">
                  Select customer and items. Weight and volume calculate automatically.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCreate} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer Account *
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    required
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
                  >
                    <option value="">Select Customer...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company_name} ({c.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dispatch Priority *
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
                  >
                    <option value="Standard">Standard</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold font-mono uppercase text-slate-700">
                    Order Items &amp; Quantities
                  </label>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Item Line
                  </button>
                </div>

                <div className="space-y-2 border border-slate-200 rounded-lg p-2.5 sm:p-3 bg-slate-50/50">
                  {orderLines.map((line, idx) => {
                    const chosenItem = items.find((i) => i.id === line.itemId);
                    return (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200"
                      >
                        <div className="flex-1 min-w-0">
                          <select
                            value={line.itemId}
                            onChange={(e) => handleLineChange(idx, 'itemId', e.target.value)}
                            required
                            className="w-full text-xs bg-white border border-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:border-blue-600 truncate"
                          >
                            <option value="">Select Item / SKU...</option>
                            {items.map((it) => (
                              <option key={it.id} value={it.id}>
                                {it.sku} &bull; {it.name} ({it.weight_kg} kg | {it.volume_m3} m³)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center justify-between sm:justify-start gap-2 shrink-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-slate-500 font-mono">Qty:</span>
                            <input
                              type="number"
                              min="1"
                              value={line.quantity}
                              onChange={(e) =>
                                handleLineChange(idx, 'quantity', parseInt(e.target.value) || 1)
                              }
                              className="w-20 text-xs font-mono bg-white border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-600 text-center"
                              placeholder="Qty"
                            />
                          </div>

                          {chosenItem && (
                            <div className="text-[11px] font-mono text-slate-500 sm:w-28 text-right shrink-0">
                              {(chosenItem.weight_kg * line.quantity).toFixed(1)} kg &bull;{' '}
                              {(chosenItem.volume_m3 * line.quantity).toFixed(2)} m³
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => handleRemoveLine(idx)}
                            disabled={orderLines.length === 1}
                            className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-30 rounded hover:bg-slate-100 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Automatic Calculation Card */}
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-[11px] font-mono uppercase font-bold text-blue-900">
                    Automatically Calculated Totals
                  </div>
                  <div className="text-xs text-blue-700">
                    Summed from catalog unit weight &amp; displacement specs
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">WEIGHT</span>
                    <strong className="text-slate-900 text-sm font-bold">
                      {liveCalculation.weight} kg
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">VOLUME</span>
                    <strong className="text-slate-900 text-sm font-bold">
                      {liveCalculation.volume} m³
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">TOTAL UNITS</span>
                    <strong className="text-slate-900 text-sm font-bold">
                      {liveCalculation.units} pcs
                    </strong>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dispatch Instructions &amp; Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Loading bay appointment required, delicate cargo packaging..."
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Creating Order...' : 'Submit Consignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ORDER DETAIL INSPECTOR MODAL */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold font-mono text-blue-600">
                    {selectedOrderDetails.order_number}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      selectedOrderDetails.priority === 'Urgent'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : selectedOrderDetails.priority === 'High'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {selectedOrderDetails.priority}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Customer: <strong>{selectedOrderDetails.customer_name}</strong> &bull; {selectedOrderDetails.order_date}
                </p>
              </div>
              <button
                onClick={onCloseOrderDetail}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              {/* Aggregated stats */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <div>
                  <div className="text-[10px] font-mono uppercase text-slate-500">Gross Weight</div>
                  <div className="text-base font-mono font-bold text-slate-900">
                    {formatWeight(selectedOrderDetails.total_weight_kg)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-slate-500">Cube Volume</div>
                  <div className="text-base font-mono font-bold text-slate-900">
                    {formatVolume(selectedOrderDetails.total_volume_m3)}
                  </div>
                </div>
              </div>

              {/* Line items table */}
              <div>
                <h4 className="text-xs font-mono uppercase font-bold text-slate-700 mb-2">
                  Contained Freight Items
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[360px]">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase">
                        <tr>
                          <th className="px-3 py-2">SKU &amp; Item</th>
                          <th className="px-3 py-2 text-center">Qty</th>
                          <th className="px-3 py-2 text-right">Weight</th>
                          <th className="px-3 py-2 text-right">Volume</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedOrderDetails.items?.map((it, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="px-3 py-2">
                              <div className="font-mono text-[11px] text-blue-600 font-semibold">{it.sku}</div>
                              <div className="text-slate-800">{it.item_name}</div>
                            </td>
                            <td className="px-3 py-2 text-center font-mono font-bold text-slate-700">
                              &times;{it.quantity}
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-slate-700">
                              {formatWeight(it.total_weight_kg)}
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-slate-700">
                              {formatVolume(it.total_volume_m3)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={onCloseOrderDetail}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
