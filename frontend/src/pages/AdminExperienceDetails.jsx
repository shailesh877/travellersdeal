import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/api';
import { FaArrowLeft, FaCheckCircle, FaTimesCircle, FaMapMarkerAlt, FaClock, FaTag, FaLanguage, FaUserFriends, FaCheck, FaTimes, FaCalendarAlt, FaUtensils } from 'react-icons/fa';

const AdminExperienceDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [experience, setExperience] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);

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
            navigate('/admin', { state: { activeTab: 'content' } });
        } catch (error) {
            console.error(error);
            const errorMsg = error.response?.data?.message || 'Action failed';
            alert(`Approval cancelled: ${errorMsg}`);
        }
    };

    const handleUpdateRating = async () => {
        const newRating = window.prompt("Enter new average rating (0-5):", experience.rating || 0);
        if (newRating === null) return;
        
        const newNumReviews = window.prompt("Enter new number of reviews:", experience.numReviews || 0);
        if (newNumReviews === null) return;

        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.put(`${API_URL}/admin/experiences/${id}`, { 
                rating: Number(newRating),
                numReviews: Number(newNumReviews)
            }, config);
            setExperience(data);
            alert('Rating updated successfully!');
        } catch (error) {
            console.error(error);
            const errorMsg = error.response?.data?.message || error.message;
            alert('Action failed: ' + errorMsg);
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
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8 sticky top-4 z-10 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                        <div>
                            <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">Status</p>
                            <div className="flex items-center gap-2">
                                {experience.status === 'approved' && <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold uppercase flex items-center gap-2"><FaCheckCircle /> Approved</span>}
                                {experience.status === 'rejected' && <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold uppercase flex items-center gap-2"><FaTimesCircle /> Rejected</span>}
                                {experience.status === 'pending' && <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-bold uppercase flex items-center gap-2">Pending Review</span>}
                            </div>
                        </div>
                        <div className="hidden md:block w-px h-10 bg-gray-200"></div>
                        <div>
                            <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">Rating</p>
                            <div className="flex items-center gap-2 text-gray-900 font-bold">
                                ⭐ {experience.rating || 0} <span className="text-gray-500 text-sm font-normal">({experience.numReviews || 0} reviews)</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={handleUpdateRating}
                            className="px-6 py-3 rounded-xl font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition-colors"
                        >
                            Edit Rating
                        </button>
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
                    {/* Header Image Gallery */}
                    <div className="w-full bg-gray-100 relative">
                        {experience.images && experience.images.length > 0 ? (
                            <>
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-sm flex flex-col gap-1 z-20">
                                    <>
                                        {experience.adultPrice !== undefined && <div><span className={`font-bold text-sm ${getBgClass('adultPrice')}`}>Adult: ${experience.adultPrice}</span><DiffView field="adultPrice" label="Adult Price" /></div>}
                                        {experience.childPrice !== undefined && <div><span className={`font-bold text-sm ${getBgClass('childPrice')}`}>Child: ${experience.childPrice}</span><DiffView field="childPrice" label="Child Price" /></div>}
                                    </>
                                </div>
                                <div className="flex overflow-x-auto gap-4 h-64 snap-x snap-mandatory hide-scrollbar p-2">
                                    {experience.images.map((img, idx) => (
                                        <img 
                                            key={idx} 
                                            src={img.startsWith('http') ? img : `${API_URL.replace('/api', '')}${img}`} 
                                            alt={`Experience image ${idx + 1}`} 
                                            className="shrink-0 w-[85%] md:w-[60%] lg:w-[40%] h-full object-cover cursor-pointer hover:opacity-90 transition-opacity snap-center rounded-xl" 
                                            onClick={() => setSelectedImage(img)}
                                        />
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="h-64 flex items-center justify-center text-gray-400 relative">
                                No Image
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-sm flex flex-col gap-1">
                                        {(() => {
                                            const displayPrice = experience.bookingOptions?.[0]?.availabilityAndPricing?.pricingTiers?.length > 0 ? experience.bookingOptions[0].availabilityAndPricing.pricingTiers[0].price : undefined;
                                            
                                            const displayChildPrice = experience.bookingOptions?.[0]?.availabilityAndPricing?.pricingTiers?.length > 1 ? experience.bookingOptions[0].availabilityAndPricing.pricingTiers[1].price : undefined;
                                            
                                            return (
                                                <>
                                                    {displayPrice !== undefined && <div><span className={`font-bold text-sm ${getBgClass('adultPrice')}`}>Adult: ${displayPrice}</span><DiffView field="adultPrice" label="Adult Price" /></div>}
                                                    {displayChildPrice !== undefined && <div><span className={`font-bold text-sm ${getBgClass('childPrice')}`}>Child: ${displayChildPrice}</span><DiffView field="childPrice" label="Child Price" /></div>}
                                                </>
                                            );
                                        })()}
                                </div>
                            </div>
                        )}
                    </div>

                    <style>{`
                        .hide-scrollbar::-webkit-scrollbar {
                            display: none;
                        }
                        .hide-scrollbar {
                            -ms-overflow-style: none;
                            scrollbar-width: none;
                        }
                    `}</style>

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
                                        <span className={`flex items-center gap-1 px-2 py-1 rounded ${getBgClass('duration', 'bg-gray-100')}`}>
                                            <FaClock className="text-primary" /> 
                                            {experience.duration || experience.bookingOptions?.[0]?.optionSetup?.durationOrValidity?.value || 'Duration Not Provided'} 
                                            <HighlightLabel field="duration" />
                                        </span>
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
                        <div className={`prose max-w-none text-gray-600 mb-8 pb-8 border-b border-gray-100 ${getBgClass('shortDescription')}`}>
                            <h3 className="text-gray-900 font-bold text-lg mb-2">Short Description <HighlightLabel field="shortDescription" /></h3>
                            <p>{experience.shortDescription}</p>
                            <DiffView field="shortDescription" label="Short Description" />
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

                        {/* New Schema Info Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 pb-8 border-b border-gray-100">
                            {/* Guide & Transport */}
                            <div className="space-y-6">
                                <h3 className="font-bold text-gray-900 mb-3 text-xl">Service Details</h3>
                                <div className={`flex flex-col gap-1 ${getBgClass('guideType')}`}>
                                    <span className="font-medium text-gray-700">Guide Type: <span className="font-normal">{experience.guideType || 'Not specified'}</span><HighlightLabel field="guideType" /></span>
                                    <DiffView field="guideType" label="Guide Type" />
                                </div>
                                <div className={`flex flex-col gap-1 ${getBgClass('isDifferentCityTravel')}`}>
                                    <span className="font-medium text-gray-700">Different City Travel: <span className="font-normal">{experience.isDifferentCityTravel ? 'Yes' : 'No'}</span><HighlightLabel field="isDifferentCityTravel" /></span>
                                    <DiffView field="isDifferentCityTravel" label="Different City Travel" />
                                </div>
                                {experience.isTransportationUsed && (
                                    <div className={`flex flex-col gap-1 ${getBgClass('transports')}`}>
                                        <span className="font-medium text-gray-700">Transports: <HighlightLabel field="transports" /></span>
                                        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                                            {experience.transports?.map((t, i) => <li key={i}>{t}</li>)}
                                        </ul>
                                        <DiffView field="transports" label="Transports" />
                                    </div>
                                )}
                            </div>

                            {/* Extra Information */}
                            <div className="space-y-6">
                                <h3 className="font-bold text-gray-900 mb-3 text-xl">Extra Information</h3>
                                <div className={`flex flex-col gap-1 ${getBgClass('extraInformation')}`}>
                                    <HighlightLabel field="extraInformation" />
                                    <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 space-y-3">
                                        <div className={getBgClass('meetingPoint')}><span className="font-bold">Meeting Point:</span> {experience.meetingPoint || 'None'}<HighlightLabel field="meetingPoint" /><DiffView field="meetingPoint" label="Meeting Point" /></div>
                                        <div><span className="font-bold">Pet Friendly:</span> {experience.extraInformation?.petFriendly ? `Yes (${experience.extraInformation.petPolicy})` : 'No'}</div>
                                        <div><span className="font-bold">Emergency Contact:</span> {experience.extraInformation?.emergencyContact?.countryCode} {experience.extraInformation?.emergencyContact?.number}</div>
                                        <div><span className="font-bold">Voucher Info:</span> {experience.extraInformation?.voucherInfo || 'None'}</div>
                                        
                                        {experience.extraInformation?.notAllowed?.length > 0 && (
                                            <div>
                                                <span className="font-bold">Not Allowed:</span>
                                                <ul className="list-disc pl-5 text-gray-600">
                                                    {experience.extraInformation.notAllowed.map((item, i) => <li key={i}>{item}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                        {experience.extraInformation?.whatToBring?.length > 0 && (
                                            <div>
                                                <span className="font-bold">What to Bring:</span>
                                                <ul className="list-disc pl-5 text-gray-600">
                                                    {experience.extraInformation.whatToBring.map((item, i) => <li key={i}>{item}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                        {experience.extraInformation?.knowBeforeYouGo?.length > 0 && (
                                            <div>
                                                <span className="font-bold">Know Before You Go:</span>
                                                <ul className="list-disc pl-5 text-gray-600">
                                                    {experience.extraInformation.knowBeforeYouGo.filter(x => x).map((item, i) => <li key={i}>{item}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                    <DiffView field="extraInformation" label="Extra Info" />
                                </div>
                            </div>
                            
                            {/* Meals */}
                            {experience.isFoodIncluded && experience.meals?.length > 0 && (
                                <div className="md:col-span-2 space-y-4">
                                    <h3 className="font-bold text-gray-900 mb-3 text-xl">Included Meals <HighlightLabel field="meals" /></h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {experience.meals.map((meal, i) => (
                                            <div key={i} className="bg-orange-50 border border-orange-100 p-4 rounded-lg text-sm text-gray-700 space-y-2">
                                                <div className="flex justify-between items-center"><span className="font-bold text-lg text-orange-800">{meal.type}</span><span className="bg-orange-200 text-orange-800 px-2 py-1 rounded text-xs font-bold">{meal.format}</span></div>
                                                <div><span className="font-semibold">Drinks Included:</span> {meal.isDrinksIncluded ? 'Yes' : 'No'}</div>
                                                {meal.dietaryOptions?.length > 0 && <div><span className="font-semibold">Dietary Options:</span> {meal.dietaryOptions.join(', ')}</div>}
                                            </div>
                                        ))}
                                    </div>
                                    <DiffView field="meals" label="Meals" />
                                </div>
                            )}

                            {/* Booking Options */}
                            {experience.bookingOptions?.length > 0 && (
                                <div className="md:col-span-2 space-y-4 mt-6">
                                    <h3 className="font-bold text-gray-900 mb-3 text-xl">Booking Options <HighlightLabel field="bookingOptions" /></h3>
                                    <div className="space-y-6">
                                        {experience.bookingOptions.map((opt, i) => (
                                            <div key={i} className="bg-white border-2 border-blue-100 rounded-xl p-5 shadow-sm">
                                                <h4 className="font-bold text-blue-900 text-lg mb-2">{opt.optionSetup?.title}</h4>
                                                <p className="text-gray-600 text-sm mb-4">{opt.optionSetup?.description}</p>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                                                    <div>
                                                        <h5 className="font-bold text-gray-800 border-b pb-1 mb-2">Availability & Pricing</h5>
                                                        <ul className="space-y-1 text-gray-600">
                                                            <li><span className="font-medium">Type:</span> {opt.availabilityAndPricing?.pricingType} ({opt.availabilityAndPricing?.pricingPersonDependency})</li>
                                                            <li><span className="font-medium">Capacity:</span> {opt.availabilityAndPricing?.capacity}</li>
                                                            <li><span className="font-medium">Base Price:</span> {opt.availabilityAndPricing?.price || 0} {opt.availabilityAndPricing?.currency}</li>
                                                        </ul>
                                                        {opt.availabilityAndPricing?.pricingTiers?.length > 0 && (
                                                            <div className="mt-2 p-2 bg-gray-50 rounded">
                                                                <span className="font-medium text-xs block mb-1">Pricing Tiers:</span>
                                                                {opt.availabilityAndPricing.pricingTiers.map((tier, idx) => (
                                                                    <div key={idx} className="text-xs flex justify-between">
                                                                        <span>{tier.title} ({tier.minAge}-{tier.maxAge}):</span>
                                                                        <span className="font-bold">{tier.price}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    <div>
                                                        <h5 className="font-bold text-gray-800 border-b pb-1 mb-2">Meeting/Pickup</h5>
                                                        <ul className="space-y-1 text-gray-600">
                                                            <li><span className="font-medium">Type:</span> <span className="uppercase text-xs font-bold px-1.5 py-0.5 bg-gray-200 rounded">{opt.meetingPointOrPickup?.meetingType}</span></li>
                                                            {opt.meetingPointOrPickup?.meetingType === 'meeting' && (
                                                                <li><span className="font-medium">Address:</span> {opt.meetingPointOrPickup?.meetingAddress}</li>
                                                            )}
                                                            {opt.meetingPointOrPickup?.meetingType === 'pickup' && (
                                                                <>
                                                                    <li><span className="font-medium">Pickup Type:</span> {opt.meetingPointOrPickup?.pickupType}</li>
                                                                    <li><span className="font-medium">Confirmation:</span> {opt.meetingPointOrPickup?.pickupConfirmationType}</li>
                                                                </>
                                                            )}
                                                        </ul>
                                                    </div>

                                                    <div>
                                                        <h5 className="font-bold text-gray-800 border-b pb-1 mb-2">Policies</h5>
                                                        <ul className="space-y-1 text-gray-600">
                                                            <li><span className="font-medium">Cut-off:</span> {opt.cutOff?.cutoffHours} hours</li>
                                                            <li><span className="font-medium">Cancellation:</span> {opt.cutOff?.cancellationPolicy}</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <DiffView field="bookingOptions" label="Booking Options" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Full-screen Image Modal */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-pointer"
                    onClick={() => setSelectedImage(null)}
                >
                    <button 
                        className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 transition-colors z-[101]"
                        onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
                    >
                        &times;
                    </button>
                    <img 
                        src={selectedImage.startsWith('http') ? selectedImage : `${API_URL.replace('/api', '')}${selectedImage}`} 
                        alt="Full size" 
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl cursor-default"
                        onClick={(e) => e.stopPropagation()} 
                    />
                </div>
            )}
        </div>
    );
};

export default AdminExperienceDetails;
