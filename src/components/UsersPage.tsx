import React, { useState } from 'react';
import {
  UserCheck,
  Plus,
  Trash2,
  Shield,
  User as UserIcon,
  X,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  Lock,
  UserX,
  AlertTriangle,
  Power,
  RotateCcw,
} from 'lucide-react';
import { User, Role } from '../types/index.ts';

interface UsersPageProps {
  users: User[];
  onCreateUser: (u: Partial<User>) => Promise<void>;
  onUpdateUser: (id: string, u: Partial<User>) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
}

export const UsersPage: React.FC<UsersPageProps> = ({
  users,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
}) => {
  // Create User Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('20052005');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>('operator');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Reset Password Modal
  const [passwordResetUser, setPasswordResetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // Delete User In-App Confirmation Modal
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!name.trim()) {
      setFormError('Full name is required.');
      return;
    }

    if (!trimmedEmail) {
      setFormError('Email address is required.');
      return;
    }

    if (!trimmedPassword || trimmedPassword.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onCreateUser({
        name: name.trim(),
        email: trimmedEmail,
        role,
        password: trimmedPassword,
        status: 'active',
      });
      setIsModalOpen(false);
      setName('');
      setEmail('');
      setPassword('20052005');
      setRole('operator');
    } catch (err: any) {
      setFormError(err.message || 'Failed to create user account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordResetUser) return;
    if (!newPassword.trim() || newPassword.trim().length < 6) {
      return;
    }

    try {
      setIsResetting(true);
      await onUpdateUser(passwordResetUser.id, {
        password: newPassword.trim(),
      });
      setResetSuccessMessage(`Password updated for ${passwordResetUser.email}!`);
      setTimeout(() => {
        setPasswordResetUser(null);
        setNewPassword('');
        setResetSuccessMessage(null);
      }, 1000);
    } catch (err: any) {
      setResetSuccessMessage(err.message || 'Failed to update password');
    } finally {
      setIsResetting(false);
    }
  };

  const handleToggleDeactivation = async (u: User) => {
    const newStatus = u.status === 'deactivated' ? 'active' : 'deactivated';
    try {
      await onUpdateUser(u.id, { status: newStatus });
    } catch (err: any) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      setIsDeleting(true);
      await onDeleteUser(userToDelete.id);
      setUserToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete user:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeactivateInstead = async () => {
    if (!userToDelete) return;
    try {
      setIsDeleting(true);
      await onUpdateUser(userToDelete.id, { status: 'deactivated' });
      setUserToDelete(null);
    } catch (err: any) {
      console.error('Failed to deactivate user:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Top Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Personnel &amp; User Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage authorized staff accounts, role permissions (Administrator vs Operator), and corporate access statuses
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-mono text-[11px]">
              <tr>
                <th className="px-4 py-3">Staff Member</th>
                <th className="px-4 py-3">Corporate Email (Login ID)</th>
                <th className="px-4 py-3">Access Status</th>
                <th className="px-4 py-3">Security Role</th>
                <th className="px-4 py-3">Permission Scope</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const isDeactivated = u.status === 'deactivated';
                return (
                  <tr key={u.id} className={`hover:bg-slate-50/80 transition-colors ${isDeactivated ? 'bg-slate-50/60 opacity-80' : ''}`}>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${
                            isDeactivated
                              ? 'bg-amber-100 border-amber-300 text-amber-800'
                              : 'bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          {u.name ? u.name[0].toUpperCase() : 'U'}
                        </div>
                        <span className={`truncate ${isDeactivated ? 'line-through text-slate-500' : ''}`}>
                          {u.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-700 font-medium">
                      {u.email}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${
                          isDeactivated
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isDeactivated ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                        <span>{isDeactivated ? 'Deactivated' : 'Active'}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => onUpdateUser(u.id, { role: e.target.value as Role })}
                        className={`text-[11px] font-mono font-bold uppercase px-2 py-0.5 rounded border focus:outline-none cursor-pointer ${
                          u.role === 'admin'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        <option value="admin">Administrator</option>
                        <option value="operator">Logistics Operator</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-[11px]">
                      {u.role === 'admin'
                        ? 'Full Access: Users, Fleet, Catalog, Packaging & Analytics'
                        : 'Operator: Order Intake, Vector Bin Packing & Manifest Dispatch'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Temporal Deactivation / Activation Toggle */}
                        <button
                          onClick={() => handleToggleDeactivation(u)}
                          className={`p-1.5 rounded transition-colors cursor-pointer ${
                            isDeactivated
                              ? 'text-emerald-600 hover:bg-emerald-50'
                              : 'text-amber-600 hover:bg-amber-50'
                          }`}
                          title={isDeactivated ? 'Activate user access' : 'Temporarily deactivate user'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>

                        {/* Password Reset */}
                        <button
                          onClick={() => {
                            setPasswordResetUser(u);
                            setNewPassword('');
                            setResetSuccessMessage(null);
                          }}
                          className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                          title="Change / Reset Password"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete User */}
                        <button
                          onClick={() => setUserToDelete(u)}
                          disabled={users.length <= 1}
                          className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 transition-colors disabled:opacity-30 cursor-pointer"
                          title={users.length <= 1 ? 'Cannot delete only administrator' : 'Delete user'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. Modal: Add New Staff Member */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Staff Member</h3>
                  <p className="text-[11px] text-slate-500">Create a new corporate account with custom access role</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                  {formError}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Karim Bennani"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate Email Address (Login ID) *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="karim@truck.com"
                  className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Login Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password (min. 6 characters)"
                    className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg pl-3 pr-9 py-2 focus:outline-none focus:border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  Minimum 6 characters. The user will use this password to sign in.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Platform Role *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  <option value="operator">Logistics Operator (Orders, Fleet &amp; Optimization)</option>
                  <option value="admin">Administrator (Full Access &amp; Personnel Management)</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Creating...' : 'Create Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Change / Reset Password */}
      {passwordResetUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Change Password</h3>
                  <p className="text-[11px] font-mono text-slate-500 truncate max-w-[180px]">{passwordResetUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setPasswordResetUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="p-4 space-y-4">
              {resetSuccessMessage ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{resetSuccessMessage}</span>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">New Security Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        autoFocus
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password (min. 6 characters)"
                        className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg pl-3 pr-9 py-2 focus:outline-none focus:border-purple-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setPasswordResetUser(null)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isResetting || !newPassword}
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      {isResetting ? 'Saving...' : 'Update Password'}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* 3. In-App Delete Confirmation Modal (NO window.confirm!) */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Confirm User Action</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    You are removing account <strong className="font-mono text-slate-900">{userToDelete.email}</strong> ({userToDelete.name}).
                  </p>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 space-y-1">
                <div className="font-semibold">Recommended Security Practice:</div>
                <p>
                  You can <strong>temporarily deactivate</strong> this account to immediately block all sign-ins while preserving audit records, or permanently delete it.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  disabled={isDeleting}
                  className="px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeactivateInstead}
                  disabled={isDeleting}
                  className="px-3.5 py-2 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg cursor-pointer transition-colors"
                >
                  Deactivate Instead
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs cursor-pointer transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
