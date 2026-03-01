import React, { useEffect, useState } from 'react';
import {
    FaUser, FaMoneyBillWave, FaMapMarkedAlt, FaCalendarCheck,
    FaChartLine, FaStore, FaUserClock, FaCheckCircle,
    FaSignOutAlt, FaHome, FaClipboardList, FaImage, FaPlus, FaTrash, FaEdit, FaStar
} from 'react-icons/fa';
import axios from 'axios';
import { API_URL } from '../config/api';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        userCount: 0,
        experienceCount: 0,
        bookingCount: 0,
        totalRevenue: 0
    });
    const [vendors, setVendors] = useState([]);
    const [experiences, setExperiences] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('stats');
    const [savingSection, setSavingSection] = useState('');
    const [savedBadge, setSavedBadge] = useState('');

    // Homepage Content State — draft (local edits) + committed (backend)
    const [destinations, setDestinations] = useState([]);
    const [attractions, setAttractions] = useState([]);
    const [destDraft, setDestDraft] = useState(null);
    const [attrDraft, setAttrDraft] = useState(null);
    const [footerLinks, setFooterLinks] = useState([]);
    const [footerDraft, setFooterDraft] = useState(null);

    // App Store Links
    const [appLinks, setAppLinks] = useState({ playStoreUrl: '', appStoreUrl: '', feedbackUrl: '' });
    const [savingAppLinks, setSavingAppLinks] = useState(false);
    const [appLinksSaved, setAppLinksSaved] = useState(false);

    const getAuthConfig = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    // Called when admin clicks "Save Destinations"
    const saveDestinations = async () => {
        const toSave = destDraft ?? destinations;
        try {
            setSavingSection('destinations');
            await axios.put(`${API_URL}/homepage/destinations`, { items: toSave }, getAuthConfig());
            setDestinations(toSave);
            setDestDraft(null);
            setSavedBadge('destinations');
            setTimeout(() => setSavedBadge(''), 2500);
        } catch (err) {
            console.error('Failed to save destinations', err);
            alert('Save failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setSavingSection('');
        }
    };

    // Called when admin clicks "Save Attractions"
    const saveAttractions = async () => {
        const toSave = attrDraft ?? attractions;
        try {
            setSavingSection('attractions');
            await axios.put(`${API_URL}/homepage/attractions`, { items: toSave }, getAuthConfig());
            setAttractions(toSave);
            setAttrDraft(null);
            setSavedBadge('attractions');
            setTimeout(() => setSavedBadge(''), 2500);
        } catch (err) {
            console.error('Failed to save attractions', err);
            alert('Save failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setSavingSection('');
        }
    };

    // Called when admin clicks "Save Footer Links"
    const saveFooterLinks = async () => {
        const toSave = footerDraft ?? footerLinks;
        try {
            setSavingSection('footerLinks');
            await axios.put(`${API_URL}/homepage/footerLinks`, { items: toSave }, getAuthConfig());
            setFooterLinks(toSave);
            setFooterDraft(null);
            setSavedBadge('footerLinks');
            setTimeout(() => setSavedBadge(''), 2500);
        } catch (err) {
            console.error('Failed to save footer links', err);
            alert('Save failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setSavingSection('');
        }
    };

    // Local-only edit helpers (no API call)
    const updateDestLocal = (idx, field, value) => {
        const base = destDraft ?? [...destinations];
        const updated = base.map((d, i) => i === idx ? { ...d, [field]: value } : d);
        setDestDraft(updated);
    };
    const addDestLocal = () => setDestDraft([...(destDraft ?? destinations), { city: 'New City', image: '' }]);
    const removeDestLocal = (idx) => setDestDraft((destDraft ?? destinations).filter((_, i) => i !== idx));

    const updateAttrLocal = (idx, field, value) => {
        const base = attrDraft ?? [...attractions];
        const updated = base.map((a, i) => i === idx ? { ...a, [field]: value } : a);
        setAttrDraft(updated);
    };
    const addAttrLocal = () => setAttrDraft([...(attrDraft ?? attractions), { title: 'New Attraction', activities: '0', image: '' }]);
    const removeAttrLocal = (idx) => setAttrDraft((attrDraft ?? attractions).filter((_, i) => i !== idx));

    const displayDest = destDraft ?? destinations;
    const displayAttr = attrDraft ?? attractions;
    const displayFooter = footerDraft ?? footerLinks;

    // Local-only edit helpers for Footer Links
    const addFooterCategoryLocal = () => {
        const base = footerDraft ?? [...footerLinks];
        setFooterDraft([...base, { category: 'New Category', links: [] }]);
    };
    const removeFooterCategoryLocal = (catIdx) => {
        const base = footerDraft ?? [...footerLinks];
        setFooterDraft(base.filter((_, i) => i !== catIdx));
    };
    const updateFooterCategoryLocal = (catIdx, title) => {
        const base = footerDraft ?? [...footerLinks];
        const updated = [...base];
        updated[catIdx] = { ...updated[catIdx], category: title };
        setFooterDraft(updated);
    };
    const addFooterLinkLocal = (catIdx) => {
        const base = footerDraft ?? [...footerLinks];
        const updated = [...base];
        updated[catIdx] = {
            ...updated[catIdx],
            links: [...(updated[catIdx].links || []), { title: 'New Link', subtitle: '', url: '#' }]
        };
        setFooterDraft(updated);
    };
    const removeFooterLinkLocal = (catIdx, linkIdx) => {
        const base = footerDraft ?? [...footerLinks];
        const updated = [...base];
        updated[catIdx] = {
            ...updated[catIdx],
            links: updated[catIdx].links.filter((_, i) => i !== linkIdx)
        };
        setFooterDraft(updated);
    };
    const updateFooterLinkLocal = (catIdx, linkIdx, field, value) => {
        const base = footerDraft ?? [...footerLinks];
        const updated = [...base];
        const updatedLinks = [...updated[catIdx].links];
        updatedLinks[linkIdx] = { ...updatedLinks[linkIdx], [field]: value };
        updated[catIdx] = { ...updated[catIdx], links: updatedLinks };
        setFooterDraft(updated);
    };

    const handleUserStatusToggle = async (userId, newStatus) => {
        try {
            await axios.put(`${API_URL}/admin/users/${userId}/status`, { isActive: newStatus }, getAuthConfig());
            setUsers(users.map(u => u._id === userId ? { ...u, isActive: newStatus } : u));
        } catch (error) {
            console.error('Failed to update user status:', error);
            alert('Failed to update user status.');
        }
    };

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const config = { headers: { Authorization: `Bearer ${token}` } };

                const [statsRes, vendorsRes, expRes, bookingsRes, usersRes] = await Promise.all([
                    axios.get(`${API_URL}/admin/stats`, config),
                    axios.get(`${API_URL}/admin/vendors`, config),
                    axios.get(`${API_URL}/admin/experiences`, config),
                    axios.get(`${API_URL}/admin/bookings`, config),
                    axios.get(`${API_URL}/admin/users`, config),
                ]);

                setStats(statsRes.data);
                setVendors(vendorsRes.data);
                setExperiences(expRes.data);
                setBookings(bookingsRes.data);
                setUsers(usersRes.data);
            } catch (error) {
                console.error('Error fetching admin data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAdminData();
    }, []);

    // Separate effect — homepage sections are public, always load independently
    useEffect(() => {
        const fetchHomepageSections = async () => {
            try {
                const [destRes, attrRes, footerRes] = await Promise.all([
                    axios.get(`${API_URL}/homepage/destinations`),
                    axios.get(`${API_URL}/homepage/attractions`),
                    axios.get(`${API_URL}/homepage/footerLinks`),
                ]);
                setDestinations(destRes.data);
                setAttractions(attrRes.data);
                setFooterLinks(footerRes.data);
            } catch (err) {
                console.error('Error fetching homepage sections:', err);
            }
        };

        fetchHomepageSections();
    }, []);

    // Fetch App Links
    useEffect(() => {
        axios.get(`${API_URL}/admin/settings`)
            .then(r => setAppLinks({ playStoreUrl: r.data.playStoreUrl || '', appStoreUrl: r.data.appStoreUrl || '', feedbackUrl: r.data.feedbackUrl || '' }))
            .catch(() => { });
    }, []);

    const saveAppLinks = async () => {
        try {
            setSavingAppLinks(true);
            await axios.put(`${API_URL}/admin/settings`, appLinks, getAuthConfig());
            setAppLinksSaved(true);
            setTimeout(() => setAppLinksSaved(false), 2500);
        } catch (err) {
            alert('Failed to save: ' + (err.response?.data?.message || err.message));
        } finally {
            setSavingAppLinks(false);
        }
    };

    const cards = [
        { title: 'Total Revenue', value: `$${stats.totalRevenue ? stats.totalRevenue.toLocaleString() : '0'}`, icon: <FaMoneyBillWave />, color: 'bg-green-500' },
        { title: 'Total Bookings', value: stats.bookingCount, icon: <FaCalendarCheck />, color: 'bg-blue-500' },
        { title: 'Experiences', value: stats.experienceCount, icon: <FaMapMarkedAlt />, color: 'bg-orange-500' },
        { title: 'Registered Users', value: stats.userCount, icon: <FaUser />, color: 'bg-purple-500' },
    ];

    const filteredVendors = vendors.filter(v => {
        if (activeTab === 'pending') return !v.isVerified;
        if (activeTab === 'verified') return v.isVerified;
        return true;
    });

    const pendingExperiences = experiences.filter(e => e.status === 'pending');
    const pendingVendorsCount = vendors.filter(v => !v.isVerified).length;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const NavItem = ({ id, icon: Icon, label, count }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center justify-between px-6 py-4 text-sm font-medium transition-colors ${activeTab === id
                ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
        >
            <div className="flex items-center gap-3">
                <Icon className="text-lg" />
                <span>{label}</span>
            </div>
            {count > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {count}
                </span>
            )}
        </button>
    );

    return (
        <div className="min-h-screen bg-gray-100 flex pt-16">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-xl z-10 hidden md:flex flex-col">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-blue-600 font-bold text-xl">
                        <FaMapMarkedAlt />
                        <span>AdminPanel</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Travellers Deal</p>
                </div>

                <nav className="flex-1 py-6 space-y-1">
                    <div className="px-6 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Main</div>
                    <NavItem id="stats" icon={FaChartLine} label="Dashboard" />

                    <div className="px-6 pb-2 pt-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Management</div>
                    <NavItem id="users" icon={FaUser} label="Users Management" />
                    <NavItem id="bookings" icon={FaClipboardList} label="Booking Ledger" />
                    <NavItem id="content" icon={FaCheckCircle} label="Content Moderation" count={pendingExperiences.length} />

                    <div className="px-6 pb-2 pt-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Partners</div>
                    <NavItem id="pending" icon={FaUserClock} label="Pending Requests" count={pendingVendorsCount} />
                    <NavItem id="verified" icon={FaStore} label="Verified Vendors" />

                    <div className="px-6 pb-2 pt-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">Content</div>
                    <NavItem id="homepage" icon={FaImage} label="Homepage Sections" />
                    <NavItem id="applinks" icon={FaStore} label="App Store Links" />
                    <button
                        onClick={() => navigate('/admin/testimonials')}
                        className="w-full flex items-center gap-3 px-6 py-4 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                        <FaStar className="text-lg" />
                        <span>Testimonials</span>
                    </button>
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-3 text-gray-500 hover:text-blue-600 transition-colors px-4 py-2 w-full"
                    >
                        <FaHome />
                        <span className="text-sm font-medium">Back to Home</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto">
                {/* Header */}
                <header className="bg-white shadow-sm sticky top-0 z-20 px-8 py-4 flex justify-between items-center md:hidden">
                    <div className="font-bold text-gray-800">Admin Panel</div>
                    <button className="text-gray-500"><FaClipboardList /></button>
                </header>

                <div className="p-8">
                    {/* Page Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-800">
                            {activeTab === 'stats' && 'Dashboard Overview'}
                            {activeTab === 'users' && 'Users Management'}
                            {activeTab === 'bookings' && 'Global Booking Ledger'}
                            {activeTab === 'content' && 'Experience Moderation'}
                            {activeTab === 'pending' && 'Vendor Approval Queue'}
                            {activeTab === 'verified' && 'Active Vendor Partners'}
                            {activeTab === 'applinks' && '📱 App Store Links'}
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Welcome back, Admin. Here is what is happening today.
                        </p>
                    </div>

                    {activeTab === 'stats' && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                {cards.map((card, index) => (
                                    <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between hover:shadow-md transition-shadow">
                                        <div>
                                            <p className="text-sm text-gray-500 font-medium mb-1">{card.title}</p>
                                            <h3 className="text-2xl font-bold text-gray-800">{card.value}</h3>
                                        </div>
                                        <div className={`p-3 rounded-lg text-white shadow-lg ${card.color}`}>
                                            {card.icon}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                    <h3 className="font-bold text-gray-800 mb-4">Quick Stats</h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Pending Experiences</span>
                                            <span className="font-bold text-orange-500">{pendingExperiences.length}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${Math.min(pendingExperiences.length * 10, 100)}%` }}></div>
                                        </div>

                                        <div className="flex justify-between items-center pt-2">
                                            <span className="text-gray-600">Pending Vendors</span>
                                            <span className="font-bold text-blue-500">{pendingVendorsCount}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min(pendingVendorsCount * 10, 100)}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'content' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-xs border-b">
                                    <tr>
                                        <th className="px-6 py-4">Title</th>
                                        <th className="px-6 py-4">Vendor</th>
                                        <th className="px-6 py-4">Price</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {pendingExperiences.length > 0 ? pendingExperiences.map(e => (
                                        <tr key={e._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">{e.title}</div>
                                                <div className="text-xs text-gray-500">{e.location.city}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{e.vendor?.name}</div>
                                                <div className="text-xs text-gray-500">{e.vendor?.email}</div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-gray-900">${e.price}</td>
                                            <td className="px-6 py-4">
                                                <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full font-bold uppercase">Pending</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <a href={`/admin/experience/${e._id}`} className="inline-block bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                                                    Review
                                                </a>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">No pending experiences.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-xs border-b">
                                        <tr>
                                            <th className="px-6 py-4 whitespace-nowrap">User</th>
                                            <th className="px-6 py-4 whitespace-nowrap">Role</th>
                                            <th className="px-6 py-4 whitespace-nowrap">Joined</th>
                                            <th className="px-6 py-4 whitespace-nowrap text-center">Status</th>
                                            <th className="px-6 py-4 whitespace-nowrap text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {users.map(u => (
                                            <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div
                                                        className="flex items-center gap-3 cursor-pointer group"
                                                        onClick={() => navigate(`/admin/user/${u._id}`)}
                                                    >
                                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg group-hover:bg-blue-200 transition-colors">
                                                            {u.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-gray-900 group-hover:text-primary transition-colors">{u.name}</div>
                                                            <div className="text-xs text-blue-600">{u.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : u.role === 'vendor' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {new Date(u.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase inline-block w-20 ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {u.isActive ? 'Active' : 'Blocked'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                                                    {u.role !== 'admin' && (
                                                        <button
                                                            onClick={() => handleUserStatusToggle(u._id, !u.isActive)}
                                                            className={`text-xs font-bold px-4 py-2 rounded-lg transition-colors ${u.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                                                        >
                                                            {u.isActive ? 'Block' : 'Unblock'}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {users.length === 0 && <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">No users found.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'bookings' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-xs border-b">
                                        <tr>
                                            <th className="px-6 py-4 whitespace-nowrap">Booking ID</th>
                                            <th className="px-6 py-4 whitespace-nowrap">Customer</th>
                                            <th className="px-6 py-4 whitespace-nowrap">Experience & Vendor</th>
                                            <th className="px-6 py-4 whitespace-nowrap">Booking Details</th>
                                            <th className="px-6 py-4 whitespace-nowrap">Payment Info</th>
                                            <th className="px-6 py-4 whitespace-nowrap">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {bookings.map(b => (
                                            <tr key={b._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 text-xs font-mono text-gray-500">#{b._id.slice(-6)}</td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-900">{b.user?.name}</div>
                                                    <div className="text-xs text-blue-600">{b.user?.email}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-bold text-gray-800">{b.experience?.title}</div>
                                                    <div className="text-xs text-gray-500 mt-0.5">
                                                        Vendor: <span className="font-medium text-gray-700">{b.experience?.vendor?.name || 'N/A'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-[10px] text-gray-400 font-semibold mb-1" title="Booking placed on">Booked: {new Date(b.createdAt).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</div>
                                                    <div className="text-sm font-medium text-gray-900" title="Scheduled for">For: {new Date(b.date).toLocaleDateString()}</div>
                                                    {b.timeSlot && <div className="text-xs text-gray-500">{b.timeSlot}</div>}
                                                    <div className="text-xs font-medium text-gray-600 mt-1">{b.slots} Person(s)</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="font-bold text-gray-900">${b.totalPrice}</div>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${b.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                            {b.paymentStatus}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400">
                                                            ({b.paymentStatus === 'paid' ? 'Online' : 'Pay Later'})
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`text-[10px] font-bold px-2 py-1 rounded w-full text-center inline-block uppercase ${b.status === 'confirmed' ? 'bg-blue-100 text-blue-700' : b.status === 'cancelled' ? 'bg-gray-200 text-gray-600' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        {b.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {bookings.length === 0 && <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500">No bookings on record.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'homepage' && (
                        <div className="space-y-10">

                            {/* ── Destinations Section ── */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">Things to do wherever you're going</h3>
                                        <p className="text-sm text-gray-500 mt-0.5">Edit cards below, then click <strong>Save Destinations</strong></p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {destDraft && (
                                            <span className="text-xs text-orange-500 font-semibold">● Unsaved changes</span>
                                        )}
                                        {savedBadge === 'destinations' && (
                                            <span className="text-xs text-green-600 font-semibold">✓ Saved!</span>
                                        )}
                                        <button onClick={addDestLocal} className="flex items-center gap-2 bg-gray-100 text-gray-700 text-sm font-bold px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                                            <FaPlus size={12} /> Add City
                                        </button>
                                        <button
                                            onClick={saveDestinations}
                                            disabled={savingSection === 'destinations'}
                                            className="flex items-center gap-2 bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
                                        >
                                            {savingSection === 'destinations' ? 'Saving...' : 'Save Destinations'}
                                        </button>
                                    </div>
                                </div>
                                <div className="p-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {displayDest.map((dest, idx) => (
                                            <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                                                <div className="relative h-36">
                                                    <img src={dest.image || 'https://placehold.co/400x200?text=No+Image'} alt={dest.city} className="w-full h-full object-cover" onError={(e) => { e.target.src = 'https://placehold.co/400x200?text=Invalid+URL'; }} />
                                                    <div className="absolute inset-0 bg-black/30 flex items-end p-3">
                                                        <span className="text-white font-bold text-lg drop-shadow">{dest.city}</span>
                                                    </div>
                                                </div>
                                                <div className="p-4 space-y-3">
                                                    <div>
                                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">City Name</label>
                                                        <input type="text" value={dest.city} onChange={(e) => updateDestLocal(idx, 'city', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="e.g. London" />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Image URL</label>
                                                        <input type="url" value={dest.image} onChange={(e) => updateDestLocal(idx, 'image', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="https://..." />
                                                    </div>
                                                    <button onClick={() => removeDestLocal(idx)} className="flex items-center gap-2 text-red-500 hover:text-red-700 text-xs font-semibold transition-colors">
                                                        <FaTrash size={10} /> Remove
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* ── Attractions Section ── */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">Attractions you can't miss</h3>
                                        <p className="text-sm text-gray-500 mt-0.5">Edit cards below, then click <strong>Save Attractions</strong></p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {attrDraft && (
                                            <span className="text-xs text-orange-500 font-semibold">● Unsaved changes</span>
                                        )}
                                        {savedBadge === 'attractions' && (
                                            <span className="text-xs text-green-600 font-semibold">✓ Saved!</span>
                                        )}
                                        <button onClick={addAttrLocal} className="flex items-center gap-2 bg-gray-100 text-gray-700 text-sm font-bold px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                                            <FaPlus size={12} /> Add Attraction
                                        </button>
                                        <button
                                            onClick={saveAttractions}
                                            disabled={savingSection === 'attractions'}
                                            className="flex items-center gap-2 bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
                                        >
                                            {savingSection === 'attractions' ? 'Saving...' : 'Save Attractions'}
                                        </button>
                                    </div>
                                </div>
                                <div className="p-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {displayAttr.map((attr, idx) => (
                                            <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                                                <div className="relative h-44">
                                                    <img src={attr.image || 'https://placehold.co/600x300?text=No+Image'} alt={attr.title} className="w-full h-full object-cover" onError={(e) => { e.target.src = 'https://placehold.co/600x300?text=Invalid+URL'; }} />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4">
                                                        <div>
                                                            <p className="text-white font-bold text-base drop-shadow">{attr.title}</p>
                                                            <p className="text-white/80 text-xs">{attr.activities} activities</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-4 space-y-3">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Attraction Name</label>
                                                            <input type="text" value={attr.title} onChange={(e) => updateAttrLocal(idx, 'title', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="e.g. Eiffel Tower" />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">No. of Activities</label>
                                                            <input type="text" value={attr.activities} onChange={(e) => updateAttrLocal(idx, 'activities', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="e.g. 172" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Image URL</label>
                                                        <input type="url" value={attr.image} onChange={(e) => updateAttrLocal(idx, 'image', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="https://..." />
                                                    </div>
                                                    <button onClick={() => removeAttrLocal(idx)} className="flex items-center gap-2 text-red-500 hover:text-red-700 text-xs font-semibold transition-colors">
                                                        <FaTrash size={10} /> Remove
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* ── Footer Links Section ── */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">Footer Links</h3>
                                        <p className="text-sm text-gray-500 mt-0.5">Manage the categorized links displayed at the bottom of the homepage.</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {footerDraft && (
                                            <span className="text-xs text-orange-500 font-semibold">● Unsaved changes</span>
                                        )}
                                        {savedBadge === 'footerLinks' && (
                                            <span className="text-xs text-green-600 font-semibold">✓ Saved!</span>
                                        )}
                                        <button onClick={addFooterCategoryLocal} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 text-sm font-bold px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                                            <FaPlus size={12} /> Add Category
                                        </button>
                                        <button
                                            onClick={saveFooterLinks}
                                            disabled={savingSection === 'footerLinks'}
                                            className="flex items-center gap-2 bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
                                        >
                                            {savingSection === 'footerLinks' ? 'Saving...' : 'Save Footer Links'}
                                        </button>
                                    </div>
                                </div>
                                <div className="p-8 space-y-8">
                                    {displayFooter.map((categoryGroup, catIdx) => (
                                        <div key={catIdx} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                            {/* Category Header */}
                                            <div className="bg-gray-100/50 px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                                                <div className="flex-1 flex items-center gap-3">
                                                    <label className="text-sm font-semibold text-gray-600">Category / Tab Name:</label>
                                                    <input
                                                        type="text"
                                                        value={categoryGroup.category}
                                                        onChange={(e) => updateFooterCategoryLocal(catIdx, e.target.value)}
                                                        className="w-1/2 border-none bg-white font-bold text-gray-900 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                                        placeholder="e.g. Top destinations"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => addFooterLinkLocal(catIdx)} className="text-blue-600 hover:text-blue-800 text-sm font-bold px-3 border-r border-gray-300">
                                                        + Add Link
                                                    </button>
                                                    <button onClick={() => removeFooterCategoryLocal(catIdx)} className="text-red-500 hover:text-red-700 text-sm font-bold px-3">
                                                        Delete Category
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Links inside Category */}
                                            <div className="p-5">
                                                {(!categoryGroup.links || categoryGroup.links.length === 0) ? (
                                                    <p className="text-sm text-gray-400 italic text-center py-4">No links in this category yet. Click "+ Add Link".</p>
                                                ) : (
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                        {categoryGroup.links.map((link, linkIdx) => (
                                                            <div key={linkIdx} className="flex gap-3 bg-gray-50 border border-gray-100 rounded-lg p-3 relative group">
                                                                <div className="flex-1 space-y-2">
                                                                    <input
                                                                        type="text"
                                                                        value={link.title}
                                                                        onChange={(e) => updateFooterLinkLocal(catIdx, linkIdx, 'title', e.target.value)}
                                                                        className="w-full text-sm font-bold text-gray-900 bg-transparent border-b border-dashed border-gray-300 focus:border-blue-500 focus:bg-white focus:ring-0 outline-none px-1 pb-1"
                                                                        placeholder="Link Title (e.g. Colosseum)"
                                                                    />
                                                                    <input
                                                                        type="text"
                                                                        value={link.subtitle}
                                                                        onChange={(e) => updateFooterLinkLocal(catIdx, linkIdx, 'subtitle', e.target.value)}
                                                                        className="w-full text-xs text-gray-500 bg-transparent border-b border-dashed border-gray-300 focus:border-blue-500 focus:bg-white focus:ring-0 outline-none px-1 pb-1"
                                                                        placeholder="Subtitle (e.g. 1151 tours)"
                                                                    />
                                                                    <input
                                                                        type="text"
                                                                        value={link.url}
                                                                        onChange={(e) => updateFooterLinkLocal(catIdx, linkIdx, 'url', e.target.value)}
                                                                        className="w-full text-xs text-blue-500 bg-transparent border-b border-dashed border-gray-300 focus:border-blue-500 focus:bg-white focus:ring-0 outline-none px-1 pb-1"
                                                                        placeholder="URL (e.g. /attractions/colosseum)"
                                                                    />
                                                                </div>
                                                                <button
                                                                    onClick={() => removeFooterLinkLocal(catIdx, linkIdx)}
                                                                    className="text-gray-400 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    title="Remove Link"
                                                                >
                                                                    <FaTrash size={12} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-green-50 border border-green-200 rounded-xl px-6 py-4 text-sm text-green-700 flex items-center gap-2">
                                <span className="text-green-500 text-lg">✓</span>
                                <span><strong>Live:</strong> Changes are saved directly to MongoDB and reflect instantly on the homepage.</span>
                            </div>
                        </div>
                    )}

                    {activeTab === 'applinks' && (
                        <div className="max-w-2xl">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">App Store Links</h3>
                                        <p className="text-sm text-gray-500 mt-1">These links power the "Leave feedback" and "Rate the app" buttons in the mobile app's Profile screen.</p>
                                    </div>
                                    {appLinksSaved && <span className="text-green-600 font-semibold text-sm">✓ Saved!</span>}
                                </div>
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">🤖 Google Play Store URL</label>
                                        <input type="url" value={appLinks.playStoreUrl}
                                            onChange={e => setAppLinks(p => ({ ...p, playStoreUrl: e.target.value }))}
                                            placeholder="https://play.google.com/store/apps/details?id=..."
                                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">🍎 Apple App Store URL</label>
                                        <input type="url" value={appLinks.appStoreUrl}
                                            onChange={e => setAppLinks(p => ({ ...p, appStoreUrl: e.target.value }))}
                                            placeholder="https://apps.apple.com/app/..."
                                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">💬 Feedback URL <span className="text-gray-400 font-normal">(optional)</span></label>
                                        <input type="url" value={appLinks.feedbackUrl}
                                            onChange={e => setAppLinks(p => ({ ...p, feedbackUrl: e.target.value }))}
                                            placeholder="https://travellersdeal.com/contact"
                                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition" />
                                    </div>
                                </div>
                                <div className="mt-6 p-4 bg-blue-50 rounded-xl text-sm text-blue-700">
                                    <p className="font-semibold mb-1">How it works:</p>
                                    <ul className="list-disc list-inside space-y-1 text-blue-600">
                                        <li><strong>Rate the app</strong> → Play Store (Android) / App Store (iOS)</li>
                                        <li><strong>Leave feedback</strong> → Feedback URL, or falls back to store link</li>
                                        <li>Changes reflect <strong>instantly</strong> in the app on next open</li>
                                    </ul>
                                </div>
                                <button onClick={saveAppLinks} disabled={savingAppLinks}
                                    className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-60">
                                    {savingAppLinks ? 'Saving...' : 'Save App Store Links'}
                                </button>
                            </div>
                        </div>
                    )}

                    {(activeTab === 'pending' || activeTab === 'verified') && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-xs border-b">
                                    <tr>
                                        <th className="px-6 py-4">Vendor</th>
                                        <th className="px-6 py-4">Business</th>
                                        <th className="px-6 py-4">Type</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredVendors.length > 0 ? filteredVendors.map(v => (
                                        <tr key={v._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">{v.name}</div>
                                                <div className="text-xs text-gray-500">{v.email}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {v.vendorDetails?.brandName || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                                                {v.vendorDetails?.businessType?.replace('_', ' ') || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {v.isVerified ? (
                                                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold uppercase">Verified</span>
                                                ) : (
                                                    <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full font-bold uppercase">Pending</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <a href={`/admin/id/${v._id}`} className="inline-block bg-gray-900 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                                                    Manage
                                                </a>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">No vendors found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
