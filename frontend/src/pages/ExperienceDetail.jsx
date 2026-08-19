import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/api';
import { FaStar, FaMapMarkerAlt, FaClock, FaCheck, FaInfoCircle, FaCalendarAlt, FaUserFriends, FaGlobe, FaMobileAlt, FaTimes, FaUtensils, FaHeart, FaShoppingCart, FaBus, FaUserTie, FaMapSigns, FaTag, FaChevronDown } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';


const ExperienceDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useContext(AuthContext);
    const { addToCart, loading: cartLoading } = useContext(CartContext);
    const [cartMsg, setCartMsg] = useState('');

    const [experience, setExperience] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [participantCounts, setParticipantCounts] = useState({
        'Adult': 1, 'Infant': 0, 'Child': 0, 'Youth': 0, 'Senior': 0,
        'Student (with ID)': 0, 'Student EU Citizens (with ID)': 0, 
        'Military (with ID)': 0, 'EU Citizens (with ID)': 0
    });
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [date, setDate] = useState('');
    const [timeSlot, setTimeSlot] = useState('');
    const [language, setLanguage] = useState('English');

    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    // Booking Options State
    const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);

    // Availability State
    const [availability, setAvailability] = useState({});
    const [fetchingAvailability, setFetchingAvailability] = useState(false);
    const [isAvailabilityChecked, setIsAvailabilityChecked] = useState(false);

    const calculateTotalAndTiers = (opt, pCounts) => {
        let total = 0;
        const tiers = opt?.availabilityAndPricing?.pricingTiers || [];
        const basePrice = opt?.availabilityAndPricing?.price || 0;
        let computedTierCounts = {};
        let totalQty = 0;

        if (tiers.length === 0) {
            Object.entries(pCounts).forEach(([type, count]) => {
                totalQty += count;
            });
            total = totalQty * basePrice;
            computedTierCounts[0] = totalQty;
            return { total, computedTierCountsObj: computedTierCounts, totalQty };
        }

        Object.entries(pCounts).forEach(([type, count]) => {
            if (count > 0) {
                totalQty += count;
                
                let matchIdx = tiers.findIndex(t => t.title?.toLowerCase()?.includes(type.toLowerCase()));
                if (matchIdx === -1 && type === 'Adult') matchIdx = tiers.findIndex(t => t.title?.toLowerCase()?.includes('adult'));
                if (matchIdx === -1 && type === 'Child') matchIdx = tiers.findIndex(t => t.title?.toLowerCase()?.includes('child'));
                if (matchIdx === -1 && type === 'Infant') matchIdx = tiers.findIndex(t => t.title?.toLowerCase()?.includes('infant'));
                
                if (matchIdx === -1) {
                    matchIdx = tiers.findIndex(t => t.title?.toLowerCase()?.includes('adult'));
                    if (matchIdx === -1) matchIdx = 0;
                }

                computedTierCounts[matchIdx] = (computedTierCounts[matchIdx] || 0) + count;
                total += count * (tiers[matchIdx]?.price || 0);
            }
        });

        return { total, computedTierCountsObj: computedTierCounts, totalQty };
    };

    useEffect(() => {
        const fetchExperienceAndReviews = async () => {
            try {
                const token = localStorage.getItem('token');
                const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
                const { data: expData } = await axios.get(`${API_URL}/experiences/${id}`, config);
                setExperience(expData);

                // Fetch reviews
                try {
                    const { data: reviewsData } = await axios.get(`${API_URL}/reviews/${id}`);
                    setReviews(reviewsData);
                } catch (reviewErr) {
                    console.error('Error fetching reviews:', reviewErr);
                }

                setLoading(false);
            } catch (err) {
                console.error(err);
                setError(err.response?.data?.message || 'Failed to load experience details.');
                setLoading(false);
            }
        };
        fetchExperienceAndReviews();
    }, [id]);

    useEffect(() => {
        if (date && id) {
            const fetchAvailability = async () => {
                setFetchingAvailability(true);
                try {
                    const { data } = await axios.get(`${API_URL}/experiences/${id}/availability?date=${date}`);
                    setAvailability(data.availability || {});
                } catch (err) {
                    console.error('Failed to fetch availability', err);
                } finally {
                    setFetchingAvailability(false);
                }
            };
            fetchAvailability();
        } else {
            setAvailability({});
        }
    }, [date, id]);

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!user) return alert('Please login to review');

        setSubmittingReview(true);
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            await axios.post(`${API_URL}/reviews`, {
                experienceId: id,
                rating: reviewRating,
                comment: reviewComment
            }, config);

            // Refresh reviews
            const { data: reviewsData } = await axios.get(`${API_URL}/reviews/${id}`);
            setReviews(reviewsData);
            setReviewComment('');
            setSubmittingReview(false);
            alert('Review submitted successfully!');
        } catch (error) {
            console.error(error);
            setSubmittingReview(false);
            alert(error.response?.data?.message || 'Failed to submit review. Have you booked this experience?');
        }
    };

    const NavigateToCheckout = (optIndex) => {
        if (!user) {
            navigate('/login', { state: { from: location } });
            return;
        }

        if (!date) {
            alert('Please select a date');
            return;
        }

        if (experience.timeSlots && experience.timeSlots.length > 0 && !timeSlot) {
            alert('Please select a start time');
            return;
        }

        let currency = experience.currency || 'USD';
        let totalAmount = 0;
        let totalSlots = 0;
        let tierSelections = [];
        let basePrice = 0;

        if (experience.bookingOptions?.length > 0) {
            const opt = experience.bookingOptions[optIndex];
            setSelectedOptionIndex(optIndex);
            if (opt?.availabilityAndPricing) {
                currency = opt.availabilityAndPricing.currency || currency;
                
                const { total, computedTierCountsObj, totalQty } = calculateTotalAndTiers(opt, participantCounts);
                totalAmount = total;
                totalSlots = totalQty;

                if (opt.availabilityAndPricing.pricingTiers?.length > 0) {
                    Object.entries(computedTierCountsObj).forEach(([idx, qty]) => {
                        if (qty > 0) {
                            const tier = opt.availabilityAndPricing.pricingTiers[idx];
                            tierSelections.push({
                                title: tier.title,
                                price: tier.price,
                                quantity: qty
                            });
                        }
                    });
                } else {
                    if (totalQty > 0) {
                        basePrice = opt.availabilityAndPricing.price || 0;
                        tierSelections.push({
                            title: 'Adult',
                            price: basePrice,
                            quantity: totalQty
                        });
                    }
                }
            }
        }

        navigate('/checkout', {
            state: {
                amount: totalAmount,
                experienceTitle: experience.bookingOptions?.length > 0 ? `${experience.title} - ${experience.bookingOptions[optIndex].optionSetup?.title}` : experience.title,
                currency: currency,
                experienceId: experience._id,
                date: date,
                slots: totalSlots,
                tierSelections: tierSelections,
                timeSlot: timeSlot
            }
        });
    };

    const handleAddToCart = async (optIndex) => {
        if (!user) { navigate('/login', { state: { from: location } }); return; }
        if (!date) { alert('Please select a date first'); return; }

        let totalAmount = 0;
        let totalSlots = 0;
        
        if (experience.bookingOptions?.length > 0) {
            const opt = experience.bookingOptions[optIndex];
            const { total, totalQty } = calculateTotalAndTiers(opt, participantCounts);
            totalAmount = total;
            totalSlots = totalQty;
        }

        if (totalSlots === 0) {
            alert('Please select at least one ticket');
            return;
        }

        const avgPrice = totalAmount / totalSlots;

        let currency = experience.currency || 'USD';
        if (experience.bookingOptions?.length > 0) {
            const opt = experience.bookingOptions[optIndex];
            if (opt?.availabilityAndPricing) {
                currency = opt.availabilityAndPricing.currency || currency;
            }
        }

        const result = await addToCart({
            experienceId: experience._id,
            quantity: totalSlots,
            date,
            timeSlot: timeSlot || '',
            priceAtAdd: avgPrice,
            currency: currency
        });
        if (result.success) {
            setCartMsg('Added to cart!');
            setTimeout(() => setCartMsg(''), 3000);
            handleNavigateToCheckout(optIndex);
        } else {
            alert(result.error);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
    if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
    if (!experience) return <div className="min-h-screen flex items-center justify-center">Experience not found</div>;

    const currencySymbol = {
        'USD': '$', 'EUR': '€', 'GBP': '£', 'INR': '₹', 'AED': 'AED ', 'JPY': '¥'
    }[experience.currency] || '$';

    // Calculate rating from reviews explicitly if backend doesn't sync perfectly immediately
    const displayRating = reviews.length > 0
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : (experience.averageRating || experience.rating || '0.0');

    const displayCount = reviews.length > 0 ? reviews.length : experience.reviewsCount || experience.numReviews || 0;

    const displayItinerary = experience.itinerary?.length > 0 ? experience.itinerary : [];

    return (
        <div className="bg-white min-h-screen pb-20 pt-20 md:pt-24 font-sans text-gray-800">
            {/* Header / Breadcrumbs Area */}
            <div className="max-w-[1240px] mx-auto px-4 md:px-8 pt-4 pb-4">
                <div className="flex items-center text-xs text-gray-500 mb-4">
                    <span className="hover:underline cursor-pointer">Home</span> <span className="mx-2">›</span>
                    <span className="text-gray-900 font-medium truncate max-w-[200px]">{experience.title}</span>
                </div>

                {experience.status === 'pending' && (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-xl mb-4 text-sm font-medium flex items-center gap-2">
                        ⏳ <span><strong>Under Review:</strong> This experience listing is currently waiting for admin approval before going live to customers.</span>
                    </div>
                )}
                {experience.status === 'rejected' && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-4 text-sm font-medium flex items-center gap-2">
                        ❌ <span><strong>Rejected:</strong> This experience listing was rejected by admin. Please edit and resubmit.</span>
                    </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                    <span className="uppercase text-xs font-bold text-red-500 tracking-wider">Originals by Travellers Deal</span>
                </div>

                <h1 className="text-3xl md:text-4xl font-extrabold text-[#1a2b49] leading-tight mb-4">{experience.title}</h1>

                <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-[#1a2b49] text-white text-xs font-bold px-2 py-1 rounded">Top rated</div>
                        <div className="flex items-center gap-1 text-yellow-500">
                            {[...Array(5)].map((_, i) => <FaStar key={i} className={i < Math.floor(displayRating) ? "" : "text-gray-300"} />)}
                            <span className="font-bold text-gray-900 ml-1">{displayRating}</span>
                            <span className="text-gray-900 underline decoration-gray-900 underline-offset-2 ml-1 cursor-pointer font-medium hover:text-primary hover:decoration-primary transition-colors">{displayCount} reviews</span>
                        </div>
                        <span className="hidden md:inline text-gray-300">•</span>
                        <span className="text-gray-500">Activity provider: <span className="text-gray-900 hover:underline cursor-pointer">Travellers Deal Verified</span></span>
                    </div>

                    <div className="flex items-center gap-6">
                        <button className="flex items-center gap-2 font-bold text-gray-900 hover:text-primary hover:underline transition-colors">
                            <FaHeart className="text-lg" /> Add to wishlist
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="max-w-[1240px] mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
                {/* Left Column: Image Gallery & Details */}
                <div className="lg:col-span-2 space-y-8 md:space-y-10">

                    {/* Short Description */}
                    {experience.shortDescription && (
                        <p className="text-gray-700 text-lg leading-relaxed font-medium">
                            {experience.shortDescription}
                        </p>
                    )}

                    {/* Image Gallery - Horizontal Scroll */}
                    <div className="flex overflow-x-auto gap-4 h-[300px] md:h-[400px] rounded-2xl snap-x snap-mandatory hide-scrollbar">
                        {(experience.images?.length > 0 ? experience.images : ['https://placehold.co/800x600?text=No+Image']).map((img, idx) => (
                            <div key={idx} className="shrink-0 w-[85%] md:w-[60%] h-full relative cursor-pointer snap-center rounded-2xl overflow-hidden group">
                                <img 
                                    src={img.startsWith('http') ? img : `${API_URL.replace('/api', '')}${img}`} 
                                    alt={`${experience.title} ${idx + 1}`} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                />
                            </div>
                        ))}
                    </div>
                    {/* Custom styles for hidden scrollbar but still scrollable */}
                    <style>{`
                        .hide-scrollbar::-webkit-scrollbar {
                            display: none;
                        }
                        .hide-scrollbar {
                            -ms-overflow-style: none;
                            scrollbar-width: none;
                        }
                    `}</style>

                    {/* About this activity */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">About this activity</h2>
                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="w-6 mt-1 flex justify-center"><FaCheck className="text-green-600" /></div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm">Free cancellation</h4>
                                    <p className="text-sm text-gray-600">Cancel up to 24 hours in advance for a full refund</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-6 mt-1 flex justify-center"><FaCalendarAlt className="text-gray-700" /></div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm">Reserve now & pay later</h4>
                                    <p className="text-sm text-gray-600">Keep your travel plans flexible — book your spot and pay nothing today.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-6 mt-1 flex justify-center"><FaClock className="text-gray-700" /></div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm">Duration {experience.duration || experience.bookingOptions?.[0]?.optionSetup?.durationOrValidity?.value || ''}</h4>
                                    <p className="text-sm text-gray-600">Check availability to see starting times.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-6 mt-1 flex justify-center"><FaUserFriends className="text-gray-700" /></div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm">Languages</h4>
                                    <p className="text-sm text-gray-600">{experience.languages?.join(', ') || 'English'}</p>
                                </div>
                            </div>
                            {experience.guideType && (
                                <div className="flex items-start gap-4">
                                    <div className="w-6 mt-1 flex justify-center"><FaUserTie className="text-gray-700" /></div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm">Guide</h4>
                                        <p className="text-sm text-gray-600 capitalize">{experience.guideType}</p>
                                    </div>
                                </div>
                            )}
                            {experience.isTransportationUsed && experience.transports?.length > 0 && (
                                <div className="flex items-start gap-4">
                                    <div className="w-6 mt-1 flex justify-center"><FaBus className="text-gray-700" /></div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm">Transportation Included</h4>
                                        <p className="text-sm text-gray-600">{experience.transports.join(', ')}</p>
                                    </div>
                                </div>
                            )}
                            {experience.isDifferentCityTravel && (
                                <div className="flex items-start gap-4">
                                    <div className="w-6 mt-1 flex justify-center"><FaMapSigns className="text-gray-700" /></div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm">Different City Travel</h4>
                                        <p className="text-sm text-gray-600">This activity involves traveling to a different city.</p>
                                    </div>
                                </div>
                            )}
                            {experience.privateGroup && (
                                <div className="flex items-start gap-4">
                                    <div className="w-6 mt-1 flex justify-center"><FaUserFriends className="text-gray-700" /></div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm">Private group available</h4>
                                        <p className="text-sm text-gray-600">This experience can be booked for a private group.</p>
                                    </div>
                                </div>
                            )}
                            {experience.isFoodIncluded && experience.meals?.length > 0 && (
                                <div className="flex items-start gap-4">
                                    <div className="w-6 mt-1 flex justify-center"><FaUtensils className="text-gray-700" /></div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm">Meals Included</h4>
                                        <p className="text-sm text-gray-600">
                                            {experience.meals.map(m => `${m.type} (${m.format})`).join(', ')}
                                        </p>
                                    </div>
                                </div>
                            )}
                            {experience.dietaryOptions?.length > 0 && (
                                <div className="flex items-start gap-4">
                                    <div className="w-6 mt-1 flex justify-center"><FaInfoCircle className="text-gray-700" /></div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm">Dietary options available</h4>
                                        <p className="text-sm text-gray-600">{experience.dietaryOptions.join(', ')}. Please inform the provider of any dietary needs when booking.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Experience Description */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Experience</h2>

                        <div className="mb-6">
                            <h3 className="font-bold text-gray-900 mb-3 text-lg">Highlights</h3>
                            <ul className="grid gap-2">
                                {experience.highlights?.map((highlight, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-900 mt-2.5 flex-shrink-0"></div>
                                        <span className="text-gray-700 leading-relaxed">{highlight}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-bold text-gray-900 mb-3 text-lg">Full description</h3>
                            <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                                {experience.description}
                            </div>
                        </div>

                        {/* Includes */}
                        {(experience.includes?.length > 0 || experience.notSuitableFor?.length > 0) && (
                            <div className="mt-8">
                                <h3 className="font-bold text-gray-900 mb-4 text-lg">Includes</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-8">
                                    {experience.includes?.map((item, idx) => (
                                        <div key={idx} className="flex items-start gap-3">
                                            <FaCheck className="text-green-600 mt-1 flex-shrink-0" />
                                            <span className="text-gray-700 text-sm">{item}</span>
                                        </div>
                                    ))}
                                    {experience.notSuitableFor?.map((item, idx) => (
                                        <div key={idx} className="flex items-start gap-3 opacity-75">
                                            <FaTimes className="text-red-500 mt-1 flex-shrink-0" />
                                            <span className="text-gray-700 text-sm line-through decoration-gray-400">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Booking Options Section */}
                    {experience.bookingOptions?.length > 0 && isAvailabilityChecked && (
                        <section className="pt-8 border-t border-gray-100" id="booking-options">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Select an option</h2>
                            <div className="flex overflow-x-auto pb-6 gap-4 custom-scrollbar">
                                {experience.bookingOptions.map((opt, index) => {
                                    const { total } = calculateTotalAndTiers(opt, participantCounts);
                                    const pricing = opt.availabilityAndPricing;
                                    const isSelected = selectedOptionIndex === index;
                                    return (
                                        <div 
                                            key={index}
                                            onClick={() => setSelectedOptionIndex(index)} 
                                            className={`min-w-[320px] max-w-[320px] cursor-pointer flex-shrink-0 border rounded-2xl p-5 bg-white flex flex-col transition-all ${isSelected ? 'border-blue-600 shadow-md ring-1 ring-blue-600' : 'border-gray-200 shadow-sm hover:border-gray-400'}`}
                                        >
                                            <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2">{opt.optionSetup?.title}</h3>
                                            <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-grow">{opt.optionSetup?.description}</p>
                                            
                                            <div className="flex justify-between items-end mt-auto pt-4 border-t border-gray-100">
                                                <div>
                                                    <div className="text-xs text-gray-500 font-medium">Total price</div>
                                                    <div className="font-extrabold text-xl text-[#1a2b49]">
                                                        {pricing?.currency || experience.currency || '$'}{total}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleAddToCart(index); }}
                                                    className="bg-[#002b5c] hover:bg-[#001f42] text-white font-bold py-2.5 px-6 rounded-full transition-colors flex items-center justify-center whitespace-nowrap"
                                                >
                                                    Continue
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Details for Selected Option */}
                            {experience.bookingOptions[selectedOptionIndex] && (
                                <div className="mt-6 bg-gray-50 rounded-2xl p-6 border border-gray-100 animate-fade-in-up">
                                    <h3 className="font-bold text-lg text-gray-900 mb-4">
                                        Option Details: <span className="font-medium text-gray-700">{experience.bookingOptions[selectedOptionIndex].optionSetup?.title}</span>
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2 mb-3"><FaClock className="text-primary" /> General Info</h4>
                                            <ul className="text-sm text-gray-600 space-y-2">
                                                <li><span className="font-medium text-gray-900">Group type:</span> {experience.bookingOptions[selectedOptionIndex].optionSetup?.isPrivateActivity ? 'Private' : 'Shared'}</li>
                                                {experience.bookingOptions[selectedOptionIndex].optionSetup?.maxGroupSize && <li><span className="font-medium text-gray-900">Max group:</span> {experience.bookingOptions[selectedOptionIndex].optionSetup.maxGroupSize}</li>}
                                                {experience.bookingOptions[selectedOptionIndex].optionSetup?.languages?.length > 0 && <li><span className="font-medium text-gray-900">Guide:</span> {experience.bookingOptions[selectedOptionIndex].optionSetup.languages.join(', ')}</li>}
                                                {experience.bookingOptions[selectedOptionIndex].availabilityAndPricing?.capacity && <li><span className="font-medium text-gray-900">Capacity:</span> {experience.bookingOptions[selectedOptionIndex].availabilityAndPricing.capacity}</li>}
                                            </ul>
                                            
                                            {experience.bookingOptions[selectedOptionIndex].availabilityAndPricing?.pricingTiers?.length > 0 && (
                                                <>
                                                    <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2 mb-3 mt-6"><FaTag className="text-primary" /> Pricing Tiers</h4>
                                                    <ul className="text-sm text-gray-600 space-y-2">
                                                        {experience.bookingOptions[selectedOptionIndex].availabilityAndPricing.pricingTiers.map((tier, idx) => (
                                                            <li key={idx} className="flex justify-between w-full max-w-[240px] bg-white border border-gray-200 px-3 py-2 rounded-lg">
                                                                <span className="font-medium">{tier.title} <span className="text-xs text-gray-400">({tier.minAge}-{tier.maxAge} yrs)</span></span>
                                                                <span className="font-bold text-gray-900">{experience.bookingOptions[selectedOptionIndex].availabilityAndPricing.currency || experience.currency || '$'} {tier.price}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2 mb-3"><FaMapMarkerAlt className="text-primary" /> Meeting & Pickup</h4>
                                            <ul className="text-sm text-gray-600 space-y-2">
                                                <li><span className="font-medium text-xs uppercase bg-gray-200 text-gray-800 px-2 py-1 rounded-md">{experience.bookingOptions[selectedOptionIndex].meetingPointOrPickup?.meetingType || 'MEET AT LOCATION'}</span></li>
                                                {experience.bookingOptions[selectedOptionIndex].meetingPointOrPickup?.meetingAddress && <li><span className="font-medium text-gray-900">Address:</span> {experience.bookingOptions[selectedOptionIndex].meetingPointOrPickup.meetingAddress}</li>}
                                                {experience.bookingOptions[selectedOptionIndex].meetingPointOrPickup?.pickupType && <li><span className="font-medium text-gray-900">Pickup:</span> {experience.bookingOptions[selectedOptionIndex].meetingPointOrPickup.pickupType}</li>}
                                                {experience.bookingOptions[selectedOptionIndex].meetingPointOrPickup?.arrivalTime && <li><span className="font-medium text-gray-900">Arrive:</span> {experience.bookingOptions[selectedOptionIndex].meetingPointOrPickup.arrivalTime}</li>}
                                            </ul>

                                            {experience.bookingOptions[selectedOptionIndex].cutOff && (
                                                <div className="mt-6">
                                                    <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2 mb-3"><FaCheck className="text-primary" /> Policies</h4>
                                                    <ul className="text-sm text-gray-600 space-y-2">
                                                        <li><span className="font-medium text-gray-900">Cancellation:</span> {experience.bookingOptions[selectedOptionIndex].cutOff.cancellationPolicy.replace(/_/g, ' ').toUpperCase()}</li>
                                                        <li><span className="font-medium text-gray-900">Cut-off:</span> {experience.bookingOptions[selectedOptionIndex].cutOff.cutoffHours} hours before</li>
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>
                    )}



                    {/* Itinerary Section */}
                    {displayItinerary.length > 0 && (
                        <section className="pt-8 border-t border-gray-100 mt-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Itinerary</h2>
                            <div className="flex flex-col md:flex-row gap-8">
                                {/* Timeline Column */}
                                <div className="flex-1">
                                    <div className="relative">
                                        {/* The vertical red line */}
                                        <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-red-500 z-0"></div>
                                        <div className="space-y-7">
                                            {displayItinerary.map((step, index) => (
                                                <div key={index} className="relative flex items-start gap-5">
                                                    <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-white bg-[#1a2b49] shadow shrink-0 z-10 mt-0.5">
                                                        <span className="w-2 h-2 rounded-full bg-white"></span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-gray-900 text-base">{step.title || step}</h4>
                                                        {step.description && <p className="text-sm text-gray-600 mt-0.5">{step.description}</p>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="mt-8 flex items-start gap-4 text-sm text-gray-500">
                                        <FaInfoCircle className="mt-1 flex-shrink-0" />
                                        <p>For reference only. Itineraries are subject to change.</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Reviews Section */}
                    <section className="pt-8 border-t border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            Customer Reviews
                            <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{reviews.length}</span>
                        </h2>

                        {/* Write Review Form - Only if logged in */}
                        {user && (
                            <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-100">
                                <h3 className="font-bold text-gray-900 mb-4">Write a review</h3>
                                <form onSubmit={handleReviewSubmit}>
                                    <div className="flex items-center gap-1 mb-4">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <FaStar
                                                key={star}
                                                className={`cursor-pointer text-xl ${star <= reviewRating ? 'text-yellow-500' : 'text-gray-300'}`}
                                                onClick={() => setReviewRating(star)}
                                            />
                                        ))}
                                    </div>
                                    <textarea
                                        value={reviewComment}
                                        onChange={(e) => setReviewComment(e.target.value)}
                                        placeholder="Share your experience with others..."
                                        rows="3"
                                        className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:border-primary outline-none mb-3"
                                        required
                                    ></textarea>
                                    <button
                                        type="submit"
                                        disabled={submittingReview}
                                        className="bg-primary text-white font-bold py-2 px-6 rounded-lg text-sm hover:bg-cyan-700 transition disabled:opacity-50"
                                    >
                                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                                    </button>
                                </form>
                            </div>
                        )}

                        <div className="space-y-6">
                            {reviews.length === 0 ? (
                                <p className="text-gray-500 italic">No reviews yet. Be the first to review!</p>
                            ) : (
                                reviews.map((review) => (
                                    <div key={review._id} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-sm">{review.user?.name || 'Traveler'}</h4>
                                                <p className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <div className="flex text-yellow-500 text-xs">
                                                {[...Array(5)].map((_, i) => (
                                                    <FaStar key={i} className={i < review.rating ? "" : "text-gray-200"} />
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    {/* Important Information */}
                    {(experience.meetingPoint || experience.whatToBring?.length > 0 || experience.knowBeforeYouGo?.length > 0 || experience.extraInformation?.notAllowed?.length > 0 || experience.extraInformation?.whatToBring?.length > 0 || experience.extraInformation?.knowBeforeYouGo?.length > 0 || experience.extraInformation?.petFriendly !== undefined) && (
                        <section className="pt-8 border-t border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Important information</h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                                {experience.meetingPoint && (
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2"><FaMapMarkerAlt className="text-gray-400" /> Meeting Point</h4>
                                        <p className="text-gray-700 text-sm ml-6">{experience.meetingPoint}</p>
                                    </div>
                                )}

                                {(experience.whatToBring?.length > 0 || experience.extraInformation?.whatToBring?.length > 0) && (
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2"><FaCheck className="text-gray-400" /> What to bring</h4>
                                        <ul className="list-disc list-inside text-gray-700 text-sm space-y-1.5 ml-1">
                                            {[...(experience.whatToBring || []), ...(experience.extraInformation?.whatToBring || [])].filter((v,i,a)=>a.indexOf(v)===i && v).map((item, i) => <li key={i}>{item}</li>)}
                                        </ul>
                                    </div>
                                )}

                                {(experience.extraInformation?.notAllowed?.length > 0 || experience.notSuitableFor?.length > 0) && (
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2"><FaTimes className="text-gray-400" /> Not allowed</h4>
                                        <ul className="list-disc list-inside text-gray-700 text-sm space-y-1.5 ml-1">
                                            {[...(experience.extraInformation?.notAllowed || []), ...(experience.notSuitableFor || [])].filter((v,i,a)=>a.indexOf(v)===i && v).map((item, i) => <li key={i}>{item}</li>)}
                                        </ul>
                                    </div>
                                )}

                                {(experience.knowBeforeYouGo?.length > 0 || experience.extraInformation?.knowBeforeYouGo?.length > 0) && (
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2"><FaInfoCircle className="text-gray-400" /> Know before you go</h4>
                                        <ul className="list-disc list-inside text-gray-700 text-sm space-y-1.5 ml-1">
                                            {[...(experience.knowBeforeYouGo || []), ...(experience.extraInformation?.knowBeforeYouGo || [])].filter((v,i,a)=>a.indexOf(v)===i && v).map((item, i) => <li key={i}>{item}</li>)}
                                        </ul>
                                    </div>
                                )}
                                
                                {experience.extraInformation?.petFriendly !== undefined && (
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2"><FaInfoCircle className="text-gray-400" /> Pets</h4>
                                        <p className="text-gray-700 text-sm ml-6">
                                            {experience.extraInformation.petFriendly ? `Pets allowed: ${experience.extraInformation.petPolicy}` : 'Pets are not allowed.'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Check Availability is now handled exclusively by the right sidebar */}
                </div>

                {/* Right Column: Sidebar Booking */}
                <div className="relative">
                    <div className="sticky top-32 max-h-[calc(100vh-120px)] overflow-y-auto hide-scrollbar bg-white border border-gray-200 rounded-2xl p-6">
                        {/* Price Details */}
                        <div className="mb-6">
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-extrabold text-gray-900">
                                    {currencySymbol}
                                    {experience.bookingOptions?.[0]?.availabilityAndPricing?.pricingTiers?.find(t => t.title.toLowerCase().includes('adult'))?.price 
                                     || experience.bookingOptions?.[0]?.availabilityAndPricing?.pricingTiers?.[0]?.price 
                                     || experience.bookingOptions?.[0]?.availabilityAndPricing?.price || experience.price || 0}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 font-medium mt-1">per person</p>
                        </div>

                        {/* Booking Selectors */}
                        <div className="space-y-4 mb-8">
                            {/* Participants */}
                            <button
                                onClick={() => setShowTicketModal(true)}
                                className="w-full flex items-center justify-between bg-white border border-gray-300 rounded-full px-4 py-3.5 hover:border-gray-500 hover:shadow-sm transition-all focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-left"
                            >
                                <div className="flex items-center gap-3 text-gray-700">
                                    <FaUserFriends size={16} className="text-gray-500" />
                                    <span className="font-medium text-sm">
                                        {(() => {
                                            const parts = [];
                                            Object.entries(participantCounts).forEach(([type, count]) => {
                                                if (count > 0) parts.push(`${type.split(' ')[0]} x ${count}`);
                                            });
                                            return parts.length > 0 ? parts.join(', ') : 'Select participants';
                                        })()}
                                    </span>
                                </div>
                                <FaChevronDown size={12} className="text-gray-400" />
                            </button>

                            {/* Select Date */}
                            <div className="relative border border-gray-300 rounded-full hover:border-gray-500 hover:shadow-sm transition-all focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-500">
                                    <FaCalendarAlt size={16} />
                                </div>
                                <input
                                    type="date"
                                    min={new Date().toISOString().split('T')[0]}
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full bg-transparent p-3 pl-12 pr-4 rounded-full font-medium text-gray-700 outline-none cursor-pointer text-sm appearance-none"
                                    required
                                />
                            </div>
                            
                            {/* Select Time */}
                            {experience.timeSlots?.length > 0 && (
                                <div className="relative border border-gray-300 rounded-full hover:border-gray-500 hover:shadow-sm transition-all focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600">
                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-500">
                                        <FaClock size={16} />
                                    </div>
                                    <select
                                        value={timeSlot}
                                        onChange={(e) => setTimeSlot(e.target.value)}
                                        className="w-full bg-transparent text-sm font-medium text-gray-700 py-3.5 pl-12 pr-4 rounded-full outline-none focus:ring-0 appearance-none"
                                    >
                                        <option value="" disabled>Select start time</option>
                                        {experience.timeSlots.map((slot, index) => (
                                            <option key={index} value={slot}>{slot}</option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
                                        <FaChevronDown size={12} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* CTA Buttons */}
                        <button
                            onClick={() => {
                                if (!date) { alert('Please select a date'); return; }
                                if (experience.timeSlots?.length > 0 && !timeSlot) { alert('Please select a start time'); return; }
                                setIsAvailabilityChecked(true);
                                setTimeout(() => {
                                    document.getElementById('booking-options')?.scrollIntoView({ behavior: 'smooth' });
                                }, 100);
                            }}
                            className="w-full bg-[#0071eb] hover:bg-blue-600 text-white font-bold py-4 rounded-full transition-colors flex items-center justify-center"
                        >
                            Check availability
                        </button>

                        {/* Policies */}
                        <div className="mt-8 space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 w-5 h-5 rounded-full border border-green-600 text-green-600 flex items-center justify-center shrink-0">
                                    <FaCheck size={10} />
                                </div>
                                <div>
                                    <h5 className="font-bold text-gray-900 text-sm">Free cancellation</h5>
                                    <p className="text-gray-600 text-[13px] leading-snug">Cancel up to 24 hours in advance for a full refund</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 w-5 h-5 rounded-full border border-green-600 text-green-600 flex items-center justify-center shrink-0">
                                    <FaCheck size={10} />
                                </div>
                                <div>
                                    <h5 className="font-bold text-gray-900 text-sm">Reserve now & pay later</h5>
                                    <p className="text-gray-600 text-[13px] leading-snug">Keep your travel plans flexible — book your spot and pay nothing today. <span className="font-bold underline cursor-pointer hover:no-underline text-gray-900">Read more</span></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ticket Selection Modal */}
            {showTicketModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                            <h3 className="font-bold text-lg text-gray-900">Select Participants</h3>
                            <button onClick={() => setShowTicketModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                                <FaTimes className="text-gray-500" />
                            </button>
                        </div>
                        
                        <div className="p-4 overflow-y-auto space-y-4">
                            {Object.entries(participantCounts).map(([type, count]) => (
                                <div key={type} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                    <div>
                                        <div className="font-bold text-gray-900">{type}</div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => setParticipantCounts(prev => ({ ...prev, [type]: Math.max(0, count - 1) }))}
                                            disabled={count <= 0}
                                            className={`w-9 h-9 rounded-full flex items-center justify-center border font-bold text-lg transition-colors ${count <= 0 ? 'border-gray-200 text-gray-300 bg-gray-50' : 'border-[#002b5c] text-[#002b5c] hover:bg-[#002b5c]/5'}`}
                                        >-</button>
                                        <span className="w-4 text-center font-bold text-gray-900">{count}</span>
                                        <button 
                                            onClick={() => setParticipantCounts(prev => ({ ...prev, [type]: count + 1 }))}
                                            className="w-9 h-9 rounded-full flex items-center justify-center border border-[#002b5c] text-[#002b5c] font-bold text-lg hover:bg-[#002b5c]/5 transition-colors"
                                        >+</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t border-gray-100 bg-white sticky bottom-0">
                            <button 
                                onClick={() => setShowTicketModal(false)}
                                className="w-full bg-[#002b5c] hover:bg-[#001d3d] text-white font-bold py-3.5 rounded-full transition-colors"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExperienceDetail;
