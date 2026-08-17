import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/api';

const DynamicFooterLinks = () => {
    const { pathname } = useLocation();
    const [footerCategories, setFooterCategories] = useState([]);
    const [activeCategoryIdx, setActiveCategoryIdx] = useState(0);

    // Check user role: Only show to guests or normal users
    const userStr = localStorage.getItem('user');
    let isUser = true;
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            if (user.role === 'admin' || user.role === 'vendor') {
                isUser = false;
            }
        } catch (e) {
            // parsing error, assume visitor
        }
    }

    useEffect(() => {
        if (!isUser) return;

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
    }, [isUser]);

    if (!isUser || footerCategories.length === 0 || pathname.startsWith('/vendor') || pathname.startsWith('/admin')) return null;

    return (
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
    );
};

export default DynamicFooterLinks;
