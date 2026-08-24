import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';
import { FaUserPlus, FaEdit, FaTrash, FaCheckCircle, FaTimesCircle, FaEye, FaEyeSlash } from 'react-icons/fa';

const PERMISSIONS_LIST = [
    { id: 'stats', label: 'Dashboard' },
    { id: 'users', label: 'Users Management' },
    { id: 'bookings', label: 'Booking Ledger' },
    { id: 'content', label: 'Pending Experiences' },
    { id: 'rejected', label: 'Rejected Experiences' },
    { id: 'active-experiences', label: 'Active Experiences' },
    { id: 'pending', label: 'Pending Vendors' },
    { id: 'verified', label: 'Active Vendors' },
    { id: 'homepage', label: 'Homepage Sections' },
    { id: 'applinks', label: 'App Store Links' },
    { id: 'testimonials', label: 'Testimonials' },
    { id: 'listing-rules', label: 'Listing Rules' }
];

const AdminManagement = () => {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        adminPermissions: []
    });

    const getAuthConfig = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    const fetchAdmins = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/admin/admins`, getAuthConfig());
            setAdmins(data);
        } catch (error) {
            console.error('Failed to fetch admins', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const handleCheckbox = (permId) => {
        setFormData(prev => ({
            ...prev,
            adminPermissions: prev.adminPermissions.includes(permId)
                ? prev.adminPermissions.filter(p => p !== permId)
                : [...prev.adminPermissions, permId]
        }));
    };

    const handleSelectAll = () => {
        if (formData.adminPermissions.length === PERMISSIONS_LIST.length) {
            setFormData(prev => ({ ...prev, adminPermissions: [] }));
        } else {
            setFormData(prev => ({ ...prev, adminPermissions: PERMISSIONS_LIST.map(p => p.id) }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingAdmin) {
                await axios.put(`${API_URL}/admin/admins/${editingAdmin._id}`, formData, getAuthConfig());
                alert('Admin updated successfully');
            } else {
                await axios.post(`${API_URL}/admin/admins`, formData, getAuthConfig());
                alert('Admin created successfully');
            }
            setShowModal(false);
            setFormData({ name: '', email: '', password: '', adminPermissions: [] });
            setEditingAdmin(null);
            fetchAdmins();
        } catch (error) {
            alert('Error: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsSaving(false);
        }
    };

    const openEditModal = (admin) => {
        setEditingAdmin(admin);
        setFormData({
            name: admin.name,
            email: admin.email,
            password: '', // Blank for security
            adminPermissions: admin.adminPermissions || []
        });
        setShowModal(true);
    };

    if (loading) return <div>Loading admins...</div>;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h2 className="font-bold text-gray-800">Administrators</h2>
                <button
                    onClick={() => {
                        setEditingAdmin(null);
                        setFormData({ name: '', email: '', password: '', adminPermissions: [] });
                        setShowModal(true);
                    }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
                >
                    <FaUserPlus /> Add New Admin
                </button>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                            <th className="px-6 py-4 font-semibold">Name</th>
                            <th className="px-6 py-4 font-semibold">Email</th>
                            <th className="px-6 py-4 font-semibold">Role Level</th>
                            <th className="px-6 py-4 font-semibold">Permissions</th>
                            <th className="px-6 py-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {admins.map(admin => (
                            <tr key={admin._id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-900">{admin.name}</td>
                                <td className="px-6 py-4 text-gray-500">{admin.email}</td>
                                <td className="px-6 py-4">
                                    {admin.isSuperAdmin ? (
                                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-semibold">Super Admin</span>
                                    ) : (
                                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold">Sub-Admin</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {admin.isSuperAdmin ? (
                                        <span className="text-gray-400 text-xs">All Access</span>
                                    ) : (
                                        <span className="text-gray-600 text-xs">{admin.adminPermissions?.length || 0} tabs allowed</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right flex justify-end gap-3">
                                    {!admin.isSuperAdmin && (
                                        <button onClick={() => openEditModal(admin)} className="text-blue-500 hover:text-blue-700" title="Edit Permissions">
                                            <FaEdit />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-gray-900">{editingAdmin ? 'Edit Admin Permissions' : 'Create Sub-Admin'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500"><FaTimesCircle size={20} /></button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1">
                            <form id="adminForm" onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                                        <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border rounded-lg px-3 py-2 outline-none focus:border-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                                        <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border rounded-lg px-3 py-2 outline-none focus:border-blue-500" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            Password {editingAdmin && <span className="text-gray-400 font-normal">(Leave blank to keep current password)</span>}
                                        </label>
                                        <div className="relative">
                                            <input required={!editingAdmin} type={showPassword ? "text" : "password"} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full border rounded-lg px-3 py-2 outline-none focus:border-blue-500 pr-10" />
                                            <button 
                                                type="button" 
                                                onClick={() => setShowPassword(!showPassword)} 
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                            >
                                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="block text-sm font-bold text-gray-800">Allowed Navigation Tabs</label>
                                        <button type="button" onClick={handleSelectAll} className="text-xs text-blue-600 font-semibold hover:underline">Select All</button>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {PERMISSIONS_LIST.map(perm => (
                                            <label key={perm.id} className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition ${formData.adminPermissions.includes(perm.id) ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={formData.adminPermissions.includes(perm.id)} 
                                                    onChange={() => handleCheckbox(perm.id)}
                                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                />
                                                <span className="text-sm font-medium">{perm.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </form>
                        </div>
                        
                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-semibold transition">Cancel</button>
                            <button 
                                type="submit" 
                                form="adminForm" 
                                disabled={isSaving}
                                className={`px-4 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-md transition flex items-center justify-center gap-2 min-w-[120px] ${isSaving ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                            >
                                {isSaving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        Saving...
                                    </>
                                ) : 'Save Admin'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminManagement;
