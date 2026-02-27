import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/api';
import { FaPlus, FaEdit, FaTrash, FaStar, FaTimes, FaCheck, FaArrowLeft, FaToggleOn, FaToggleOff } from 'react-icons/fa';

const EMPTY_FORM = { name: '', location: '', rating: 5, comment: '', experienceTitle: '', isVerified: true, isActive: true, displayOrder: 0 };

const AdminTestimonials = () => {
    const navigate = useNavigate();
    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

    const fetchTestimonials = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(`${API_URL}/admin/testimonials`, config);
            setTestimonials(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchTestimonials(); }, []);

    const openAdd = () => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); };
    const openEdit = (t) => { setForm({ ...t }); setEditingId(t._id); setShowForm(true); };
    const closeForm = () => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); };

    const handleSave = async () => {
        if (!form.name || !form.comment) return alert('Name and Comment are required.');
        try {
            setSaving(true);
            if (editingId) {
                const { data } = await axios.put(`${API_URL}/admin/testimonials/${editingId}`, form, config);
                setTestimonials(prev => prev.map(t => t._id === data._id ? data : t));
            } else {
                const { data } = await axios.post(`${API_URL}/admin/testimonials`, form, config);
                setTestimonials(prev => [data, ...prev]);
            }
            closeForm();
        } catch (e) { alert(e?.response?.data?.message || 'Save failed'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this testimonial?')) return;
        try {
            await axios.delete(`${API_URL}/admin/testimonials/${id}`, config);
            setTestimonials(prev => prev.filter(t => t._id !== id));
        } catch (e) { alert('Delete failed'); }
    };

    const toggleActive = async (t) => {
        try {
            const { data } = await axios.put(`${API_URL}/admin/testimonials/${t._id}`, { isActive: !t.isActive }, config);
            setTestimonials(prev => prev.map(x => x._id === data._id ? data : x));
        } catch (e) { alert('Failed to toggle'); }
    };

    const StarPicker = ({ value, onChange }) => (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(s => (
                <FaStar key={s} onClick={() => onChange(s)}
                    className={`text-2xl cursor-pointer transition-colors ${s <= value ? 'text-yellow-400' : 'text-gray-300'}`} />
            ))}
            <span className="ml-2 text-sm text-gray-500">{value}/5</span>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pt-20 p-8 font-sans">
            <div className="container mx-auto max-w-5xl">
                <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 font-medium">
                    <FaArrowLeft /> Back to Dashboard
                </button>

                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Testimonials</h1>
                        <p className="text-gray-500 mt-1 text-sm">Manage reviews shown on the public homepage. <span className="font-semibold text-primary">Not linked to any user account.</span></p>
                    </div>
                    <button onClick={openAdd} className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-xl font-bold hover:bg-cyan-600 transition-colors shadow-lg shadow-cyan-200">
                        <FaPlus /> Add Testimonial
                    </button>
                </div>

                {/* Add / Edit Form */}
                {showForm && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Testimonial' : 'New Testimonial'}</h2>
                            <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><FaTimes className="text-xl" /></button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">Display Name *</label>
                                <input
                                    value={form.name}
                                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                    placeholder="e.g. Martin R."
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">Location</label>
                                <input
                                    value={form.location}
                                    onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                                    placeholder="e.g. New York, USA"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">Experience / Trip Name</label>
                                <input
                                    value={form.experienceTitle}
                                    onChange={e => setForm(p => ({ ...p, experienceTitle: e.target.value }))}
                                    placeholder="e.g. NYC Explorer Pass"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">Display Order</label>
                                <input
                                    type="number" min={0}
                                    value={form.displayOrder}
                                    onChange={e => setForm(p => ({ ...p, displayOrder: Number(e.target.value) }))}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="text-xs font-bold text-gray-600 uppercase mb-2 block">Rating</label>
                            <StarPicker value={form.rating} onChange={v => setForm(p => ({ ...p, rating: v }))} />
                        </div>

                        <div className="mb-4">
                            <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">Review Comment *</label>
                            <textarea
                                rows={4}
                                value={form.comment}
                                onChange={e => setForm(p => ({ ...p, comment: e.target.value }))}
                                placeholder="Write the testimonial text..."
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                            />
                        </div>

                        <div className="flex items-center gap-6 mb-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.isVerified} onChange={e => setForm(p => ({ ...p, isVerified: e.target.checked }))} className="w-4 h-4 accent-primary" />
                                <span className="text-sm font-medium text-gray-700">Show "Verified booking" badge</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 accent-primary" />
                                <span className="text-sm font-medium text-gray-700">Active (visible on homepage)</span>
                            </label>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={handleSave} disabled={saving}
                                className="bg-primary text-white px-8 py-2.5 rounded-xl font-bold hover:bg-cyan-600 transition-colors disabled:opacity-60">
                                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Testimonial'}
                            </button>
                            <button onClick={closeForm} className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancel</button>
                        </div>
                    </div>
                )}

                {/* Testimonials List */}
                {loading ? (
                    <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div></div>
                ) : testimonials.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                        <FaStar className="text-5xl text-gray-200 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Testimonials Yet</h3>
                        <p className="text-gray-500 mb-6">Add your first testimonial to show on the homepage.</p>
                        <button onClick={openAdd} className="bg-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-cyan-600">Add Testimonial</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {testimonials.map(t => (
                            <div key={t._id} className={`bg-white rounded-2xl border p-5 transition-all ${t.isActive ? 'border-gray-100' : 'border-gray-200 opacity-60'}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                                            {t.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                                            {t.location && <p className="text-xs text-gray-500">{t.location}</p>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <button onClick={() => toggleActive(t)} title={t.isActive ? 'Deactivate' : 'Activate'}
                                            className={`p-1.5 rounded-lg transition-colors ${t.isActive ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}>
                                            {t.isActive ? <FaToggleOn className="text-xl" /> : <FaToggleOff className="text-xl" />}
                                        </button>
                                        <button onClick={() => openEdit(t)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><FaEdit /></button>
                                        <button onClick={() => handleDelete(t._id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><FaTrash /></button>
                                    </div>
                                </div>

                                {t.experienceTitle && <p className="text-xs font-semibold text-primary mb-2">{t.experienceTitle}</p>}

                                <div className="flex items-center gap-0.5 mb-2">
                                    {[1, 2, 3, 4, 5].map(s => <FaStar key={s} className={`text-xs ${s <= t.rating ? 'text-yellow-400' : 'text-gray-200'}`} />)}
                                    {t.isVerified && <span className="ml-2 text-[10px] text-green-600 font-bold flex items-center gap-1"><FaCheck className="text-[8px]" /> Verified</span>}
                                </div>

                                <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{t.comment}</p>

                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {t.isActive ? 'Live on Homepage' : 'Hidden'}
                                    </span>
                                    <span className="text-[10px] text-gray-400">Order: {t.displayOrder}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminTestimonials;
