import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/api';
import { FaArrowLeft, FaCheckCircle, FaBan, FaEnvelope, FaCalendarAlt, FaMapMarkerAlt, FaStar, FaEdit, FaTrash, FaPlus, FaTimes } from 'react-icons/fa';

const AdminUserDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingReview, setEditingReview] = useState(null); // { _id, rating, comment }
    const [showAddReview, setShowAddReview] = useState(false);
    const [newReview, setNewReview] = useState({ experienceId: '', rating: 5, comment: '' });
    const [reviewLoading, setReviewLoading] = useState(false);

    const fetchUserDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get(`${API_URL}/admin/users/${id}`, config);
            setUser(data.user);
            setStats(data.stats);
            setBookings(data.bookings);
            setReviews(data.reviews || []);
            setLoading(false);
        } catch (error) {
            console.error(error);
            alert('Error fetching user details');
            navigate('/admin');
        }
    };

    useEffect(() => {
        fetchUserDetails();
    }, [id]);

    const handleStatusUpdate = async (isActive) => {
        if (!window.confirm(`Are you sure you want to ${isActive ? 'unblock' : 'block'} this user?`)) return;

        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`${API_URL}/admin/users/${id}/status`, { isActive }, config);
            fetchUserDetails(); // Refresh data
        } catch (error) {
            console.error(error);
            alert('Update failed');
        }
    };

    // Helper for formatting price safely
    const formatPrice = (price) => {
        return price ? `$${price.toLocaleString()}` : '$0';
    };

    const getAuthConfig = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm('Delete this review?')) return;
        try {
            setReviewLoading(true);
            await axios.delete(`${API_URL}/admin/reviews/${reviewId}`, getAuthConfig());
            setReviews(prev => prev.filter(r => r._id !== reviewId));
        } catch (e) { alert('Delete failed'); } finally { setReviewLoading(false); }
    };

    const handleUpdateReview = async () => {
        if (!editingReview) return;
        try {
            setReviewLoading(true);
            const { data } = await axios.put(`${API_URL}/admin/reviews/${editingReview._id}`,
                { rating: editingReview.rating, comment: editingReview.comment }, getAuthConfig());
            setReviews(prev => prev.map(r => r._id === data._id ? data : r));
            setEditingReview(null);
        } catch (e) { alert('Update failed'); } finally { setReviewLoading(false); }
    };

    const handleAddReview = async () => {
        if (!newReview.experienceId || !newReview.comment) return alert('Please select an experience and write a comment.');
        try {
            setReviewLoading(true);
            const { data } = await axios.post(`${API_URL}/admin/reviews`,
                { userId: id, experienceId: newReview.experienceId, rating: newReview.rating, comment: newReview.comment },
                getAuthConfig());
            setReviews(prev => [data, ...prev]);
            setNewReview({ experienceId: '', rating: 5, comment: '' });
            setShowAddReview(false);
        } catch (e) { alert(e?.response?.data?.message || 'Failed to add review'); } finally { setReviewLoading(false); }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>;

    return (
        <div className="min-h-screen bg-gray-50 pt-20 p-8 font-sans">
            <div className="container mx-auto max-w-5xl">
                <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 font-medium">
                    <FaArrowLeft /> Back to Dashboard
                </button>

                {/* Header Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8 flex justify-between items-start">
                    <div className="flex gap-6 items-center">
                        <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-3xl shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : user.role === 'vendor' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>
                                    {user.role}
                                </span>
                                {user.isActive ?
                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1"><FaCheckCircle /> Active</span>
                                    :
                                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1"><FaBan /> Blocked</span>
                                }
                            </div>
                            <p className="text-gray-500 flex items-center gap-2 mb-1"><FaEnvelope className="text-gray-400" /> {user.email}</p>
                            <p className="text-gray-500 flex items-center gap-2 text-sm"><FaCalendarAlt className="text-gray-400" /> Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        {user.role !== 'admin' && (
                            <button
                                onClick={() => handleStatusUpdate(!user.isActive)}
                                className={`px-6 py-2 rounded-lg font-bold border transition-all shadow-sm ${user.isActive ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-green-60 text-green-700 border-green-200 hover:bg-green-100'}`}
                            >
                                {user.isActive ? 'Block User' : 'Unblock User'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total Spent', value: formatPrice(stats.totalSpent), bg: 'bg-green-50 text-green-700' },
                        { label: 'Total Bookings', value: stats.totalBookings, bg: 'bg-blue-50 text-blue-700' },
                        { label: 'Active Bookings', value: stats.activeBookings, bg: 'bg-purple-50 text-purple-700' },
                        { label: 'Total Reviews', value: stats.totalReviews ?? reviews.length, bg: 'bg-yellow-50 text-yellow-700' },
                    ].map((s, i) => (
                        <div key={i} className={`p-5 rounded-xl border border-gray-100 ${s.bg}`}>
                            <p className="text-xs font-bold opacity-70 uppercase tracking-wide">{s.label}</p>
                            <p className="text-3xl font-extrabold mt-1">{s.value}</p>
                        </div>
                    ))}
                </div>

                {/* Bookings List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-900 border-l-4 border-primary pl-3">Booking History (360° View)</h3>
                        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-bold ">{bookings.length} Bookings</span>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {bookings.map(booking => (
                            <div key={booking._id} className="p-6 hover:bg-gray-50 flex flex-col md:flex-row gap-6 transition-colors">
                                {/* Experience Image & Details */}
                                <div className="flex gap-4 flex-1">
                                    <div className="w-24 h-24 rounded-xl bg-gray-200 overflow-hidden flex-shrink-0 cursor-pointer" onClick={() => navigate(`/admin/experience/${booking.experience?._id}`)}>
                                        {booking.experience?.images && booking.experience.images[0] ? (
                                            <img src={booking.experience.images[0].startsWith('http') ? booking.experience.images[0] : `${API_URL.replace('/api', '')}${booking.experience.images[0]}`} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                                        ) : (
                                            <div className="w-full h-full bg-gray-200" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex gap-3 mb-1">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                                                {booking.status}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${booking.paymentStatus === 'paid' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                                {booking.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                                            </span>
                                        </div>
                                        <h4
                                            className="font-bold text-gray-900 text-lg hover:text-primary cursor-pointer transition-colors"
                                            onClick={() => navigate(`/admin/experience/${booking.experience?._id}`)}
                                        >
                                            {booking.experience?.title || 'Unknown Experience'}
                                        </h4>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                                            <FaMapMarkerAlt className="text-gray-400" /> {booking.experience?.location?.city || 'N/A'}, {booking.experience?.location?.country || 'N/A'}
                                        </div>
                                        <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                                            <span>Provider:</span>
                                            <span
                                                className="font-medium text-gray-700 hover:text-primary cursor-pointer"
                                                onClick={() => navigate(`/admin/vendor/${booking.experience?.vendor?._id}`)}
                                            >
                                                {booking.experience?.vendor?.vendorDetails?.brandName || booking.experience?.vendor?.name || 'Unknown'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Booking Specifics */}
                                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 min-w-[280px] flex flex-col justify-center">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Booking Ref</span>
                                        <span className="text-xs font-mono bg-white px-2 py-1 rounded border border-gray-200 text-gray-700">{booking._id.substring(18).toUpperCase()}</span>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">Booked On</span>
                                            <span className="text-sm font-medium text-gray-900">{new Date(booking.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">Exp. Date</span>
                                            <span className="text-sm font-bold text-gray-900">{new Date(booking.date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">Time Slot</span>
                                            <span className="text-sm font-bold text-primary bg-blue-50 px-2 py-0.5 rounded">{booking.timeSlot || 'Any Time'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">Total Guests</span>
                                            <span className="text-sm font-bold text-gray-900 bg-gray-200 px-2 py-0.5 rounded-full min-w-8 text-center">{booking.slots || 1}</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-3 border-t border-gray-200 mt-auto">
                                        <span className="text-sm text-gray-500 font-medium">Total Paid</span>
                                        <span className="text-xl font-black text-gray-900">{formatPrice(booking.totalPrice)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {bookings.length === 0 && (
                            <div className="p-12 text-center flex flex-col items-center justify-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <FaCalendarAlt className="text-gray-300 text-2xl" />
                                </div>
                                <h4 className="text-lg font-bold text-gray-900 mb-1">No Bookings Yet</h4>
                                <p className="text-gray-500">This user hasn't made any bookings on the platform.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Reviews Section */}
                <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-900 border-l-4 border-yellow-400 pl-3">Reviews Written</h3>
                        <div className="flex items-center gap-3">
                            <span className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold">{reviews.length} Reviews</span>
                            <button
                                onClick={() => { setShowAddReview(v => !v); setEditingReview(null); }}
                                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-cyan-600 transition-colors"
                            >
                                {showAddReview ? <><FaTimes /> Cancel</> : <><FaPlus /> Add Review</>}
                            </button>
                        </div>
                    </div>

                    {/* Add Review Form */}
                    {showAddReview && (
                        <div className="p-6 bg-blue-50 border-b border-blue-100">
                            <h4 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">Write a New Review for this User</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-600 mb-1 block">Select Experience</label>
                                    <select
                                        value={newReview.experienceId}
                                        onChange={e => setNewReview(p => ({ ...p, experienceId: e.target.value }))}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                    >
                                        <option value="">-- Choose an experience --</option>
                                        {bookings.map(b => b.experience && (
                                            <option key={b._id} value={b.experience._id}>{b.experience.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-600 mb-1 block">Rating</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <FaStar
                                                key={star}
                                                onClick={() => setNewReview(p => ({ ...p, rating: star }))}
                                                className={`text-2xl cursor-pointer transition-colors ${star <= newReview.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                            />
                                        ))}
                                        <span className="text-sm text-gray-500 ml-2">{newReview.rating}/5</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="text-xs font-bold text-gray-600 mb-1 block">Review Comment</label>
                                <textarea
                                    rows={3}
                                    placeholder="Write the review comment..."
                                    value={newReview.comment}
                                    onChange={e => setNewReview(p => ({ ...p, comment: e.target.value }))}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                                />
                            </div>
                            <button
                                onClick={handleAddReview}
                                disabled={reviewLoading}
                                className="bg-primary text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-cyan-600 transition-colors disabled:opacity-60"
                            >
                                {reviewLoading ? 'Saving...' : 'Submit Review'}
                            </button>
                        </div>
                    )}

                    <div className="divide-y divide-gray-100">
                        {reviews.map(review => (
                            <div key={review._id} className="p-5 hover:bg-gray-50 transition-colors">
                                {editingReview?._id === review._id ? (
                                    /* Inline Edit Form */
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-xs font-bold text-gray-600 uppercase">Rating:</span>
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <FaStar
                                                    key={star}
                                                    onClick={() => setEditingReview(p => ({ ...p, rating: star }))}
                                                    className={`text-xl cursor-pointer transition-colors ${star <= editingReview.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                                />
                                            ))}
                                            <span className="text-sm text-gray-500">{editingReview.rating}/5</span>
                                        </div>
                                        <textarea
                                            rows={3}
                                            value={editingReview.comment}
                                            onChange={e => setEditingReview(p => ({ ...p, comment: e.target.value }))}
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none resize-none mb-3"
                                        />
                                        <div className="flex gap-2">
                                            <button onClick={handleUpdateReview} disabled={reviewLoading} className="bg-green-600 text-white px-5 py-1.5 rounded-lg text-sm font-bold hover:bg-green-700">{reviewLoading ? 'Saving...' : 'Save'}</button>
                                            <button onClick={() => setEditingReview(null)} className="bg-gray-100 text-gray-700 px-5 py-1.5 rounded-lg text-sm font-bold hover:bg-gray-200">Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    /* Review Display */
                                    <div className="flex gap-4">
                                        <div
                                            className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 cursor-pointer"
                                            onClick={() => navigate(`/admin/experience/${review.experience?._id}`)}
                                        >
                                            {review.experience?.images?.[0] ? (
                                                <img src={review.experience.images[0].startsWith('http') ? review.experience.images[0] : `${API_URL.replace('/api', '')}${review.experience.images[0]}`}
                                                    alt="" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                                            ) : <div className="w-full h-full bg-gray-200" />}
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-1">
                                                <span className="font-semibold text-gray-900 hover:text-primary cursor-pointer text-sm"
                                                    onClick={() => navigate(`/admin/experience/${review.experience?._id}`)}>
                                                    {review.experience?.title || 'Unknown Experience'}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                                                    <button
                                                        onClick={() => setEditingReview({ _id: review._id, rating: review.rating, comment: review.comment })}
                                                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit review"
                                                    ><FaEdit /></button>
                                                    <button
                                                        onClick={() => handleDeleteReview(review._id)}
                                                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete review"
                                                    ><FaTrash /></button>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-0.5 mb-2">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <FaStar key={star} className={`text-sm ${star <= review.rating ? 'text-yellow-400' : 'text-gray-200'}`} />
                                                ))}
                                                <span className="text-xs text-gray-500 ml-1 font-medium">{review.rating}/5</span>
                                            </div>
                                            <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {reviews.length === 0 && !showAddReview && (
                            <div className="p-12 text-center flex flex-col items-center">
                                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <FaStar className="text-gray-300 text-2xl" />
                                </div>
                                <h4 className="font-bold text-gray-900 mb-1">No Reviews Yet</h4>
                                <p className="text-gray-500 text-sm">Add the first review for this user using the button above.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminUserDetails;
