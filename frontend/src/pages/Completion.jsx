import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';

const Completion = () => {
    const location = useLocation();
    const paymentMethod = location.state?.paymentMethod || 'online'; // default to online if not specified

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 text-center max-w-md">
                <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
                
                {paymentMethod === 'online' ? (
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment & Booking Successful!</h1>
                ) : (
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Successful!</h1>
                )}

                <p className="text-gray-600 mb-6">Thank you for your booking. You will receive a confirmation email shortly.</p>
                <Link to="/" className="bg-primary text-white px-6 py-2 rounded-full font-bold hover:bg-cyan-600 transition">
                    Back to Home
                </Link>
            </div>
        </div>
    );
};

export default Completion;
