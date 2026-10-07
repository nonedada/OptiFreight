import React, { useState, useMemo } from 'react';
import { Boxes, Box, Plus, Search, Filter, Edit, Trash2, X, AlertTriangle, Layers } from 'lucide-react';
import { Item } from '../types/index.ts';
import { formatWeight, formatVolume, formatNumber } from '../utils/formatters.ts';

interface ItemsPageProps {
  items: Item[];
  onCreateItem: (item: Partial<Item>) => Promise<void>;
  onUpdateItem: (id: string, item: Partial<Item>) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
}

export const ItemsPage: React.FC<ItemsPageProps> = ({
  items,
  onCreateItem,
  onUpdateItem,
  onDeleteItem,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Form State
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Automotive');
  const [weightKg, setWeightKg] = useState<number | ''>(10);
  const [volumeM3, setVolumeM3] = useState<number | ''>(0.05);
  const [stockQuantity, setStockQuantity] = useState<number | ''>(100);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((it) => set.add(it.category));
    return Array.from(set).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      const matchSearch =
        it.sku.toLowerCase().includes(search.toLowerCase()) ||
        it.name.toLowerCase().includes(search.toLowerCase()) ||
        it.category.toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === 'ALL' || it.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [items, search, categoryFilter]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setSku(`SKU-${Math.floor(100 + Math.random() * 900)}`);
    setName('');
    setDescription('');
    setCategory(categories[0] || 'General');
    setWeightKg(15);
    setVolumeM3(0.06);
    setStockQuantity(200);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (it: Item) => {
    setEditingItem(it);
    setSku(it.sku);
    setName(it.name);
    setDescription(it.description || '');
    setCategory(it.category);
    setWeightKg(it.weight_kg);
    setVolumeM3(it.volume_m3);
    setStockQuantity(it.stock_quantity);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (Number(weightKg) < 0 || Number(volumeM3) < 0 || Number(stockQuantity) < 0) {
      setFormError('Weight, volume, and stock quantity cannot be negative.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingItem) {
        await onUpdateItem(editingItem.id, {
          sku,
          name,
          description,
          category,
          weight_kg: Number(weightKg),
          volume_m3: Number(volumeM3),
          stock_quantity: Number(stockQuantity),
        });
      } else {
        await onCreateItem({
          sku,
          name,
          description,
          category,
          weight_kg: Number(weightKg),
          volume_m3: Number(volumeM3),
          stock_quantity: Number(stockQuantity),
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="FILTER BY SKU, PART NAME, OR CATEGORY..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:border-blue-600 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded border border-slate-200 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer pr-2"
            >
              <option value="ALL">All Categories ({items.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add SKU Item
          </button>
        </div>
      </div>

      {/* Items Grid / Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[720px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-mono text-[11px]">
              <tr>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Item Specification</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Unit Weight</th>
                <th className="px-4 py-3 text-right">Unit Volume</th>
                <th className="px-4 py-3 text-right">Density (kg/m³)</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                      <Box className="w-10 h-10 text-slate-300" />
                      <span className="font-semibold text-slate-700 text-sm">No SKUs in Catalog</span>
                      <p className="text-xs text-slate-500 max-w-sm">
                        Product catalog is empty. Click 'Add SKU Item' to register physical freight items with weight and volume.
                      </p>
                      <button
                        onClick={handleOpenCreate}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add First SKU</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((it) => {
                const density = it.volume_m3 > 0 ? Math.round(it.weight_kg / it.volume_m3) : 0;
                return (
                  <tr key={it.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">{it.sku}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{it.name}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">{it.description}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {it.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-slate-900">
                      {formatWeight(it.weight_kg)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-slate-900">
                      {formatVolume(it.volume_m3)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-500">
                      {density > 0 ? `${formatNumber(density)} kg/m³` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">
                      {formatNumber(it.stock_quantity)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(it)}
                          className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors"
                          title="Edit Item"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteItem(it.id)}
                          className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 transition-colors"
                          title="Delete Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl w-full max-w-lg">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editingItem ? 'Edit SKU Item' : 'Register New Item'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SKU *</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full text-xs font-mono bg-white border border-slate-300 rounded px-3 py-2 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                  <input
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded px-3 py-2 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded px-3 py-2 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded px-3 py-2 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Weight / Unit (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={weightKg}
                    onChange={(e) => setWeightKg(parseFloat(e.target.value) || '')}
                    className="w-full text-xs font-mono bg-white border border-slate-300 rounded px-3 py-2 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Volume / Unit (m³) *
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    required
                    value={volumeM3}
                    onChange={(e) => setVolumeM3(parseFloat(e.target.value) || '')}
                    className="w-full text-xs font-mono bg-white border border-slate-300 rounded px-3 py-2 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(parseInt(e.target.value) || '')}
                    className="w-full text-xs font-mono bg-white border border-slate-300 rounded px-3 py-2 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
