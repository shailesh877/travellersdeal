import React, { useState } from 'react';
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope } from 'react-icons/fa';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Placeholder for form submission logic
        console.log('Form submitted:', formData);
        alert('Thank you for reaching out! We will get back to you soon.');
        setFormData({ name: '', email: '', subject: '', message: '' });
    };

    return (
        <div className="container mx-auto px-4 py-12 pt-24 md:pt-28 max-w-6xl">
            <h1 className="text-4xl font-bold text-center mb-12 text-gray-800">Contact Us</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Contact Information */}
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <h2 className="text-2xl font-semibold mb-6 text-gray-800">Get In Touch</h2>
                    <p className="text-gray-600 mb-8">
                        Have questions about our tours or need assistance with your booking?
                        We're here to help! Reach out to us through any of the channels below.
                    </p>

                    <div className="space-y-6">
                        <div className="flex items-start space-x-4">
                            <div className="text-primary mt-1">
                                <FaMapMarkerAlt size={24} className="text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800">Visit Us</h3>
                                <p className="text-gray-600 mt-1">
                                    Branova ADT Services (OPC) Private Limited<br />
                                    GF H.NO. 70, NR POLE NO 5 VILL. DHUL SIRAS<br />
                                    Dhulsiras, South West Delhi, Delhi, India 110077
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4">
                            <div className="text-primary mt-1">
                                <FaPhoneAlt size={24} className="text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800">Call Us</h3>
                                <p className="text-gray-600 mt-1">
                                    +91 9643052598
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4">
                            <div className="text-primary mt-1">
                                <FaEnvelope size={24} className="text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800">Email Us</h3>
                                <p className="text-gray-600 mt-1">
                                    Support@travellersdeal.com
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Form */}
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <h2 className="text-2xl font-semibold mb-6 text-gray-800">Send us a Message</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label htmlFor="name" className="block text-gray-700 font-medium mb-2">Your Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="email" className="block text-gray-700 font-medium mb-2">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="subject" className="block text-gray-700 font-medium mb-2">Subject</label>
                            <input
                                type="text"
                                id="subject"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div className="mb-6">
                            <label htmlFor="message" className="block text-gray-700 font-medium mb-2">Message</label>
                            <textarea
                                id="message"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                rows="4"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            ></textarea>
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300"
                        >
                            Send Message
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Contact;
