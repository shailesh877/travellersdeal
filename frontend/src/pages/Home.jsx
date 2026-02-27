import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaCalendarAlt } from 'react-icons/fa';
import ExperienceCard from '../components/ExperienceCard';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../config/api';

const Home = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [date, setDate] = useState('');
    const [featuredExperiences, setFeaturedExperiences] = useState([]);
    const [destinations, setDestinations] = useState([]);
    const [attractions, setAttractions] = useState([]);
    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [scrolled, setScrolled] = useState(false);
    const [activeTab, setActiveTab] = useState('Top attractions worldwide');
    const navigate = useNavigate();
    const testimonialsRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 300) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data } = await axios.get(`${API_URL}/experiences?pageNumber=1`);
                setFeaturedExperiences(data.experiences ? data.experiences.slice(0, 8) : []);

                const [destRes, attrRes, testimonialRes] = await Promise.all([
                    axios.get(`${API_URL}/homepage/destinations`),
                    axios.get(`${API_URL}/homepage/attractions`),
                    axios.get(`${API_URL}/admin/testimonials`),
                ]);
                setDestinations(destRes.data);
                setAttractions(attrRes.data);
                setTestimonials(testimonialRes.data.filter(t => t.isActive));
            } catch (error) {
                console.error('Error fetching homepage data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        navigate(`/experiences?keyword=${searchTerm}`);
    };

    return (
        <div className="pb-20 bg-white min-h-screen relative">
            {/* Hero Background */}
            <div className="absolute top-0 left-0 right-0 h-[600px] overflow-hidden z-0">
                <img
                    src="https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=2940&q=80"
                    alt="Travel Hero"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40"></div>
            </div>

            {/* Hero Content */}
            <div className="relative z-10 pt-[220px] px-6 text-center w-full max-w-4xl mx-auto">
                <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-12 tracking-tight drop-shadow-lg leading-tight">
                    Discover &amp; book things to do
                </h1>
            </div>

            {/* Sticky Search Bar */}
            <div className={`sticky top-[8px] z-[60] w-full px-4 md:px-6 flex justify-center transition-all duration-300 pointer-events-none`}>
                <div className={`w-full transition-all duration-300 ease-in-out transform origin-top pointer-events-auto ${scrolled ? 'max-w-xl scale-100' : 'max-w-3xl scale-100'}`}>
                    <form onSubmit={handleSearch} className={`bg-white rounded-3xl md:rounded-full flex flex-col md:flex-row items-center w-full transition-all duration-300 ${scrolled ? 'p-1.5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-100' : 'p-2 md:p-3 shadow-2xl hover:scale-[1.01]'}`}>
                        <div className={`flex-1 flex items-center w-full border-b md:border-b-0 md:border-r border-gray-200 transition-all ${scrolled ? 'px-3 py-1.5' : 'px-4 py-3'}`}>
                            <FaSearch className={`text-gray-400 mr-3 ${scrolled ? 'text-lg' : 'text-xl'}`} />
                            <input
                                type="text"
                                placeholder="Where are you going?"
                                className={`w-full outline-none text-gray-700 placeholder-gray-400 transition-all ${scrolled ? 'text-base' : 'text-lg'}`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className={`flex-1 flex items-center w-full hidden md:flex transition-all ${scrolled ? 'px-3 py-1.5' : 'px-4 py-3'}`}>
                            <FaCalendarAlt className={`text-gray-400 mr-3 ${scrolled ? 'text-lg' : 'text-xl'}`} />
                            <input
                                type="date"
                                className={`w-full outline-none text-gray-700 bg-transparent transition-all ${scrolled ? 'text-base' : 'text-lg'}`}
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                        <button type="submit" className={`bg-primary hover:bg-red-600 text-white font-bold rounded-2xl md:rounded-full transition-all m-1 w-full md:w-auto shadow-md ${scrolled ? 'text-sm px-6 py-2' : 'text-lg px-8 py-3'}`}>
                            Search
                        </button>
                    </form>
                </div>
            </div>

            {/* Spacer */}
            <div className="h-[150px] sm:h-[200px] lg:h-[280px] w-full relative z-0 transition-all duration-300"></div>

            {/* Things to do section */}
            <div className="max-w-[1240px] mx-auto px-4 md:px-8 mb-16 relative z-10">
                <h2 className="text-2xl md:text-3xl font-bold text-[#1a2b49] mb-6">Things to do wherever you're going</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {destinations.map(dest => (
                        <Link to={`/experiences?keyword=${dest.city}`} key={dest.city} className="group cursor-pointer block">
                            <div className="relative aspect-square rounded-xl overflow-hidden mb-3">
                                <img
                                    src={dest.image}
                                    alt={dest.city}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                            <h3 className="text-[#1a2b49] font-bold text-lg leading-tight">{dest.city}</h3>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Attractions section */}
            <div className="max-w-[1240px] mx-auto px-4 md:px-8 mb-16 relative z-10">
                <div className="flex justify-between items-end mb-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-[#1a2b49]">Attractions you can't miss</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {attractions.map((attr, idx) => (
                        <Link to="/experiences" key={idx} className={`group cursor-pointer block${idx === attractions.length - 1 ? ' relative' : ''}`}>
                            <div className="relative h-48 md:h-56 rounded-xl overflow-hidden mb-3">
                                <img src={attr.image} alt={attr.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                {idx === attractions.length - 1 && (
                                    <button className="absolute right-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:bg-gray-50 transition-colors z-10 hidden md:flex items-center justify-center w-10 h-10 border border-gray-200">
                                        <span className="text-[#0071eb] text-xl font-bold">›</span>
                                    </button>
                                )}
                            </div>
                            <h3 className="text-[#1a2b49] font-bold text-lg leading-tight">{attr.title}</h3>
                            <p className="text-gray-500 text-sm mt-1">{attr.activities} activities</p>
                        </Link>
                    ))}
                </div>
            </div>

            {/* ── Testimonials ── dark navy, exact same design as original, now DYNAMIC */}
            {testimonials.length > 0 && (
                <div className="max-w-[1240px] mx-auto px-4 md:px-8 mb-16 relative z-10">
                    <div className="bg-[#1a2b49] rounded-2xl p-6 md:p-8">
                        <h2 className="text-xl md:text-2xl font-bold text-white mb-6">
                            Trusted by millions of travelers around the world
                        </h2>

                        <div className="relative">
                            {/* Left Arrow */}
                            <button
                                onClick={() => testimonialsRef.current?.scrollBy({ left: -280, behavior: 'smooth' })}
                                className="absolute -left-4 top-1/2 -translate-y-1/2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors z-10 hidden lg:flex items-center justify-center w-10 h-10 border border-gray-200"
                            >
                                <span className="text-[#0071eb] text-xl font-bold">‹</span>
                            </button>

                            {/* Right Arrow */}
                            <button
                                onClick={() => testimonialsRef.current?.scrollBy({ left: 280, behavior: 'smooth' })}
                                className="absolute -right-4 top-1/2 -translate-y-1/2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors z-10 hidden lg:flex items-center justify-center w-10 h-10 border border-gray-200"
                            >
                                <span className="text-[#0071eb] text-xl font-bold">›</span>
                            </button>

                            {/* Scrollable track */}
                            <div
                                ref={testimonialsRef}
                                className="flex gap-4 overflow-x-auto pb-1"
                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            >
                                {testimonials.map(t => {
                                    const palette = ['#ff5a5f', '#ff7a3d', '#00a699', '#0071eb', '#7c3aed', '#db2777'];
                                    const color = palette[t.name.charCodeAt(0) % palette.length];
                                    return (
                                        <div key={t._id} className="min-w-[260px] max-w-[260px] bg-white rounded-xl p-5 text-gray-900 flex flex-col">
                                            {/* Experience title */}
                                            <p className="text-sm font-bold line-clamp-2 mb-3 text-[#1a2b49]">
                                                {t.experienceTitle || 'Travel Experience'}
                                            </p>

                                            {/* Stars */}
                                            <div className="flex mb-4">
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <svg key={s} className={`w-4 h-4 ${s <= t.rating ? 'text-[#1a2b49]' : 'text-gray-200'} fill-current`} viewBox="0 0 24 24">
                                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                    </svg>
                                                ))}
                                            </div>

                                            {/* Avatar + name */}
                                            <div className="flex items-center gap-3 mb-4">
                                                <div
                                                    className="w-10 h-10 rounded-full text-white flex items-center justify-center font-bold text-lg flex-shrink-0"
                                                    style={{ backgroundColor: color }}
                                                >
                                                    {t.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold">{t.name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {t.location && `${t.location} · `}
                                                        {new Date(t.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                                        {t.isVerified && ' • Verified booking'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Comment */}
                                            <p className="text-sm text-gray-700 flex-grow line-clamp-4">{t.comment}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Rated Experiences */}
            <div className="max-w-[1240px] mx-auto px-4 md:px-8 mt-16">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Top Rated Experiences</h2>
                        <p className="text-gray-500">Unforgettable activities for your next trip</p>
                    </div>
                    <Link to="/experiences" className="text-primary font-bold hover:text-red-600 transition-colors flex items-center gap-1">
                        See all <span className="text-xl">›</span>
                    </Link>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(n => (
                            <div key={n} className="bg-white rounded-xl h-80 animate-pulse shadow-sm"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {featuredExperiences.length > 0 ? (
                            featuredExperiences.map(exp => (
                                <ExperienceCard key={exp._id} experience={exp} />
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center">
                                <p className="text-gray-500 text-lg">No experiences available at the moment.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Popular Destinations */}
            <div className="max-w-[1240px] mx-auto px-4 md:px-8 mt-20 mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-8">Popular Destinations</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {destinations.length > 0 ? (
                        destinations.slice(0, 6).map(dest => (
                            <Link to={`/experiences?keyword=${dest.city}`} key={dest.city} className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer block shadow-sm">
                                <img
                                    src={dest.image ? (dest.image.startsWith('http') ? dest.image : `${API_URL.replace('/api', '')}${dest.image}`) : `https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=800`}
                                    alt={dest.city}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    onError={(e) => e.target.src = 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=800'}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
                                    <h3 className="text-white font-bold text-lg">{dest.city}</h3>
                                    <span className="text-white/80 text-xs mt-1">{dest.count} Activities</span>
                                </div>
                            </Link>
                        ))
                    ) : (
                        [1, 2, 3, 4, 5, 6].map(n => (
                            <div key={n} className="aspect-square bg-gray-200 rounded-xl animate-pulse"></div>
                        ))
                    )}
                </div>
            </div>

            {/* Footer links moved to Footer.jsx */}
        </div>
    );
};

export default Home;
