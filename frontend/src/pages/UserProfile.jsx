import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { Link, useLocation } from 'react-router-dom';
import {
    FaUserCircle, FaEnvelope, FaCalendarAlt, FaHistory,
    FaHeart, FaRegHeart, FaStar, FaMapMarkerAlt
} from 'react-icons/fa';

const UserProfile = () => {
    const { user, refreshUser } = useContext(AuthContext);
    const location = useLocation();
    const [bookings, setBookings] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    // Read ?tab=liked from URL (e.g. when coming from navbar heart)
    const initialTab = new URLSearchParams(location.search).get('tab') === 'liked' ? 'liked' : 'bookings';
    const [activeTab, setActiveTab] = useState(initialTab);

    const config = { headers: { Authorization: `Bearer ${user?.token || localStorage.getItem('token')}` } };

    useEffect(() => {
        if (!user) return;

        const fetchAll = async () => {
            try {
                const [bookRes, wishRes] = await Promise.all([
                    axios.get(`${API_URL}/bookings/mybookings`, config),
                    axios.get(`${API_URL}/users/wishlist`, config),
                ]);
                setBookings(bookRes.data);
                setWishlist(wishRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [user]);

    const removeFromWishlist = async (expId) => {
        try {
            await axios.delete(`${API_URL}/users/wishlist/${expId}`, config);
            setWishlist(prev => prev.filter(e => e._id !== expId));
            refreshUser(); // sync heart icon on other pages
        } catch (err) { console.error(err); }
    };

    if (!user) return (
        <div className="min-h-screen flex items-center justify-center text-gray-500">
            Please log in to view your profile.
        </div>
    );

    const tabs = [
        { id: 'bookings', label: 'Booking History', icon: <FaHistory /> },
        { id: 'liked', label: 'Liked Experiences', icon: <FaHeart className="text-red-400" />, count: wishlist.length },
    ];

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4">
            <div className="container mx-auto max-w-6xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* ── Sidebar ── */}
                    <div className="md:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center sticky top-24">
                            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary text-4xl">
                                <FaUserCircle />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">{user.name}</h2>
                            <p className="text-sm text-gray-500 uppercase font-bold tracking-wider mb-6">{user.role}</p>

                            <div className="flex items-center justify-center gap-2 text-gray-600 bg-gray-50 py-3 rounded-xl mb-6">
                                <FaEnvelope className="text-gray-400" />
                                <span className="text-sm font-medium">{user.email}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-center border-t border-gray-100 pt-6">
                                <div>
                                    <span className="block text-2xl font-bold text-gray-900">{bookings.length}</span>
                                    <span className="text-xs text-gray-400 font-medium uppercase">Bookings</span>
                                </div>
                                <div>
                                    <span className="block text-2xl font-bold text-red-400">{wishlist.length}</span>
                                    <span className="text-xs text-gray-400 font-medium uppercase">Liked</span>
                                </div>
                            </div>

                            {/* Tab switcher in sidebar */}
                            <div className="mt-6 space-y-2">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.id
                                            ? 'bg-primary text-white shadow-md shadow-primary/20'
                                            : 'text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        {tab.icon}
                                        <span>{tab.label}</span>
                                        {tab.count > 0 && (
                                            <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-red-100 text-red-500'}`}>
                                                {tab.count}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Main Content ── */}
                    <div className="md:col-span-2">

                        {/* ── BOOKING HISTORY TAB ── */}
                        {activeTab === 'bookings' && (
                            <>
                                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                    <FaHistory className="text-primary" /> Booking History
                                </h3>

                                {loading ? (
                                    <div className="flex justify-center p-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    </div>
                                ) : bookings.length === 0 ? (
                                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                                        <FaCalendarAlt className="text-gray-300 text-6xl mb-4 mx-auto" />
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">No bookings yet</h3>
                                        <p className="text-gray-500 mb-6">You haven't booked any experiences yet.</p>
                                        <a href="/experiences" className="inline-block bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-cyan-600 transition-colors">
                                            Browse Experiences
                                        </a>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {bookings.map((booking) => (
                                            <div key={booking._id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 transition-transform hover:shadow-md">
                                                <div className="w-full md:w-1/3 h-48 md:h-auto rounded-xl overflow-hidden relative">
                                                    <img
                                                        src={booking.experience?.images?.[0] || 'https://via.placeholder.com/300x200'}
                                                        alt={booking.experience?.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className={`absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-bold uppercase text-white shadow-sm ${booking.status === 'confirmed' ? 'bg-green-500' : booking.status === 'cancelled' ? 'bg-red-500' : 'bg-yellow-500'}`}>
                                                        {booking.status}
                                                    </div>
                                                </div>

                                                <div className="flex-1 flex flex-col justify-between py-1">
                                                    <div>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h4 className="text-xl font-bold text-gray-900 line-clamp-2">{booking.experience?.title}</h4>
                                                            <span className="text-lg font-bold text-primary whitespace-nowrap">${booking.totalPrice}</span>
                                                        </div>
                                                        <div className="space-y-2 mb-4">
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <FaCalendarAlt className="text-gray-400" />
                                                                <span className="font-medium">{new Date(booking.date).toLocaleDateString()}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <FaUserCircle className="text-gray-400" />
                                                                <span>{booking.slots} Guest{booking.slots > 1 ? 's' : ''}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-3 pt-4 border-t border-gray-50">
                                                        <button className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-semibold transition-colors">
                                                            View Details
                                                        </button>
                                                        {booking.status === 'pending' && (
                                                            <button className="flex-1 border border-red-200 text-red-500 hover:bg-red-50 py-2 rounded-lg text-sm font-semibold transition-colors">
                                                                Cancel Booking
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}

                        {/* ── LIKED / WISHLIST TAB ── */}
                        {activeTab === 'liked' && (
                            <>
                                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                    <FaHeart className="text-red-400" /> Liked Experiences
                                </h3>

                                {loading ? (
                                    <div className="flex justify-center p-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    </div>
                                ) : wishlist.length === 0 ? (
                                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                                        <FaRegHeart className="text-gray-300 text-6xl mb-4 mx-auto" />
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">No liked experiences yet</h3>
                                        <p className="text-gray-500 mb-6">Heart any experience to save it here for later!</p>
                                        <a href="/experiences" className="inline-block bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-cyan-600 transition-colors">
                                            Browse Experiences
                                        </a>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        {wishlist.map(exp => (
                                            <div key={exp._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group">
                                                <div className="relative h-44 overflow-hidden">
                                                    <Link to={`/experience/${exp._id}`}>
                                                        <img
                                                            src={exp.images?.[0]
                                                                ? (exp.images[0].startsWith('http') ? exp.images[0] : `${API_URL.replace('/api', '')}${exp.images[0]}`)
                                                                : 'https://placehold.co/400x300'}
                                                            alt={exp.title}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                        />
                                                    </Link>
                                                    {/* Remove heart button */}
                                                    <button
                                                        onClick={() => removeFromWishlist(exp._id)}
                                                        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                                                        title="Remove from liked"
                                                    >
                                                        <FaHeart className="text-red-500 text-sm" />
                                                    </button>
                                                    {exp.category && (
                                                        <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/50 text-white text-xs font-bold">
                                                            {exp.category}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="p-4">
                                                    <div className="flex items-center gap-1 mb-1">
                                                        {[...Array(5)].map((_, i) => (
                                                            <FaStar key={i} className={`text-xs ${i < Math.floor(exp.rating || 0) ? 'text-yellow-400' : 'text-gray-200'}`} />
                                                        ))}
                                                        <span className="text-gray-400 text-xs ml-1">({exp.reviewsCount || 0})</span>
                                                    </div>
                                                    <Link to={`/experience/${exp._id}`}>
                                                        <h4 className="font-bold text-gray-900 line-clamp-2 hover:text-primary transition-colors mb-2">{exp.title}</h4>
                                                    </Link>
                                                    {exp.location && (
                                                        <div className="flex items-center gap-1 text-gray-500 text-xs mb-3">
                                                            <FaMapMarkerAlt className="text-xs" />
                                                            <span>{exp.location?.city}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-gray-400">{exp.duration}</span>
                                                        <span className="font-bold text-gray-900">
                                                            {exp.currency === 'INR' ? '₹' : '$'}{exp.price}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
