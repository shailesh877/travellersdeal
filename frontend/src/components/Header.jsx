import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaUserCircle, FaBars, FaTimes, FaHeart, FaShoppingCart, FaSearch, FaGlobe } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';

const Header = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const { user, logout } = useContext(AuthContext);
    const { cart, setCartOpen } = useContext(CartContext);
    const cartCount = cart?.items?.reduce((s, i) => s + i.quantity, 0) || 0;
    const navigate = useNavigate();
    const location = useLocation();

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim() !== '') {
            navigate(`/experiences?keyword=${searchTerm}`);
        }
    };

    // Handle scroll effect for sticky header
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 10) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        logout();
        setIsOpen(false);
        navigate('/');
    };

    const isHome = location.pathname === '/';
    const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/vendor');

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled || !isHome ? 'bg-white shadow-sm border-b border-gray-100 py-3' : 'bg-transparent py-5'}`}>
            <div className={`container mx-auto px-6 h-full flex items-center ${!isHome ? 'justify-between gap-4 md:gap-8' : 'justify-between'}`}>
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 z-50 shrink-0">
                    <img
                        src="/logo.png"
                        alt="Travellers Deal"
                        className={`w-auto object-contain transition-all duration-500 ${scrolled || !isHome ? 'h-12 md:h-14' : 'h-20 md:h-24'}`}
                    />
                </Link>

                {/* Search Bar - Hidden on Home and Admin/Vendor routes */}
                {!isHome && !isAdminRoute && (
                    <div className="hidden md:flex flex-1 max-w-2xl">
                        <form onSubmit={handleSearch} className="w-full relative flex items-center relative group">
                            <FaSearch className="absolute left-4 text-gray-400 group-hover:text-primary transition-colors focus-within:text-primary z-10" />
                            <input
                                type="text"
                                placeholder="Find places and things to do"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white border-2 border-gray-200 text-gray-900 rounded-full py-2.5 pl-12 pr-24 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                            />
                            <button
                                type="submit"
                                className="absolute right-1 top-1 bottom-1 bg-primary hover:bg-blue-600 text-white px-6 rounded-full font-bold transition-colors"
                            >
                                Search
                            </button>
                        </form>
                    </div>
                )}

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-6 text-sm shrink-0">
                    {/* Common Links for Home Only - hidden on other pages to save space for search */}
                    {isHome && (
                        <Link to="/experiences" className={`font-medium transition-colors ${scrolled ? 'text-secondary hover:text-primary' : 'text-white/90 hover:text-white'}`}>
                            Experiences
                        </Link>
                    )}

                    {/* Role Based Links */}
                    {user && (user.role === 'vendor' || user.role === 'admin') && (
                        <Link to="/vendor/dashboard" className={`font-medium transition-colors ${scrolled || !isHome ? 'text-secondary hover:text-primary' : 'text-white/90 hover:text-white'}`}>
                            Vendor Dashboard
                        </Link>
                    )}
                    {user && user.role === 'admin' && (
                        <Link to="/admin" className={`font-medium transition-colors ${scrolled || !isHome ? 'text-secondary hover:text-primary' : 'text-white/90 hover:text-white'}`}>
                            Admin
                        </Link>
                    )}

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-6">

                        {/* Always visible icons on non-home pages */}
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate('/profile?tab=liked')} className={`flex flex-col items-center gap-1 transition-colors ${scrolled || !isHome ? 'text-gray-600 hover:text-primary' : 'text-white/90 hover:text-white'}`}>
                                <FaHeart size={20} />
                                {!isHome && <span className="text-[10px] font-medium hidden lg:block">Liked</span>}
                            </button>
                            <button onClick={() => setCartOpen(true)} className={`flex flex-col items-center gap-1 transition-colors relative ${scrolled || !isHome ? 'text-gray-600 hover:text-primary' : 'text-white/90 hover:text-white'}`}>
                                <FaShoppingCart size={20} />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                        {cartCount > 9 ? '9+' : cartCount}
                                    </span>
                                )}
                                {!isHome && <span className="text-[10px] font-medium hidden lg:block">Cart</span>}
                            </button>
                            {!isHome && (
                                <button className="flex flex-col items-center gap-1 transition-colors text-gray-600 hover:text-primary hidden lg:flex">
                                    <FaGlobe size={20} />
                                    <span className="text-[10px] font-medium">EN/INR ₹</span>
                                </button>
                            )}
                        </div>

                        {user ? (
                            <div className="relative group">
                                <button className={`flex flex-col lg:flex-row items-center gap-1 lg:gap-2 font-medium ${scrolled || !isHome ? 'text-gray-600 hover:text-primary' : 'text-white'}`}>
                                    <FaUserCircle size={22} className={scrolled || !isHome ? '' : 'text-white'} />
                                    {!isHome ? (
                                        <span className="text-[10px] lg:text-sm font-medium">Profile</span>
                                    ) : (
                                        <span className="hidden lg:block">{user.name}</span>
                                    )}
                                </button>
                                {/* Dropdown */}
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-2 hidden group-hover:block transition-all opacity-0 group-hover:opacity-100 transform origin-top-right">
                                    <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary">Profile</Link>
                                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-500">Log Out</button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link to="/login" className={`font-bold transition-colors ${scrolled || !isHome ? 'text-gray-900 hover:text-primary' : 'text-white hover:text-white/80'}`}>
                                    Log in
                                </Link>
                                <Link to="/register" className={`px-4 py-2 rounded-full font-bold transition-all ${scrolled || !isHome ? 'bg-primary text-white hover:bg-blue-600' : 'bg-white text-secondary hover:bg-gray-100'}`}>
                                    Sign up
                                </Link>
                            </div>
                        )}
                    </div>
                </nav>

                {/* Mobile Menu Toggle */}
                <button className={`md:hidden z-50 ${scrolled || !isHome ? 'text-secondary' : 'text-white'}`} onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                </button>
            </div>

            {/* Mobile Search - Only on non-home pages */}
            {!isHome && !isOpen && (
                <div className="md:hidden px-4 pb-3 pt-2">
                    <form onSubmit={handleSearch} className="w-full relative flex items-center">
                        <FaSearch className="absolute left-3 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Find places..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-100 border-none text-gray-900 rounded-full py-2 pl-10 pr-4 outline-none text-sm"
                        />
                    </form>
                </div>
            )}

            {/* Mobile Nav Overlay */}
            {isOpen && (
                <div className="fixed inset-0 bg-white z-40 pt-20 px-6 flex flex-col gap-6 md:hidden overflow-y-auto w-full">
                    <Link to="/" className="text-xl font-medium text-secondary" onClick={() => setIsOpen(false)}>Home</Link>
                    <Link to="/experiences" className="text-xl font-medium text-secondary" onClick={() => setIsOpen(false)}>Experiences</Link>
                    {user && (user.role === 'vendor' || user.role === 'admin') && (
                        <Link to="/vendor/dashboard" className="text-xl font-medium text-secondary" onClick={() => setIsOpen(false)}>Vendor Dashboard</Link>
                    )}
                    <div className="border-t border-gray-100 pt-6 mt-2 flex flex-col gap-4">
                        {user ? (
                            <>
                                <Link to="/profile" className="flex items-center gap-3 text-xl font-medium text-secondary" onClick={() => setIsOpen(false)}>
                                    <FaUserCircle className="text-primary" />
                                    Profile
                                </Link>
                                <Link to="/wishlist" className="flex items-center gap-3 text-xl font-medium text-secondary relative" onClick={() => setIsOpen(false)}>
                                    <FaHeart className="text-primary" />
                                    Wishlist
                                    {user && user.wishlist && user.wishlist.length > 0 && (
                                        <span className="absolute left-6 -top-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                            {user.wishlist.length}
                                        </span>
                                    )}
                                </Link>
                                <button onClick={handleLogout} className="text-left text-xl font-medium text-red-500">Log Out</button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="w-full py-3 text-center rounded-lg border border-gray-200 text-secondary font-bold" onClick={() => setIsOpen(false)}>Log in</Link>
                                <Link to="/register" className="w-full py-3 text-center rounded-lg bg-primary text-white font-bold" onClick={() => setIsOpen(false)}>Sign up</Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;
