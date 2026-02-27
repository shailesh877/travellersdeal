import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/api';
import { FaArrowLeft, FaEnvelope } from 'react-icons/fa';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            const { data } = await axios.post(`${API_URL}/auth/forgotpassword`, { email });
            setMessage(data.message || 'Password reset link sent to your email.');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send reset link.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f8fa] px-4 pt-20 pb-16">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="mb-6">
                    <Link to="/login" className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-primary transition-colors">
                        <FaArrowLeft className="mr-2 text-xs" /> Back to log in
                    </Link>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password</h1>
                <p className="text-gray-500 text-sm mb-6">
                    No worries, we'll send you reset instructions.
                </p>

                {error && <div className="bg-red-50 text-red-600 p-3 rounded-md mb-6 text-sm flex items-center">{error}</div>}
                {message && <div className="bg-green-50 text-green-700 p-3 rounded-md mb-6 text-sm flex items-center">{message}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Email address</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaEnvelope className="text-gray-400" />
                            </div>
                            <input
                                type="email"
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-gray-900"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-cyan-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-md mt-4 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {loading ? 'Sending...' : 'Reset Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;
