import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/api';
import { FaBuilding, FaUserTie, FaUsers, FaLandmark, FaUniversity, FaStore, FaCheck, FaInfoCircle } from 'react-icons/fa';

const VendorRegister = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        // Step 1
        businessType: '', // 'registered_company', 'registered_individual', 'non_profit', 'government', 'educational', 'other'

        // Step 2
        activityCount: '', // 'Up to 2', '3-6', '7-15', '16-35', '+35'
        hasReservationSystem: true,
        reservationSystem: '',

        // Step 3
        brandName: '',
        website: '',
        registrationCountry: '',
        currency: '',
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        agreeToTerms: false,
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleNext = () => {
        if (step < 3) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!formData.agreeToTerms) {
            setError('You must agree to the terms and conditions');
            setLoading(false);
            return;
        }

        try {
            const payload = {
                name: `${formData.firstName} ${formData.lastName}`.trim(),
                email: formData.email,
                password: formData.password,
                role: 'vendor',
                vendorDetails: {
                    businessType: formData.businessType,
                    activityCount: formData.activityCount,
                    reservationSystem: formData.hasReservationSystem ? formData.reservationSystem : 'None',
                    brandName: formData.brandName,
                    website: formData.website,
                    registrationCountry: formData.registrationCountry,
                    currency: formData.currency,
                }
            };

            const { data } = await axios.post(`${API_URL}/auth/register`, payload);

            localStorage.setItem('user', JSON.stringify(data));
            localStorage.setItem('token', data.token);

            alert('Registration Successful! Redirecting to your dashboard...');
            window.location.href = '/vendor/dashboard';
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const reservationSystems = [
        'Activitar', 'Anchor', 'Bookingkit', 'Bokun', 'FareHarbor', 'Peek Pro', 'Rezdy', 'TrekkSoft', 'Xola', 'Other'
    ];

    const countries = ['United States', 'United Kingdom', 'United Arab Emirates', 'India', 'France', 'Spain', 'Italy', 'Germany', 'Australia', 'Canada'];
    const currencies = ['USD', 'EUR', 'GBP', 'AED', 'INR', 'AUD', 'CAD'];

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-white p-8 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">Join us as a supply partner</h2>
                    <span className="text-sm font-medium text-gray-500">Step {step} of 3</span>
                </div>

                <div className="p-8">
                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 1: Business Type */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                How do you run your business?
                                <FaInfoCircle className="text-gray-400" />
                            </h3>

                            <div className="space-y-4">
                                {[
                                    { id: 'registered_company', label: 'As a registered company', desc: 'Legally incorporated entities operating under formal business registration.', icon: FaBuilding },
                                    { id: 'registered_individual', label: 'As a registered individual', desc: 'Single person businesses operating under personal name.', icon: FaUserTie },
                                    { id: 'non_profit', label: 'As a Non-Profit Organization', desc: 'Mission-driven organizations operating for charitable or social purposes.', icon: FaUsers },
                                    { id: 'government', label: 'As a Government Entity', desc: 'State-owned or public organizations.', icon: FaLandmark },
                                    { id: 'educational', label: 'As an Educational Institution', desc: 'Learning and training organizations providing educational services.', icon: FaUniversity },
                                    { id: 'other', label: 'Other business type', desc: 'Entities operating outside standard business registries', icon: FaStore },
                                ].map((type) => (
                                    <div
                                        key={type.id}
                                        onClick={() => setFormData({ ...formData, businessType: type.id })}
                                        className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.businessType === type.id ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-blue-200 hover:border-blue-400 hover:bg-blue-50'}`}
                                    >
                                        <div className={`mt-1 p-2 rounded-lg ${formData.businessType === type.id ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-500'}`}>
                                            <type.icon />
                                        </div>
                                        <div className="ml-4">
                                            <h4 className={`text-base font-bold ${formData.businessType === type.id ? 'text-blue-600' : 'text-gray-900'}`}>{type.label}</h4>
                                            <p className="text-sm text-gray-500 mt-1">{type.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end pt-6">
                                <button
                                    onClick={handleNext}
                                    disabled={!formData.businessType}
                                    className={`px-8 py-3 rounded-full font-bold text-white transition-all duration-300 ${!formData.businessType ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-800 shadow-lg'}`}
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Details */}
                    {step === 2 && (
                        <div className="space-y-8 animate-fade-in-up">
                            {/* Selected Business Type Summary */}
                            <div className="bg-blue-600 rounded-lg p-4 text-white flex items-center gap-3">
                                <FaUserTie className="text-xl" />
                                <div>
                                    <p className="font-bold text-sm opacity-80">Selected Type</p>
                                    <p className="font-bold">
                                        {formData.businessType === 'registered_company' && 'Registered Company'}
                                        {formData.businessType === 'registered_individual' && 'Registered Individual'}
                                        {formData.businessType === 'non_profit' && 'Non-Profit Organization'}
                                        {formData.businessType === 'government' && 'Government Entity'}
                                        {formData.businessType === 'educational' && 'Educational Institution'}
                                        {formData.businessType === 'other' && 'Other Business Type'}
                                    </p>
                                </div>
                            </div>

                            {/* Activity Count */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-4">How many activities of any type do you offer?</h3>
                                <div className="flex flex-wrap gap-0 border border-gray-300 rounded-lg overflow-hidden divide-x divide-gray-300">
                                    {['Up to 2', '3-6', '7-15', '16-35', '+35'].map((count) => (
                                        <button
                                            key={count}
                                            onClick={() => setFormData({ ...formData, activityCount: count })}
                                            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${formData.activityCount === count ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                        >
                                            {count}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Reservation System */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Do you use a reservation system to manage your products?</h3>
                                <div className="flex rounded-lg border border-gray-300 overflow-hidden mb-6">
                                    <button
                                        onClick={() => setFormData({ ...formData, hasReservationSystem: true })}
                                        className={`flex-1 py-3 font-bold transition-colors ${formData.hasReservationSystem ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                    >
                                        Yes
                                    </button>
                                    <button
                                        onClick={() => setFormData({ ...formData, hasReservationSystem: false })}
                                        className={`flex-1 py-3 font-bold transition-colors ${!formData.hasReservationSystem ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                    >
                                        No
                                    </button>
                                </div>

                                {formData.hasReservationSystem && (
                                    <div className="animate-fade-in">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Select the reservation system you use:</label>
                                        <select
                                            name="reservationSystem"
                                            value={formData.reservationSystem}
                                            onChange={handleChange}
                                            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white appearance-none"
                                        >
                                            <option value="">Select one</option>
                                            {reservationSystems.map(sys => <option key={sys} value={sys}>{sys}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between pt-6 border-t border-gray-100">
                                <button onClick={handleBack} className="text-gray-500 font-bold hover:text-gray-900">Back</button>
                                <button
                                    onClick={handleNext}
                                    disabled={!formData.activityCount || (formData.hasReservationSystem && !formData.reservationSystem)}
                                    className={`px-8 py-3 rounded-full font-bold text-white transition-all duration-300 ${!formData.activityCount || (formData.hasReservationSystem && !formData.reservationSystem) ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-400 hover:bg-blue-800 shadow-lg'}`}
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Account Creation */}
                    {step === 3 && (
                        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in-up">

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Public/Brand individual name</label>
                                <input
                                    type="text"
                                    name="brandName"
                                    value={formData.brandName}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                    placeholder="Acme Inc."
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Add a website that represents your business</label>
                                <input
                                    type="url"
                                    name="website"
                                    value={formData.website}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                    placeholder="https://www.website.com/"
                                />
                                <p className="text-xs text-gray-500 mt-1">We may use this website for verification of your business activities.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Where're you registered?</label>
                                    <select
                                        name="registrationCountry"
                                        value={formData.registrationCountry}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white"
                                        required
                                    >
                                        <option value="">Country</option>
                                        {countries.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Preferred currency</label>
                                    <select
                                        name="currency"
                                        value={formData.currency}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white"
                                        required
                                    >
                                        <option value="">Select one</option>
                                        {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            <hr className="border-gray-100 my-4" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">First name</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                        placeholder="John"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Last name</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                        placeholder="Doe"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">You will use this to log in to your account</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                    required
                                />
                                <ul className="text-xs text-gray-500 mt-2 space-y-1">
                                    <li className="flex items-center gap-1"><FaCheck className="text-green-500" /> Between 8 and 30 characters</li>
                                    <li className="flex items-center gap-1"><FaCheck className="text-green-500" /> Include a number (1234) and one special character (#%!.^)</li>
                                </ul>
                            </div>

                            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
                                <input
                                    type="checkbox"
                                    name="agreeToTerms"
                                    checked={formData.agreeToTerms}
                                    onChange={handleChange}
                                    className="mt-1 h-5 w-5 text-primary rounded focus:ring-primary border-gray-300"
                                />
                                <div className="text-sm">
                                    <p className="font-medium text-gray-900">Terms and conditions</p>
                                    <p className="text-gray-500">I have read and agree to the <a href="#" className="text-primary hover:underline">Supplier Terms and Conditions</a> and the <a href="#" className="text-primary hover:underline">Privacy Policy</a>.</p>
                                </div>
                            </div>

                            {/* Verification Info Box from Screenshot */}
                            <div className="flex items-start gap-3 p-4 bg-blue-100 text-blue-800 rounded-xl border border-blue-200">
                                <FaInfoCircle className="mt-0.5 flex-shrink-0" />
                                <p className="text-sm font-medium">You'll receive an email to verify your account after registering</p>
                            </div>

                            <div className="flex justify-between pt-2">
                                <button type="button" onClick={handleBack} className="text-gray-500 font-bold hover:text-gray-900">Back</button>
                                <button
                                    type="submit"
                                    disabled={loading || !formData.agreeToTerms}
                                    className={`px-8 py-3 rounded-full font-bold text-white transition-all duration-300 ${loading || !formData.agreeToTerms ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-400 hover:bg-blue-800 shadow-lg'}`}
                                >
                                    {loading ? 'Creating...' : 'Create an account'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                <div className="bg-gray-50 p-6 text-center border-t border-gray-100">
                    <p className="text-gray-600">
                        Already have an account? <Link to="/login" className="text-primary font-bold hover:underline">Log in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VendorRegister;
