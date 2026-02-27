import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import { Dimensions, Image, Modal, ScrollView, Text, TouchableOpacity, View, Alert, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BookingFlow from "./BookingFlow";
import { API_URL } from "../constants/Config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { formatPrice } from "../utils/currency";

const { width } = Dimensions.get('window');

interface Experience {
    id?: string;
    _id?: string;
    title: string;
    category: string;
    images?: string[];
    image?: string;
    price: string;
    currency: string;
    rating: number;
    reviews: string;
    features: string;
    isOriginal?: boolean;
    certified?: boolean;
    description?: string;
    highlights?: string[];
    itinerary?: { title: string; description: string }[];
    includes?: string[];
    whatToBring?: string[];
    meetingPoint?: string;
    duration?: string;
    languages?: string[];
    timeSlots?: string[];
}

interface Props {
    visible: boolean;
    experience: Experience | null;
    onClose: () => void;
}

export default function ExperienceDetail({ visible, experience, onClose }: Props) {
    const insets = useSafeAreaInsets();
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [isBookingFlowVisible, setIsBookingFlowVisible] = useState(false);
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);

    // Normalize ID
    const experienceId = experience ? (experience.id || experience._id || '') : '';

    useEffect(() => {
        if (visible) {
            console.log("ExperienceDetail modal visible. Experience ID:", experienceId);
        }
        if (visible && experienceId) {
            checkWishlistStatus();
        }
    }, [visible, experienceId]);

    const checkWishlistStatus = async () => {
        try {
            const userInfo = await AsyncStorage.getItem('userInfo');
            if (!userInfo) return;
            const { token } = JSON.parse(userInfo);

            const response = await fetch(`${API_URL}/users/wishlist`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            if (response.ok && Array.isArray(data)) {
                setIsInWishlist(data.some((item: any) => item._id === experienceId || item.id === experienceId));
            }
        } catch (error) {
            console.error("Error checking wishlist:", error);
        }
    };

    const toggleWishlist = async () => {
        if (!experienceId) return;
        setWishlistLoading(true);

        try {
            const userInfo = await AsyncStorage.getItem('userInfo');
            if (!userInfo) {
                Alert.alert("Login Required", "Please login to add items to wishlist");
                return;
            }
            const { token } = JSON.parse(userInfo);

            const url = `${API_URL}/users/wishlist/${experienceId}`;
            const method = isInWishlist ? 'DELETE' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setIsInWishlist(!isInWishlist);
            }
        } catch (error) {
            console.error("Error toggling wishlist:", error);
        } finally {
            setWishlistLoading(false);
        }
    };

    const handleBooking = () => {
        if (!selectedDate) {
            Alert.alert("Select Date", "Please select a date to proceed.");
            return;
        }
        if (experience?.timeSlots && experience.timeSlots.length > 0 && !selectedTime) {
            Alert.alert("Select Time", "Please select a time slot to proceed.");
            return;
        }
        setIsBookingFlowVisible(true);
    };

    if (!experience) return null;

    // Normalize images: use array if present, else single image wrapped in array
    const displayImages = experience.images && experience.images.length > 0
        ? experience.images
        : experience.image ? [experience.image] : ['https://via.placeholder.com/400x300'];

    // Generate next 10 days
    const dates = Array.from({ length: 10 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i);
        return {
            id: i.toString(),
            dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
            dayNumber: date.getDate().toString(),
            month: date.toLocaleDateString('en-US', { month: 'short' }),
            fullDate: date.toDateString(),
        };
    });

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle={Platform.OS === 'ios' ? "pageSheet" : undefined}
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-white dark:bg-black">
                <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                    {/* IMAGE CAROUSEL SECTION */}
                    <View className="relative h-[400px]">
                        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
                            {displayImages.map((img, index) => (
                                <Image
                                    key={index}
                                    source={{ uri: img }}
                                    style={{ width: width, height: 400 }}
                                    resizeMode="cover"
                                />
                            ))}
                        </ScrollView>

                        {/* CLOSE BUTTON */}
                        <TouchableOpacity
                            onPress={() => {
                                setSelectedDate(null);
                                setSelectedTime(null);
                                onClose();
                            }}
                            style={{ top: (insets?.top ?? 0) + 10 }}
                            className="absolute left-4 w-10 h-10 bg-black/30 rounded-full items-center justify-center z-10"
                        >
                            <Ionicons name="close" size={24} color="white" />
                        </TouchableOpacity>

                        {/* SHARE & WISHLIST BUTTONS */}
                        <View style={{ top: (insets?.top ?? 0) + 10 }} className="absolute right-4 flex-row gap-3 z-10">
                            <TouchableOpacity className="w-10 h-10 bg-black/30 rounded-full items-center justify-center">
                                <Ionicons name="share-outline" size={20} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={toggleWishlist}
                                disabled={wishlistLoading}
                                className="w-10 h-10 bg-black/30 rounded-full items-center justify-center"
                            >
                                <Ionicons
                                    name={isInWishlist ? "heart" : "heart-outline"}
                                    size={22}
                                    color={isInWishlist ? "#ef4444" : "white"}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* PAGINATION DOTS */}
                        {displayImages.length > 1 && (
                            <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-2">
                                {displayImages.map((_, i) => (
                                    <View key={i} className="w-2 h-2 rounded-full bg-white/50" />
                                ))}
                            </View>
                        )}
                    </View>

                    {/* CONTENT SECTION */}
                    <View className="p-6">
                        <Text className="text-gray-500 dark:text-gray-400 font-bold tracking-widest uppercase text-xs">
                            {experience.category}
                        </Text>
                        <Text className="text-gray-900 dark:text-white font-extrabold text-3xl mt-2 leading-tight">
                            {experience.title}
                        </Text>

                        {/* RATING SECTION */}
                        <View className="flex-row items-center mt-4 gap-2">
                            <Ionicons name="star" size={18} color="#fbbf24" />
                            <Text className="text-gray-900 dark:text-white font-bold text-lg">{experience.rating || '0.0'}</Text>
                            <Text className="text-gray-500 dark:text-gray-400 text-base">({experience.reviews || '0'} reviews)</Text>
                        </View>

                        {/* BADGES */}
                        <View className="flex-row flex-wrap gap-2 mt-4">
                            {experience.isOriginal && (
                                <View className="flex-row items-center bg-orange-100 dark:bg-orange-950/30 px-3 py-1.5 rounded-full border border-orange-200 dark:border-orange-900/50">
                                    <Text className="text-orange-700 dark:text-orange-400 text-xs font-bold">TravellersDeal Original</Text>
                                </View>
                            )}
                            {experience.certified && (
                                <View className="flex-row items-center bg-blue-100 dark:bg-blue-950/30 px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-900/50">
                                    <Ionicons name="shield-checkmark" size={14} color="#1d4ed8" className="mr-1" />
                                    <Text className="text-blue-700 dark:text-blue-400 text-xs font-bold">Certified Provider</Text>
                                </View>
                            )}
                        </View>

                        <View className="h-[1px] bg-gray-100 dark:bg-gray-800 my-6" />

                        {/* DESCRIPTION */}
                        <View>
                            <Text className="text-gray-900 dark:text-white font-extrabold text-xl mb-3">About this experience</Text>
                            <Text className="text-gray-600 dark:text-gray-300 leading-7 text-base">
                                {experience.description || "No description available."}
                            </Text>
                        </View>

                        {/* HIGHLIGHTS */}
                        {experience.highlights && experience.highlights.length > 0 && (
                            <View className="mt-8">
                                <Text className="text-gray-900 dark:text-white font-extrabold text-xl mb-4">Highlights</Text>
                                {experience.highlights.map((item, i) => (
                                    <View key={i} className="flex-row items-start mb-3">
                                        <Ionicons name="checkmark-circle-outline" size={20} color="#002b5c" style={{ marginTop: 2 }} />
                                        <Text className="text-gray-600 dark:text-gray-300 ml-3 flex-1 leading-6">{item}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* QUICK INFO GRID */}
                        <View className="bg-gray-50 dark:bg-[#1c1c1e] rounded-2xl p-4 mt-8 grid grid-cols-2 gap-4">
                            <View className="flex-row items-center mb-4">
                                <View className="w-10 h-10 bg-white dark:bg-black rounded-full items-center justify-center shadow-sm mr-3">
                                    <Ionicons name="time-outline" size={20} color="#002b5c" />
                                </View>
                                <View>
                                    <Text className="text-gray-500 dark:text-gray-400 text-xs font-bold">Duration</Text>
                                    <Text className="text-gray-900 dark:text-white font-bold">{experience.duration || 'Flexible'}</Text>
                                </View>
                            </View>
                            <View className="flex-row items-center mb-4">
                                <View className="w-10 h-10 bg-white dark:bg-black rounded-full items-center justify-center shadow-sm mr-3">
                                    <Ionicons name="language-outline" size={20} color="#002b5c" />
                                </View>
                                <View>
                                    <Text className="text-gray-500 dark:text-gray-400 text-xs font-bold">Languages</Text>
                                    <Text className="text-gray-900 dark:text-white font-bold" numberOfLines={1}>
                                        {experience.languages?.join(', ') || 'English'}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* DATE SELECTION */}
                        <View className="mt-8">
                            <Text className="text-gray-900 dark:text-white font-extrabold text-xl mb-4">Select date</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                                {dates.map((d) => (
                                    <TouchableOpacity
                                        key={d.id}
                                        onPress={() => setSelectedDate(d.fullDate)}
                                        className={`w-16 h-20 rounded-2xl items-center justify-center border-2 ${selectedDate === d.fullDate
                                            ? 'bg-[#002b5c] border-[#002b5c] dark:bg-[#58a6ff] dark:border-[#58a6ff]'
                                            : 'bg-white dark:bg-[#1c1c1e] border-gray-100 dark:border-gray-800'
                                            }`}
                                    >
                                        <Text className={`text-[10px] font-bold uppercase ${selectedDate === d.fullDate ? 'text-blue-100 dark:text-white' : 'text-gray-400'}`}>
                                            {d.dayName}
                                        </Text>
                                        <Text className={`text-lg font-extrabold my-0.5 ${selectedDate === d.fullDate ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                            {d.dayNumber}
                                        </Text>
                                        <Text className={`text-[10px] font-bold ${selectedDate === d.fullDate ? 'text-blue-100 dark:text-white' : 'text-gray-500'}`}>
                                            {d.month}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* TIME SLOT SELECTION */}
                        {experience.timeSlots && experience.timeSlots.length > 0 && selectedDate && (
                            <View className="mt-6">
                                <Text className="text-gray-900 dark:text-white font-extrabold text-xl mb-4">Select time</Text>
                                <View className="flex-row flex-wrap gap-3">
                                    {experience.timeSlots.map((time, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            onPress={() => setSelectedTime(time)}
                                            className={`px-4 py-3 rounded-xl border-2 ${selectedTime === time
                                                ? 'bg-[#002b5c] border-[#002b5c] dark:bg-[#58a6ff] dark:border-[#58a6ff]'
                                                : 'bg-white dark:bg-[#1c1c1e] border-gray-100 dark:border-gray-800'
                                                }`}
                                        >
                                            <Text className={`font-bold ${selectedTime === time ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                                {time}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* INCLUDES */}
                        {experience.includes && experience.includes.length > 0 && (
                            <View className="mt-8">
                                <Text className="text-gray-900 dark:text-white font-extrabold text-xl mb-4">What's included</Text>
                                {experience.includes.map((item, i) => (
                                    <View key={i} className="flex-row items-center mb-2">
                                        <Ionicons name="checkmark" size={18} color="#22c55e" />
                                        <Text className="text-gray-600 dark:text-gray-300 ml-3">{item}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* LOGISTICS */}
                        <View className="mt-8 mb-4">
                            <Text className="text-gray-900 dark:text-white font-extrabold text-xl mb-4">Logistics</Text>
                            {experience.meetingPoint && (
                                <View className="flex-row items-start mb-4">
                                    <Ionicons name="map-outline" size={24} color="#6b7280" />
                                    <View className="ml-3 flex-1">
                                        <Text className="text-gray-900 dark:text-white font-bold">Meeting Point</Text>
                                        <Text className="text-gray-600 dark:text-gray-400 mt-1">{experience.meetingPoint}</Text>
                                    </View>
                                </View>
                            )}
                            {experience.whatToBring && experience.whatToBring.length > 0 && (
                                <View className="flex-row items-start">
                                    <Ionicons name="briefcase-outline" size={24} color="#6b7280" />
                                    <View className="ml-3 flex-1">
                                        <Text className="text-gray-900 dark:text-white font-bold">What to bring</Text>
                                        <Text className="text-gray-600 dark:text-gray-400 mt-1">
                                            {experience.whatToBring.join(', ')}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        <View className="h-24" />
                    </View>
                </ScrollView>

                {/* BOTTOM BAR */}
                <View
                    style={{ paddingBottom: (insets?.bottom ?? 0) + 16 }}
                    className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#1c1c1e] border-t border-gray-100 dark:border-gray-800 px-6 pt-4 flex-row items-center justify-between"
                >
                    <View>
                        <Text className="text-gray-500 dark:text-gray-400 text-xs">Total from</Text>
                        <Text className="text-gray-900 dark:text-white font-extrabold text-2xl">{formatPrice(experience.price, experience.currency)}</Text>
                    </View>
                    <TouchableOpacity
                        onPress={handleBooking}
                        className={`px-8 py-4 rounded-full shadow-lg ${selectedDate && (!experience.timeSlots?.length || selectedTime)
                            ? 'bg-[#002b5c] dark:bg-[#58a6ff]'
                            : 'bg-gray-300 dark:bg-gray-800'
                            }`}
                        disabled={!selectedDate || (!!experience.timeSlots?.length && !selectedTime)}
                    >
                        <Text className={`font-bold text-lg ${selectedDate && (!experience.timeSlots?.length || selectedTime) ? 'text-white' : 'text-gray-500'}`}>
                            {selectedDate && (!experience.timeSlots?.length || selectedTime) ? 'Book Now' : 'Select details'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {experience && (
                    <BookingFlow
                        visible={isBookingFlowVisible}
                        onClose={() => setIsBookingFlowVisible(false)}
                        experience={{ ...experience, id: experienceId, image: experience.image || (experience.images ? experience.images[0] : '') }}
                        selectedDate={selectedDate!}
                        selectedTime={selectedTime!}
                    />
                )}
            </View>
        </Modal>
    );
}
