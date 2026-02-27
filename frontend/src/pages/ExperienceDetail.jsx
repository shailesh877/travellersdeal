import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/api';
import { FaStar, FaMapMarkerAlt, FaClock, FaCheck, FaInfoCircle, FaCalendarAlt, FaUserFriends, FaGlobe, FaMobileAlt, FaTimes, FaUtensils, FaHeart, FaShoppingCart } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
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
    const [guests, setGuests] = useState(1);
    const [date, setDate] = useState('');
    const [timeSlot, setTimeSlot] = useState('');
    const [language, setLanguage] = useState('English');

    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    // Availability State
    const [availability, setAvailability] = useState({});
    const [fetchingAvailability, setFetchingAvailability] = useState(false);

    useEffect(() => {
        const fetchExperienceAndReviews = async () => {
            try {
                const { data: expData } = await axios.get(`${API_URL}/experiences/${id}`);
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
                setError('Failed to load experience details.');
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

    const NavigateToCheckout = () => {
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

        navigate('/checkout', {
            state: {
                amount: experience.price * guests,
                experienceTitle: experience.title,
                currency: experience.currency || 'USD',
                experienceId: experience._id,
                date: date,
                slots: guests,
                timeSlot: timeSlot
            }
        });
    };

    const handleAddToCart = async () => {
        if (!user) { navigate('/login', { state: { from: location } }); return; }
        if (!date) { alert('Please select a date first'); return; }
        const result = await addToCart({
            experienceId: experience._id,
            quantity: guests,
            date,
            timeSlot: timeSlot || '',
            priceAtAdd: experience.price,
        });
        if (result.success) {
            setCartMsg('Added to cart!');
            setTimeout(() => setCartMsg(''), 3000);
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
        : (experience.rating || 4.8);

    const displayCount = reviews.length > 0 ? reviews.length : experience.reviewsCount || 0;

    const dummyItinerary = [
        { title: 'Starting/pickup location', description: 'Depends on the selected option' },
        { title: 'Ganges River', description: 'Boat cruise' },
        { title: 'Manikarnika Ghat, Varanasi', description: 'Guided tour, Sightseeing' },
        { title: 'Assi ghat', description: 'Guided tour, Sightseeing' },
        { title: 'Shri Kashi Vishwanath Temple', description: 'Guided tour, Sightseeing' },
        { title: 'Banaras Hindu University', description: 'Guided tour, Sightseeing' },
        { title: 'Arrive back at:', description: 'Varanasi' }
    ];
    const displayItinerary = experience.itinerary?.length > 0 ? experience.itinerary : dummyItinerary;

    return (
        <div className="bg-white min-h-screen pb-20 pt-20 md:pt-24 font-sans text-gray-800">
            {/* Header / Breadcrumbs Area */}
            <div className="max-w-[1240px] mx-auto px-4 md:px-8 pt-4 pb-4">
                <div className="flex items-center text-xs text-gray-500 mb-4">
                    <span className="hover:underline cursor-pointer">Home</span> <span className="mx-2">›</span>
                    <span className="hover:underline cursor-pointer">{experience.location?.country || 'Country'}</span> <span className="mx-2">›</span>
                    <span className="hover:underline cursor-pointer">{experience.location?.city || 'City'}</span> <span className="mx-2">›</span>
                    <span className="text-gray-900 font-medium truncate max-w-[200px]">{experience.title}</span>
                </div>

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

                    {/* Image Gallery Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 h-[300px] md:h-[400px] rounded-2xl overflow-hidden relative group">
                        {/* Main Image */}
                        <div className="md:col-span-2 h-full relative cursor-pointer">
                            <img src={experience.images?.[0] ? (experience.images[0].startsWith('http') ? experience.images[0] : `${API_URL.replace('/api', '')}${experience.images[0]}`) : 'https://placehold.co/800x600?text=No+Image'} alt={experience.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                        </div>
                        {/* Right Stacked Images */}
                        <div className="hidden md:flex flex-col gap-2 h-full">
                            <div className="flex-1 overflow-hidden cursor-pointer relative">
                                <img src={experience.images?.[1] ? (experience.images[1].startsWith('http') ? experience.images[1] : `${API_URL.replace('/api', '')}${experience.images[1]}`) : (experience.images?.[0] ? (experience.images[0].startsWith('http') ? experience.images[0] : `${API_URL.replace('/api', '')}${experience.images[0]}`) : 'https://placehold.co/400x300?text=Image+2')} alt="Gallery 2" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                            </div>
                            <div className="flex-1 overflow-hidden cursor-pointer relative">
                                <img src={experience.images?.[2] ? (experience.images[2].startsWith('http') ? experience.images[2] : `${API_URL.replace('/api', '')}${experience.images[2]}`) : (experience.images?.[0] ? (experience.images[0].startsWith('http') ? experience.images[0] : `${API_URL.replace('/api', '')}${experience.images[0]}`) : 'https://placehold.co/400x300?text=Image+3')} alt="Gallery 3" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                                <button className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-md hover:bg-black/80 transition-colors flex items-center gap-2">
                                    <FaCalendarAlt /> <span className="tracking-widest">{experience.images?.length > 3 ? experience.images.length : '18'}</span>
                                </button>
                            </div>
                        </div>
                    </div>

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
                                    <h4 className="font-bold text-gray-900 text-sm">Duration {experience.duration}</h4>
                                    <p className="text-sm text-gray-600">Check availability to see starting times.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-6 mt-1 flex justify-center"><FaUserFriends className="text-gray-700" /></div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm">Live tour guide</h4>
                                    <p className="text-sm text-gray-600">{experience.languages?.join(', ') || 'English'}</p>
                                </div>
                            </div>
                            {experience.privateGroup && (
                                <div className="flex items-start gap-4">
                                    <div className="w-6 mt-1 flex justify-center"><FaUserFriends className="text-gray-700" /></div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm">Private group available</h4>
                                        <p className="text-sm text-gray-600">This experience can be booked for a private group.</p>
                                    </div>
                                </div>
                            )}
                            {experience.dietaryOptions?.length > 0 && (
                                <div className="flex items-start gap-4">
                                    <div className="w-6 mt-1 flex justify-center"><FaUtensils className="text-gray-700" /></div>
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

                    {/* Meeting Point */}
                    {experience.meetingPoint && (
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Meeting point</h2>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-gray-100 rounded-lg text-gray-600"><FaMapMarkerAlt size={20} /></div>
                                <div>
                                    <p className="text-gray-700 font-medium mb-1">{experience.meetingPoint}</p>
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(experience.meetingPoint)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary font-bold text-sm underline hover:no-underline flex items-center gap-1"
                                    >
                                        Open in Google Maps <FaGlobe size={12} />
                                    </a>
                                </div>
                            </div>
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

                                {/* Map Column */}
                                <div className="w-full md:w-1/2">
                                    <div className="bg-gray-100 rounded-xl overflow-hidden h-[400px] relative sticky top-32 z-0">
                                        {experience.location?.coordinates?.lat && experience.location?.coordinates?.lng ? (
                                            <MapContainer
                                                center={[experience.location.coordinates.lat, experience.location.coordinates.lng]}
                                                zoom={13}
                                                className="w-full h-full"
                                                scrollWheelZoom={false}
                                            >
                                                <TileLayer
                                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                />
                                                <Marker position={[experience.location.coordinates.lat, experience.location.coordinates.lng]} />
                                            </MapContainer>
                                        ) : (
                                            <div className="absolute inset-0 bg-blue-50/50 flex flex-col items-center justify-center p-4 text-center">
                                                <FaMapMarkerAlt className="text-4xl text-red-500 mb-4 drop-shadow-md" />
                                                <h4 className="font-bold text-gray-900">Interactive Map Overview</h4>
                                                <p className="text-sm text-gray-500 mt-2">Route mapping for {experience.title}</p>
                                            </div>
                                        )}
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
                    {(experience.whatToBring?.length > 0 || experience.knowBeforeYouGo?.length > 0) && (
                        <section className="pt-8 border-t border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Important information</h2>

                            {experience.whatToBring?.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="font-bold text-gray-900 text-sm mb-2">What to bring</h4>
                                    <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 ml-1">
                                        {experience.whatToBring.map((item, i) => <li key={i}>{item}</li>)}
                                    </ul>
                                </div>
                            )}

                            {experience.knowBeforeYouGo?.length > 0 && (
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm mb-2">Know before you go</h4>
                                    <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 ml-1">
                                        {experience.knowBeforeYouGo.map((item, i) => <li key={i}>{item}</li>)}
                                    </ul>
                                </div>
                            )}
                        </section>
                    )}

                    {/* Check Availability is now handled exclusively by the right sidebar */}
                </div>

                {/* Right Column: Sidebar Booking */}
                <div className="relative">
                    <div className="sticky top-32 bg-white border border-gray-200 rounded-2xl p-6">
                        {/* Price Details */}
                        <div className="mb-6 flex flex-col">
                            <div className="flex items-center gap-2 text-sm text-gray-500 line-through decoration-gray-400">
                                <span>From</span>
                                <span>{currencySymbol}{Math.round(experience.price * 1.2)}</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-red-600">
                                    {currencySymbol}{experience.price}
                                </span>
                                <span className="text-sm font-medium text-gray-700">per person</span>
                            </div>
                        </div>

                        {/* Booking Selectors */}
                        <div className="space-y-4 mb-8">
                            {/* Participants */}
                            <div className="relative border border-gray-300 rounded-full hover:border-gray-500 hover:shadow-sm transition-all focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-500">
                                    <FaUserFriends size={16} />
                                </div>
                                <div className="flex items-center justify-between w-full p-2 pl-12">
                                    <span className="font-medium text-gray-700 text-sm">Adult x {guests}</span>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setGuests(Math.max(1, guests - 1))} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 font-bold">-</button>
                                        <button onClick={() => setGuests(guests + 1)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 font-bold">+</button>
                                    </div>
                                </div>
                            </div>

                            {/* Select Date */}
                            <div className="relative border border-gray-300 rounded-full hover:border-gray-500 hover:shadow-sm transition-all focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-500">
                                    <FaCalendarAlt size={16} />
                                </div>
                                <input
                                    type="date"
                                    className="w-full bg-transparent p-3 pl-12 pr-4 rounded-full font-medium text-gray-700 outline-none cursor-pointer text-sm"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>

                            {/* Select Time (Attractive Pills) */}
                            {experience.timeSlots?.length > 0 && (
                                <div className="space-y-3 pt-2">
                                    <h4 className="font-semibold text-gray-700 text-sm flex items-center gap-2">
                                        <FaClock className="text-gray-400" /> Starting time
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {experience.timeSlots.map((slot, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setTimeSlot(slot)}
                                                className={`px-4 py-2 font-medium text-sm rounded-lg border transition-all duration-200 ${timeSlot === slot
                                                    ? 'bg-[#0071eb] border-[#0071eb] text-white shadow-md transform scale-[1.03]'
                                                    : 'bg-white border-gray-300 text-gray-700 hover:border-[#0071eb] hover:text-[#0071eb] hover:bg-blue-50'
                                                    }`}
                                            >
                                                {slot}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Select Language */}
                            <div className="relative border border-gray-300 rounded-full hover:border-gray-500 hover:shadow-sm transition-all focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-500">
                                    <FaGlobe size={16} />
                                </div>
                                <span className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
                                    ▾
                                </span>
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="w-full bg-transparent p-3 pl-12 pr-10 rounded-full font-medium text-gray-700 outline-none cursor-pointer appearance-none text-sm"
                                >
                                    {(experience.languages?.length > 0 ? experience.languages : ['English', 'Spanish', 'Hindi', 'French', 'Italian', 'Japanese']).map((lang) => (
                                        <option key={lang} value={lang}>{lang}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* CTA Buttons */}
                        <button
                            onClick={NavigateToCheckout}
                            disabled={!date || (experience.timeSlots?.length > 0 && !timeSlot)}
                            className={`w-full font-bold py-3.5 px-6 rounded-full transition-all flex items-center justify-center gap-2 mt-2 ${(date && (!experience.timeSlots?.length || timeSlot))
                                ? 'bg-[#0071eb] hover:bg-[#005cbf] text-white shadow-md active:scale-95'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            Check availability
                        </button>

                        {/* Add to Cart button */}
                        <button
                            onClick={handleAddToCart}
                            disabled={!date || cartLoading}
                            className={`w-full font-bold py-3.5 px-6 rounded-full border-2 transition-all flex items-center justify-center gap-2 mt-2 ${date
                                    ? 'border-[#0071eb] text-[#0071eb] hover:bg-[#0071eb] hover:text-white active:scale-95'
                                    : 'border-gray-200 text-gray-300 cursor-not-allowed'
                                }`}
                        >
                            <FaShoppingCart />
                            {cartLoading ? 'Adding...' : 'Add to Cart'}
                        </button>
                        {cartMsg && (
                            <p className="text-green-600 text-sm text-center font-semibold animate-pulse">{cartMsg}</p>
                        )}

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
        </div >
    );
};

export default ExperienceDetail;
