import React, { useContext } from 'react';
import { CartContext } from '../context/CartContext';
import { FaTimes, FaTrash, FaPlus, FaMinus, FaShoppingCart, FaArrowRight } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../config/api';

const CartDrawer = () => {
    const { cart, cartOpen, setCartOpen, removeItem, updateItem, clearCart } = useContext(CartContext);
    const navigate = useNavigate();

    if (!cartOpen) return null;

    const { items = [], total = 0 } = cart;

    const handleCheckout = () => {
        setCartOpen(false);
        navigate('/checkout');
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 z-[80] backdrop-blur-sm"
                onClick={() => setCartOpen(false)}
            />

            {/* Drawer */}
            <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[90] shadow-2xl flex flex-col animate-slide-in-right">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <FaShoppingCart className="text-primary text-xl" />
                        <h2 className="text-xl font-bold text-gray-900">Cart</h2>
                        {items.length > 0 && (
                            <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                {items.reduce((s, i) => s + i.quantity, 0)}
                            </span>
                        )}
                    </div>
                    <button onClick={() => setCartOpen(false)} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500">
                        <FaTimes />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                            <FaShoppingCart className="text-gray-200 text-7xl" />
                            <h3 className="text-lg font-bold text-gray-700">Your cart is empty</h3>
                            <p className="text-gray-400 text-sm">Add experiences to get started!</p>
                            <button
                                onClick={() => { setCartOpen(false); navigate('/experiences'); }}
                                className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-red-600 transition-colors"
                            >
                                Browse Experiences
                            </button>
                        </div>
                    ) : (
                        items.map(item => {
                            const exp = item.experience;
                            const imgSrc = exp?.images?.[0]
                                ? (exp.images[0].startsWith('http') ? exp.images[0] : `${API_URL.replace('/api', '')}${exp.images[0]}`)
                                : 'https://placehold.co/80x80';
                            return (
                                <div key={item._id} className="flex gap-4 bg-gray-50 rounded-2xl p-4">
                                    <Link to={`/experience/${exp?._id}`} onClick={() => setCartOpen(false)}>
                                        <img src={imgSrc} alt={exp?.title} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
                                    </Link>
                                    <div className="flex-1 min-w-0">
                                        <Link to={`/experience/${exp?._id}`} onClick={() => setCartOpen(false)}>
                                            <p className="font-bold text-sm text-gray-900 line-clamp-2 hover:text-primary transition-colors">
                                                {exp?.title}
                                            </p>
                                        </Link>
                                        <p className="text-xs text-gray-400 mt-1">
                                            📅 {item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                            {item.timeSlot && ` · ${item.timeSlot}`}
                                        </p>
                                        <div className="flex items-center justify-between mt-3">
                                            {/* Qty controls */}
                                            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2 py-1">
                                                <button
                                                    onClick={() => item.quantity > 1 ? updateItem(item._id, item.quantity - 1) : removeItem(item._id)}
                                                    className="text-gray-500 hover:text-primary transition-colors"
                                                >
                                                    <FaMinus className="text-xs" />
                                                </button>
                                                <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateItem(item._id, item.quantity + 1)}
                                                    className="text-gray-500 hover:text-primary transition-colors"
                                                >
                                                    <FaPlus className="text-xs" />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-gray-900">
                                                    {exp?.currency === 'INR' ? '₹' : '$'}{(item.priceAtAdd * item.quantity).toFixed(2)}
                                                </span>
                                                <button onClick={() => removeItem(item._id)} className="text-red-400 hover:text-red-600 transition-colors p-1">
                                                    <FaTrash className="text-xs" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="border-t border-gray-100 px-6 py-5 space-y-4 bg-white">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-medium">Total</span>
                            <span className="text-2xl font-bold text-gray-900">${total.toFixed ? total.toFixed(2) : total}</span>
                        </div>
                        <button
                            onClick={handleCheckout}
                            className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-base hover:bg-red-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/30"
                        >
                            Checkout <FaArrowRight />
                        </button>
                        <button onClick={clearCart} className="w-full text-center text-xs text-gray-400 hover:text-red-400 transition-colors">
                            Clear cart
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default CartDrawer;
