import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/api';
import { FaArrowLeft, FaCheckCircle, FaTimesCircle, FaMapMarkerAlt, FaClock, FaTag, FaLanguage, FaUserFriends, FaCheck, FaTimes, FaCalendarAlt, FaUtensils } from 'react-icons/fa';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const AdminExperienceDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [experience, setExperience] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchExperience = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get(`${API_URL}/experiences/${id}`, config);
            setExperience(data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            alert('Error fetching experience');
            navigate('/admin');
        }
    };

    useEffect(() => {
        fetchExperience();
    }, [id]);

    const handleModeration = async (status) => {
        if (!window.confirm(`Are you sure you want to ${status} this experience?`)) return;

        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`${API_URL}/admin/experiences/${id}/verify`, { status }, config);
            alert(`Experience ${status} successfully!`);
            navigate('/admin');
        } catch (error) {
            console.error(error);
            alert('Action failed');
        }
    };

    const isChanged = (field) => {
        if (!experience?.lastApprovedSnapshot) return false;

        let curr = experience[field];
        let prev = experience.lastApprovedSnapshot[field];

        if (curr === prev) return false;
        if (curr == null || prev == null) return curr !== prev;

        const cleanObj = (obj) => {
            if (Array.isArray(obj)) return obj.map(cleanObj);
            if (typeof obj === 'object' && obj !== null) {
                const cleaned = {};
                Object.keys(obj).sort().forEach(key => { // Sort keys for safe stringify
                    if (!['_id', 'id', 'updatedAt', 'createdAt'].includes(key)) {
                        cleaned[key] = cleanObj(obj[key]);
                    }
                });
                return cleaned;
            }
            return obj;
        };

        return JSON.stringify(cleanObj(curr)) !== JSON.stringify(cleanObj(prev));
    };

    const HighlightLabel = ({ field }) => {
        if (!isChanged(field)) return null;
        return <span className="ml-2 inline-block align-middle text-[10px] bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded font-black uppercase tracking-wider shadow-sm">Updated</span>;
    };

    const DiffView = ({ field, label }) => {
        if (!isChanged(field)) return null;
        let oldVal = experience?.lastApprovedSnapshot?.[field];

        if (field === 'location') {
            oldVal = `${oldVal?.city || 'N/A'}, ${oldVal?.country || 'N/A'}`;
        } else if (Array.isArray(oldVal)) {
            oldVal = oldVal.length ? oldVal.join(', ') : 'None';
        } else if (typeof oldVal === 'object' && oldVal !== null) {
            oldVal = 'Complex Data Changed';
        } else {
            oldVal = oldVal?.toString() || 'Empty';
        }

        return (
            <div className="mt-2 text-[12px] text-red-600 bg-red-50/80 px-2.5 py-1.5 rounded-lg inline-block border border-red-100 shadow-sm">
                <span className="font-bold mr-1">Previous {label || field}:</span>
                <span className="line-through opacity-80">{oldVal}</span>
            </div>
        );
    };

    const getBgClass = (field, defaultClass = "") => {
        return isChanged(field) ? `${defaultClass} bg-yellow-50 border-yellow-300 ring-1 ring-yellow-400/30 rounded-lg p-1 -m-1 transition-all` : defaultClass;
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 pt-20 p-8 font-sans">
            <div className="container mx-auto max-w-4xl">
                <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 font-medium">
                    <FaArrowLeft /> Back to Dashboard
                </button>

                {/* Moderation Actions Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8 sticky top-4 z-10 flex justify-between items-center">
                    <div>
                        <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">Status</p>
                        <div className="flex items-center gap-2">
                            {experience.status === 'approved' && <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold uppercase flex items-center gap-2"><FaCheckCircle /> Approved</span>}
                            {experience.status === 'rejected' && <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold uppercase flex items-center gap-2"><FaTimesCircle /> Rejected</span>}
                            {experience.status === 'pending' && <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-bold uppercase flex items-center gap-2">Pending Review</span>}
                        </div>
                    </div>
                    <div className="flex gap-4">
                        {experience.status !== 'rejected' && (
                            <button
                                onClick={() => handleModeration('rejected')}
                                className="px-6 py-3 rounded-xl font-bold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors"
                            >
                                Reject
                            </button>
                        )}
                        {experience.status !== 'approved' && (
                            <button
                                onClick={() => handleModeration('approved')}
                                className="px-6 py-3 rounded-xl font-bold bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl transition-all"
                            >
                                Approve & Publish
                            </button>
                        )}
                    </div>
                </div>

                {/* Content Preview */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Header Image */}
                    <div className="h-64 w-full bg-gray-200 relative">
                        {experience.images && experience.images[0] ? (
                            <img src={experience.images[0].startsWith('http') ? experience.images[0] : `${API_URL.replace('/api', '')}${experience.images[0]}`} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                        )}
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-sm">
                            <span className={`font-bold text-lg ${getBgClass('price')}`}>${experience.price}</span>
                            <DiffView field="price" label="Price" />
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="flex justify-between items-start mb-6 align-top">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                    <span className={getBgClass('title')}>{experience.title}</span>
                                    <HighlightLabel field="title" />
                                </h1>
                                <DiffView field="title" label="Title" />
                                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
                                    <div className="flex flex-col">
                                        <span className={`flex items-center gap-1 px-2 py-1 rounded ${getBgClass('location', 'bg-gray-100')}`}><FaMapMarkerAlt className="text-primary" /> {experience.location?.city}, {experience.location?.country} <HighlightLabel field="location" /></span>
                                        <DiffView field="location" label="Location" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`flex items-center gap-1 px-2 py-1 rounded ${getBgClass('duration', 'bg-gray-100')}`}><FaClock className="text-primary" /> {experience.duration} <HighlightLabel field="duration" /></span>
                                        <DiffView field="duration" label="Duration" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`flex items-center gap-1 px-2 py-1 rounded ${getBgClass('category', 'bg-gray-100')}`}><FaTag className="text-primary" /> {experience.category} <HighlightLabel field="category" /></span>
                                        <DiffView field="category" label="Category" />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <p className="text-xs font-bold text-blue-500 uppercase mb-1">Uploaded By</p>
                                <p className="font-bold text-gray-900">{experience.vendor?.name}</p>
                                <p className="text-sm text-gray-600">{experience.vendor?.email}</p>
                            </div>
                        </div>

                        <div className={`prose max-w-none text-gray-600 mb-8 pb-8 border-b border-gray-100 ${getBgClass('description')}`}>
                            <h3 className="text-gray-900 font-bold text-lg mb-2">Description <HighlightLabel field="description" /></h3>
                            <p>{experience.description}</p>
                            <DiffView field="description" label="Description" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 pb-8 border-b border-gray-100">
                            {/* Key Details */}
                            <div className="md:col-span-1 space-y-6">
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-3">Key Information</h3>
                                    <div className="space-y-3 text-sm text-gray-600">
                                        <div className={`flex flex-col gap-1 ${getBgClass('languages')}`}>
                                            <div className="flex items-center gap-3">
                                                <FaLanguage className="text-primary text-lg" />
                                                <span>Languages: <span className="font-medium text-gray-900">{experience.languages?.join(', ') || 'English'}</span></span><HighlightLabel field="languages" />
                                            </div>
                                            <DiffView field="languages" label="Languages" />
                                        </div>
                                        <div className={`flex flex-col gap-1 ${getBgClass('capacity')}`}>
                                            <div className="flex items-center gap-3">
                                                <FaUserFriends className="text-primary text-lg" />
                                                <span>Capacity: <span className="font-medium text-gray-900">{experience.capacity || 'N/A'} Guests</span></span><HighlightLabel field="capacity" />
                                            </div>
                                            <DiffView field="capacity" label="Capacity" />
                                        </div>
                                        <div className={`flex flex-col gap-1 ${getBgClass('timeSlots')}`}>
                                            <div className="flex items-start gap-3">
                                                <FaCalendarAlt className="text-primary text-lg mt-0.5" />
                                                <div>
                                                    <span>Time Slots: <HighlightLabel field="timeSlots" /></span>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {experience.timeSlots && experience.timeSlots.length > 0 ? (
                                                            experience.timeSlots.map((slot, index) => (
                                                                <span key={index} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                                                                    {slot}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-gray-500 italic">No specific time slots</span>
                                                        )}
                                                    </div>
                                                    <DiffView field="timeSlots" label="Time Slots" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {experience.includes?.length > 0 && (
                                    <div className={`p-2 rounded-lg -m-2 ${getBgClass('includes')}`}>
                                        <h3 className="font-bold text-gray-900 mb-3">Includes <HighlightLabel field="includes" /></h3>
                                        <ul className="space-y-2 text-sm text-gray-600">
                                            {experience.includes?.map((item, i) => (
                                                <li key={i} className="flex items-start gap-2">
                                                    <FaCheck className="text-green-500 mt-1 flex-shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <DiffView field="includes" label="Includes" />
                                    </div>
                                )}

                                {experience.highlights?.length > 0 && (
                                    <div className={`p-2 rounded-lg -m-2 mt-4 ${getBgClass('highlights')}`}>
                                        <h3 className="font-bold text-gray-900 mb-3">Highlights <HighlightLabel field="highlights" /></h3>
                                        <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
                                            {experience.highlights?.map((h, i) => <li key={i}>{h}</li>)}
                                        </ul>
                                        <DiffView field="highlights" label="Highlights" />
                                    </div>
                                )}
                            </div>

                            {/* Itinerary */}
                            <div className={`md:col-span-2 p-4 rounded-xl -m-4 ${getBgClass('itinerary')}`}>
                                <h3 className="font-bold text-gray-900 mb-4 text-xl">Itinerary <HighlightLabel field="itinerary" /></h3>
                                <div className="space-y-6">
                                    {experience.itinerary?.length > 0 ? experience.itinerary.map((stop, i) => (
                                        <div key={i} className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-primary flex items-center justify-center font-bold shadow-sm shrink-0">
                                                    {i + 1}
                                                </div>
                                                {i !== experience.itinerary.length - 1 && <div className="w-0.5 h-full bg-blue-100 my-2"></div>}
                                            </div>
                                            <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 flex-1">
                                                <h4 className="font-bold text-gray-900 text-lg mb-2">{stop.title}</h4>
                                                <p className="text-gray-600 text-sm mb-3 leading-relaxed">{stop.description}</p>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-gray-500 italic">No itinerary provided.</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Map Location */}
                        <div className={`p-4 rounded-xl -m-4 ${getBgClass('location')}`}>
                            <h3 className="font-bold text-gray-900 mb-4 text-xl">Exact Location <HighlightLabel field="location" /></h3>
                            <div className="flex items-center gap-2 text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <FaMapMarkerAlt className="text-primary text-xl" />
                                <div>
                                    <p className="font-medium">{experience.location?.address}</p>
                                    <p className="text-sm">{experience.location?.city}, {experience.location?.country}</p>
                                </div>
                            </div>
                            <div className="h-96 w-full rounded-2xl overflow-hidden border border-gray-200 shadow-inner z-0 relative">
                                {experience.location?.coordinates &&
                                    experience.location.coordinates.lat &&
                                    experience.location.coordinates.lng ? (
                                    <MapContainer
                                        center={[experience.location.coordinates.lat, experience.location.coordinates.lng]}
                                        zoom={13}
                                        scrollWheelZoom={false}
                                        style={{ height: '100%', width: '100%', zIndex: 0 }}
                                    >
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        />
                                        <Marker position={[experience.location.coordinates.lat, experience.location.coordinates.lng]} />
                                    </MapContainer>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500">
                                        Coordinate data not available for map rendering
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminExperienceDetails;
