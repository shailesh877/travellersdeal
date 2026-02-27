import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/api';
import { FaLock, FaCheckCircle, FaArrowLeft } from 'react-icons/fa';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (password !== confirmPassword) {
            setError("Passwords don't match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters long");
            return;
        }

        setLoading(true);

        try {
            const { data } = await axios.put(`${API_URL}/auth/resetpassword/${token}`, { password });
            setSuccess(true);
            setMessage(data.message || 'Password reset successful!');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f8fa] px-4">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                    <div className="flex justify-center mb-4">
                        <FaCheckCircle className="text-green-500 text-6xl" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Reset Successful</h1>
                    <p className="text-gray-500 text-sm mb-8">
                        Your password has been securely updated. You can now use your new password to log in.
                    </p>
                    <Link
                        to="/login"
                        className="w-full bg-primary hover:bg-cyan-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-md inline-block"
                    >
                        Go to Log In
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f8fa] px-4 pt-20 pb-16">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="mb-6">
                    <Link to="/login" className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-primary transition-colors">
                        <FaArrowLeft className="mr-2 text-xs" /> Back to log in
                    </Link>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">Create New Password</h1>
                <p className="text-gray-500 text-sm mb-6">
                    Your new password must be different from previously used passwords.
                </p>

                {error && <div className="bg-red-50 text-red-600 p-3 rounded-md mb-6 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">New Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaLock className="text-gray-400" />
                            </div>
                            <input
                                type="password"
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-gray-900"
                                placeholder="Enter new password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Confirm Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaLock className="text-gray-400" />
                            </div>
                            <input
                                type="password"
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-gray-900"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-cyan-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-md mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
