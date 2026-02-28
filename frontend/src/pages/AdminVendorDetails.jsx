import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/api';
import { FaArrowLeft, FaCheckCircle, FaBan, FaGlobe, FaEnvelope, FaBuilding, FaUser, FaUniversity } from 'react-icons/fa';

const AdminVendorDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [vendor, setVendor] = useState(null);
    const [stats, setStats] = useState(null);
    const [experiences, setExperiences] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchVendorDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get(`${API_URL}/admin/vendors/${id}`, config);
            setVendor(data.vendor);
            setStats(data.stats);
            setExperiences(data.experiences);
            setLoading(false);
        } catch (error) {
            console.error(error);
            alert('Error fetching details');
            navigate('/admin');
        }
    };

    useEffect(() => {
        fetchVendorDetails();
    }, [id]);

    const handleStatusUpdate = async (isVerified, isActive) => {
        if (!window.confirm('Are you sure you want to update this vendor\'s status?')) return;

        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`${API_URL}/admin/vendors/${id}/status`, { isVerified, isActive }, config);
            fetchVendorDetails(); // Refresh data
        } catch (error) {
            console.error(error);
            alert('Update failed');
        }
    };

    if (loading) return <div className="p-8 text-center">Loading details...</div>;

    return (
        <div className="min-h-screen bg-gray-50 pt-20 p-8 font-sans">
            <div className="container mx-auto max-w-5xl">
                <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 font-medium">
                    <FaArrowLeft /> Back to Dashboard
                </button>

                {/* Header Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-gray-900">{vendor.vendorDetails?.brandName || vendor.name}</h1>
                            {vendor.isVerified ?
                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1"><FaCheckCircle /> Verified</span>
                                :
                                <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Pending Verification</span>
                            }
                        </div>
                        <p className="text-gray-500 flex items-center gap-2"><FaEnvelope className="text-gray-300" /> {vendor.email}</p>
                        <p className="text-gray-500 flex items-center gap-2 mt-1"><FaGlobe className="text-gray-300" /> {vendor.vendorDetails?.website || 'No website'}</p>
                    </div>

                    <div className="flex gap-3">
                        {!vendor.isVerified && (
                            <button
                                onClick={() => handleStatusUpdate(true, true)}
                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold shadow-md transition-all flex items-center gap-2"
                            >
                                <FaCheckCircle /> Approve & Verify
                            </button>
                        )}
                        {vendor.isVerified && (
                            <button
                                onClick={() => handleStatusUpdate(false, false)} // Example logic: unverify/deactivate
                                className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg font-bold transition-all border border-red-200"
                            >
                                Revoke Verification
                            </button>
                        )}

                        <button
                            onClick={() => handleStatusUpdate(vendor.isVerified, !vendor.isActive)}
                            className={`px-4 py-2 rounded-lg font-bold border transition-all ${vendor.isActive ? 'border-red-200 text-red-600 hover:bg-red-50' : 'bg-green-600 text-white hover:bg-green-700'}`}
                        >
                            {vendor.isActive ? 'Deactivate Account' : 'Activate Account'}
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {[
                        { label: 'Total Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, bg: 'bg-green-50 text-green-700' },
                        { label: 'Total Customers', value: stats.totalCustomers, bg: 'bg-blue-50 text-blue-700' },
                        { label: 'Bookings', value: stats.totalBookings, bg: 'bg-purple-50 text-purple-700' },
                        { label: 'Live Experiences', value: stats.totalExperiences, bg: 'bg-orange-50 text-orange-700' },
                    ].map((s, i) => (
                        <div key={i} className={`p-6 rounded-xl border border-gray-100 ${s.bg}`}>
                            <p className="text-sm font-bold opacity-70 uppercase">{s.label}</p>
                            <p className="text-3xl font-extrabold mt-1">{s.value}</p>
                        </div>
                    ))}
                </div>

                {/* Detailed Info Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    {/* Left Col: Vendor Info */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Business Details</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-400 font-bold uppercase">Business Type</label>
                                    <p className="font-medium text-gray-700">{vendor.vendorDetails?.businessType?.replace(/_/g, ' ') || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 font-bold uppercase">Registration Country</label>
                                    <p className="font-medium text-gray-700">{vendor.vendorDetails?.registrationCountry || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 font-bold uppercase">Activity Volume</label>
                                    <p className="font-medium text-gray-700">{vendor.vendorDetails?.activityCount || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 font-bold uppercase">Res. System</label>
                                    <p className="font-medium text-gray-700">{vendor.vendorDetails?.reservationSystem || 'None'}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 font-bold uppercase">Preferred Currency</label>
                                    <p className="font-medium text-gray-700">{vendor.vendorDetails?.currency || 'USD'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Personal Contact</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-400 font-bold uppercase">Full Name</label>
                                    <p className="font-medium text-gray-700">{vendor.name}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 font-bold uppercase">Email</label>
                                    <p className="font-medium text-gray-700">{vendor.email}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 font-bold uppercase">Joined Date</label>
                                    <p className="font-medium text-gray-700">{new Date(vendor.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Bank Details Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2 flex items-center gap-2">
                                <FaUniversity className="text-primary" /> Bank Details
                            </h3>
                            <div className="space-y-4">
                                {vendor.vendorDetails?.bankDetails ? (
                                    <>
                                        <div>
                                            <label className="text-xs text-gray-400 font-bold uppercase">Account Name</label>
                                            <p className="font-medium text-gray-700">{vendor.vendorDetails.bankDetails.accountName || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 font-bold uppercase">Account Number</label>
                                            <p className="font-medium text-gray-700 font-mono">{vendor.vendorDetails.bankDetails.accountNumber || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 font-bold uppercase">Bank Name</label>
                                            <p className="font-medium text-gray-700">{vendor.vendorDetails.bankDetails.bankName || 'N/A'}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-gray-400 font-bold uppercase">IFSC / Routing</label>
                                                <p className="font-medium text-gray-700 font-mono text-sm">{vendor.vendorDetails.bankDetails.ifscCode || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-400 font-bold uppercase">SWIFT / BIC</label>
                                                <p className="font-medium text-gray-700 font-mono text-sm">{vendor.vendorDetails.bankDetails.swiftCode || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-4 bg-gray-50 rounded-lg">
                                        <p className="text-sm font-medium text-gray-500">No bank details provided.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Col: Experiences List */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-gray-900">Services & Experiences</h3>
                                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold ">{experiences.length} Items</span>
                            </div>

                            <div className="divide-y divide-gray-100">
                                {experiences.map(exp => (
                                    <div
                                        key={exp._id}
                                        onClick={() => navigate(`/admin/experience/${exp._id}`)}
                                        className="p-4 hover:bg-gray-50 flex gap-4 transition-colors cursor-pointer"
                                    >
                                        <div className="w-16 h-16 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                                            {exp.images && exp.images[0] ? (
                                                <img src={exp.images[0]} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-gray-200" />
                                            )}
                                        </div>
                                        <div className="flex-grow">
                                            <h4 className="font-bold text-gray-900 group-hover:text-primary transition-colors">{exp.title}</h4>
                                            <p className="text-sm text-gray-500 line-clamp-1">{exp.description}</p>
                                            <div className="flex gap-3 mt-2 text-xs">
                                                <span className="font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">{exp.category}</span>
                                                <span className="text-gray-500">{exp.location.city}, {exp.location.country}</span>
                                                <span className="font-bold text-gray-700 ml-auto">${exp.price}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {experiences.length === 0 && (
                                    <div className="p-8 text-center text-gray-400">This vendor has not added any experiences yet.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminVendorDetails;
