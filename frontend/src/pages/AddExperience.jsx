import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/api';
import { FaCloudUploadAlt, FaPlus, FaTrash, FaMapMarkerAlt, FaClock, FaLanguage, FaListUl, FaSuitcase, FaUserSlash, FaCheck, FaDollarSign, FaCalendarAlt, FaInfoCircle, FaUsers, FaUtensils } from 'react-icons/fa';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet icon not showing correctly in React/Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const LocationPicker = ({ position, setPosition }) => {
    useMapEvents({
        click(e) {
            setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
        },
    });
    return position && position.lat && position.lng ? <Marker position={position} /> : null;
};

const MapUpdater = ({ coordinates }) => {
    const map = useMap();
    useEffect(() => {
        if (coordinates && !isNaN(coordinates.lat) && !isNaN(coordinates.lng)) {
            map.flyTo([coordinates.lat, coordinates.lng], map.getZoom(), { duration: 0.5 });
        }
    }, [coordinates.lat, coordinates.lng, map]);
    return null;
};

const AddExperience = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // Get ID from URL if editing
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false); // Loading state for fetching data
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Adventure',
        price: '',
        currency: 'USD',
        duration: '',
        location: { city: '', country: '', coordinates: { lat: 25.2048, lng: 55.2708 } },
        images: [],
        highlights: [],
        itinerary: [],
        itineraryMap: '',
        includes: [],
        knowBeforeYouGo: [],
        meetingPoint: '',
        whatToBring: [],
        notSuitableFor: [],
        languages: [],
        timeSlots: [],
        capacity: 20,
        privateGroup: false,
        dietaryOptions: []
    });

    // Fetch existing data if editing
    useEffect(() => {
        if (id) {
            const fetchExperience = async () => {
                setLoading(true);
                try {
                    const token = localStorage.getItem('token');
                    const config = {
                        headers: { Authorization: `Bearer ${token}` },
                    };
                    const { data } = await axios.get(`${API_URL}/experiences/${id}`, config);

                    // Populate form with fetched data
                    setFormData({
                        title: data.title || '',
                        description: data.description || '',
                        category: data.category || 'Adventure',
                        price: data.price || '',
                        currency: data.currency || 'USD',
                        duration: data.duration || '',
                        location: {
                            city: data.location?.city || '',
                            country: data.location?.country || '',
                            coordinates: data.location?.coordinates || { lat: 25.2048, lng: 55.2708 }
                        },
                        images: data.images || [],
                        highlights: data.highlights || [],
                        itinerary: data.itinerary || [],
                        itineraryMap: data.itineraryMap || '',
                        includes: data.includes || [],
                        knowBeforeYouGo: data.knowBeforeYouGo || [],
                        meetingPoint: data.meetingPoint || '',
                        whatToBring: data.whatToBring || [],
                        notSuitableFor: data.notSuitableFor || [],
                        languages: data.languages || [],
                        timeSlots: data.timeSlots || [],
                        capacity: data.capacity || 20,
                        privateGroup: data.privateGroup || false,
                        dietaryOptions: data.dietaryOptions || []
                    });
                } catch (error) {
                    console.error('Error fetching experience details:', error);
                    alert('Failed to load experience details.');
                } finally {
                    setLoading(false);
                }
            };
            fetchExperience();
        }
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: value } }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        const newImages = [];

        try {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            };

            // Helper to get base URL safely (removes trailing slash from replacement if needed)
            const getBaseUrl = () => API_URL.replace(/\/api\/?$/, '');

            for (const file of files) {
                const imageData = new FormData();
                imageData.append('image', file);
                const { data } = await axios.post(`${API_URL}/upload`, imageData, config);

                let imagePath = data.image;
                if (!imagePath.startsWith('http')) {
                    // Robust base URL extraction: remove '/api' suffix safely
                    // This handles cases like '.../api', '.../api/', or even just base URL if config changes
                    const baseUrl = API_URL.replace(/\/api\/?$/, '');

                    // Ensure imagePath starts with /
                    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;

                    imagePath = `${baseUrl}${cleanPath}`;
                }

                newImages.push(imagePath);
            }

            setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
            setUploading(false);
        } catch (error) {
            console.error(error);
            setUploading(false);
            alert('Failed to upload image(s). Please try again.');
        }
    };

    // Helper functions for dynamic array fields
    const addArrayItem = (field) => {
        setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
    };

    const removeArrayItem = (field, index) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }));
    };

    const handleArrayChange = (field, index, value) => {
        const newArray = [...formData[field]];
        newArray[index] = value;
        setFormData(prev => ({ ...prev, [field]: newArray }));
    };

    // Helper functions for Itinerary
    const addItineraryItem = () => {
        setFormData(prev => ({
            ...prev,
            itinerary: [...prev.itinerary, { title: '', description: '' }]
        }));
    };

    const removeItineraryItem = (index) => {
        setFormData(prev => ({
            ...prev,
            itinerary: prev.itinerary.filter((_, i) => i !== index)
        }));
    };

    const handleItineraryChange = (index, field, value) => {
        const newItinerary = [...formData.itinerary];
        newItinerary[index][field] = value;
        setFormData(prev => ({ ...prev, itinerary: newItinerary }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token') || (JSON.parse(localStorage.getItem('user'))?.token);

            if (!token) {
                alert('You must be logged in to perform this action');
                return;
            }

            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };

            if (id) {
                // UPDATE existing experience
                await axios.put(`${API_URL}/experiences/${id}`, formData, config);
            } else {
                // CREATE new experience
                await axios.post(`${API_URL}/experiences`, formData, config);
            }

            navigate('/vendor/dashboard');
        } catch (error) {
            console.error(error);
            alert(`Error ${id ? 'updating' : 'creating'} experience. Please check your network and try again.`);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-900">
            {/* Top Navigation Bar */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="container mx-auto px-4 max-w-4xl h-16 flex items-center justify-between">
                    <button onClick={() => navigate('/vendor/dashboard')} className="text-gray-500 hover:text-gray-900 font-medium text-sm flex items-center gap-2 transition-colors">
                        &larr; Back to Dashboard
                    </button>
                    <div className="text-sm font-bold text-gray-400">{id ? 'Editing Mode' : 'Step 1 of 1'}</div>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-3xl mt-10">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">{id ? 'Edit Experience' : 'Create a New Experience'}</h1>
                    <p className="text-gray-500 text-lg">{id ? 'Update your listing details below.' : 'Share your unique activity with the world.'}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* Section: The Basics */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm">1</span>
                            The Basics
                        </h2>

                        <div className="grid gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Experience Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-lg font-medium placeholder-gray-300"
                                    placeholder="e.g. Sunset Desert Safari with BBQ"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                                    <div className="relative">
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleChange}
                                            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none appearance-none bg-white"
                                        >
                                            <option value="Adventure">Adventure</option>
                                            <option value="Culture">Culture</option>
                                            <option value="Food">Food</option>
                                            <option value="Sightseeing">Sightseeing</option>
                                            <option value="Wellness">Wellness</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-500">▼</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                                        <div className="relative">
                                            <FaMapMarkerAlt className="absolute top-3.5 left-3 text-gray-400 text-sm" />
                                            <input
                                                type="text"
                                                name="location.city"
                                                value={formData.location.city}
                                                onChange={handleChange}
                                                className="w-full border border-gray-300 rounded-xl pl-9 pr-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                                placeholder="Dubai"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                                        <input
                                            type="text"
                                            name="location.country"
                                            value={formData.location.country}
                                            onChange={handleChange}
                                            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                            placeholder="UAE"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 border-t border-gray-100 pt-6">
                                <label className="block text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <FaMapMarkerAlt className="text-primary" /> Pinpoint Location
                                </label>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Latitude</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={formData.location.coordinates.lat || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, location: { ...prev.location, coordinates: { ...prev.location.coordinates, lat: parseFloat(e.target.value) } } }))}
                                            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                            placeholder="e.g. 25.2048"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Longitude</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={formData.location.coordinates.lng || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, location: { ...prev.location, coordinates: { ...prev.location.coordinates, lng: parseFloat(e.target.value) } } }))}
                                            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                            placeholder="e.g. 55.2708"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (navigator.geolocation) {
                                                navigator.geolocation.getCurrentPosition(
                                                    (position) => {
                                                        const { latitude, longitude } = position.coords;
                                                        setFormData(prev => ({ ...prev, location: { ...prev.location, coordinates: { lat: latitude, lng: longitude } } }));
                                                    },
                                                    (error) => {
                                                        alert("Error fetching location. Please ensure you have given browser permissions.");
                                                    }
                                                );
                                            } else {
                                                alert("Geolocation is not supported by your browser.");
                                            }
                                        }}
                                        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg text-sm transition-colors border border-gray-200"
                                    >
                                        <FaMapMarkerAlt className="text-blue-500" /> Fetch Current Location
                                    </button>
                                </div>

                                <p className="text-xs text-gray-500 mb-3">Or click anywhere on the map to drop a pin at the exact location.</p>
                                <div className="h-[400px] w-full rounded-xl overflow-hidden border border-gray-300 z-10 relative shadow-inner">
                                    <MapContainer center={[formData.location.coordinates.lat || 25.2048, formData.location.coordinates.lng || 55.2708]} zoom={11} className="h-full w-full">
                                        <TileLayer
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />
                                        <LocationPicker
                                            position={formData.location.coordinates}
                                            setPosition={(newPos) => setFormData(prev => ({ ...prev, location: { ...prev.location, coordinates: newPos } }))}
                                        />
                                        <MapUpdater coordinates={formData.location.coordinates} />
                                    </MapContainer>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Photos */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-sm">2</span>
                            Photos
                        </h2>

                        <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${uploading ? 'bg-gray-50 border-gray-300' : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'}`}>
                            {formData.images.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                                    {formData.images.map((img, index) => (
                                        <div key={index} className="relative group overflow-hidden rounded-xl shadow-md cursor-pointer aspect-video">
                                            <img
                                                src={img}
                                                alt={`Preview ${index}`}
                                                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                                                onError={(e) => {
                                                    e.target.onerror = null; // Prevent infinite loop
                                                    // Try to reload with a timestamp to bypass cache if it's a fresh upload
                                                    if (!e.target.src.includes('?retry=')) {
                                                        setTimeout(() => {
                                                            e.target.src = `${img}?retry=${Date.now()}`;
                                                        }, 1000); // Wait 1 second before retry
                                                    } else {
                                                        e.target.src = 'https://placehold.co/400x300?text=Load+Failed';
                                                    }
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))}
                                                    className="bg-white text-red-500 p-2 rounded-full shadow-lg hover:bg-red-50 transition-colors"
                                                >
                                                    <FaTrash size={14} />
                                                </button>
                                            </div>
                                            {index === 0 && <span className="absolute top-2 left-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded shadow-sm">Cover</span>}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <label className="cursor-pointer flex flex-col items-center justify-center p-4">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400 group-hover:text-primary transition-colors">
                                    <FaCloudUploadAlt size={32} />
                                </div>
                                <span className="text-gray-900 font-bold text-lg mb-1">{formData.images.length > 0 ? 'Add more photos' : 'Upload photos'}</span>
                                <span className="text-sm text-gray-500">Supported formats: JPG, PNG, WEBP</span>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageUpload}
                                    disabled={uploading}
                                />
                            </label>
                            {uploading && <div className="mt-4 text-primary font-bold animate-pulse">Uploading Image(s)...</div>}
                        </div>
                    </div>

                    {/* Section: Details */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center text-sm">3</span>
                            Experience Details
                        </h2>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Duration</label>
                                    <div className="relative">
                                        <FaClock className="absolute top-3.5 left-3 text-gray-400 text-sm" />
                                        <input
                                            type="text"
                                            name="duration"
                                            value={formData.duration}
                                            onChange={handleChange}
                                            className="w-full border border-gray-300 rounded-xl pl-9 pr-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                            placeholder="e.g. 5 hours"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Languages</label>
                                    <div className="relative">
                                        <FaLanguage className="absolute top-3.5 left-3 text-gray-400" />
                                        <input
                                            type="text"
                                            value={formData.languages.join(', ')}
                                            onChange={(e) => setFormData(prev => ({ ...prev, languages: e.target.value.split(',').map(l => l.trim()) }))}
                                            className="w-full border border-gray-300 rounded-xl pl-9 pr-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                            placeholder="English, French, etc."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="6"
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none leading-relaxed"
                                    placeholder="Describe the experience in detail. What will guests see and do? What makes it unique?"
                                    required
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Section: Highlights & Itinerary */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-sm">4</span>
                            Highlights & Itinerary
                        </h2>

                        <div className="space-y-8">
                            {/* Highlights */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <label className="text-base font-bold text-gray-800 flex items-center gap-2"><FaListUl className="text-gray-400" /> Highlights</label>
                                    <button type="button" onClick={() => addArrayItem('highlights')} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1">
                                        <FaPlus size={10} /> Add
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {formData.highlights.map((item, index) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={item}
                                                onChange={(e) => handleArrayChange('highlights', index, e.target.value)}
                                                className="w-full border border-gray-200 bg-gray-50 rounded-lg px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-colors"
                                                placeholder="e.g. Visit the Burj Khalifa observation deck"
                                            />
                                            <button type="button" onClick={() => removeArrayItem('highlights', index)} className="text-gray-300 hover:text-red-500 px-2 transition-colors">
                                                <FaTrash size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {formData.highlights.length === 0 && <div className="text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-sm text-gray-400">Add key highlights to attract users</div>}
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            {/* Itinerary */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <label className="text-base font-bold text-gray-800 flex items-center gap-2"><FaMapMarkerAlt className="text-gray-400" /> Itinerary</label>
                                    <button type="button" onClick={addItineraryItem} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1">
                                        <FaPlus size={10} /> Add Stop
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {formData.itinerary.map((item, index) => (
                                        <div key={index} className="p-4 border border-gray-200 rounded-xl bg-gray-50 relative group hover:border-primary/30 transition-colors">
                                            <button type="button" onClick={() => removeItineraryItem(index)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors">
                                                <FaTrash size={14} />
                                            </button>
                                            <div className="space-y-3">
                                                <input
                                                    type="text"
                                                    value={item.title}
                                                    onChange={(e) => handleItineraryChange(index, 'title', e.target.value)}
                                                    className="w-full bg-transparent border-b border-gray-200 focus:border-primary outline-none py-1 font-bold text-gray-800 placeholder-gray-400"
                                                    placeholder={`Stop ${index + 1} Name`}
                                                />
                                                <textarea
                                                    value={item.description}
                                                    onChange={(e) => handleItineraryChange(index, 'description', e.target.value)}
                                                    rows="2"
                                                    className="w-full bg-transparent border-none outline-none text-sm text-gray-600 resize-none placeholder-gray-400"
                                                    placeholder="What happens here?"
                                                ></textarea>
                                            </div>
                                        </div>
                                    ))}
                                    {formData.itinerary.length === 0 && <div className="text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-sm text-gray-400">Map out the journey step by step</div>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Logistics */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center text-sm">5</span>
                            Logistics
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Meeting Point</label>
                                <div className="relative">
                                    <FaMapMarkerAlt className="absolute top-3.5 left-3 text-gray-400 text-sm" />
                                    <input
                                        type="text"
                                        name="meetingPoint"
                                        value={formData.meetingPoint}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-xl pl-9 pr-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                        placeholder="Full address of the meeting point"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Includes */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-semibold text-gray-700">What's Included</label>
                                        <button type="button" onClick={() => addArrayItem('includes')} className="text-xs text-primary font-bold">+ Add</button>
                                    </div>
                                    <div className="space-y-2">
                                        {formData.includes.map((item, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <FaCheck className="text-green-500 text-xs" />
                                                <input
                                                    type="text"
                                                    value={item}
                                                    onChange={(e) => handleArrayChange('includes', index, e.target.value)}
                                                    className="flex-1 border-b border-gray-200 focus:border-primary outline-none py-1 text-sm bg-transparent"
                                                    placeholder="e.g. Hotel pickup"
                                                />
                                                <button type="button" onClick={() => removeArrayItem('includes', index)} className="text-gray-300 hover:text-red-500"><FaTrash size={12} /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Not Suitable For */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-semibold text-gray-700">Not Suitable For</label>
                                        <button type="button" onClick={() => addArrayItem('notSuitableFor')} className="text-xs text-primary font-bold">+ Add</button>
                                    </div>
                                    <div className="space-y-2">
                                        {formData.notSuitableFor.map((item, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <FaUserSlash className="text-red-400 text-xs" />
                                                <input
                                                    type="text"
                                                    value={item}
                                                    onChange={(e) => handleArrayChange('notSuitableFor', index, e.target.value)}
                                                    className="flex-1 border-b border-gray-200 focus:border-primary outline-none py-1 text-sm bg-transparent"
                                                    placeholder="e.g. Pregnant women"
                                                />
                                                <button type="button" onClick={() => removeArrayItem('notSuitableFor', index)} className="text-gray-300 hover:text-red-500"><FaTrash size={12} /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* What to Bring */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-semibold text-gray-700">What to Bring</label>
                                        <button type="button" onClick={() => addArrayItem('whatToBring')} className="text-xs text-primary font-bold">+ Add</button>
                                    </div>
                                    <div className="space-y-2">
                                        {formData.whatToBring.map((item, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <FaSuitcase className="text-blue-400 text-xs" />
                                                <input
                                                    type="text"
                                                    value={item}
                                                    onChange={(e) => handleArrayChange('whatToBring', index, e.target.value)}
                                                    className="flex-1 border-b border-gray-200 focus:border-primary outline-none py-1 text-sm bg-transparent"
                                                    placeholder="e.g. Passport"
                                                />
                                                <button type="button" onClick={() => removeArrayItem('whatToBring', index)} className="text-gray-300 hover:text-red-500"><FaTrash size={12} /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Pricing & Schedule */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center text-sm">6</span>
                            Pricing & Schedule
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Price per Person</label>
                                <div className="relative">
                                    <div className="absolute top-3.5 left-3 text-gray-500 text-sm font-bold">{formData.currency === 'USD' ? '$' : formData.currency}</div>
                                    <input
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-bold text-lg"
                                        placeholder="0.00"
                                        required
                                    />
                                    <select
                                        name="currency"
                                        value={formData.currency}
                                        onChange={handleChange}
                                        className="absolute right-2 top-2 bottom-2 bg-gray-100 border-none rounded-lg text-xs font-bold text-gray-600 outline-none px-2 cursor-pointer"
                                    >
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                        <option value="GBP">GBP</option>
                                        <option value="INR">INR</option>
                                        <option value="AED">AED</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            {/* Capacity */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Max Groups / Capacity per Slot</label>
                                <div className="relative">
                                    <div className="absolute top-3.5 left-3 text-gray-400 text-sm"><FaUsers /></div>
                                    <input
                                        type="number"
                                        name="capacity"
                                        value={formData.capacity}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-bold text-lg"
                                        placeholder="20"
                                        required
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Total seats available per time slot.</p>
                            </div>

                            {/* Private Group */}
                            <div className="flex flex-col justify-center">
                                <label className="flex items-center gap-3 cursor-pointer p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                                    <input
                                        type="checkbox"
                                        name="privateGroup"
                                        checked={formData.privateGroup}
                                        onChange={(e) => setFormData(prev => ({ ...prev, privateGroup: e.target.checked }))}
                                        className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                                    />
                                    <div>
                                        <div className="font-semibold text-gray-900">Private Group Available</div>
                                        <div className="text-xs text-gray-500">Allow users to book this as a private tour.</div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2"><FaClock className="text-gray-400" /> Start Times (Daily Slots)</label>
                                <button type="button" onClick={() => addArrayItem('timeSlots')} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1">
                                    <FaPlus size={10} /> Add Time
                                </button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {formData.timeSlots.map((slot, index) => (
                                    <div key={index} className="relative">
                                        <input
                                            type="time"
                                            value={slot}
                                            onChange={(e) => handleArrayChange('timeSlots', index, e.target.value)}
                                            className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-center font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                        />
                                        <button type="button" onClick={() => removeArrayItem('timeSlots', index)} className="absolute -top-1 -right-1 bg-white text-red-500 rounded-full shadow-sm hover:bg-red-50 p-0.5 border border-gray-100">
                                            <FaTrash size={10} />
                                        </button>
                                    </div>
                                ))}
                                {formData.timeSlots.length === 0 && <div className="col-span-full text-center py-3 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-xs text-gray-400">No start times added. Experience applies to full day?</div>}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="sticky bottom-4 z-20">
                        <div className="bg-white/90 backdrop-blur-md border border-gray-200 p-4 rounded-2xl shadow-2xl flex items-center justify-between max-w-3xl mx-auto">
                            <div className="text-sm font-medium text-gray-500 hidden sm:block">
                                Review your details before publishing.
                            </div>
                            <div className="flex gap-3 w-full sm:w-auto">
                                <button
                                    type="button"
                                    onClick={() => navigate('/vendor/dashboard')}
                                    className="flex-1 sm:flex-none px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className={`flex-1 sm:flex-none px-8 py-3 bg-primary hover:bg-cyan-600 text-white font-bold rounded-xl shadow-lg shadow-cyan-200 transition-all transform active:scale-95 ${uploading ? 'opacity-70 cursor-wait' : ''}`}
                                >
                                    {uploading ? 'Processing...' : (id ? 'Update Experience' : 'Publish Experience')}
                                </button>
                            </div>
                        </div>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default AddExperience;
