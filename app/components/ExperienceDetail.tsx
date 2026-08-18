import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect, useRef } from "react";
import { Dimensions, Image, Modal, ScrollView, Text, TouchableOpacity, View, Alert, Platform, Linking, ActivityIndicator, Share } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BookingFlow from "./BookingFlow";
import { API_URL } from "../constants/Config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { formatPrice, getDisplayPrice, getChildPrice, getAdultPrice } from "../utils/currency";
import { getImageUrlFromString } from "../utils/image";

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
    averageRating?: number;
    reviews?: string;
    numReviews?: number;
    reviewsCount?: number;
    features: string;
    isOriginal?: boolean;
    certified?: boolean;
    description?: string;
    shortDescription?: string;
    highlights?: string[];
    itinerary?: { title: string; description: string }[];
    includes?: string[];
    excludes?: string[];
    whatToBring?: string[];
    meetingPoint?: string;
    duration?: string;
    languages?: string[];
    timeSlots?: string[];
    guideType?: string;
    isTransportationUsed?: boolean;
    transports?: string[];
    isDifferentCityTravel?: boolean;
    privateGroup?: boolean;
    isFoodIncluded?: boolean;
    meals?: { type: string; format: string }[];
    dietaryOptions?: string[];
    notSuitableFor?: string[];
    knowBeforeYouGo?: string[];
    extraInformation?: {
        notAllowed?: string[];
        whatToBring?: string[];
        knowBeforeYouGo?: string[];
        petFriendly?: boolean;
    };
    cancellationPolicy?: string;
    bookingOptions?: any[];
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
    const scrollViewRef = useRef<ScrollView>(null);
    const [bookingWidgetY, setBookingWidgetY] = useState(0);
    const [buttonY, setButtonY] = useState(0);
    const [isStickyVisible, setIsStickyVisible] = useState(true);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [adultCount, setAdultCount] = useState(1);
    const [childCount, setChildCount] = useState(0);
    const [tierCounts, setTierCounts] = useState<{ [key: number]: number }>({ 0: 1, 1: 0, 2: 0, 3: 0, 4: 0 });
    const [isBookingFlowVisible, setIsBookingFlowVisible] = useState(false);
    const [isDateModalVisible, setIsDateModalVisible] = useState(false);
    const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [reviews, setReviews] = useState<any[]>([]);
    
    // Add state for full experience fetch
    const [fullExperience, setFullExperience] = useState<any>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [activeSection, setActiveSection] = useState<string | null>(null);

    // Pick the first available language as default
    const [selectedLanguage, setSelectedLanguage] = useState<string | null>(experience?.languages?.[0] || 'English');

    // Normalize ID
    const experienceId = experience ? (experience.id || experience._id || '') : '';

    useEffect(() => {
        if (visible) {
            console.log("ExperienceDetail modal visible. Experience ID:", experienceId);
            setAdultCount(1);
            setChildCount(0);
            setTierCounts({ 0: 1, 1: 0, 2: 0, 3: 0, 4: 0 });
            checkWishlistStatus();

            // Fetch full experience details
            if (experienceId) {
                setLoadingDetails(true);
                fetch(`${API_URL}/experiences/${experienceId}`)
                    .then(res => res.json())
                    .then(data => {
                        setFullExperience(data);
                        if (data?.languages?.length > 0) {
                            setSelectedLanguage(data.languages[0]);
                        }
                        setLoadingDetails(false);
                    })
                    .catch(err => {
                        console.error("Error fetching full experience:", err);
                        setLoadingDetails(false);
                    });
            }

            // Fetch reviews
            if (experienceId) {
                fetch(`${API_URL}/reviews/${experienceId}`)
                    .then(res => res.json())
                    .then(data => {
                        if (Array.isArray(data)) setReviews(data);
                    })
                    .catch(err => console.error("Error fetching reviews:", err));
            }
        } else {
            setFullExperience(null);
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

    const handleShare = async () => {
        if (!displayExp) return;
        try {
            const url = `https://travellersdeal.com/experience/${experienceId}`;
            await Share.share({
                message: `Check out this experience on Travellers Deal: ${displayExp.title}\n\n${url}`,
                url: url,
                title: displayExp.title
            });
        } catch (error: any) {
            console.error("Error sharing:", error.message);
        }
    };

    const handleBooking = () => {
        if (!selectedDate) {
            Alert.alert("Select Date", "Please select a date to proceed.");
            return;
        }
        if (displayExp?.timeSlots && displayExp.timeSlots.length > 0 && !selectedTime) {
            Alert.alert("Select Time", "Please select a time slot to proceed.");
            return;
        }

        let totalQty = 0;
        const tiers = getDynamicTiers();
        tiers.forEach((tier: any, index: number) => {
            const isAdultTier = tier.title.toLowerCase().includes('adult') || (index === 0 && !tiers.some((t: any) => t.title.toLowerCase().includes('adult')));
            const isChildTier = tier.title.toLowerCase().includes('child') || (index === 1 && !tiers.some((t: any) => t.title.toLowerCase().includes('child')));
            const qty = tierCounts[index] !== undefined ? tierCounts[index] : (isAdultTier ? adultCount : (isChildTier ? childCount : 0));
            totalQty += qty;
        });

        if (totalQty === 0) {
            Alert.alert("Select Participants", "Please select at least one participant to proceed.");
            return;
        }

        setIsBookingFlowVisible(true);
    };

    const [addingToCart, setAddingToCart] = useState(false);

    const getDynamicTiers = () => {
        let tiersToRender = [];
        if (displayExp?.bookingOptions?.length > 0) {
            const opt = displayExp.bookingOptions[0];
            if (opt?.availabilityAndPricing?.pricingTiers?.length > 0) {
                tiersToRender = opt.availabilityAndPricing.pricingTiers;
            } else {
                tiersToRender = [{ title: 'Adult', price: opt?.availabilityAndPricing?.price || getAdultPrice(displayExp) }];
            }
        } else {
            tiersToRender = [{ title: 'Adult (Age 13+)', price: getAdultPrice(displayExp) }];
            if (getChildPrice(displayExp) > 0) {
                tiersToRender.push({ title: 'Child', price: getChildPrice(displayExp) });
            }
        }
        return tiersToRender;
    };

    const addToCart = async () => {
        if (!selectedDate) {
            Alert.alert("Select Date", "Please select a date before adding to cart.");
            return;
        }
        if (displayExp?.timeSlots && displayExp.timeSlots.length > 0 && !selectedTime) {
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

            let totalAmount = 0;
            let totalQuantity = 0;
            const tiers = getDynamicTiers();
            tiers.forEach((tier: any, index: number) => {
                const isAdultTier = tier.title.toLowerCase().includes('adult') || (index === 0 && !tiers.some((t: any) => t.title.toLowerCase().includes('adult')));
                const isChildTier = tier.title.toLowerCase().includes('child') || (index === 1 && !tiers.some((t: any) => t.title.toLowerCase().includes('child')));
                const qty = tierCounts[index] !== undefined ? tierCounts[index] : (isAdultTier ? adultCount : (isChildTier ? childCount : 0));
                totalQuantity += qty;
                totalAmount += (tier.price * qty);
            });

            if (totalQuantity === 0) {
                setAddingToCart(false);
                Alert.alert("Select Participants", "Please select at least one participant before adding to cart.");
                return;
            }

            const avgPrice = totalQuantity > 0 ? totalAmount / totalQuantity : 0;

            const response = await fetch(`${API_URL}/cart`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    experienceId: experienceId,
                    quantity: totalQuantity,
                    date: selectedDate,
                    timeSlot: selectedTime || '',
                    priceAtAdd: avgPrice
                })
            });

            const data = await response.json();
            if (response.ok) {
                Alert.alert(
                    '✅ Added to Cart',
                    `${displayExp?.title} has been added to your cart.`,
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

    if (!experience && !fullExperience) return null;

    const displayExp = fullExperience || experience;

    const displayImages = displayExp.images && displayExp.images.length > 0
        ? displayExp.images
        : displayExp.image ? [displayExp.image] : ['https://via.placeholder.com/400x300'];

    // Generate next 90 days
    const dates = Array.from({ length: 90 }, (_: any, i: number) => {
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
                <ScrollView 
                    ref={scrollViewRef} 
                    showsVerticalScrollIndicator={false} 
                    className="flex-1"
                    scrollEventThrottle={16}
                    onScroll={(e) => {
                        const scrollY = e.nativeEvent.contentOffset.y;
                        const layoutHeight = e.nativeEvent.layoutMeasurement.height;
                        if (bookingWidgetY > 0) {
                            if (buttonY > 0) {
                                const absoluteButtonY = bookingWidgetY + 400 + buttonY;
                                const isVisible = scrollY + layoutHeight >= absoluteButtonY - 10 && scrollY <= absoluteButtonY + 70;
                                setIsStickyVisible(!isVisible);
                            } else {
                                const absoluteWidgetY = bookingWidgetY + 400;
                                const isVisible = scrollY + layoutHeight >= absoluteWidgetY - 10;
                                setIsStickyVisible(!isVisible);
                            }
                        }
                    }}
                >
                    {/* IMAGE CAROUSEL SECTION */}
                    <View className="relative h-[400px]">
                        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
                            {displayImages.map((img: any, index: number) => (
                                <Image
                                    key={index}
                                    source={{ uri: getImageUrlFromString(img) }}
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
                            <TouchableOpacity onPress={handleShare} className="w-10 h-10 bg-black/30 rounded-full items-center justify-center">
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
                                {displayImages.map((_: any, i: number) => (
                                    <View key={i} className="w-2 h-2 rounded-full bg-white/50" />
                                ))}
                            </View>
                        )}
                    </View>

                    {/* CONTENT SECTION */}
                    <View className="px-5 pt-6 pb-2">
                        {/* ORIGINALS BADGE */}
                        {displayExp.isOriginal ? (
                            <Text className="text-red-600 dark:text-red-500 font-extrabold tracking-wider text-[10px] uppercase mb-2">
                                ORIGINALS BY TRAVELLERS DEAL
                            </Text>
                        ) : (
                            <Text className="text-gray-500 dark:text-gray-400 font-bold tracking-widest uppercase text-[10px] mb-2">
                                {displayExp.category}
                            </Text>
                        )}

                        {/* TITLE */}
                        <View className="flex-row items-center gap-x-4 mb-4">
                                <View className="flex-row items-center">
                                    <Ionicons name="star" size={18} color="#F59E0B" />
                                    <Text className="text-gray-900 dark:text-white font-black text-sm ml-1.5">{displayExp.averageRating || displayExp.rating || 'New'}</Text>
                                    <Text className="text-gray-500 dark:text-gray-400 text-sm ml-1">({displayExp.numReviews || displayExp.reviewsCount || 0} reviews)</Text>
                                </View>

                                {(typeof displayExp.location === 'object' ? displayExp.location?.city : displayExp.location) && (
                                    <View className="flex-row items-center">
                                        <Ionicons name="location" size={16} color="#6b7280" />
                                        <Text className="text-gray-600 dark:text-gray-400 text-sm ml-1 font-medium">
                                            {typeof displayExp.location === 'object' ? displayExp.location?.city : displayExp.location}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        <Text className="text-gray-900 dark:text-white font-extrabold text-[28px] leading-tight flex-wrap">
                            {displayExp.title}
                        </Text>
                        {displayExp.certified && (
                                        <View className="flex-row items-center mt-1">
                                            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                                            <Text className="text-green-600 dark:text-green-400 text-xs font-bold ml-1 uppercase tracking-wider">Certified by Travellers Deal</Text>
                                        </View>
                                    )}
                        {displayExp.shortDescription && (
                            <Text className="text-gray-700 dark:text-gray-300 text-base leading-relaxed mt-4 font-medium">
                                {displayExp.shortDescription}
                            </Text>
                        )}
                    </View>

                    <View className="h-[1px] bg-gray-200 dark:bg-gray-800 my-6" />

                    <View className="px-5">
                        {loadingDetails ? (
                                <ActivityIndicator size="small" color="#002b5c" className="my-10" />
                            ) : (
                                <>
                                    {/* INFO STRIP */}
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8" contentContainerStyle={{ gap: 12 }}>
                                        {displayExp.duration && (
                                            <View className="bg-gray-100 dark:bg-gray-800/50 px-4 py-2.5 rounded-xl flex-row items-center">
                                                <Ionicons name="time-outline" size={18} color="#6b7280" />
                                                <Text className="text-gray-700 dark:text-gray-300 font-semibold ml-2 text-sm">{displayExp.duration}</Text>
                                            </View>
                                        )}

                                        {displayExp.languages && displayExp.languages.length > 0 && (
                                            <TouchableOpacity
                                                onPress={() => setIsLanguageModalVisible(true)}
                                                className="bg-gray-100 dark:bg-gray-800/50 px-4 py-2.5 rounded-xl flex-row items-center"
                                            >
                                                <Ionicons name="language-outline" size={18} color="#6b7280" />
                                                <Text className="text-gray-700 dark:text-gray-300 font-semibold ml-2 text-sm mr-1">
                                                    {selectedLanguage || displayExp.languages[0]}
                                                </Text>
                                                <Ionicons name="chevron-down" size={14} color="#9ca3af" />
                                            </TouchableOpacity>
                                        )}

                                        {displayExp.cancellationPolicy && (
                                            <View className="bg-gray-100 dark:bg-gray-800/50 px-4 py-2.5 rounded-xl flex-row items-center">
                                                <Ionicons name="shield-checkmark-outline" size={18} color="#6b7280" />
                                                <Text className="text-gray-700 dark:text-gray-300 font-semibold ml-2 text-sm">Free cancellation</Text>
                                            </View>
                                        )}
                                    </ScrollView>

                        {/* ABOUT THIS ACTIVITY */}
                        <TouchableOpacity onPress={() => setActiveSection(activeSection === 'about' ? null : 'about')} className="flex-row items-center justify-between mb-5">
                            <Text className="text-gray-900 dark:text-white font-extrabold text-[22px]">About this activity</Text>
                            <Ionicons name={activeSection === 'about' ? "chevron-up" : "chevron-down"} size={24} color="#1a2b49" className="dark:text-white" style={{ color: undefined }} />
                        </TouchableOpacity>

                        {activeSection === 'about' && (
                            <View>
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

                        {displayExp.guideType && (
                            <View className="flex-row items-start mb-4">
                                <Ionicons name="person-outline" size={24} color="#1a2b49" className="dark:text-white mr-4" style={{ color: undefined }} />
                                <View className="flex-1">
                                    <Text className="text-gray-900 dark:text-white font-bold text-base">Guide</Text>
                                    <Text className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm capitalize">{displayExp.guideType}</Text>
                                </View>
                            </View>
                        )}

                        {displayExp.isTransportationUsed && displayExp.transports && displayExp.transports.length > 0 && (
                            <View className="flex-row items-start mb-4">
                                <Ionicons name="bus-outline" size={24} color="#1a2b49" className="dark:text-white mr-4" style={{ color: undefined }} />
                                <View className="flex-1">
                                    <Text className="text-gray-900 dark:text-white font-bold text-base">Transportation Included</Text>
                                    <Text className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">{displayExp.transports.join(', ')}</Text>
                                </View>
                            </View>
                        )}

                        {displayExp.isDifferentCityTravel && (
                            <View className="flex-row items-start mb-4">
                                <Ionicons name="map-outline" size={24} color="#1a2b49" className="dark:text-white mr-4" style={{ color: undefined }} />
                                <View className="flex-1">
                                    <Text className="text-gray-900 dark:text-white font-bold text-base">Different City Travel</Text>
                                    <Text className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">This activity involves traveling to a different city.</Text>
                                </View>
                            </View>
                        )}

                        {displayExp.privateGroup && (
                            <View className="flex-row items-start mb-4">
                                <Ionicons name="people-outline" size={24} color="#1a2b49" className="dark:text-white mr-4" style={{ color: undefined }} />
                                <View className="flex-1">
                                    <Text className="text-gray-900 dark:text-white font-bold text-base">Private group available</Text>
                                    <Text className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">This experience can be booked for a private group.</Text>
                                </View>
                            </View>
                        )}

                        {displayExp.isFoodIncluded && displayExp.meals && displayExp.meals.length > 0 && (
                            <View className="flex-row items-start mb-4">
                                <Ionicons name="restaurant-outline" size={24} color="#1a2b49" className="dark:text-white mr-4" style={{ color: undefined }} />
                                <View className="flex-1">
                                    <Text className="text-gray-900 dark:text-white font-bold text-base">Meals Included</Text>
                                    <Text className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">
                                        {displayExp.meals.map((m: any) => `${m.type} (${m.format})`).join(', ')}
                                    </Text>
                                </View>
                            </View>
                        )}

                        {displayExp.dietaryOptions && displayExp.dietaryOptions.length > 0 && (
                            <View className="flex-row items-start mb-4">
                                <Ionicons name="information-circle-outline" size={24} color="#1a2b49" className="dark:text-white mr-4" style={{ color: undefined }} />
                                <View className="flex-1">
                                    <Text className="text-gray-900 dark:text-white font-bold text-base">Dietary options available</Text>
                                    <Text className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">
                                        {displayExp.dietaryOptions.join(', ')}. Please inform the provider of any dietary needs when booking.
                                    </Text>
                                </View>
                            </View>
                        )}
                            </View>
                        )}

                        <View className="h-[1px] bg-gray-200 dark:bg-gray-800 my-6" />

                        {/* EXPERIENCE */}
                        <TouchableOpacity onPress={() => setActiveSection(activeSection === 'experience' ? null : 'experience')} className="flex-row items-center justify-between mb-6">
                            <Text className="text-gray-900 dark:text-white font-extrabold text-[22px]">Experience</Text>
                            <Ionicons name={activeSection === 'experience' ? "chevron-up" : "chevron-down"} size={24} color="#1a2b49" className="dark:text-white" style={{ color: undefined }} />
                        </TouchableOpacity>

                        {activeSection === 'experience' && (
                            <View>
                        {/* HIGHLIGHTS */}
                        {displayExp.highlights && displayExp.highlights.length > 0 && (
                            <View className="mb-6">
                                <Text className="text-gray-900 dark:text-white font-bold text-lg mb-3">Highlights</Text>
                                {displayExp.highlights.map((item: any, i: number) => (
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
                                {displayExp.description || displayExp.shortDescription || "No description available."}
                            </Text>
                        </View>

                        {/* INCLUDES / EXCLUDES */}
                        {(displayExp.includes && displayExp.includes.length > 0) || (displayExp.excludes && displayExp.excludes.length > 0) ? (
                            <View className="mb-6">
                                {displayExp.includes && displayExp.includes.length > 0 && (
                                    <View>
                                        <Text className="text-gray-900 dark:text-white font-bold text-lg mb-4">Includes</Text>
                                        <View className="flex-row flex-wrap">
                                            {displayExp.includes.map((item: any, i: number) => (
                                                <View key={i} className="w-[50%] flex-row items-start mb-3 pr-2">
                                                    <Ionicons name="checkmark" size={20} color="#10b981" className="mr-2" />
                                                    <Text className="text-gray-700 dark:text-gray-300 flex-1 text-sm">{item}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}
                                {displayExp.excludes && displayExp.excludes.length > 0 && (
                                    <View className="mt-4">
                                        <Text className="text-gray-900 dark:text-white font-bold text-lg mb-3">Not included</Text>
                                        {displayExp.excludes.map((item: any, i: number) => (
                                            <View key={i} className="flex-row items-start mb-2 pl-1">
                                                <Ionicons name="close" size={20} color="#ef4444" className="mr-2" />
                                                <Text className="text-gray-700 dark:text-gray-300 flex-1 text-sm">{item}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        ) : null}
                            </View>
                        )}

                        <View className="h-[1px] bg-gray-200 dark:bg-gray-800 my-6" />

                        {/* IMPORTANT INFORMATION */}
                        {(displayExp.meetingPoint || displayExp.whatToBring?.length > 0 || displayExp.knowBeforeYouGo?.length > 0 || displayExp.extraInformation?.notAllowed?.length > 0 || displayExp.extraInformation?.whatToBring?.length > 0 || displayExp.extraInformation?.knowBeforeYouGo?.length > 0 || displayExp.extraInformation?.petFriendly !== undefined) && (
                            <>
                                <TouchableOpacity onPress={() => setActiveSection(activeSection === 'info' ? null : 'info')} className="flex-row items-center justify-between mb-6">
                                    <Text className="text-gray-900 dark:text-white font-extrabold text-[22px]">Important information</Text>
                                    <Ionicons name={activeSection === 'info' ? "chevron-up" : "chevron-down"} size={24} color="#1a2b49" className="dark:text-white" style={{ color: undefined }} />
                                </TouchableOpacity>
                                {activeSection === 'info' && (
                                <View className="mb-6 gap-y-6">
                                    {displayExp.meetingPoint && (
                                        <View>
                                            <View className="flex-row items-center mb-2">
                                                <Ionicons name="location-outline" size={20} color="#9ca3af" className="mr-2" />
                                                <Text className="text-gray-900 dark:text-white font-bold text-base">Meeting Point</Text>
                                            </View>
                                            <Text className="text-gray-700 dark:text-gray-300 leading-6 pl-7">
                                                {displayExp.meetingPoint}
                                            </Text>
                                        </View>
                                    )}

                                    {((displayExp.whatToBring && displayExp.whatToBring.length > 0) || (displayExp.extraInformation?.whatToBring && displayExp.extraInformation.whatToBring.length > 0)) && (
                                        <View>
                                            <View className="flex-row items-center mb-2">
                                                <Ionicons name="checkmark-outline" size={20} color="#9ca3af" className="mr-2" />
                                                <Text className="text-gray-900 dark:text-white font-bold text-base">What to bring</Text>
                                            </View>
                                            <View className="pl-7">
                                                {[...(displayExp.whatToBring || []), ...(displayExp.extraInformation?.whatToBring || [])].filter((v,i,a)=>a.indexOf(v)===i && v).map((item: any, i: number) => (
                                                    <View key={i} className="flex-row items-start mb-1">
                                                        <View className="w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-gray-400 mt-2.5 mr-3" />
                                                        <Text className="text-gray-700 dark:text-gray-300 flex-1 leading-6">{item}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    )}

                                    {((displayExp.extraInformation?.notAllowed && displayExp.extraInformation.notAllowed.length > 0) || (displayExp.notSuitableFor && displayExp.notSuitableFor.length > 0)) && (
                                        <View>
                                            <View className="flex-row items-center mb-2">
                                                <Ionicons name="close-outline" size={20} color="#9ca3af" className="mr-2" />
                                                <Text className="text-gray-900 dark:text-white font-bold text-base">Not allowed</Text>
                                            </View>
                                            <View className="pl-7">
                                                {[...(displayExp.extraInformation?.notAllowed || []), ...(displayExp.notSuitableFor || [])].filter((v,i,a)=>a.indexOf(v)===i && v).map((item: any, i: number) => (
                                                    <View key={i} className="flex-row items-start mb-1">
                                                        <View className="w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-gray-400 mt-2.5 mr-3" />
                                                        <Text className="text-gray-700 dark:text-gray-300 flex-1 leading-6">{item}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    )}

                                    {((displayExp.knowBeforeYouGo && displayExp.knowBeforeYouGo.length > 0) || (displayExp.extraInformation?.knowBeforeYouGo && displayExp.extraInformation.knowBeforeYouGo.length > 0)) && (
                                        <View>
                                            <View className="flex-row items-center mb-2">
                                                <Ionicons name="information-circle-outline" size={20} color="#9ca3af" className="mr-2" />
                                                <Text className="text-gray-900 dark:text-white font-bold text-base">Know before you go</Text>
                                            </View>
                                            <View className="pl-7">
                                                {[...(displayExp.knowBeforeYouGo || []), ...(displayExp.extraInformation?.knowBeforeYouGo || [])].filter((v,i,a)=>a.indexOf(v)===i && v).map((item: any, i: number) => (
                                                    <View key={i} className="flex-row items-start mb-1">
                                                        <View className="w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-gray-400 mt-2.5 mr-3" />
                                                        <Text className="text-gray-700 dark:text-gray-300 flex-1 leading-6">{item}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    )}
                                    
                                    {displayExp.extraInformation?.petFriendly !== undefined && (
                                        <View>
                                            <View className="flex-row items-center mb-2">
                                                <Ionicons name="paw-outline" size={20} color="#9ca3af" className="mr-2" />
                                                <Text className="text-gray-900 dark:text-white font-bold text-base">Pet friendly</Text>
                                            </View>
                                            <Text className="text-gray-700 dark:text-gray-300 leading-6 pl-7">
                                                {displayExp.extraInformation.petFriendly ? "Yes, this experience is pet friendly." : "No, pets are not allowed."}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                )}

                                <View className="h-[1px] bg-gray-200 dark:bg-gray-800 my-6" />
                            </>
                        )}

                        {/* ITINERARY */}
                        {displayExp.itinerary && displayExp.itinerary.length > 0 && (
                            <View className="mb-6">
                                <TouchableOpacity onPress={() => setActiveSection(activeSection === 'itinerary' ? null : 'itinerary')} className="flex-row items-center justify-between mb-6">
                                    <Text className="text-gray-900 dark:text-white font-extrabold text-[22px]">Itinerary</Text>
                                    <Ionicons name={activeSection === 'itinerary' ? "chevron-up" : "chevron-down"} size={24} color="#1a2b49" className="dark:text-white" style={{ color: undefined }} />
                                </TouchableOpacity>

                                {activeSection === 'itinerary' && (
                                <View className="flex-col md:flex-row gap-6">
                                    <View className="flex-1">
                                        {displayExp.itinerary.map((item: any, i: number) => (
                                            <View key={i} className="flex-row relative">
                                                {i !== displayExp.itinerary.length - 1 && (
                                                    <View className="absolute left-[7px] top-6 bottom-[-16px] w-[2px] bg-red-600" />
                                                )}
                                                <View className="w-4 h-4 rounded-full border-[3px] border-[#002b5c] dark:bg-white bg-[#002b5c] dark:border-[#58a6ff] mt-1 mr-4 z-10" />

                                                <View className="flex-1 pb-6">
                                                    <Text className="text-gray-900 dark:text-white font-bold text-base">{item.title}</Text>
                                                    <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">{item.description}</Text>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                                )}
                            </View>
                        )}
                        </>
                    )}

                        <View className="h-[1px] bg-gray-200 dark:bg-gray-800 my-6" />



                        {/* DESKTOP-STYLE BOOKING WIDGET ON MOBILE */}
                        <View 
                            onLayout={(e) => setBookingWidgetY(e.nativeEvent.layout.y)}
                            className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm mb-8 mt-2"
                        >
                            {(() => {
                                const tiers = getDynamicTiers();
                                let currentTotalAmount = 0;
                                tiers.forEach((tier: any, index: number) => {
                                    const isAdult = tier.title.toLowerCase().includes('adult') || (index === 0 && !tiers.some((t: any) => t.title.toLowerCase().includes('adult')));
                                    const isChild = tier.title.toLowerCase().includes('child') || (index === 1 && !tiers.some((t: any) => t.title.toLowerCase().includes('child')));
                                    const count = tierCounts[index] !== undefined ? tierCounts[index] : (isAdult ? adultCount : (isChild ? childCount : 0));
                                    currentTotalAmount += tier.price * count;
                                });

                                return (
                                    <>
                                        <Text className="text-gray-500 dark:text-gray-400 text-xs tracking-widest font-bold uppercase mb-1">Base Price</Text>
                                        <View className="flex-row items-baseline gap-1 mb-6">
                                            <Text className="text-gray-900 dark:text-white font-black text-2xl">{formatPrice(getDisplayPrice(displayExp), displayExp.currency)}</Text>
                                        </View>

                                        {/* Participants */}
                                        <View className="border border-gray-300 dark:border-gray-700 rounded-3xl p-1 mb-4 bg-gray-50 dark:bg-[#252527]">
                                            {tiers.map((tier: any, index: number) => {
                                                const isAdultTier = tier.title.toLowerCase().includes('adult') || (index === 0 && !tiers.some((t: any) => t.title.toLowerCase().includes('adult')));
                                                const isChildTier = tier.title.toLowerCase().includes('child') || (index === 1 && !tiers.some((t: any) => t.title.toLowerCase().includes('child')));
                                                
                                                const count = tierCounts[index] !== undefined ? tierCounts[index] : (isAdultTier ? adultCount : (isChildTier ? childCount : 0));
                                                
                                                const handleSetCount = (newCount: number) => {
                                                    setTierCounts(prev => ({ ...prev, [index]: newCount }));
                                                    if (isAdultTier) setAdultCount(newCount);
                                                    if (isChildTier) setChildCount(newCount);
                                                };
                                                const minCount = 0;

                                                return (
                                                    <React.Fragment key={index}>
                                                        {index > 0 && <View className="h-[1px] bg-gray-200 dark:bg-gray-700 mx-3 my-1" />}
                                                        <View className="flex-row items-center justify-between px-3 py-2">
                                                            <View>
                                                                <Text className="text-gray-900 dark:text-white font-medium text-base">
                                                                    {tier.title}
                                                                    {tier.minAge !== undefined && tier.maxAge !== undefined ? ` (${tier.minAge}-${tier.maxAge} yrs)` : ''}
                                                                </Text>
                                                                <Text className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                                                                    {formatPrice(tier.price?.toString() || "0", displayExp.currency)}
                                                                </Text>
                                                            </View>
                                                            <View className="flex-row items-center">
                                                                <TouchableOpacity
                                                                    onPress={() => handleSetCount(Math.max(minCount, count - 1))}
                                                                    className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 items-center justify-center mr-2 shadow-sm border border-gray-100 dark:border-gray-700"
                                                                >
                                                                    <Text className={`${count > minCount ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'} font-bold text-lg leading-none`}>-</Text>
                                                                </TouchableOpacity>
                                                                <Text className="text-gray-900 dark:text-white font-bold w-6 text-center">{count}</Text>
                                                                <TouchableOpacity
                                                                    onPress={() => handleSetCount(count + 1)}
                                                                    className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 items-center justify-center ml-2 shadow-sm border border-gray-100 dark:border-gray-700"
                                                                >
                                                                    <Text className="text-gray-900 dark:text-white font-bold text-lg leading-none">+</Text>
                                                                </TouchableOpacity>
                                                            </View>
                                                        </View>
                                                    </React.Fragment>
                                                );
                                            })}
                                            
                                            {currentTotalAmount > 0 && (
                                                <View className="mt-2 mb-2 pt-3 border-t border-gray-200 dark:border-gray-700 mx-3">
                                                    <Text className="text-gray-900 dark:text-white font-black text-lg text-right">
                                                        Total: {formatPrice(currentTotalAmount.toString(), displayExp.currency)}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </>
                                );
                            })()}

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
                                    {(displayExp.timeSlots && displayExp.timeSlots.length > 0 ? displayExp.timeSlots : []).length > 0 ? (
                                        displayExp.timeSlots!.map((time: any, idx: number) => (
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
                                onLayout={(e) => setButtonY(e.nativeEvent.layout.y)}
                                onPress={() => {
                                    if (!selectedDate || (displayExp.timeSlots?.length && !selectedTime)) {
                                        Alert.alert("Missing Details", "Please select a date and time before checking availability.");
                                    } else {
                                        handleBooking();
                                    }
                                }}
                                className={`w-full py-4 rounded-full items-center mb-3 ${selectedDate && (!displayExp.timeSlots?.length || selectedTime) ? 'bg-[#002b5c] dark:bg-[#58a6ff]' : 'bg-[#f3f4f6] dark:bg-gray-800'}`}
                            >
                                <Text className={`font-extrabold text-lg ${selectedDate && (!displayExp.timeSlots?.length || selectedTime) ? 'text-white' : 'text-gray-400 dark:text-gray-500'}`}>Check availability</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={addToCart}
                                disabled={!selectedDate || (!!displayExp.timeSlots?.length && !selectedTime) || addingToCart}
                                className={`w-full bg-white dark:bg-[#1c1c1e] border-2 py-4 rounded-full items-center mb-6 ${selectedDate && (!displayExp.timeSlots?.length || selectedTime) ? 'border-[#002b5c] dark:border-[#58a6ff]' : 'border-gray-200 dark:border-gray-800'}`}
                            >
                                <View className="flex-row items-center">
                                    <Ionicons name="cart" size={20} color={selectedDate && (!displayExp.timeSlots?.length || selectedTime) ? '#002b5c' : '#9ca3af'} className="mr-2" />
                                    <Text className={`font-extrabold text-lg ${selectedDate && (!displayExp.timeSlots?.length || selectedTime) ? 'text-[#002b5c] dark:text-[#58a6ff]' : 'text-gray-400 dark:text-gray-500'}`}>
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

                        <View className="h-[1px] bg-gray-200 dark:bg-gray-800 mt-4 mb-8" />

                        {/* CUSTOMER REVIEWS */}
                        <View className="mb-4">
                            <Text className="text-gray-900 dark:text-white font-extrabold text-[22px] mb-6">Customer Reviews</Text>
                            <View>
                            {reviews.length === 0 ? (
                                <Text className="text-gray-500 dark:text-gray-400 italic">No reviews yet.</Text>
                            ) : (
                                reviews.map((review, idx) => (
                                    <View key={review._id || idx} className="mb-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                                        <View className="flex-row justify-between items-start mb-2">
                                            <View>
                                                <Text className="text-gray-900 dark:text-white font-bold">{review.user?.name || 'Traveler'}</Text>
                                                <Text className="text-gray-400 dark:text-gray-500 text-xs">{new Date(review.createdAt).toLocaleDateString()}</Text>
                                            </View>
                                            <View className="flex-row">
                                                {[1, 2, 3, 4, 5].map((_, i) => (
                                                    <Ionicons key={i} name={i + 1 <= review.rating ? "star" : "star-outline"} size={12} color="#F59E0B" />
                                                ))}
                                            </View>
                                        </View>
                                        <Text className="text-gray-700 dark:text-gray-300 text-sm">{review.comment}</Text>
                                    </View>
                                ))
                            )}
                            </View>
                        </View>

                        <View className="h-24" />
                    </View>
                </ScrollView>

                {/* STICKY BOTTOM BAR */}
                {isStickyVisible && (
                <View 
                    className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#1c1c1e] border-t border-gray-100 dark:border-gray-800 px-5 flex-row items-center justify-between" 
                    style={{ paddingBottom: Math.max(insets.bottom, 16), paddingTop: 12, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 10 }}
                >
                    <View>
                        <Text className="text-gray-500 dark:text-gray-400 text-[10px] font-medium mb-0.5">From</Text>
                        <View className="flex-row items-baseline gap-1">
                            <Text className="text-[#ef4444] font-extrabold text-[18px] leading-none">{formatPrice(getDisplayPrice(displayExp), displayExp.currency)}</Text>
                            <Text className="text-gray-500 dark:text-gray-400 text-[11px] font-medium">per person</Text>
                        </View>
                    </View>
                    <TouchableOpacity 
                        onPress={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                        className="bg-[#007aff] px-6 py-3.5 rounded-full"
                        activeOpacity={0.8}
                    >
                        <Text className="text-white font-bold text-base">Check availability</Text>
                    </TouchableOpacity>
                </View>
                )}

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
                                {displayExp.languages && displayExp.languages.length > 0 ? (
                                    displayExp.languages.map((lang: any, idx: number) => (
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
                            experience={displayExp}
                            selectedDate={selectedDate!}
                            selectedTime={selectedTime!}
                            adultCount={adultCount}
                            childCount={childCount}
                            tierCounts={tierCounts}
                        />
                    )
                }
            </View >
        </Modal >
    );
}
