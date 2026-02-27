import { Ionicons } from "@expo/vector-icons";
import React, { useState, useCallback, useEffect } from "react";
import { Dimensions, FlatList, Image, Text, TouchableOpacity, View, ActivityIndicator, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BookingFlow from "../../components/BookingFlow";
import ExperienceDetail from "../../components/ExperienceDetail";
import { API_URL } from "../../constants/Config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, router } from "expo-router";

const { width } = Dimensions.get('window');

interface CartItem {
    _id: string;
    experience: {
        _id: string;
        title: string;
        category: string;
        images: string[];
        price: number;
    };
    quantity: number;
    date: string;
    timeSlot: string;
    priceAtAdd: number;
}

export default function CartScreen() {
    const insets = useSafeAreaInsets();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [selectedExperience, setSelectedExperience] = useState<any>(null);
    const [isBookingFlowVisible, setIsBookingFlowVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [total, setTotal] = useState(0);

    const fetchCart = async () => {
        try {
            const userInfo = await AsyncStorage.getItem('userInfo');
            if (!userInfo) {
                setLoading(false);
                return;
            }
            const { token } = JSON.parse(userInfo);

            const response = await fetch(`${API_URL}/cart`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (response.ok) {
                setCartItems(data.items || []);
                setTotal(data.total || 0);
            }
        } catch (error) {
            console.error("Error fetching cart:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchCart();
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchCart();
        }, [])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchCart();
    }, []);

    const updateQuantity = async (itemId: string, newQuantity: number) => {
        if (newQuantity < 1) return;

        try {
            const userInfo = await AsyncStorage.getItem('userInfo');
            if (!userInfo) return;
            const { token } = JSON.parse(userInfo);

            const response = await fetch(`${API_URL}/cart/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ quantity: newQuantity })
            });

            const data = await response.json();
            if (response.ok) {
                setCartItems(data.items || []);
                setTotal(data.total || 0);
            }
        } catch (error) {
            console.error("Error updating quantity:", error);
        }
    };

    const removeItem = async (itemId: string) => {
        try {
            const userInfo = await AsyncStorage.getItem('userInfo');
            if (!userInfo) return;
            const { token } = JSON.parse(userInfo);

            const response = await fetch(`${API_URL}/cart/${itemId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (response.ok) {
                setCartItems(data.items || []);
                setTotal(data.total || 0);
            }
        } catch (error) {
            console.error("Error removing item:", error);
        }
    };

    const taxes = Math.round(total * 0.18);
    const grandTotal = total + taxes;

    // Synthesize "Experience" data for the entire cart
    const cartSummaryExperience = cartItems.length > 0 ? {
        id: 'CART_CHECKOUT',
        title: 'Trip Checkout',
        price: grandTotal.toLocaleString(),
        image: cartItems[0]?.experience?.images?.[0] || '',
    } : null;

    const renderCartItem = ({ item }: { item: CartItem }) => (
        <View className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-4 mb-4 border border-gray-100 dark:border-gray-800 shadow-sm">
            <View className="flex-row">
                <TouchableOpacity onPress={() => setSelectedExperience(item.experience)}>
                    <Image source={{ uri: item.experience?.images?.[0] || 'https://via.placeholder.com/150' }} className="w-24 h-24 rounded-2xl bg-gray-200" />
                </TouchableOpacity>

                <View className="flex-1 ml-4 justify-between">
                    <View>
                        <View className="flex-row justify-between items-start">
                            <Text className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-widest">{item.experience?.category || 'Experience'}</Text>
                            <TouchableOpacity onPress={() => removeItem(item._id)}>
                                <Ionicons name="trash-outline" size={18} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                        <Text className="text-gray-900 dark:text-white font-bold text-sm mt-1" numberOfLines={2}>{item.experience?.title || 'Untitled'}</Text>
                        <View className="flex-row items-center mt-1">
                            <Ionicons name="calendar-outline" size={12} color="#6b7280" />
                            <Text className="text-gray-500 dark:text-gray-400 text-[11px] ml-1">{new Date(item.date).toDateString()}</Text>
                        </View>
                    </View>

                    <View className="flex-row justify-between items-center mt-2">
                        <Text className="text-[#002b5c] dark:text-[#58a6ff] font-black text-base">₹{item.priceAtAdd * item.quantity}</Text>

                        <View className="flex-row items-center bg-gray-50 dark:bg-gray-800 rounded-full border border-gray-100 dark:border-gray-700 px-2 py-1">
                            <TouchableOpacity onPress={() => updateQuantity(item._id, item.quantity - 1)} className="w-8 h-8 items-center justify-center">
                                <Ionicons name="remove" size={16} color="#6b7280" />
                            </TouchableOpacity>
                            <Text className="text-gray-900 dark:text-white font-bold mx-2 min-w-[20px] text-center">{item.quantity}</Text>
                            <TouchableOpacity onPress={() => updateQuantity(item._id, item.quantity + 1)} className="w-8 h-8 items-center justify-center">
                                <Ionicons name="add" size={16} color="#6b7280" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );

    return (
        <View style={{ flex: 1, paddingTop: insets?.top ?? 0 }} className="bg-white dark:bg-black">
            <View className="px-6 py-4">
                <Text className="text-3xl font-extrabold text-[#002b5c] dark:text-white">My Cart</Text>
                <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">{cartItems.length} items ready for adventure</Text>
            </View>

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#002b5c" />
                </View>
            ) : cartItems.length > 0 ? (
                <>
                    <FlatList
                        data={cartItems}
                        renderItem={renderCartItem}
                        keyExtractor={item => item._id}
                        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 10, paddingBottom: 150 }}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                    />

                    <View
                        style={{ paddingBottom: (insets?.bottom ?? 0) + 10 }}
                        className="absolute bottom-20 left-0 right-0 bg-white dark:bg-[#1c1c1e] border-t border-gray-100 dark:border-gray-800 px-6 pt-6 shadow-2xl"
                    >
                        <View className="flex-row justify-between items-center mb-2">
                            <Text className="text-gray-500 dark:text-gray-400">Subtotal</Text>
                            <Text className="text-gray-900 dark:text-white font-bold">₹{total.toLocaleString()}</Text>
                        </View>
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-gray-500 dark:text-gray-400">Taxes (GST 18%)</Text>
                            <Text className="text-gray-900 dark:text-white font-bold">₹{taxes.toLocaleString()}</Text>
                        </View>

                        <TouchableOpacity
                            onPress={() => setIsBookingFlowVisible(true)}
                            className="bg-[#002b5c] dark:bg-[#58a6ff] w-full py-5 rounded-full flex-row items-center justify-center shadow-lg"
                        >
                            <View className="flex-row items-center">
                                <Text className="text-white font-black text-lg mr-2">Checkout</Text>
                                <View className="h-6 w-[1.5px] bg-white/30 mx-3" />
                                <Text className="text-white font-black text-lg">₹{grandTotal.toLocaleString()}</Text>
                            </View>
                            <View className="absolute right-6">
                                <Ionicons name="arrow-forward" size={20} color="white" />
                            </View>
                        </TouchableOpacity>
                    </View>
                </>
            ) : (
                <View className="flex-1 items-center justify-center px-10 pb-20">
                    <View className="w-24 h-24 bg-gray-50 dark:bg-[#1c1c1e] rounded-full items-center justify-center mb-6">
                        <Ionicons name="cart-outline" size={48} color="#d1d5db" />
                    </View>
                    <Text className="text-2xl font-black text-gray-900 dark:text-white text-center">Your cart is empty</Text>
                    <Text className="text-gray-500 dark:text-gray-400 text-center mt-3 leading-6 text-base">
                        Your next great story starts here. Browse experiences and add them to your cart!
                    </Text>
                    <TouchableOpacity
                        onPress={() => router.push('/')}
                        className="mt-10 bg-[#002b5c] dark:bg-[#58a6ff] px-10 py-4 rounded-full shadow-md"
                    >
                        <Text className="text-white font-bold text-lg">Start Exploring</Text>
                    </TouchableOpacity>
                </View>
            )}

            <ExperienceDetail
                visible={!!selectedExperience}
                experience={selectedExperience}
                onClose={() => setSelectedExperience(null)}
            />

            {cartSummaryExperience && (
                <BookingFlow
                    visible={isBookingFlowVisible}
                    onClose={() => setIsBookingFlowVisible(false)}
                    experience={cartSummaryExperience}
                    selectedDate={cartItems[0]?.date || new Date().toISOString()}
                    selectedTime={cartItems[0]?.timeSlot || null}
                />
            )}
        </View>
    );
}
