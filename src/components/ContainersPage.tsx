import React, { useState } from 'react';
import {
  Truck,
  Plus,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  Layers,
  DollarSign,
  MapPin,
  Scale,
  Box,
} from 'lucide-react';
import { Container, ContainerType } from '../types/index.ts';
import { formatMAD, formatWeight, formatVolume } from '../utils/formatters.ts';

interface ContainersPageProps {
  containers: Container[];
  containerTypes: ContainerType[];
  onCreateContainer: (c: Partial<Container>) => Promise<void>;
  onUpdateContainer: (id: string, c: Partial<Container>) => Promise<void>;
  onDeleteContainer: (id: string) => Promise<void>;
  onCreateContainerType: (ct: Partial<ContainerType>) => Promise<void>;
  onUpdateContainerType?: (id: string, ct: Partial<ContainerType>) => Promise<void>;
  onDeleteContainerType?: (id: string) => Promise<void>;
}

export const ContainersPage: React.FC<ContainersPageProps> = ({
  containers,
  containerTypes,
  onCreateContainer,
  onUpdateContainer,
  onDeleteContainer,
  onCreateContainerType,
  onUpdateContainerType,
  onDeleteContainerType,
}) => {
  const [activeTab, setActiveTab] = useState<'FLEET' | 'TYPES'>('FLEET');

  // Add / Edit Container Modals
  const [isAddContainerModal, setIsAddContainerModal] = useState(false);
  const [editingContainer, setEditingContainer] = useState<Container | null>(null);

  // Add / Edit Container Type Modals
  const [isAddTypeModal, setIsAddTypeModal] = useState(false);
  const [editingType, setEditingType] = useState<ContainerType | null>(null);

  // In-app Delete Modals (NO window.confirm!)
  const [containerToDelete, setContainerToDelete] = useState<Container | null>(null);
  const [typeToDelete, setTypeToDelete] = useState<ContainerType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Container Form State
  const [containerCode, setContainerCode] = useState('');
  const [selectedTypeId, setSelectedTypeId] = useState(containerTypes[0]?.id || '');
  const [location, setLocation] = useState('Casablanca Port Hub');
  const [status, setStatus] = useState<'Available' | 'Allocated' | 'Prepared' | 'Dispatched' | 'Maintenance'>('Available');

  // Type Form State
  const [typeName, setTypeName] = useState('');
  const [typeDesc, setTypeDesc] = useState('');
  const [maxWeight, setMaxWeight] = useState<number | ''>(5000);
  const [maxVol, setMaxVol] = useState<number | ''>(30);
  const [costMad, setCostMad] = useState<number | ''>(1000);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Open Create Container Modal
  const handleOpenAddContainer = () => {
    setContainerCode(`TRK-${Math.floor(100 + Math.random() * 900)}`);
    setSelectedTypeId(containerTypes[0]?.id || '');
    setLocation('Casablanca Port Hub');
    setStatus('Available');
    setFormError(null);
    setIsAddContainerModal(true);
  };

  // Open Edit Container Modal
  const handleOpenEditContainer = (c: Container) => {
    setEditingContainer(c);
    setContainerCode(c.code);
    setSelectedTypeId(c.type_id || containerTypes[0]?.id || '');
    setLocation(c.current_location || 'Casablanca Hub');
    setStatus(c.status);
    setFormError(null);
  };

  // Open Create Type Modal
  const handleOpenAddType = () => {
    setTypeName('');
    setTypeDesc('');
    setMaxWeight(6000);
    setMaxVol(35);
    setCostMad(1200);
    setFormError(null);
    setIsAddTypeModal(true);
  };

  // Open Edit Type Modal
  const handleOpenEditType = (ct: ContainerType) => {
    setEditingType(ct);
    setTypeName(ct.name);
    setTypeDesc(ct.description || '');
    setMaxWeight(ct.max_weight_kg);
    setMaxVol(ct.max_volume_m3);
    setCostMad(ct.cost_mad);
    setFormError(null);
  };

  // Submit Create Container
  const handleSubmitContainer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const chosenType = containerTypes.find((t) => t.id === selectedTypeId);

    try {
      setIsSubmitting(true);
      await onCreateContainer({
        code: containerCode.trim().toUpperCase(),
        type_id: selectedTypeId,
        type_name: chosenType?.name || 'Standard Unit',
        max_weight_kg: chosenType?.max_weight_kg || 1000,
        max_volume_m3: chosenType?.max_volume_m3 || 10,
        cost_mad: chosenType?.cost_mad || 500,
        status,
        current_location: location.trim(),
      });
      setIsAddContainerModal(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to add transport unit');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edit Container
  const handleSubmitEditContainer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContainer) return;
    setFormError(null);
    const chosenType = containerTypes.find((t) => t.id === selectedTypeId);

    try {
      setIsSubmitting(true);
      await onUpdateContainer(editingContainer.id, {
        code: containerCode.trim().toUpperCase(),
        type_id: selectedTypeId,
        type_name: chosenType?.name || editingContainer.type_name,
        max_weight_kg: chosenType?.max_weight_kg || editingContainer.max_weight_kg,
        max_volume_m3: chosenType?.max_volume_m3 || editingContainer.max_volume_m3,
        cost_mad: chosenType?.cost_mad || editingContainer.cost_mad,
        status,
        current_location: location.trim(),
      });
      setEditingContainer(null);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update container');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Create Type
  const handleSubmitType = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (Number(maxWeight) <= 0 || Number(maxVol) <= 0 || Number(costMad) < 0) {
      setFormError('Capacities must be greater than zero and cost cannot be negative.');
      return;
    }
    try {
      setIsSubmitting(true);
      await onCreateContainerType({
        name: typeName.trim(),
        description: typeDesc.trim(),
        max_weight_kg: Number(maxWeight),
        max_volume_m3: Number(maxVol),
        cost_mad: Number(costMad),
      });
      setIsAddTypeModal(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create container model');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edit Type
  const handleSubmitEditType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingType || !onUpdateContainerType) return;
    setFormError(null);
    if (Number(maxWeight) <= 0 || Number(maxVol) <= 0 || Number(costMad) < 0) {
      setFormError('Capacities must be greater than zero and cost cannot be negative.');
      return;
    }
    try {
      setIsSubmitting(true);
      await onUpdateContainerType(editingType.id, {
        name: typeName.trim(),
        description: typeDesc.trim(),
        max_weight_kg: Number(maxWeight),
        max_volume_m3: Number(maxVol),
        cost_mad: Number(costMad),
      });
      setEditingType(null);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update container model');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Execute Delete Physical Container
  const handleConfirmDeleteContainer = async () => {
    if (!containerToDelete) return;
    try {
      setIsDeleting(true);
      await onDeleteContainer(containerToDelete.id);
      setContainerToDelete(null);
    } catch (err: any) {
      console.error('Delete container error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Execute Delete Container Model
  const handleConfirmDeleteType = async () => {
    if (!typeToDelete || !onDeleteContainerType) return;
    try {
      setIsDeleting(true);
      await onDeleteContainerType(typeToDelete.id);
      setTypeToDelete(null);
    } catch (err: any) {
      console.error('Delete model error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* View Switcher Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('FLEET')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'FLEET'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Physical Fleet ({containers.length})
          </button>
          <button
            onClick={() => setActiveTab('TYPES')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'TYPES'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Container Models ({containerTypes.length})
          </button>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {activeTab === 'FLEET' ? (
            <button
              onClick={handleOpenAddContainer}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Container</span>
            </button>
          ) : (
            <button
              onClick={handleOpenAddType}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Define Container Model</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'FLEET' ? (
        /* Physical Containers Table */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[720px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-mono text-[11px]">
                <tr>
                  <th className="px-4 py-3">Container ID / Code</th>
                  <th className="px-4 py-3">Model / Type</th>
                  <th className="px-4 py-3 text-right">Max Weight</th>
                  <th className="px-4 py-3 text-right">Max Volume</th>
                  <th className="px-4 py-3 text-right">Trip Cost</th>
                  <th className="px-4 py-3">Depot Location</th>
                  <th className="px-4 py-3">Operational Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {containers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                        <Truck className="w-10 h-10 text-slate-300" />
                        <span className="font-semibold text-slate-700 text-sm">No Fleet Units Registered</span>
                        <p className="text-xs text-slate-500 max-w-sm">
                          No fleet units registered yet. Click 'Add Container' to register cargo vans, rigid trucks, or intermodal containers.
                        </p>
                        <button
                          onClick={handleOpenAddContainer}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add First Container</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  containers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-blue-600 flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{c.code}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{c.type_name}</td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-slate-900">
                        {formatWeight(c.max_weight_kg)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-slate-900">
                        {formatVolume(c.max_volume_m3)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">
                        {formatMAD(c.cost_mad)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{c.current_location}</td>
                      <td className="px-4 py-3">
                        <select
                          value={c.status}
                          onChange={(e) => onUpdateContainer(c.id, { status: e.target.value as any })}
                          className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border focus:outline-none cursor-pointer ${
                            c.status === 'Available'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : c.status === 'Prepared'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : c.status === 'Dispatched'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <option value="Available">Available</option>
                          <option value="Allocated">Allocated</option>
                          <option value="Prepared">Prepared</option>
                          <option value="Dispatched">Dispatched</option>
                          <option value="Maintenance">Maintenance</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditContainer(c)}
                            className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                            title="Edit Container Specifications"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setContainerToDelete(c)}
                            className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                            title="Delete Container Unit"
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
      ) : (
        /* Container Types Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {containerTypes.length === 0 ? (
            <div className="col-span-full bg-white p-8 rounded-xl border border-slate-200 text-center space-y-3">
              <Box className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No Container Models Defined</p>
              <p className="text-xs text-slate-500">Create container models to define weight, volume and cost limits.</p>
              <button
                onClick={handleOpenAddType}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Define First Model</span>
              </button>
            </div>
          ) : (
            containerTypes.map((ct) => (
              <div
                key={ct.id}
                className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all relative group"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2">
                    <h4 className="font-bold text-slate-900 text-sm truncate">{ct.name}</h4>
                    <span className="font-mono text-xs font-bold text-blue-600 px-2 py-0.5 rounded bg-blue-50 border border-blue-200 shrink-0">
                      {formatMAD(ct.cost_mad)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 min-h-8 leading-relaxed line-clamp-2">{ct.description || 'Standard fleet transport container specification.'}</p>

                  <div className="mt-4 space-y-2 font-mono text-xs">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                      <span className="text-slate-500">Max Weight:</span>
                      <strong className="text-slate-900">{formatWeight(ct.max_weight_kg)}</strong>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                      <span className="text-slate-500">Max Volume:</span>
                      <strong className="text-slate-900">{formatVolume(ct.max_volume_m3)}</strong>
                    </div>
                  </div>
                </div>

                {/* Model Action Toolbar */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-mono text-slate-400">Spec ID: {ct.id.slice(0, 8)}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditType(ct)}
                      className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                      title="Edit Model Specifications"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setTypeToDelete(ct)}
                      className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Delete Container Model"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 1. ADD PHYSICAL CONTAINER MODAL */}
      {isAddContainerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Add Transport Unit</h3>
              <button
                onClick={() => setIsAddContainerModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitContainer} className="p-4 sm:p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                  {formError}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Container Code *</label>
                <input
                  type="text"
                  required
                  value={containerCode}
                  onChange={(e) => setContainerCode(e.target.value)}
                  placeholder="e.g. TRK-101"
                  className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Model / Type *</label>
                <select
                  value={selectedTypeId}
                  onChange={(e) => setSelectedTypeId(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  {containerTypes.map((ct) => (
                    <option key={ct.id} value={ct.id}>
                      {ct.name} ({ct.max_weight_kg} kg | {ct.max_volume_m3} m³ &bull; {ct.cost_mad} MAD)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Depot / Hub Location *</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Casablanca Port Hub"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  <option value="Available">Available for Dispatch</option>
                  <option value="Allocated">Allocated to Plan</option>
                  <option value="Prepared">Prepared / Staged</option>
                  <option value="Dispatched">Dispatched</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddContainerModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Registering...' : 'Add Container'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. EDIT PHYSICAL CONTAINER MODAL */}
      {editingContainer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Container Unit</h3>
                <p className="text-[11px] font-mono text-slate-500">{editingContainer.code}</p>
              </div>
              <button
                onClick={() => setEditingContainer(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitEditContainer} className="p-4 sm:p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                  {formError}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Container Code *</label>
                <input
                  type="text"
                  required
                  value={containerCode}
                  onChange={(e) => setContainerCode(e.target.value)}
                  className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Model / Specification *</label>
                <select
                  value={selectedTypeId}
                  onChange={(e) => setSelectedTypeId(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  {containerTypes.map((ct) => (
                    <option key={ct.id} value={ct.id}>
                      {ct.name} ({ct.max_weight_kg} kg | {ct.max_volume_m3} m³ &bull; {ct.cost_mad} MAD)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Depot / Hub Location *</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Operational Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  <option value="Available">Available</option>
                  <option value="Allocated">Allocated</option>
                  <option value="Prepared">Prepared</option>
                  <option value="Dispatched">Dispatched</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingContainer(null)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. DEFINE CONTAINER MODEL MODAL */}
      {isAddTypeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Define Container Model</h3>
              <button
                onClick={() => setIsAddTypeModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitType} className="p-4 sm:p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                  {formError}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Model Name *</label>
                <input
                  type="text"
                  required
                  value={typeName}
                  onChange={(e) => setTypeName(e.target.value)}
                  placeholder="e.g. Heavy Duty Semi-Trailer (40ft)"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={typeDesc}
                  onChange={(e) => setTypeDesc(e.target.value)}
                  placeholder="e.g. Long-haul intercity freight transport"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Weight (kg) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    step={10}
                    value={maxWeight}
                    onChange={(e) => setMaxWeight(e.target.value ? Number(e.target.value) : '')}
                    className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Volume (m³) *</label>
                  <input
                    type="number"
                    required
                    min={0.1}
                    step={0.1}
                    value={maxVol}
                    onChange={(e) => setMaxVol(e.target.value ? Number(e.target.value) : '')}
                    className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Base Trip Cost (MAD) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  step={10}
                  value={costMad}
                  onChange={(e) => setCostMad(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddTypeModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Create Model'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. EDIT CONTAINER MODEL MODAL */}
      {editingType && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Container Model</h3>
                <p className="text-[11px] font-mono text-slate-500">{editingType.name}</p>
              </div>
              <button
                onClick={() => setEditingType(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitEditType} className="p-4 sm:p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                  {formError}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Model Name *</label>
                <input
                  type="text"
                  required
                  value={typeName}
                  onChange={(e) => setTypeName(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={typeDesc}
                  onChange={(e) => setTypeDesc(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Weight (kg) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    step={10}
                    value={maxWeight}
                    onChange={(e) => setMaxWeight(e.target.value ? Number(e.target.value) : '')}
                    className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Volume (m³) *</label>
                  <input
                    type="number"
                    required
                    min={0.1}
                    step={0.1}
                    value={maxVol}
                    onChange={(e) => setMaxVol(e.target.value ? Number(e.target.value) : '')}
                    className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Base Trip Cost (MAD) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  step={10}
                  value={costMad}
                  onChange={(e) => setCostMad(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingType(null)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. DELETE CONTAINER IN-APP MODAL (NO window.confirm!) */}
      {containerToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Delete Transport Unit</h3>
                  <p className="text-xs text-slate-500 font-mono">{containerToDelete.code}</p>
                </div>
              </div>
              <p className="text-xs text-slate-600">
                Are you sure you want to delete container unit <strong className="font-mono text-slate-900">{containerToDelete.code}</strong> ({containerToDelete.type_name})? This action cannot be undone.
              </p>
              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setContainerToDelete(null)}
                  disabled={isDeleting}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteContainer}
                  disabled={isDeleting}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs cursor-pointer transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Container'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. DELETE CONTAINER MODEL IN-APP MODAL (NO window.confirm!) */}
      {typeToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Delete Model Specification</h3>
                  <p className="text-xs text-slate-500">{typeToDelete.name}</p>
                </div>
              </div>
              <p className="text-xs text-slate-600">
                Are you sure you want to delete container specification <strong className="text-slate-900">{typeToDelete.name}</strong>? Physical containers using this specification will need reassignment.
              </p>
              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTypeToDelete(null)}
                  disabled={isDeleting}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteType}
                  disabled={isDeleting}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs cursor-pointer transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Model'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
