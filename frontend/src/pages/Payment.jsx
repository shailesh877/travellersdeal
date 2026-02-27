import React, { useEffect, useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { FaLock, FaShieldAlt, FaCalendarAlt, FaUserFriends, FaClock, FaCheck, FaChevronRight, FaStar, FaTag } from 'react-icons/fa';

const Payment = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const {
        amount = 50,
        experienceTitle = 'Experience',
        currency = 'USD',
        experienceId,
        date,
        slots = 1,
        timeSlot
    } = location.state || {};

    const [loading, setLoading] = useState(false);
    const [coupon, setCoupon] = useState('');
    const [couponApplied, setCouponApplied] = useState(false);

    const currencySymbol = {
        'USD': '$', 'EUR': '€', 'GBP': '£', 'INR': '₹', 'AED': 'AED ', 'JPY': '¥'
    }[currency] || '$';

    const pricePerPerson = Math.round(amount / slots);
    const originalTotal = Math.round(amount * 1.18);
    const discount = originalTotal - amount;

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayment = async () => {
        setLoading(true);
        const res = await loadRazorpay();

        if (!res) {
            alert('Razorpay SDK failed to load. Are you online?');
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const { data: order } = await axios.post(
                `${API_URL}/payments/create-order`,
                { amount: Math.round(amount * 100), currency },
                config
            );

            const { data: { keyId } } = await axios.get(`${API_URL}/payments/key`, config);

            const options = {
                key: keyId,
                amount: order.amount,
                currency: order.currency,
                name: "Travellers Deal",
                description: experienceTitle,
                order_id: order.id,
                handler: async function (response) {
                    try {
                        const verifyData = {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        };
                        const { data } = await axios.post(`${API_URL}/payments/verify`, verifyData, config);

                        if (data.status === 'success') {
                            try {
                                await axios.post(
                                    `${API_URL}/bookings`,
                                    { experienceId, date, slots, timeSlot, paymentStatus: 'paid', paymentId: response.razorpay_payment_id },
                                    config
                                );
                                navigate('/completion');
                            } catch (bookingError) {
                                console.error('Booking creation failed:', bookingError);
                                alert('Payment successful but booking failed. Please contact support.');
                            }
                        } else {
                            alert('Payment Verification Failed');
                        }
                    } catch (error) {
                        console.error(error);
                        alert('Payment Verification Failed');
                    }
                },
                prefill: { name: user?.name || '', email: user?.email || '' },
                theme: { color: "#00C2CB" },
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.open();
            setLoading(false);
        } catch (error) {
            console.error(error);
            alert('Error creating order. Ensure backend is running and keys are set.');
            setLoading(false);
        }
    };

    const handlePayLater = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            await axios.post(
                `${API_URL}/bookings`,
                { experienceId, date, slots, timeSlot, paymentStatus: 'pending', paymentId: 'pay_later' },
                config
            );

            navigate('/completion');
        } catch (bookingError) {
            console.error('Booking creation failed:', bookingError);
            alert('Booking failed. Please try again or contact support.');
            setLoading(false);
        }
    };

    const formattedDate = date ? new Date(date).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }) : 'Not selected';

    return (
        <div className="min-h-screen bg-[#f7f8fa] pt-20 md:pt-24 pb-16 font-sans">
            {/* Breadcrumb */}
            <div className="max-w-5xl mx-auto px-4 md:px-8 mb-6 flex items-center gap-2 text-sm text-gray-500">
                <span className="hover:underline cursor-pointer" onClick={() => navigate(-2)}>Experience</span>
                <FaChevronRight size={10} />
                <span className="font-semibold text-gray-800">Checkout</span>
            </div>

            <div className="max-w-5xl mx-auto px-4 md:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

                    {/* ─── LEFT: Booking Details ─── */}
                    <div className="lg:col-span-3 space-y-6">
                        <h1 className="text-2xl md:text-3xl font-extrabold text-[#1a2b49]">Confirm your booking</h1>

                        {/* Experience Card */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-5 border-b border-gray-100">
                                <p className="text-xs uppercase font-bold text-primary tracking-wider mb-1">Experience</p>
                                <h2 className="text-lg font-bold text-gray-900 leading-snug">{experienceTitle}</h2>
                                <div className="flex items-center gap-1 mt-1">
                                    {[...Array(5)].map((_, i) => <FaStar key={i} className="text-yellow-400 text-xs" />)}
                                    <span className="text-xs text-gray-500 ml-1">4.8 · Travellers Deal Verified</span>
                                </div>
                            </div>
                            <div className="px-6 py-5 space-y-4">
                                <div className="flex items-center gap-3 text-sm text-gray-700">
                                    <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                                        <FaCalendarAlt className="text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-medium">Date</p>
                                        <p className="font-semibold text-gray-800">{formattedDate}</p>
                                    </div>
                                </div>
                                {timeSlot && (
                                    <div className="flex items-center gap-3 text-sm text-gray-700">
                                        <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                                            <FaClock className="text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-medium">Time</p>
                                            <p className="font-semibold text-gray-800">{timeSlot}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-sm text-gray-700">
                                    <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                                        <FaUserFriends className="text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-medium">Participants</p>
                                        <p className="font-semibold text-gray-800">{slots} Adult{slots > 1 ? 's' : ''} × {currencySymbol}{pricePerPerson}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Traveller Info */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                            <div className="px-6 py-5 border-b border-gray-100">
                                <h3 className="font-bold text-gray-900">Traveller information</h3>
                            </div>
                            <div className="px-6 py-5 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Full Name</label>
                                        <input type="text" defaultValue={user?.name || ''} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition" placeholder="Your full name" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Email</label>
                                        <input type="email" defaultValue={user?.email || ''} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition" placeholder="Your email" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Phone (optional)</label>
                                    <input type="tel" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition" placeholder="+91 00000 00000" />
                                </div>
                            </div>
                        </div>

                        {/* Inclusions */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5">
                            <h3 className="font-bold text-gray-900 mb-4">What's included</h3>
                            <div className="space-y-2">
                                {['Free cancellation up to 24 hours before', 'Reserve now, pay nothing today', 'Instant confirmation', 'Secure payment powered by Razorpay'].map((item, i) => (
                                    <div key={i} className="flex items-start gap-3 text-sm text-gray-700">
                                        <FaCheck className="text-green-500 mt-0.5 flex-shrink-0" />
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ─── RIGHT: Price Summary & Pay ─── */}
                    <div className="lg:col-span-2">
                        <div className="sticky top-28 bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">
                            {/* Price Breakdown */}
                            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                                <h3 className="font-bold text-gray-900 text-base mb-5">Price summary</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between text-gray-600">
                                        <span>{slots} person{slots > 1 ? 's' : ''} × {currencySymbol}{pricePerPerson}</span>
                                        <span className="line-through text-gray-400">{currencySymbol}{originalTotal}</span>
                                    </div>
                                    <div className="flex justify-between text-green-600 font-medium">
                                        <span className="flex items-center gap-1"><FaTag size={11} /> Special Discount</span>
                                        <span>-{currencySymbol}{discount}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Taxes & fees</span>
                                        <span className="text-green-600 font-medium">Included</span>
                                    </div>
                                </div>
                                <div className="mt-5 pt-4 border-t border-dashed border-gray-200 flex justify-between items-center">
                                    <span className="font-extrabold text-gray-900 text-base">Total</span>
                                    <div className="text-right">
                                        <p className="text-2xl font-extrabold text-[#1a2b49]">{currencySymbol}{amount}</p>
                                        <p className="text-xs text-gray-400">All taxes included</p>
                                    </div>
                                </div>
                                {/* Coupon */}
                                {!couponApplied ? (
                                    <div className="mt-4 flex gap-2">
                                        <input
                                            type="text"
                                            value={coupon}
                                            onChange={(e) => setCoupon(e.target.value)}
                                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
                                            placeholder="Coupon code"
                                        />
                                        <button
                                            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-200 transition"
                                            onClick={() => coupon && setCouponApplied(true)}
                                        >
                                            Apply
                                        </button>
                                    </div>
                                ) : (
                                    <div className="mt-4 flex items-center gap-2 text-green-600 text-sm font-medium bg-green-50 rounded-lg px-4 py-2">
                                        <FaCheck /> Coupon "{coupon}" applied!
                                    </div>
                                )}
                            </div>

                            {/* Pay Button */}
                            <div className="px-6 py-5 space-y-3">
                                <button
                                    onClick={handlePayment}
                                    disabled={loading}
                                    className="w-full bg-primary hover:bg-red-600 text-white font-extrabold py-4 px-6 rounded-xl text-base transition-all duration-200 shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                                >
                                    <FaLock size={14} />
                                    {loading ? 'Processing...' : `Pay ${currencySymbol}${amount} with Razorpay`}
                                </button>

                                <div className="relative flex items-center py-2">
                                    <div className="flex-grow border-t border-gray-200"></div>
                                    <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase tracking-wider">or</span>
                                    <div className="flex-grow border-t border-gray-200"></div>
                                </div>

                                <button
                                    onClick={handlePayLater}
                                    disabled={loading}
                                    className="w-full bg-white hover:bg-gray-50 border-2 border-primary text-primary font-extrabold py-4 px-6 rounded-xl text-base transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                                >
                                    <FaCalendarAlt size={14} />
                                    {loading ? 'Processing...' : `Reserve Now, Pay Later`}
                                </button>

                                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400 pt-2">
                                    <FaShieldAlt className="text-green-400" />
                                    <span>Secured by 256-bit SSL encryption</span>
                                </div>
                                <div className="mt-3 flex items-center justify-center gap-3">
                                    {['UPI', 'Cards', 'Net Banking', 'Wallets'].map(m => (
                                        <span key={m} className="text-[10px] font-bold text-gray-400 uppercase tracking-wide bg-gray-100 px-2 py-0.5 rounded">{m}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Payment;
