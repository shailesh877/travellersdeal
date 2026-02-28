import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/api';
import { AuthContext } from '../context/AuthContext';
import {
    FaPlus, FaEdit, FaTrash, FaBoxOpen, FaWallet,
    FaClipboardList, FaChartLine, FaCalendarAlt, FaStar, FaCheck, FaTimes, FaUniversity
} from 'react-icons/fa';

const VendorDashboard = () => {
    const { user } = useContext(AuthContext);
    const [experiences, setExperiences] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    // Bank Details State
    const [accountName, setAccountName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [ifscCode, setIfscCode] = useState('');
    const [bankName, setBankName] = useState('');
    const [swiftCode, setSwiftCode] = useState('');
    const [ifscLoading, setIfscLoading] = useState(false);
    const [ifscError, setIfscError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            const token = user?.token || localStorage.getItem('token');
            if (!token) {
                console.error('No token found');
                return;
            }

            try {
                const config = {
                    headers: { Authorization: `Bearer ${token}` },
                };

                const [expRes, bookRes] = await Promise.all([
                    axios.get(`${API_URL}/experiences/my`, config),
                    axios.get(`${API_URL}/bookings/vendor`, config)
                ]);

                setExperiences(expRes.data);
                setBookings(bookRes.data);

                // Initialize Bank Details State
                if (user?.vendorDetails?.bankDetails) {
                    const bd = user.vendorDetails.bankDetails;
                    setAccountName(bd.accountName || '');
                    setAccountNumber(bd.accountNumber || '');
                    setIfscCode(bd.ifscCode || '');
                    setBankName(bd.bankName || '');
                    setSwiftCode(bd.swiftCode || '');
                }
            } catch (error) {
                console.error('Error fetching vendor data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchData();
    }, [user]);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this experience?')) {
            try {
                const token = localStorage.getItem('token');
                const config = {
                    headers: { Authorization: `Bearer ${token}` },
                };
                await axios.delete(`${API_URL}/experiences/${id}`, config);
                setExperiences(experiences.filter(exp => exp._id !== id));
            } catch (error) {
                console.error('Error deleting experience:', error);
                alert('Failed to delete experience');
            }
        }
    };

    const handleStatusUpdate = async (bookingId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: { Authorization: `Bearer ${token}` },
            };

            const response = await axios.put(
                `${API_URL}/bookings/${bookingId}/status`,
                { status: newStatus },
                config
            );

            // Update local state
            setBookings(bookings.map(b =>
                b._id === bookingId ? { ...b, status: response.data.status } : b
            ));
        } catch (error) {
            console.error('Error updating booking status:', error);
            alert('Failed to update booking status');
        }
    };

    // Calculate Stats
    const totalEarnings = bookings.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);
    const totalBookings = bookings.length;
    const activeListings = experiences.length;

    // Helper for currency formatting (assuming USD default for totals, or based on first experience)
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD', // You might want to make this dynamic globally
        }).format(amount);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed': return 'bg-green-100 text-green-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    // Helper to safely format dates
    const formatDate = (dateValue) => {
        if (!dateValue) return 'N/A';
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateValue) => {
        if (!dateValue) return 'N/A';
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    const handleIfscChange = async (e) => {
        const value = e.target.value.toUpperCase();

        if (value.length === 11) {
            setIfscLoading(true);
            setIfscError('');
            try {
                const response = await axios.get(`https://ifsc.razorpay.com/${value}`);
                // Combine Bank Name and Branch for a complete string
                setBankName(`${response.data.BANK}, ${response.data.BRANCH}`);
            } catch (error) {
                console.error("Error fetching IFSC details", error);
                setIfscError('Invalid IFSC Code');
                setBankName('');
            } finally {
                setIfscLoading(false);
            }
        } else {
            setIfscError('');
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-12 pt-20">
            {/* Header Section */}
            <div className="bg-white border-b border-gray-200">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Provider Dashboard</h1>
                            <p className="text-gray-500 mt-1">Welcome back, {user?.name}</p>
                        </div>
                        <Link to="/vendor/add" className="bg-primary hover:bg-cyan-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-cyan-200 transition-all transform hover:-translate-y-0.5">
                            <FaPlus /> create New Listing
                        </Link>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex gap-8 mt-8 border-b border-gray-100 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`pb-4 font-semibold text-sm transition-colors relative whitespace-nowrap ${activeTab === 'overview' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Overview
                            {activeTab === 'overview' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></div>}
                        </button>
                        <button
                            onClick={() => setActiveTab('experiences')}
                            className={`pb-4 font-semibold text-sm transition-colors relative whitespace-nowrap ${activeTab === 'experiences' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            My Experiences ({activeListings})
                            {activeTab === 'experiences' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></div>}
                        </button>
                        <button
                            onClick={() => setActiveTab('bookings')}
                            className={`pb-4 font-semibold text-sm transition-colors relative whitespace-nowrap ${activeTab === 'bookings' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Bookings ({totalBookings})
                            {activeTab === 'bookings' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></div>}
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`pb-4 font-semibold text-sm transition-colors relative whitespace-nowrap ${activeTab === 'settings' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Bank Details
                            {activeTab === 'settings' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></div>}
                        </button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                                <div className="p-4 bg-green-50 text-green-600 rounded-xl">
                                    <FaWallet className="text-2xl" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Total Earnings</p>
                                    <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(totalEarnings)}</h3>
                                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><FaChartLine /> +12% this month</p>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                                <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
                                    <FaClipboardList className="text-2xl" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Total Bookings</p>
                                    <h3 className="text-2xl font-bold text-gray-900">{totalBookings}</h3>
                                    <p className="text-xs text-gray-400 mt-1">Lifetime bookings</p>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                                <div className="p-4 bg-purple-50 text-purple-600 rounded-xl">
                                    <FaBoxOpen className="text-2xl" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Active Experiences</p>
                                    <h3 className="text-2xl font-bold text-gray-900">{activeListings}</h3>
                                    <p className="text-xs text-purple-600 mt-1">View all listings</p>
                                </div>
                            </div>
                        </div>

                        {/* Recent Bookings Preview */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-gray-900">Recent Bookings</h3>
                                <button onClick={() => setActiveTab('bookings')} className="text-primary text-sm font-semibold hover:underline">View all</button>
                            </div>
                            {bookings.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left bg-gray-50/50 rounded-lg overflow-hidden">
                                        <thead className="text-gray-500 font-semibold text-xs uppercase bg-gray-100">
                                            <tr>
                                                <th className="px-6 py-4">Experience</th>
                                                <th className="px-6 py-4">Customer</th>
                                                <th className="px-6 py-4">Date & Time</th>
                                                <th className="px-6 py-4">Guests</th>
                                                <th className="px-6 py-4">Amount</th>
                                                <th className="px-6 py-4">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {bookings.slice(0, 5).map((booking) => (
                                                <tr key={booking._id} className="hover:bg-white transition-colors">
                                                    <td className="px-6 py-4 font-medium text-gray-900">{booking.experience?.title}</td>
                                                    <td className="px-6 py-4 text-gray-600">{booking.user?.name}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-[10px] text-gray-400 font-semibold mb-0.5" title="Booking placed on">
                                                            Booked: {formatDateTime(booking.createdAt)}
                                                        </div>
                                                        <div className="text-gray-900 font-medium">{formatDate(booking.date)}</div>
                                                        {booking.timeSlot && <div className="text-xs text-blue-600 font-semibold mt-0.5">{booking.timeSlot}</div>}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-700">{booking.slots} Person(s)</td>
                                                    <td className="px-6 py-4 font-bold text-gray-900">${booking.totalPrice}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(booking.status)}`}>
                                                            {booking.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-8">No bookings found recently.</p>
                            )}
                        </div>
                    </div>
                )}

                {/* EXPERIENCES TAB */}
                {activeTab === 'experiences' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {experiences.map(exp => (
                            <div key={exp._id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow group ${exp.status === 'rejected' ? 'border-red-200' : exp.status === 'pending' ? 'border-yellow-200' : 'border-gray-100'}`}>
                                <div className="relative h-48 overflow-hidden">
                                    <img
                                        src={exp.images[0] ? (exp.images[0].startsWith('http') ? exp.images[0] : `${API_URL.replace('/api', '')}${exp.images[0]}`) : 'https://placehold.co/600x400'}
                                        alt={exp.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                        {exp.currency} {exp.price}
                                    </div>
                                    <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold">
                                        {exp.category}
                                    </div>
                                    {/* ✅ Admin Review Status Badge */}
                                    <div className="absolute bottom-3 left-3">
                                        {exp.status === 'approved' && (
                                            <span className="bg-green-500 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1"><FaCheck className="text-[8px]" /> Live</span>
                                        )}
                                        {exp.status === 'pending' && (
                                            <span className="bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider">⏳ Under Review</span>
                                        )}
                                        {exp.status === 'rejected' && (
                                            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1"><FaTimes className="text-[8px]" /> Rejected</span>
                                        )}
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1">{exp.title}</h3>
                                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">{exp.description}</p>

                                    {/* Status Notice Banner */}
                                    {exp.status === 'pending' && (
                                        <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs px-3 py-2 rounded-lg font-medium">
                                            ⏳ Waiting for admin approval before going live.
                                        </div>
                                    )}
                                    {exp.status === 'rejected' && (
                                        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg font-medium">
                                            ❌ This experience was rejected by admin. Please edit and re-submit.
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4 text-xs text-gray-400 mb-6">
                                        <div className="flex items-center gap-1"><FaCalendarAlt /> {exp.duration}</div>
                                        <div className="flex items-center gap-1"><FaStar className="text-yellow-400" /> 4.5 (New)</div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Link to={`/vendor/edit/${exp._id}`} className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold text-sm transition-colors border border-gray-200 text-center">
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(exp._id)}
                                            className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg font-semibold text-sm transition-colors border border-red-100"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* BOOKINGS TAB */}
                {activeTab === 'bookings' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-500 font-semibold text-xs uppercase border-b">
                                    <tr>
                                        <th className="px-6 py-4">Booking ID</th>
                                        <th className="px-6 py-4">Experience</th>
                                        <th className="px-6 py-4">Customer</th>
                                        <th className="px-6 py-4">Date & Time</th>
                                        <th className="px-6 py-4">Guests</th>
                                        <th className="px-6 py-4">Total</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {bookings.map((booking) => (
                                        <tr key={booking._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-xs font-mono text-gray-400">#{booking._id.slice(-6)}</td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{booking.experience?.title || 'Unknown Experience'}</td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{booking.user?.name}</div>
                                                <div className="text-xs text-gray-400">{booking.user?.email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-[10px] text-gray-400 font-semibold mb-0.5" title="Booking placed on">
                                                    Booked: {formatDateTime(booking.createdAt)}
                                                </div>
                                                <div className="text-gray-900 font-medium">{formatDate(booking.date)}</div>
                                                {booking.timeSlot && <div className="text-xs text-blue-600 font-semibold mt-0.5">{booking.timeSlot}</div>}
                                            </td>
                                            <td className="px-6 py-4 text-gray-700">{booking.slots} Person(s)</td>
                                            <td className="px-6 py-4 font-bold text-gray-900">${booking.totalPrice}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(booking.status)}`}>
                                                    {booking.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {booking.status === 'pending' ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleStatusUpdate(booking._id, 'confirmed')}
                                                            className="bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-full transition-colors"
                                                            title="Accept Booking"
                                                        >
                                                            <FaCheck size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(booking._id, 'cancelled')}
                                                            className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-full transition-colors"
                                                            title="Reject Booking"
                                                        >
                                                            <FaTimes size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-xs italic">
                                                        {booking.status === 'confirmed' ? 'Accepted' : 'Processed'}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {bookings.length === 0 && (
                            <div className="text-center py-12">
                                <FaClipboardList className="mx-auto text-gray-300 text-5xl mb-4" />
                                <h3 className="text-gray-900 font-medium">No bookings yet</h3>
                            </div>
                        )}
                    </div>
                )}

                {/* SETTINGS / BANK DETAILS TAB */}
                {activeTab === 'settings' && (
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                <FaUniversity className="text-primary" /> Bank Details
                            </h2>
                            <p className="text-gray-500 mb-8">
                                Provide your bank details to receive payouts. Please ensure the information is accurate.
                            </p>

                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                const bankDetails = {
                                    accountName,
                                    accountNumber,
                                    bankName,
                                    ifscCode,
                                    swiftCode,
                                };

                                try {
                                    const token = localStorage.getItem('token');
                                    const config = { headers: { Authorization: `Bearer ${token}` } };
                                    const res = await axios.put(`${API_URL}/users/vendor/profile`, { vendorDetails: { bankDetails } }, config);

                                    // Update locally stored user data to reflect changes immediately
                                    const updatedUser = { ...user, vendorDetails: res.data.vendorDetails };
                                    localStorage.setItem('user', JSON.stringify(updatedUser));

                                    alert('Bank details updated successfully!');
                                } catch (error) {
                                    console.error('Error updating bank details', error);
                                    alert('Failed to update bank details.');
                                }
                            }} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Account Holder Name</label>
                                        <input
                                            type="text" name="accountName" required
                                            value={accountName}
                                            onChange={(e) => setAccountName(e.target.value)}
                                            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Account Number</label>
                                        <input
                                            type="text" name="accountNumber" required
                                            value={accountNumber}
                                            onChange={(e) => setAccountNumber(e.target.value)}
                                            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                            placeholder="1234567890"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">IFSC / Routing Code</label>
                                        <input
                                            type="text" name="ifscCode" required
                                            value={ifscCode}
                                            onChange={(e) => {
                                                setIfscCode(e.target.value);
                                                handleIfscChange(e);
                                            }}
                                            maxLength={11}
                                            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none uppercase"
                                            placeholder="e.g. SBIN0001234"
                                        />
                                        {ifscLoading && <p className="text-xs text-blue-500 mt-1">Fetching bank details...</p>}
                                        {ifscError && <p className="text-xs text-red-500 mt-1">{ifscError}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Bank Name & Branch</label>
                                        <input
                                            type="text" name="bankName" required
                                            value={bankName}
                                            onChange={(e) => setBankName(e.target.value)}
                                            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-gray-50"
                                            placeholder="Auto-filled from IFSC"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">SWIFT / BIC Code (Optional)</label>
                                    <input
                                        type="text" name="swiftCode"
                                        value={swiftCode}
                                        onChange={(e) => setSwiftCode(e.target.value)}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                        placeholder="SWIFT / BIC"
                                    />
                                </div>

                                <div className="pt-4 border-t border-gray-100 flex justify-end">
                                    <button
                                        type="submit"
                                        className="bg-primary hover:bg-cyan-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VendorDashboard;
