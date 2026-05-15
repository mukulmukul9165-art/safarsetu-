import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUserShield, FaEdit, FaTimesCircle, FaLock, FaPhoneAlt, FaEye, FaEyeSlash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { api } from '../../lib/api.js';

const SuperadminDashboard = () => {
  const [admins, setAdmins] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [showPasswordMap, setShowPasswordMap] = useState({});
  const [newPassword, setNewPassword] = useState('');

  const loadAdmins = useCallback(async () => {
    try {
      const list = await api('/api/superadmin/admins');
      setAdmins(Array.isArray(list) ? list : []);
    } catch (e) {
      toast.error(e.message || 'Failed to load admins');
    }
  }, []);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  const togglePasswordVisibility = (id) => {
    setShowPasswordMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleEditClick = (admin) => {
    setEditingAdmin({ ...admin });
    setNewPassword('');
    setShowEditModal(true);
  };

  const handleSaveAdmin = async (e) => {
    e.preventDefault();
    try {
      const body = { phone: editingAdmin.phone };
      if (newPassword.trim()) body.password = newPassword.trim();
      await api(`/api/superadmin/admins/${editingAdmin.id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      await loadAdmins();
      toast.success('Admin credentials updated!');
      setShowEditModal(false);
    } catch (err) {
      toast.error(err.message || 'Update failed');
    }
  };

  return (
    <div className="pt-20 pb-8 px-3 sm:px-4 lg:px-6 bg-background min-h-screen text-dark">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4 sm:p-8">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-2xl font-black tracking-tighter uppercase italic flex items-center gap-3">
              <FaUserShield className="text-primary" /> Superadmin Controls
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-muted text-[10px] uppercase tracking-widest border-b border-border">
                  <th className="pb-4">Admin Name</th>
                  <th className="pb-4">Phone Number</th>
                  <th className="pb-4">Password</th>
                  <th className="pb-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {admins.map((a) => (
                  <tr key={a.id} className="border-b border-border hover:bg-dark/5 transition-all group">
                    <td className="py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {a.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-dark">{a.name}</p>
                          <p className="text-[10px] text-primary font-black uppercase tracking-widest">{a.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 text-muted font-medium tracking-wide">+91 {a.phone}</td>
                    <td className="py-5">
                      <div className="flex items-center gap-3 bg-dark/5 px-3 py-1.5 rounded-lg w-max border border-border">
                        <span className="font-mono text-muted tracking-wider text-xs">
                          {showPasswordMap[a.id] ? '(set via Edit)' : '••••••••'}
                        </span>
                        <button
                          onClick={() => togglePasswordVisibility(a.id)}
                          className="text-muted hover:text-primary transition-colors"
                          type="button"
                          title={showPasswordMap[a.id] ? 'Hide' : 'Show'}
                        >
                          {showPasswordMap[a.id] ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                        </button>
                      </div>
                    </td>
                    <td className="py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(a)}
                          className="px-4 py-2 bg-primary/10 text-primary font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-primary hover:text-dark transition-all flex items-center gap-2 border border-primary/20"
                          type="button"
                        >
                          <FaEdit /> Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showEditModal && editingAdmin && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="absolute inset-0 bg-background/95 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card w-full max-w-md p-5 sm:p-8 relative z-10 border-primary/20"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-dark">Edit Admin</h3>
                <button onClick={() => setShowEditModal(false)} className="text-muted hover:text-dark" type="button">
                  <FaTimesCircle size={20} />
                </button>
              </div>
              <form onSubmit={handleSaveAdmin} className="space-y-6">
                <div className="space-y-4">
                  <div className="relative">
                    <FaPhoneAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="text"
                      placeholder="Admin Phone"
                      value={editingAdmin?.phone || ''}
                      onChange={(e) => setEditingAdmin({ ...editingAdmin, phone: e.target.value })}
                      className="input-field pl-12"
                      required
                    />
                  </div>
                  <div className="relative">
                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="password"
                      placeholder="New password (leave blank to keep)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input-field pl-12"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full btn-primary py-4 font-black uppercase tracking-widest shadow-xl shadow-primary/20">
                  Save Changes
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SuperadminDashboard;
