import React, { useState, useEffect } from 'react';
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaYoutube } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/api';

const Footer = () => {
    const [footerCategories, setFooterCategories] = useState([]);
    const [activeCategoryIdx, setActiveCategoryIdx] = useState(0);
    const [appSettings, setAppSettings] = useState({ playStoreUrl: '', appStoreUrl: '' });

    useEffect(() => {
        const fetchFooterLinks = async () => {
            try {
                const res = await axios.get(`${API_URL}/homepage/footerLinks`);
                if (res.data && Array.isArray(res.data)) {
                    setFooterCategories(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch footer links:", err);
            }
        };
        fetchFooterLinks();

        // Fetch app store links from admin settings
        axios.get(`${API_URL}/admin/settings`)
            .then(r => setAppSettings({ playStoreUrl: r.data.playStoreUrl || '', appStoreUrl: r.data.appStoreUrl || '' }))
            .catch(() => { });
    }, []);

    return (
        <div className="flex flex-col w-full">
            {/* Dynamic Footer Links Section (White Background) */}
            {footerCategories.length > 0 && (
                <section className="bg-gray-50 py-12 border-t border-gray-200">
                    <div className="max-w-[1240px] mx-auto px-4 md:px-8">
                        {/* Tabs Navigation */}
                        <div className="flex flex-wrap items-center gap-6 border-b border-gray-300 mb-8">
                            {footerCategories.map((cat, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveCategoryIdx(idx)}
                                    className={`pb-4 text-sm font-bold transition-colors ${activeCategoryIdx === idx
                                        ? 'text-blue-600 border-b-2 border-blue-600'
                                        : 'text-gray-600 hover:text-blue-600'
                                        }`}
                                >
                                    {cat.category}
                                </button>
                            ))}
                        </div>

                        {/* Active Tab Links Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8">
                            {footerCategories[activeCategoryIdx]?.links?.map((link, lIdx) => (
                                <Link to={link.url} key={lIdx} className="block group">
                                    <h4 className="font-bold text-gray-800 text-sm group-hover:underline">{link.title}</h4>
                                    <p className="text-gray-500 text-xs mt-1">{link.subtitle}</p>
                                </Link>
                            ))}
                            {(!footerCategories[activeCategoryIdx]?.links || footerCategories[activeCategoryIdx].links.length === 0) && (
                                <p className="text-sm text-gray-500 italic col-span-full">No links available in this category.</p>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* Main Dark Footer */}
            <footer className="bg-[#1a2b49] text-white pt-16 pb-8 text-sm">
                <div className="max-w-[1240px] mx-auto px-4 md:px-8">

                    {/* Top Section: Language & Currency */}
                    <div className="flex justify-start items-center border-b border-gray-700 pb-6 mb-8 gap-4">
                        <select className="bg-transparent border border-gray-600 rounded px-3 py-1.5 text-white outline-none cursor-pointer hover:border-white text-sm">
                            <option className="text-gray-900" value="en">English (US)</option>
                            <option className="text-gray-900" value="es">Español</option>
                            <option className="text-gray-900" value="fr">Français</option>
                        </select>
                        <select className="bg-transparent border border-gray-600 rounded px-3 py-1.5 text-white outline-none cursor-pointer hover:border-white text-sm">
                            <option className="text-gray-900" value="USD">USD ($)</option>
                            <option className="text-gray-900" value="EUR">EUR (€)</option>
                            <option className="text-gray-900" value="INR">INR (₹)</option>
                        </select>
                    </div>

                    {/* Main Links Grid (5 columns) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6 mb-16">
                        <div>
                            <h3 className="font-bold text-white mb-4">Support</h3>
                            <ul className="space-y-3">
                                <li><Link to="/contact" className="text-gray-300 hover:text-white transition-colors">Contact</Link></li>
                                <li><Link to="/about-us" className="text-gray-300 hover:text-white transition-colors">About Us</Link></li>
                                <li><Link to="/supplier-privacy-policy" className="text-gray-300 hover:text-white transition-colors">Privacy Policy</Link></li>
                                <li><Link to="/payment-collection-policy" className="text-gray-300 hover:text-white transition-colors">Payment Policy</Link></li>
                                <li><Link to="#" className="text-gray-300 hover:text-white transition-colors">Sitemap</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-bold text-white mb-4">Company</h3>
                            <ul className="space-y-3">
                                <li><Link to="/about-us" className="text-gray-300 hover:text-white transition-colors">About Us</Link></li>
                                <li><Link to="#" className="text-gray-300 hover:text-white transition-colors">Careers</Link></li>
                                <li><Link to="#" className="text-gray-300 hover:text-white transition-colors">Blog</Link></li>
                                <li><Link to="#" className="text-gray-300 hover:text-white transition-colors">Press</Link></li>
                                <li><Link to="#" className="text-gray-300 hover:text-white transition-colors">Gift Cards</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-bold text-white mb-4">Work With Us</h3>
                            <ul className="space-y-3">
                                <li><Link to="/vendor/register" className="text-gray-300 hover:text-white transition-colors">As a Supply Partner</Link></li>
                                <li><Link to="#" className="text-gray-300 hover:text-white transition-colors">As a Content Creator</Link></li>
                                <li><Link to="#" className="text-gray-300 hover:text-white transition-colors">As an Affiliate Partner</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-bold text-white mb-4">Ways to Travel</h3>
                            <ul className="space-y-3">
                                <li><Link to="#" className="text-gray-300 hover:text-white transition-colors">Cities</Link></li>
                                <li><Link to="#" className="text-gray-300 hover:text-white transition-colors">Magazines</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-bold text-white mb-4">Mobile</h3>
                            <div className="flex flex-col gap-3">
                                {appSettings.playStoreUrl ? (
                                    <a href={appSettings.playStoreUrl} target="_blank" rel="noopener noreferrer" className="w-32 md:w-36 transition-transform hover:scale-105">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Get it on Google Play" className="w-full" />
                                    </a>
                                ) : (
                                    <a href="#" className="w-32 md:w-36 opacity-50 cursor-default">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Get it on Google Play" className="w-full" />
                                    </a>
                                )}
                                {appSettings.appStoreUrl ? (
                                    <a href={appSettings.appStoreUrl} target="_blank" rel="noopener noreferrer" className="w-32 md:w-36 transition-transform hover:scale-105">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="Download on the App Store" className="w-full" />
                                    </a>
                                ) : (
                                    <a href="#" className="w-32 md:w-36 opacity-50 cursor-default">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="Download on the App Store" className="w-full" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Contact Info Row (Aligned with columns 1-3) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6 mb-16">
                        <div className="lg:col-span-1 pr-4">
                            <h4 className="font-bold text-gray-400 mb-2">Office Address</h4>
                            <p className="text-gray-300 leading-relaxed text-xs md:text-sm">GF H.NO. 70, NR POLE NO 5 VILL. DHUL SIRAS Dhulsiras South West Delhi Delhi India 110077</p>
                        </div>
                        <div className="lg:col-span-1">
                            <h4 className="font-bold text-gray-400 mb-2">Contact Number</h4>
                            <p className="text-gray-300 text-xs md:text-sm">9643052598</p>
                        </div>
                        <div className="lg:col-span-1">
                            <h4 className="font-bold text-gray-400 mb-2">Email</h4>
                            <a href="mailto:Support@travellersdeal.com" className="text-gray-300 hover:text-white transition-colors text-xs md:text-sm break-all">Support@travellersdeal.com</a>
                        </div>
                    </div>

                    {/* Bottom Section: Logo + Copyright & Socials */}
                    <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
                        {/* Logo + Tagline */}
                        <div className="flex flex-col items-center md:items-start gap-3">
                            <img src="/logo.png" alt="Travellers Deal" className="h-20 w-auto brightness-200 drop-shadow-lg" />
                            <p className="text-gray-400 text-xs max-w-xs text-center md:text-left leading-relaxed">
                                Discover & book the best curated travel experiences around the world.
                            </p>
                            <div className="text-gray-500 text-xs flex flex-col sm:flex-row gap-1 sm:gap-2">
                                <span>&copy; {new Date().getFullYear()} Travellers Deal. Made for travellers.</span>
                                <span className="hidden sm:inline">•</span>
                                <span>
                                    developed by{' '}
                                    <a href="https://pasiware.com" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline transition-colors">
                                        Pasiware Technologies (P) Ltd.
                                    </a>
                                </span>
                            </div>
                        </div>

                        {/* Social Icons */}
                        <div className="flex gap-4">
                            <a href="#" className="text-white hover:text-gray-300 transition-colors text-lg"><FaFacebookF /></a>
                            <a href="#" className="text-white hover:text-gray-300 transition-colors text-lg"><FaInstagram /></a>
                            <a href="#" className="text-white hover:text-gray-300 transition-colors text-lg"><FaTwitter /></a>
                            <a href="#" className="text-white hover:text-gray-300 transition-colors text-lg"><FaLinkedinIn /></a>
                            <a href="#" className="text-white hover:text-gray-300 transition-colors text-lg"><FaYoutube /></a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Footer;
