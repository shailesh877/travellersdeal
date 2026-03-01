import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import { Dimensions, Image, Modal, ScrollView, Text, TouchableOpacity, View, Alert, Platform, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker } from "react-native-maps";
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
    location?: {
        city: string;
        country: string;
        coordinates?: {
            lat: number;
            lng: number;
        }
    };
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
    const [adultCount, setAdultCount] = useState(1);
    const [isBookingFlowVisible, setIsBookingFlowVisible] = useState(false);
    const [isDateModalVisible, setIsDateModalVisible] = useState(false);
    const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);

    // Pick the first available language as default
    const [selectedLanguage, setSelectedLanguage] = useState<string | null>(experience?.languages?.[0] || 'English');

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

    const [addingToCart, setAddingToCart] = useState(false);

    const addToCart = async () => {
        if (!selectedDate) {
            Alert.alert("Select Date", "Please select a date before adding to cart.");
            return;
        }
        if (experience?.timeSlots && experience.timeSlots.length > 0 && !selectedTime) {
            Alert.alert("Select Time", "Please select a time slot before adding to cart.");
            return;
        }

        setAddingToCart(true);
        try {
            const userInfo = await AsyncStorage.getItem('userInfo');
            if (!userInfo) {
                Alert.alert("Login Required", "Please login to add items to cart.");
                return;
            }
            const { token } = JSON.parse(userInfo);

            const response = await fetch(`${API_URL}/cart`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    experienceId: experienceId,
                    quantity: adultCount,
                    date: selectedDate,
                    timeSlot: selectedTime || ''
                })
            });

            const data = await response.json();
            if (response.ok) {
                Alert.alert(
                    '✅ Added to Cart',
                    `${experience?.title} has been added to your cart.`,
                    [{ text: 'OK' }]
                );
            } else {
                Alert.alert('Error', data.message || 'Failed to add to cart. Please try again.');
            }
        } catch (error) {
            console.error('Add to cart error:', error);
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setAddingToCart(false);
        }
    };

    if (!experience) return null;

    // Normalize images: use array if present, else single image wrapped in array
    const displayImages = experience.images && experience.images.length > 0
        ? experience.images
        : experience.image ? [experience.image] : ['https://via.placeholder.com/400x300'];

    // Generate next 90 days
    const dates = Array.from({ length: 90 }, (_, i) => {
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
                    <View className="px-5 pt-6 pb-2">
                        {/* ORIGINALS BADGE */}
                        {experience.isOriginal ? (
                            <Text className="text-red-600 dark:text-red-500 font-extrabold tracking-wider text-[10px] uppercase mb-2">
                                ORIGINALS BY TRAVELLERS DEAL
                            </Text>
                        ) : (
                            <Text className="text-gray-500 dark:text-gray-400 font-bold tracking-widest uppercase text-[10px] mb-2">
                                {experience.category}
                            </Text>
                        )}

                        {/* TITLE */}
                        <Text className="text-gray-900 dark:text-white font-extrabold text-[28px] leading-tight flex-wrap">
                            {experience.title}
                        </Text>

                        {/* RATING & PROVIDER HEADER BROW */}
                        <View className="flex-row items-center flex-wrap mt-3 gap-y-2">
                            <View className="bg-[#002b5c] dark:bg-[#58a6ff] px-2 py-0.5 rounded mr-2">
                                <Text className="text-white dark:text-black font-extrabold text-[10px] uppercase">Top rated</Text>
                            </View>

                            <View className="flex-row items-center mr-2">
                                {[1, 2, 3, 4, 5].map((_, i) => (
                                    <Ionicons key={i} name="star" size={12} color="#fbbf24" />
                                ))}
                                <Text className="text-gray-900 dark:text-white font-extrabold text-xs ml-1">{experience.rating || '0.0'}</Text>
                            </View>

                            <TouchableOpacity>
                                <Text className="text-gray-600 dark:text-gray-400 text-xs tracking-tight underline ">{experience.reviews || '0'} reviews</Text>
                            </TouchableOpacity>

                            <Text className="text-gray-400 dark:text-gray-600 text-xs mx-1.5">•</Text>

                            <Text className="text-gray-600 dark:text-gray-400 text-xs">Activity provider:</Text>
                            <Text className="text-gray-900 dark:text-white font-bold text-xs ml-1">{experience.certified ? 'Travellers Deal Verified' : 'Standard'}</Text>
                        </View>
                    </View>

                    <View className="h-[1px] bg-gray-200 dark:bg-gray-800 my-6" />

                    <View className="px-5">
                        {/* ABOUT THIS ACTIVITY */}
                        <Text className="text-gray-900 dark:text-white font-extrabold text-[22px] mb-5">About this activity</Text>

                        <View className="flex-row items-start mb-4">
                            <Ionicons name="calendar-outline" size={24} color="#1a2b49" className="dark:text-white mr-4" style={{ color: undefined }} />
                            <View className="flex-1">
                                <Text className="text-gray-900 dark:text-white font-bold text-base">Free cancellation</Text>
                                <Text className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">Cancel up to 24 hours in advance for a full refund</Text>
                            </View>
                        </View>

                        <View className="flex-row items-start mb-4">
                            <Ionicons name="card-outline" size={24} color="#1a2b49" className="dark:text-white mr-4" style={{ color: undefined }} />
                            <View className="flex-1">
                                <Text className="text-gray-900 dark:text-white font-bold text-base">Reserve now & pay later</Text>
                                <Text className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">Keep your travel plans flexible — book your spot and pay nothing today.</Text>
                            </View>
                        </View>

                        <View className="flex-row items-start mb-4">
                            <Ionicons name="time-outline" size={24} color="#1a2b49" className="dark:text-white mr-4" style={{ color: undefined }} />
                            <View className="flex-1">
                                <Text className="text-gray-900 dark:text-white font-bold text-base">Duration {experience.duration || 'Flexible'}</Text>
                                <Text className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">Check availability to see starting times.</Text>
                            </View>
                        </View>

                        <View className="flex-row items-start mb-4">
                            <Ionicons name="person-outline" size={24} color="#1a2b49" className="dark:text-white mr-4" style={{ color: undefined }} />
                            <View className="flex-1">
                                <Text className="text-gray-900 dark:text-white font-bold text-base">Live tour guide</Text>
                                <Text className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">{experience.languages?.join(', ') || 'English'}</Text>
                            </View>
                        </View>

                        {/* PRIVATE GROUP MOCK */}
                        <View className="flex-row items-start mb-4">
                            <Ionicons name="people-outline" size={24} color="#1a2b49" className="dark:text-white mr-4" style={{ color: undefined }} />
                            <View className="flex-1">
                                <Text className="text-gray-900 dark:text-white font-bold text-base">Private group available</Text>
                                <Text className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">This experience can be booked for a private group.</Text>
                            </View>
                        </View>

                        <View className="h-[1px] bg-gray-200 dark:bg-gray-800 my-6" />

                        {/* EXPERIENCE */}
                        <Text className="text-gray-900 dark:text-white font-extrabold text-[22px] mb-6">Experience</Text>

                        {/* HIGHLIGHTS */}
                        {experience.highlights && experience.highlights.length > 0 && (
                            <View className="mb-6">
                                <Text className="text-gray-900 dark:text-white font-bold text-lg mb-3">Highlights</Text>
                                {experience.highlights.map((item, i) => (
                                    <View key={i} className="flex-row items-start mb-2 pl-1">
                                        <View className="w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-gray-400 mt-2.5 mr-3" />
                                        <Text className="text-gray-700 dark:text-gray-300 flex-1 leading-6">{item}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* FULL DESCRIPTION */}
                        <View className="mb-6">
                            <Text className="text-gray-900 dark:text-white font-bold text-lg mb-3">Full description</Text>
                            <Text className="text-gray-700 dark:text-gray-300 leading-6">
                                {experience.description || "No description available."}
                            </Text>
                        </View>

                        {/* INCLUDES */}
                        {experience.includes && experience.includes.length > 0 && (
                            <View className="mb-6">
                                <Text className="text-gray-900 dark:text-white font-bold text-lg mb-4">Includes</Text>
                                <View className="flex-row flex-wrap">
                                    {experience.includes.map((item, i) => (
                                        <View key={i} className="w-[50%] flex-row items-start mb-3 pr-2">
                                            <Ionicons name="checkmark" size={20} color="#10b981" className="mr-2" />
                                            <Text className="text-gray-700 dark:text-gray-300 flex-1 text-sm">{item}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        <View className="h-[1px] bg-gray-200 dark:bg-gray-800 my-6" />

                        {/* MEETING POINT */}
                        <Text className="text-gray-900 dark:text-white font-extrabold text-[22px] mb-6">Meeting point</Text>
                        {experience.meetingPoint && (
                            <View className="flex-row items-start mb-4">
                                <View className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg items-center justify-center mr-4">
                                    <Ionicons name="location" size={20} color="#6b7280" />
                                </View>
                                <View className="flex-1 justify-center">
                                    <Text className="text-gray-900 dark:text-white font-medium text-base leading-tight mb-1">{experience.meetingPoint}</Text>
                                    <TouchableOpacity>
                                        <Text className="text-blue-600 dark:text-blue-400 text-sm font-medium underline">Open in Google Maps ↗</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        <View className="h-[1px] bg-gray-200 dark:bg-gray-800 my-6" />

                        {/* ITINERARY W/ MAP PLACEHOLDER */}
                        {experience.itinerary && experience.itinerary.length > 0 && (
                            <View className="mb-6">
                                <Text className="text-gray-900 dark:text-white font-extrabold text-[22px] mb-6">Itinerary</Text>

                                <View className="flex-col md:flex-row gap-6">
                                    {/* Timeline Column */}
                                    <View className="flex-1">
                                        {experience.itinerary.map((item, i) => (
                                            <View key={i} className="flex-row relative">
                                                {/* Timeline line */}
                                                {i !== experience.itinerary!.length - 1 && (
                                                    <View className="absolute left-[7px] top-6 bottom-[-16px] w-[2px] bg-red-600" />
                                                )}
                                                {/* Timeline dot */}
                                                <View className="w-4 h-4 rounded-full border-[3px] border-[#002b5c] dark:bg-white bg-[#002b5c] dark:border-[#58a6ff] mt-1 mr-4 z-10" />

                                                <View className="flex-1 pb-6">
                                                    <Text className="text-gray-900 dark:text-white font-bold text-base">{item.title}</Text>
                                                    <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">{item.description}</Text>
                                                </View>
                                            </View>
                                        ))}
                                        <View className="flex-row items-center mt-2">
                                            <Ionicons name="information-circle-outline" size={14} color="#6b7280" />
                                            <Text className="text-gray-500 dark:text-gray-400 text-xs ml-1">
                                                For reference only. Itineraries are subject to change.
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Map Column */}
                                    <View className="w-full h-80 md:w-1/2 md:h-auto mt-4 md:mt-0 relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
                                        {(experience.location?.coordinates?.lat && experience.location?.coordinates?.lng) ? (
                                            <MapView
                                                style={{ width: '100%', height: '100%' }}
                                                initialRegion={{
                                                    latitude: experience.location.coordinates.lat,
                                                    longitude: experience.location.coordinates.lng,
                                                    latitudeDelta: 0.0922,
                                                    longitudeDelta: 0.0421,
                                                }}
                                                onPress={() => {
                                                    const query = `${experience.location!.coordinates!.lat},${experience.location!.coordinates!.lng}`;
                                                    Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(query)}`);
                                                }}
                                            >
                                                <Marker
                                                    coordinate={{
                                                        latitude: experience.location.coordinates.lat,
                                                        longitude: experience.location.coordinates.lng
                                                    }}
                                                    title={experience.title}
                                                    description={experience.meetingPoint}
                                                />
                                            </MapView>
                                        ) : (
                                            <TouchableOpacity
                                                activeOpacity={0.8}
                                                className="w-full h-full"
                                                onPress={() => {
                                                    const query = experience.location?.coordinates
                                                        ? `${experience.location.coordinates.lat},${experience.location.coordinates.lng}`
                                                        : experience.meetingPoint;
                                                    if (query) {
                                                        Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(query)}`);
                                                    }
                                                }}
                                            >
                                                {/* Beautiful CSS-based Map Placeholder instead of unreliable image link fallback */}
                                                <View style={{ width: '100%', height: '100%', backgroundColor: '#f3f4f6', opacity: 0.8 }} className="dark:bg-gray-800">
                                                    {/* Grid lines to look like a map */}
                                                    <View className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                                                </View>

                                                {/* Centered Map Marker */}
                                                <View className="absolute top-1/2 left-1/2 -ml-4 -mt-8 items-center justify-center drop-shadow-lg">
                                                    <Ionicons name="location" size={40} color="#002b5c" />
                                                    <View className="w-2 h-2 bg-black/20 rounded-full mt-1 blur-sm" />
                                                </View>
                                            </TouchableOpacity>
                                        )}

                                        {/* Open in Map label */}
                                        <TouchableOpacity
                                            activeOpacity={0.9}
                                            onPress={() => {
                                                const query = experience.location?.coordinates
                                                    ? `${experience.location.coordinates.lat},${experience.location.coordinates.lng}`
                                                    : experience.meetingPoint;
                                                if (query) {
                                                    Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(query)}`);
                                                }
                                            }}
                                            className="absolute bottom-3 right-3 bg-white/90 dark:bg-black/80 px-3 py-1.5 rounded-full flex-row items-center shadow-sm"
                                        >
                                            <Ionicons name="map-outline" size={14} color="#002b5c" className="dark:text-[#58a6ff] mr-1.5" style={{ color: undefined }} />
                                            <Text className="text-gray-900 dark:text-white text-xs font-bold">Open Map</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        )}

                        <View className="h-[1px] bg-gray-200 dark:bg-gray-800 my-6" />

                        <View className="h-[1px] bg-gray-200 dark:bg-gray-800 my-8" />

                        {/* DESKTOP-STYLE BOOKING WIDGET ON MOBILE */}
                        <View className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm mb-8 mt-2">
                            {/* Price Header */}
                            <Text className="text-gray-500 dark:text-gray-400 font-medium text-sm line-through decoration-gray-400">
                                From {formatPrice((parseFloat(experience.price) * 1.2).toString(), experience.currency)}
                            </Text>
                            <View className="flex-row items-end mb-6">
                                <Text className="text-red-600 dark:text-red-500 font-extrabold text-[32px] leading-none">
                                    {formatPrice(experience.price, experience.currency)}
                                </Text>
                                <Text className="text-gray-700 dark:text-gray-300 font-bold ml-2 mb-1">per person</Text>
                            </View>

                            {/* Participants */}
                            <View className="flex-row items-center justify-between border border-gray-300 dark:border-gray-700 rounded-full px-4 py-3 mb-4">
                                <View className="flex-row items-center">
                                    <Ionicons name="people" size={20} color="#4b5563" className="dark:text-gray-400 mr-3" />
                                    <Text className="text-gray-900 dark:text-white font-medium text-base">Adult x {adultCount}</Text>
                                </View>
                                <View className="flex-row items-center">
                                    <TouchableOpacity
                                        onPress={() => setAdultCount(Math.max(1, adultCount - 1))}
                                        className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center mr-2"
                                    >
                                        <Text className={`${adultCount > 1 ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'} font-bold text-lg leading-none`}>-</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => setAdultCount(adultCount + 1)}
                                        className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center"
                                    >
                                        <Text className="text-gray-900 dark:text-white font-bold text-lg leading-none">+</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Date Placeholder */}
                            <TouchableOpacity
                                onPress={() => setIsDateModalVisible(true)}
                                className="flex-row items-center justify-between border border-gray-300 dark:border-gray-700 rounded-full px-4 py-3.5 mb-6"
                            >
                                <View className="flex-row items-center">
                                    <Ionicons name="calendar" size={20} color="#4b5563" className="dark:text-gray-400 mr-3" />
                                    <Text className="text-gray-600 dark:text-gray-400 font-medium text-base">
                                        {selectedDate ? selectedDate : "Select a date"}
                                    </Text>
                                </View>
                                <Ionicons name="calendar-outline" size={20} color="#111827" className="dark:text-gray-300" />
                            </TouchableOpacity>

                            {/* Starting Time Options Mockup */}
                            <View className="mb-6">
                                <View className="flex-row items-center mb-3">
                                    <Ionicons name="time" size={18} color="#9ca3af" className="mr-2" />
                                    <Text className="text-gray-700 dark:text-gray-300 font-bold text-base">Starting time</Text>
                                </View>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {(experience.timeSlots && experience.timeSlots.length > 0 ? experience.timeSlots : []).length > 0 ? (
                                        experience.timeSlots!.map((time, idx) => (
                                            <TouchableOpacity
                                                key={idx}
                                                onPress={() => setSelectedTime(time)}
                                                className={`px-6 py-2.5 rounded-xl border mr-3 ${selectedTime === time ? 'border-[#002b5c] dark:border-[#58a6ff] bg-[#002b5c]/5 dark:bg-[#58a6ff]/10' : 'border-gray-300 dark:border-gray-700'}`}
                                            >
                                                <Text className={`font-medium ${selectedTime === time ? 'text-[#002b5c] dark:text-[#58a6ff]' : 'text-gray-900 dark:text-white'}`}>{time}</Text>
                                            </TouchableOpacity>
                                        ))
                                    ) : (
                                        <Text className="text-gray-500 dark:text-gray-400 py-2">No time slots required for this activity.</Text>
                                    )}
                                </ScrollView>
                            </View>

                            {/* Language Dropdown */}
                            <TouchableOpacity
                                onPress={() => setIsLanguageModalVisible(true)}
                                className="flex-row items-center justify-between border border-gray-300 dark:border-gray-700 rounded-full px-4 py-3 mb-8"
                            >
                                <View className="flex-row items-center">
                                    <Ionicons name="globe-outline" size={20} color="#4b5563" className="dark:text-gray-400 mr-3" />
                                    <Text className="text-gray-900 dark:text-white font-medium text-base">
                                        {selectedLanguage}
                                    </Text>
                                </View>
                                <Ionicons name="caret-down" size={16} color="#9ca3af" />
                            </TouchableOpacity>

                            {/* Action Buttons */}
                            <TouchableOpacity
                                onPress={() => {
                                    if (!selectedDate || (experience.timeSlots?.length && !selectedTime)) {
                                        Alert.alert("Missing Details", "Please select a date and time before checking availability.");
                                    } else {
                                        handleBooking();
                                    }
                                }}
                                className={`w-full py-4 rounded-full items-center mb-3 ${selectedDate && (!experience.timeSlots?.length || selectedTime) ? 'bg-[#002b5c] dark:bg-[#58a6ff]' : 'bg-[#f3f4f6] dark:bg-gray-800'}`}
                            >
                                <Text className={`font-extrabold text-lg ${selectedDate && (!experience.timeSlots?.length || selectedTime) ? 'text-white' : 'text-gray-400 dark:text-gray-500'}`}>Check availability</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={addToCart}
                                disabled={!selectedDate || (!!experience.timeSlots?.length && !selectedTime) || addingToCart}
                                className={`w-full bg-white dark:bg-[#1c1c1e] border-2 py-4 rounded-full items-center mb-6 ${selectedDate && (!experience.timeSlots?.length || selectedTime) ? 'border-[#002b5c] dark:border-[#58a6ff]' : 'border-gray-200 dark:border-gray-800'}`}
                            >
                                <View className="flex-row items-center">
                                    <Ionicons name="cart" size={20} color={selectedDate && (!experience.timeSlots?.length || selectedTime) ? '#002b5c' : '#9ca3af'} className="mr-2" />
                                    <Text className={`font-extrabold text-lg ${selectedDate && (!experience.timeSlots?.length || selectedTime) ? 'text-[#002b5c] dark:text-[#58a6ff]' : 'text-gray-400 dark:text-gray-500'}`}>
                                        {addingToCart ? 'Adding...' : 'Add to Cart'}
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            {/* Badges under Booking Actions */}
                            <View className="flex-row items-start mb-4 px-2">
                                <Ionicons name="checkmark-circle-outline" size={22} color="#10b981" className="mr-3" />
                                <View className="flex-1">
                                    <Text className="text-gray-900 dark:text-white font-extrabold text-base mb-1">Free cancellation</Text>
                                    <Text className="text-gray-500 dark:text-gray-400 text-sm">Cancel up to 24 hours in advance for a full refund</Text>
                                </View>
                            </View>
                        </View>

                        <View className="h-24" />
                    </View>
                </ScrollView>

                {/* MODALS */}

                {/* Date Selection Modal */}
                <Modal visible={isDateModalVisible} transparent={true} animationType="fade">
                    <TouchableOpacity
                        className="flex-1 bg-black/50 justify-end"
                        activeOpacity={1}
                        onPress={() => setIsDateModalVisible(false)}
                    >
                        <View className="bg-white dark:bg-[#1c1c1e] rounded-t-3xl pt-6 pb-10 px-6 max-h-[80%]">
                            <Text className="text-gray-900 dark:text-white font-extrabold text-[22px] mb-6">Select a date</Text>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {/* Group dates into rows of 3 — flex-wrap doesn't work inside ScrollView in React Native */}
                                {Array.from({ length: Math.ceil(dates.length / 3) }, (_, rowIndex) => (
                                    <View key={rowIndex} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                                        {dates.slice(rowIndex * 3, rowIndex * 3 + 3).map((d) => (
                                            <TouchableOpacity
                                                key={d.id}
                                                onPress={() => {
                                                    setSelectedDate(d.fullDate);
                                                    setIsDateModalVisible(false);
                                                }}
                                                style={{ width: '31%', aspectRatio: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: selectedDate === d.fullDate ? '#002b5c' : '#f3f4f6', backgroundColor: selectedDate === d.fullDate ? '#002b5c' : '#fff' }}
                                            >
                                                <Text style={{ fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', color: selectedDate === d.fullDate ? '#bfdbfe' : '#9ca3af' }}>
                                                    {d.dayName}
                                                </Text>
                                                <Text style={{ fontSize: 22, fontWeight: '900', marginVertical: 2, color: selectedDate === d.fullDate ? '#ffffff' : '#111827' }}>
                                                    {d.dayNumber}
                                                </Text>
                                                <Text style={{ fontSize: 11, fontWeight: 'bold', color: selectedDate === d.fullDate ? '#bfdbfe' : '#6b7280' }}>
                                                    {d.month}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                ))}
                            </ScrollView>
                        </View>
                    </TouchableOpacity>
                </Modal>

                {/* Language Selection Modal */}
                <Modal visible={isLanguageModalVisible} transparent={true} animationType="fade">
                    <TouchableOpacity
                        className="flex-1 bg-black/50 justify-end"
                        activeOpacity={1}
                        onPress={() => setIsLanguageModalVisible(false)}
                    >
                        <View className="bg-white dark:bg-[#1c1c1e] rounded-t-3xl pt-6 pb-10 px-6">
                            <Text className="text-gray-900 dark:text-white font-extrabold text-[22px] mb-6">Select language</Text>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {experience.languages && experience.languages.length > 0 ? (
                                    experience.languages.map((lang, idx) => (
                                        <TouchableOpacity
                                            key={idx}
                                            onPress={() => {
                                                setSelectedLanguage(lang);
                                                setIsLanguageModalVisible(false);
                                            }}
                                            className="py-4 border-b border-gray-100 dark:border-gray-800 flex-row justify-between items-center"
                                        >
                                            <Text className={`text-lg font-medium ${selectedLanguage === lang ? 'text-[#002b5c] dark:text-[#58a6ff] font-bold' : 'text-gray-700 dark:text-gray-300'}`}>
                                                {lang}
                                            </Text>
                                            {selectedLanguage === lang && (
                                                <Ionicons name="checkmark" size={24} color={Platform.OS === 'ios' ? '#007aff' : '#002b5c'} className="dark:text-[#58a6ff]" />
                                            )}
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    // Default fallback
                                    <TouchableOpacity
                                        onPress={() => {
                                            setSelectedLanguage('English');
                                            setIsLanguageModalVisible(false);
                                        }}
                                        className="py-4 border-b border-gray-100 dark:border-gray-800 flex-row justify-between items-center"
                                    >
                                        <Text className={`text-lg font-medium ${selectedLanguage === 'English' ? 'text-[#002b5c] dark:text-[#58a6ff] font-bold' : 'text-gray-700 dark:text-gray-300'}`}>
                                            English
                                        </Text>
                                        {selectedLanguage === 'English' && (
                                            <Ionicons name="checkmark" size={24} color="#002b5c" className="dark:text-[#58a6ff]" />
                                        )}
                                    </TouchableOpacity>
                                )}
                            </ScrollView>
                        </View>
                    </TouchableOpacity>
                </Modal>

                {
                    experience && (
                        <BookingFlow
                            visible={isBookingFlowVisible}
                            onClose={() => setIsBookingFlowVisible(false)}
                            experience={{ ...experience, id: experienceId, image: experience.image || (experience.images ? experience.images[0] : '') }}
                            selectedDate={selectedDate!}
                            selectedTime={selectedTime!}
                            adultCount={adultCount}
                        />
                    )
                }
            </View >
        </Modal >
    );
}
