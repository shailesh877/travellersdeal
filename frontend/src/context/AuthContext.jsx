import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const { data } = await axios.post(`${API_URL}/auth/login`, { email, password });
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
        localStorage.setItem('token', data.token); // Store token separately for easier access if needed
        return data; // Return data for calling component to handle
    };

    const register = async (name, email, password, role) => {
        const { data } = await axios.post(`${API_URL}/auth/register`, { name, email, password, role });
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
        localStorage.setItem('token', data.token);
        return data;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    useEffect(() => {
        let intervalId;
        const checkStatus = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                // Ping an endpoint to check if token/user is still valid and active
                await axios.get(`${API_URL}/users/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (error) {
                console.error('Session check failed', error);
                if (error.response && error.response.status === 401) {
                    // Automatically log out if session is invalid or deactivated
                    logout();
                    window.location.href = '/login';
                }
            }
        };

        if (user) {
            // Check every 5 seconds
            intervalId = setInterval(checkStatus, 5000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [user]);

    const refreshUser = async () => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            };
            // Assuming we have a route to get user profile, if not valid, we might need to add one.
            // Using a simple workaround: fetch wishlist and update user object for now if profile route is unsure
            // But better to fetch full user. Let's assume /api/auth/profile exists or we rely on just wishlist.
            // Actually, let's just make a dedicated call to get updated user details.
            // If getProfile isn't there, we can add it or just use getWishlist to patch the user object.

            // Checking authController, there is no generic 'getProfile'. 
            // I will use getWishlist from my new controller to update the wishlist part of user.
            const { data: wishlist } = await axios.get(`${API_URL}/users/wishlist`, config);

            const updatedUser = { ...user, wishlist };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (error) {
            console.error("Failed to refresh user", error);
        }
    }

    const socialLogin = async (data, provider) => {
        try {
            let res;
            if (provider === 'google') {
                res = await axios.post(`${API_URL}/auth/google`, { token: data.credential });
            } else {
                res = await axios.post(`${API_URL}/auth/facebook`, { accessToken: data.accessToken, userID: data.userID });
            }

            setUser(res.data);
            localStorage.setItem('user', JSON.stringify(res.data));
            localStorage.setItem('token', res.data.token);
            return res.data;
        } catch (error) {
            console.error(`${provider} login failed`, error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, refreshUser, socialLogin }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
