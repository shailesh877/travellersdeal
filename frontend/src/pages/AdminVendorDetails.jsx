import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/api';
import { FaArrowLeft, FaCheckCircle, FaBan, FaGlobe, FaEnvelope, FaBuilding, FaUser, FaUniversity, FaFilePdf, FaFileExcel, FaSyncAlt } from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
const AdminVendorDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [vendor, setVendor] = useState(null);
    const [stats, setStats] = useState(null);
    const [experiences, setExperiences] = useState([]);
    const [loading, setLoading] = useState(true);

    const getBasePrice = (exp) => {
        const pricing = exp.bookingOptions?.[0]?.availabilityAndPricing;
        if (pricing?.pricingTiers && pricing.pricingTiers.length > 0) {
            const adultTier = pricing.pricingTiers.find(t => t.title && t.title.toLowerCase().includes('adult'));
            if (adultTier) return adultTier.price || 0;
            return pricing.pricingTiers[0].price || 0;
        }
        return exp.price || exp.adultPrice || 0;
    };

    const getCurrencySymbol = (code) => {
        if (!code) return '';
        const symbols = { 'USD': '$', 'EUR': '€', 'GBP': '£', 'INR': '₹', 'AED': 'AED ', 'JPY': '¥' };
        return symbols[code] || `${code} `;
    };

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

    const exportToPDF = () => {
        if (!vendor || !stats) return;
        const doc = new jsPDF();
        
        const brandName = vendor.vendorDetails?.brandName || vendor.name;
        
        // Header Section
        doc.setFillColor(41, 128, 185); // Blue header
        doc.rect(0, 0, 210, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("Vendor Performance Report", 14, 20);
        
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
        
        // Vendor Info Box
        doc.setTextColor(44, 62, 80);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("Vendor Profile", 14, 55);
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Brand Name: ${brandName}`, 14, 65);
        doc.text(`Email: ${vendor.email}`, 14, 72);
        doc.text(`Status: ${vendor.isVerified ? 'Verified' : 'Pending'} | ${vendor.isActive ? 'Active' : 'Blocked'}`, 14, 79);
        doc.text(`Joined Date: ${new Date(vendor.createdAt).toLocaleDateString()}`, 14, 86);
        doc.text(`Country: ${vendor.vendorDetails?.registrationCountry || 'N/A'}`, 14, 93);

        // Performance Stats Box
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("Business Stats", 120, 55);
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const vendorCurrencyCode = vendor.vendorDetails?.currency || 'USD';
        doc.text(`Total Revenue: ${vendorCurrencyCode} ${(stats.totalRevenue || 0).toLocaleString()}`, 120, 65);
        doc.text(`Total Customers: ${stats.totalCustomers || 0}`, 120, 72);
        doc.text(`Total Bookings: ${stats.totalBookings || 0}`, 120, 79);
        doc.text(`Live Experiences: ${stats.totalExperiences || 0}`, 120, 86);
        
        // Draw a separator line
        doc.setDrawColor(200, 200, 200);
        doc.line(14, 100, 196, 100);

        if (experiences && experiences.length > 0) {
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("Live Experiences & Services", 14, 112);
            
            autoTable(doc, {
                startY: 118,
                head: [['Experience Title', 'Category', 'Location', 'Bookings', 'Revenue', 'Price']],
                body: experiences.map(e => {
                    const code = e.bookingOptions?.[0]?.availabilityAndPricing?.currency || e.currency || vendor.vendorDetails?.currency || 'USD';
                    return [
                        e.title,
                        e.category,
                        `${e.location?.city || ''}, ${e.location?.country || ''}`.replace(/^, | , $/g, ''),
                        e.totalBookings || 0,
                        `${code} ${(e.totalRevenue || 0).toLocaleString()}`,
                        `${code} ${getBasePrice(e)}`
                    ];
                }),
                theme: 'grid',
                headStyles: { fillColor: [44, 62, 80], textColor: 255, fontSize: 10 },
                bodyStyles: { fontSize: 9, textColor: 50 },
                alternateRowStyles: { fillColor: [245, 247, 250] },
                margin: { top: 10, left: 14, right: 14 }
            });
        }
        
        doc.save(`${brandName.replace(/ /g, '_')}_Report.pdf`);
    };

    const exportToExcel = () => {
        if (!vendor || !stats) return;
        const wb = XLSX.utils.book_new();

        const vendorDetails = [
            { Field: 'Name', Value: vendor.name },
            { Field: 'Brand Name', Value: vendor.vendorDetails?.brandName || 'N/A' },
            { Field: 'Email', Value: vendor.email },
            { Field: 'Website', Value: vendor.vendorDetails?.website || 'N/A' },
            { Field: 'Business Type', Value: vendor.vendorDetails?.businessType || 'N/A' },
            { Field: 'Registration Country', Value: vendor.vendorDetails?.registrationCountry || 'N/A' },
            { Field: 'Status', Value: vendor.isVerified ? 'Verified' : 'Pending' },
            { Field: 'Joined Date', Value: new Date(vendor.createdAt).toLocaleDateString() },
            { Field: 'Total Revenue', Value: `${vendor.vendorDetails?.currency || 'USD'} ${(stats.totalRevenue || 0).toLocaleString()}` },
            { Field: 'Total Customers', Value: stats.totalCustomers || 0 },
            { Field: 'Total Bookings', Value: stats.totalBookings || 0 },
            { Field: 'Live Experiences', Value: stats.totalExperiences || 0 }
        ];

        if (vendor.vendorDetails?.bankDetails) {
            const bank = vendor.vendorDetails.bankDetails;
            vendorDetails.push({ Field: 'Bank Account Name', Value: bank.accountName });
            vendorDetails.push({ Field: 'Bank Account Number', Value: bank.accountNumber });
            vendorDetails.push({ Field: 'Bank Name', Value: bank.bankName });
            vendorDetails.push({ Field: 'IFSC / Routing', Value: bank.ifscCode });
            vendorDetails.push({ Field: 'SWIFT / BIC', Value: bank.swiftCode });
        }

        const wsDetails = XLSX.utils.json_to_sheet(vendorDetails);
        XLSX.utils.book_append_sheet(wb, wsDetails, "Vendor Details");

        if (experiences && experiences.length > 0) {
            const expData = experiences.map(e => {
                const code = e.bookingOptions?.[0]?.availabilityAndPricing?.currency || e.currency || vendor.vendorDetails?.currency || 'USD';
                return {
                    'Title': e.title,
                    'Category': e.category,
                    'City': e.location?.city,
                    'Country': e.location?.country,
                    'Total Bookings': e.totalBookings || 0,
                    'Total Revenue': `${code} ${(e.totalRevenue || 0).toLocaleString()}`,
                    'Base Price': `${code} ${getBasePrice(e)}`
                };
            });
            const wsExp = XLSX.utils.json_to_sheet(expData);
            XLSX.utils.book_append_sheet(wb, wsExp, "Experiences");
        }

        XLSX.writeFile(wb, `${(vendor.vendorDetails?.brandName || vendor.name).replace(/ /g, '_')}_Vendor_Report.xlsx`);
    };

    if (loading) return <div className="p-8 text-center">Loading details...</div>;

    return (
        <div className="min-h-screen bg-gray-50 pt-20 p-8 font-sans">
            <div className="container mx-auto max-w-5xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                    <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium w-fit">
                        <FaArrowLeft /> Back to Dashboard
                    </button>
                    <button 
                        onClick={() => { setLoading(true); fetchVendorDetails(); }} 
                        disabled={loading}
                        className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-100 transition-colors w-fit disabled:opacity-50"
                    >
                        <FaSyncAlt className={loading ? "animate-spin" : ""} /> Refresh Data
                    </button>
                </div>

                {/* Header Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8 flex flex-col md:flex-row gap-6 md:justify-between items-start">
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

                    <div className="flex flex-wrap gap-3">
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
                    <div className="flex gap-2 w-full md:w-auto md:ml-4 border-t md:border-t-0 pt-4 md:pt-0 mt-2 md:mt-0 md:border-l border-gray-100 md:pl-4 items-center">
                        <button onClick={exportToPDF} className="flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                            <FaFilePdf /> PDF
                        </button>
                        <button onClick={exportToExcel} className="flex items-center gap-2 bg-green-50 text-green-600 hover:bg-green-100 px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                            <FaFileExcel /> Excel
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {[
                        { label: 'Total Revenue', value: `${getCurrencySymbol(vendor.vendorDetails?.currency || 'USD')}${(stats.totalRevenue || 0).toLocaleString()}`, bg: 'bg-green-50 text-green-700' },
                        { label: 'Total Customers', value: stats.totalCustomers || 0, bg: 'bg-blue-50 text-blue-700' },
                        { label: 'Bookings', value: stats.totalBookings || 0, bg: 'bg-purple-50 text-purple-700' },
                        { label: 'Live Experiences', value: stats.totalExperiences || 0, bg: 'bg-orange-50 text-orange-700' },
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
                                                <img src={exp.images[0].startsWith('http') ? exp.images[0] : `${API_URL.replace('/api', '')}${exp.images[0]}`} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-gray-200" />
                                            )}
                                        </div>
                                        <div className="flex-grow">
                                            <h4 className="font-bold text-gray-900 group-hover:text-primary transition-colors">{exp.title}</h4>
                                            <p className="text-sm text-gray-500 line-clamp-1">{exp.description}</p>
                                            <div className="flex gap-3 mt-2 text-xs items-center">
                                                <span className="font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">{exp.category}</span>
                                                <span className="text-gray-500">{exp.location.city}, {exp.location.country}</span>
                                                <div className="ml-auto flex items-center gap-4">
                                                    {(() => {
                                                        const sym = getCurrencySymbol(exp.bookingOptions?.[0]?.availabilityAndPricing?.currency || exp.currency || vendor?.vendorDetails?.currency);
                                                        return (
                                                            <>
                                                                <span className="text-gray-500 font-medium">Bookings: <strong className="text-gray-900">{exp.totalBookings || 0}</strong></span>
                                                                <span className="text-gray-500 font-medium">Revenue: <strong className="text-green-600">{sym}{(exp.totalRevenue || 0).toLocaleString()}</strong></span>
                                                                <span className="font-bold text-gray-700 text-sm ml-2">{sym}{getBasePrice(exp)}</span>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
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
