import React, { useState, useEffect } from 'react';
import ExperienceCard from '../components/ExperienceCard';
import axios from 'axios';
import { FaFilter, FaSortAmountDown, FaTimes } from 'react-icons/fa';
import { useSearchParams } from 'react-router-dom';
import { API_URL } from '../config/api';

const ExperienceList = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const keyword = searchParams.get('keyword') || '';

    const [experiences, setExperiences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);

    // Filter States
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedPrices, setSelectedPrices] = useState([]);
    const [selectedDurations, setSelectedDurations] = useState([]);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    useEffect(() => {
        const fetchExperiences = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (keyword) params.append('keyword', keyword);
                if (selectedCategories.length > 0) params.append('category', selectedCategories.join(','));
                if (selectedDurations.length > 0) params.append('duration', selectedDurations.join(','));

                // Handle Price Logic
                let minPrice = 0;
                let maxPrice = 100000;
                let priceFilterActive = false;

                if (selectedPrices.length > 0) {
                    priceFilterActive = true;
                    // Reset to restrictive defaults if filtering
                    minPrice = 100000;
                    maxPrice = 0;

                    selectedPrices.forEach(range => {
                        if (range === 'Under $50') {
                            minPrice = Math.min(minPrice, 0);
                            maxPrice = Math.max(maxPrice, 50);
                        } else if (range === '$50 - $100') {
                            minPrice = Math.min(minPrice, 50);
                            maxPrice = Math.max(maxPrice, 100);
                        } else if (range === '$100 - $200') {
                            minPrice = Math.min(minPrice, 100);
                            maxPrice = Math.max(maxPrice, 200);
                        } else if (range === 'Over $200') {
                            minPrice = Math.min(minPrice, 200);
                            maxPrice = 100000; // Arbitrary high number
                        }
                    });
                    params.append('minPrice', minPrice);
                    if (maxPrice < 100000) params.append('maxPrice', maxPrice);
                }

                const { data } = await axios.get(`${API_URL}/experiences?${params.toString()}`);
                
                // Fetch reviews for each experience to dynamically calculate true ratings explicitly
                const experiencesWithReviews = await Promise.all((data.experiences || []).map(async (exp) => {
                    try {
                        const { data: reviews } = await axios.get(`${API_URL}/reviews/${exp._id}`);
                        if (reviews && reviews.length > 0) {
                            exp.reviewsCount = reviews.length;
                            exp.numReviews = reviews.length;
                            const calcRating = (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1);
                            exp.averageRating = Number(calcRating);
                            exp.rating = Number(calcRating);
                        }
                    } catch (err) {
                        console.error('Error fetching reviews for experience', exp._id, err);
                    }
                    return exp;
                }));

                setExperiences(experiencesWithReviews);
                setTotal(data.total || 0);
            } catch (error) {
                console.error('Error fetching experiences:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchExperiences();
    }, [keyword, selectedCategories, selectedPrices, selectedDurations]);

    const toggleFilter = (item, setFunction, currentList) => {
        if (currentList.includes(item)) {
            setFunction(currentList.filter(i => i !== item));
        } else {
            setFunction([...currentList, item]);
        }
    };

    const clearFilters = () => {
        setSelectedCategories([]);
        setSelectedPrices([]);
        setSelectedDurations([]);
        setSearchParams({});
    };

    return (
        <div className="bg-gray-50 min-h-screen pt-24 pb-12">
            <div className="container mx-auto px-6">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-gray-200 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {keyword ? `Results for "${keyword}"` : 'Top things to do'}
                        </h1>
                        <p className="text-gray-500">{total} experiences found</p>
                    </div>

                    <div className="flex items-center gap-4 mt-4 md:mt-0">
                        <button
                            className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full font-medium text-gray-700 hover:border-black transition-colors bg-white"
                            onClick={() => setShowMobileFilters(!showMobileFilters)}
                        >
                            <FaFilter className="text-gray-500" /> Filters
                        </button>
                        {/* Sort placeholder - logic can be added later */}
                        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full font-medium text-gray-700 hover:border-black transition-colors bg-white">
                            <FaSortAmountDown className="text-gray-500" /> Sort by
                        </button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 relative">

                    {/* Sidebar Filters */}
                    <div className={`
                        lg:block w-72 flex-shrink-0 
                        ${showMobileFilters ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto block' : 'hidden'}
                        lg:relative lg:z-0 lg:p-0 lg:bg-transparent lg:overflow-visible
                    `}>
                        {showMobileFilters && (
                            <div className="flex justify-between items-center mb-6 lg:hidden">
                                <h2 className="text-2xl font-bold">Filters</h2>
                                <button onClick={() => setShowMobileFilters(false)}><FaTimes size={24} /></button>
                            </div>
                        )}

                        <div className="sticky top-28 space-y-8">

                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-gray-900">Filters</h3>
                                {(selectedCategories.length > 0 || selectedPrices.length > 0 || selectedDurations.length > 0) && (
                                    <button onClick={clearFilters} className="text-primary text-sm font-bold hover:underline">Clear all</button>
                                )}
                            </div>

                            {/* Categories */}
                            <div className="border-b border-gray-200 pb-6">
                                <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Interests</h3>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Tours', value: 'Tour' },
                                        { label: 'Tickets', value: 'Entry ticket' },
                                        { label: 'Rentals', value: 'Rental experience' },
                                        { label: 'Transports', value: 'Transport experience' },
                                        { label: 'City Cards', value: 'City card' },
                                        { label: 'Other', value: 'Other' }
                                    ].map(cat => (
                                        <label key={cat.value} className="flex items-center gap-3 cursor-pointer group select-none">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedCategories.includes(cat.value) ? 'bg-primary border-primary' : 'border-gray-300 bg-white group-hover:border-primary'}`}>
                                                {selectedCategories.includes(cat.value) && <span className="text-white text-xs">✓</span>}
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={selectedCategories.includes(cat.value)}
                                                onChange={() => toggleFilter(cat.value, setSelectedCategories, selectedCategories)}
                                            />
                                            <span className={`text-sm group-hover:text-black transition-colors ${selectedCategories.includes(cat.value) ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>{cat.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Price */}
                            <div className="border-b border-gray-200 pb-6">
                                <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Price</h3>
                                <div className="space-y-3">
                                    {['Under $50', '$50 - $100', '$100 - $200', 'Over $200'].map(price => (
                                        <label key={price} className="flex items-center gap-3 cursor-pointer group select-none">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedPrices.includes(price) ? 'bg-primary border-primary' : 'border-gray-300 bg-white group-hover:border-primary'}`}>
                                                {selectedPrices.includes(price) && <span className="text-white text-xs">✓</span>}
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={selectedPrices.includes(price)}
                                                onChange={() => toggleFilter(price, setSelectedPrices, selectedPrices)}
                                            />
                                            <span className={`text-sm group-hover:text-black transition-colors ${selectedPrices.includes(price) ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>{price}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Duration */}
                            <div>
                                <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Duration</h3>
                                <div className="space-y-3">
                                    {['Up to 1 hour', '1 to 4 hours', '4 hours to 1 day', 'Multi-day'].map(dur => (
                                        <label key={dur} className="flex items-center gap-3 cursor-pointer group select-none">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedDurations.includes(dur) ? 'bg-primary border-primary' : 'border-gray-300 bg-white group-hover:border-primary'}`}>
                                                {selectedDurations.includes(dur) && <span className="text-white text-xs">✓</span>}
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={selectedDurations.includes(dur)}
                                                onChange={() => toggleFilter(dur, setSelectedDurations, selectedDurations)}
                                            />
                                            <span className={`text-sm group-hover:text-black transition-colors ${selectedDurations.includes(dur) ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>{dur}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Mobile Apply Button */}
                            {showMobileFilters && (
                                <button
                                    className="w-full bg-primary text-white font-bold py-3 rounded-full mt-8"
                                    onClick={() => setShowMobileFilters(false)}
                                >
                                    Show {total} Results
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Results Grid */}
                    <div className="flex-grow">
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {[1, 2, 3, 4, 5, 6].map(n => (
                                    <div key={n} className="bg-white rounded-xl h-96 animate-pulse shadow-sm border border-gray-100"></div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {experiences.map(exp => (
                                    <ExperienceCard key={exp._id} experience={exp} />
                                ))}
                                {experiences.length === 0 && (
                                    <div className="col-span-full py-20 text-center bg-white rounded-xl border border-gray-100 shadow-sm">
                                        <div className="text-gray-300 text-6xl mb-4">🔍</div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">No experiences found</h3>
                                        <p className="text-gray-500 max-w-md mx-auto">We couldn't find matches for "{keyword}" with the selected filters. Try adjusting your search or clearing filters.</p>
                                        <button onClick={clearFilters} className="mt-6 text-primary font-bold hover:underline">Clear all filters</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExperienceList;
