import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaStar, FaHeart, FaRegHeart, FaEye } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../config/api';

const getBasePrice = (e) => {
    if (e.bookingOptions?.[0]?.availabilityAndPricing?.pricingTiers?.length > 0) {
        const tiers = e.bookingOptions[0].availabilityAndPricing.pricingTiers;
        const adultTier = tiers.find(t => t.title.toLowerCase() === 'adult');
        return adultTier ? adultTier.price : tiers[0].price;
    }
    if (e.pricingCategories?.length > 0) {
        const adultCat = e.pricingCategories.find(c => c.category.toLowerCase() === 'adult');
        if (adultCat) return adultCat.price;
    }
    return e.adultPrice || e.price || 0;
};

const ExperienceCard = ({ experience }) => {
    const { user, refreshUser } = useContext(AuthContext);
    const [reviews, setReviews] = useState([]);

    useEffect(() => {
        const fetchReviews = async () => {
            if (experience && experience._id) {
                try {
                    const { data } = await axios.get(`${API_URL}/reviews/${experience._id}`);
                    setReviews(data);
                } catch (error) {
                    console.error('Error fetching reviews for card:', error);
                }
            }
        };
        fetchReviews();
    }, [experience]);

    // Calculate rating from reviews explicitly if backend doesn't sync perfectly immediately
    const displayRating = reviews.length > 0
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : (experience.averageRating || experience.rating || '0.0');

    const displayCount = reviews.length > 0 ? reviews.length : experience.reviewsCount || experience.numReviews || 0;

    // Check if in wishlist (handle populated or objectId array)
    const isInWishlist = user?.wishlist?.some(item =>
        (typeof item === 'string' ? item : item._id) === experience._id
    );

    const toggleWishlist = async (e) => {
        e.preventDefault(); // Prevent link navigation
        if (!user) {
            alert("Please login to add to wishlist");
            return;
        }

        try {
            const config = {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')} ` }
            };

            if (isInWishlist) {
                await axios.delete(`${API_URL}/users/wishlist/${experience._id}`, config);
            } else {
                await axios.post(`${API_URL}/users/wishlist/${experience._id}`, {}, config);
            }
            refreshUser();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Link to={`/experience/${experience._id}`} className="block group">
            <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 h-full flex flex-col relative">
                <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                        src={experience.images && experience.images.length > 0
                            ? (experience.images[0].startsWith('http')
                                ? experience.images[0]
                                : `${API_URL.replace('/api', '')}${experience.images[0]}`)
                            : 'https://placehold.co/400x300'}
                        alt={experience.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <button
                        onClick={toggleWishlist}
                        className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white text-gray-700 hover:text-red-500 transition-colors z-10"
                    >
                        {isInWishlist ? <FaHeart className="text-red-500" /> : <FaRegHeart />}
                    </button>
                    {experience.category && (
                        <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/50 text-white text-xs font-bold backdrop-blur-sm">
                            {experience.category}
                        </span>
                    )}
                </div>

                <div className="p-4 flex flex-col flex-grow">
                    <div className="flex items-center flex-wrap gap-1 mb-2">
                        <div className="flex text-yellow-500 text-sm">
                            {[...Array(5)].map((_, i) => (
                                <FaStar key={i} className={i < Math.floor(displayRating) ? "text-yellow-500" : "text-gray-300"} />
                            ))}
                        </div>
                        <span className="font-bold text-gray-900 text-sm ml-1">{displayRating}</span>
                        <span className="text-gray-900 text-xs underline decoration-gray-900 underline-offset-2 ml-1 font-medium hover:text-primary hover:decoration-primary transition-colors">{displayCount} reviews</span>
                        <span className="text-gray-400 text-xs mx-1">•</span>
                        <span className="text-gray-500 text-xs">{experience.duration}</span>
                    </div>

                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {experience.title}
                    </h3>

                    <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                        <div>
                            <span className="text-[10px] text-gray-400 block font-semibold">From</span>
                            <span className="font-bold text-lg text-gray-900">
                                {(() => {
                                    const displayPrice = getBasePrice(experience);
                                    const displayCurrency = experience.bookingOptions?.[0]?.availabilityAndPricing?.currency || experience.currency || 'USD';
                                    const currencySymbol = { 'USD': '$', 'EUR': '€', 'GBP': '£', 'INR': '₹', 'AED': 'AED ', 'JPY': '¥' }[displayCurrency] || '₹';
                                    return currencySymbol + displayPrice;
                                })()}
                            </span>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-50 text-primary group-hover:bg-primary group-hover:text-white transition-colors text-xs font-bold shadow-sm">
                            <FaEye size={12} /> View Details
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default ExperienceCard;
