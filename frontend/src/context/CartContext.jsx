import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';
import { AuthContext } from './AuthContext';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [cart, setCart] = useState({ items: [], total: 0, itemCount: 0 });
    const [cartOpen, setCartOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const config = () => ({
        headers: { Authorization: `Bearer ${user?.token || localStorage.getItem('token')}` }
    });

    const fetchCart = useCallback(async () => {
        if (!user) { setCart({ items: [], total: 0, itemCount: 0 }); return; }
        try {
            const { data } = await axios.get(`${API_URL}/cart`, config());
            setCart(data);
        } catch (err) {
            console.error('Cart fetch error:', err);
        }
    }, [user]);

    // Fetch cart on login/logout
    useEffect(() => { fetchCart(); }, [fetchCart]);

    const addToCart = async ({ experienceId, quantity = 1, date, timeSlot, priceAtAdd }) => {
        if (!user) return { error: 'Please login to add to cart' };
        try {
            setLoading(true);
            const { data } = await axios.post(`${API_URL}/cart`, { experienceId, quantity, date, timeSlot, priceAtAdd }, config());
            setCart(data);
            setCartOpen(true); // Open drawer after adding
            return { success: true };
        } catch (err) {
            return { error: err.response?.data?.message || 'Failed to add to cart' };
        } finally {
            setLoading(false);
        }
    };

    const updateItem = async (itemId, quantity) => {
        try {
            const { data } = await axios.put(`${API_URL}/cart/${itemId}`, { quantity }, config());
            setCart(data);
        } catch (err) { console.error(err); }
    };

    const removeItem = async (itemId) => {
        try {
            const { data } = await axios.delete(`${API_URL}/cart/${itemId}`, config());
            setCart(data);
        } catch (err) { console.error(err); }
    };

    const clearCart = async () => {
        try {
            const { data } = await axios.delete(`${API_URL}/cart`, config());
            setCart(data);
        } catch (err) { console.error(err); }
    };

    return (
        <CartContext.Provider value={{ cart, cartOpen, setCartOpen, addToCart, updateItem, removeItem, clearCart, loading, fetchCart }}>
            {children}
        </CartContext.Provider>
    );
};
