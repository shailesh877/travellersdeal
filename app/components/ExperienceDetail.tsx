import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
import { Dimensions, Image, Modal, ScrollView, Text, TouchableOpacity, View, Alert, Platform, Linking, ActivityIndicator, Share } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BookingFlow from "./BookingFlow";
import FullItineraryModal from "./FullItineraryModal";
import { API_URL } from "../constants/Config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { formatPrice, getDisplayPrice, getChildPrice, getAdultPrice } from "../utils/currency";
import { getImageUrlFromString } from "../utils/image";
import { useColorScheme } from "nativewind";

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
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const scrollViewRef = useRef<ScrollView>(null);
    const [bookingWidgetY, setBookingWidgetY] = useState(0);
    const [buttonY, setButtonY] = useState(0);
    const [isStickyVisible, setIsStickyVisible] = useState(true);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [participantCounts, setParticipantCounts] = useState<{ [key: string]: number }>({
        'Adult': 1, 'Infant': 0, 'Child': 0, 'Youth': 0, 'Senior': 0,
        'Student (with ID)': 0, 'Student EU Citizens (with ID)': 0, 
        'Military (with ID)': 0, 'EU Citizens (with ID)': 0
    });
    const [adultCount, setAdultCount] = useState(1);
    const [childCount, setChildCount] = useState(0);
    const [tierCounts, setTierCounts] = useState<{ [key: number]: number }>({ 0: 1, 1: 0, 2: 0, 3: 0, 4: 0 });
    const [isBookingFlowVisible, setIsBookingFlowVisible] = useState(false);
    const [isTicketModalVisible, setIsTicketModalVisible] = useState(false);
    const [isDateModalVisible, setIsDateModalVisible] = useState(false);
    const [isAvailabilityChecked, setIsAvailabilityChecked] = useState(false);
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [reviews, setReviews] = useState<any[]>([]);
    
    // Add state for full experience fetch
    const [fullExperience, setFullExperience] = useState<any>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [activeSection, setActiveSection] = useState<string | null>('highlights');
    const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
    const [isItineraryModalVisible, setIsItineraryModalVisible] = useState(false);

    // Normalize ID
    const experienceId = experience ? (experience.id || experience._id || '') : '';

    useEffect(() => {
        if (visible) {
            console.log("ExperienceDetail modal visible. Experience ID:", experienceId);
            setAdultCount(1);
            setChildCount(0);
            setTierCounts({ 0: 1, 1: 0, 2: 0, 3: 0, 4: 0 });
            setIsAvailabilityChecked(false);
            setActiveSection('highlights'); // Default to highlights
            checkWishlistStatus();

            // Fetch full experience details
            if (experienceId) {
                setLoadingDetails(true);
                fetch(`${API_URL}/experiences/${experienceId}`)
                    .then(res => res.json())
                    .then(data => {
                        setFullExperience(data);
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
        const tiers = displayExp?.bookingOptions?.[selectedOptionIndex]?.availabilityAndPricing?.pricingTiers || [];
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

    const calculateTotalAndTiers = (opt: any, pCounts: { [key: string]: number }) => {
        let total = 0;
        const tiers = opt?.availabilityAndPricing?.pricingTiers || [];
        const basePrice = opt?.availabilityAndPricing?.price || getAdultPrice(displayExp);
        let computedTierCounts: { [key: number]: number } = {};
        let totalQty = 0;
        let cAdultCount = 0;
        let cChildCount = 0;

        if (tiers.length === 0) {
            Object.entries(pCounts).forEach(([type, count]) => {
                totalQty += count;
                if (type === 'Child' || type === 'Infant') cChildCount += count;
                else cAdultCount += count;
            });
            total = totalQty * basePrice;
            computedTierCounts[0] = totalQty;
            return { total, computedTierCounts, totalQty, cAdultCount, cChildCount };
        }

        Object.entries(pCounts).forEach(([type, count]) => {
            if (count > 0) {
                totalQty += count;
                if (type === 'Child' || type === 'Infant') cChildCount += count;
                else cAdultCount += count;
                
                let matchIdx = tiers.findIndex((t: any) => t.title?.toLowerCase()?.includes(type.toLowerCase()));
                if (matchIdx === -1 && type === 'Adult') matchIdx = tiers.findIndex((t: any) => t.title?.toLowerCase()?.includes('adult'));
                if (matchIdx === -1 && type === 'Child') matchIdx = tiers.findIndex((t: any) => t.title?.toLowerCase()?.includes('child'));
                if (matchIdx === -1 && type === 'Infant') matchIdx = tiers.findIndex((t: any) => t.title?.toLowerCase()?.includes('infant'));
                
                if (matchIdx === -1) {
                    matchIdx = tiers.findIndex((t: any) => t.title?.toLowerCase()?.includes('adult'));
                    if (matchIdx === -1) matchIdx = 0;
                }

                computedTierCounts[matchIdx] = (computedTierCounts[matchIdx] || 0) + count;
                total += count * (tiers[matchIdx]?.price || 0);
            }
        });

        return { total, computedTierCounts, totalQty, cAdultCount, cChildCount };
    };

    const addToCart = async (optIndex: number) => {
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

            const opt = displayExp?.bookingOptions?.[optIndex];
            const { computedTierCounts, cAdultCount, cChildCount, totalQty, total } = calculateTotalAndTiers(opt || {}, participantCounts);

            setSelectedOptionIndex(optIndex);
            setTierCounts(computedTierCounts);
            setAdultCount(cAdultCount);
            setChildCount(cChildCount);

            if (totalQty === 0) {
                setAddingToCart(false);
                Alert.alert("Select Participants", "Please select at least one participant.");
                return;
            }

            const avgPrice = totalQty > 0 ? total / totalQty : 0;

            const response = await fetch(`${API_URL}/cart`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    experienceId: experienceId,
                    quantity: totalQty,
                    date: selectedDate,
                    timeSlot: selectedTime || '',
                    priceAtAdd: avgPrice
                })
            });

            const data = await response.json();
            if (response.ok) {
                setIsTicketModalVisible(false);
                // Trigger the booking flow (payment screen) immediately after adding to cart
                setIsBookingFlowVisible(true);
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
                                const isVisible = scrollY + layoutHeight >= absoluteButtonY + 150 && scrollY <= absoluteButtonY + 70;
                                setIsStickyVisible(!isVisible);
                            } else {
                                const absoluteWidgetY = bookingWidgetY + 400;
                                const isVisible = scrollY + layoutHeight >= absoluteWidgetY + 150;
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
                    <View className="px-5 pt-6 pb-2 items-center">
                        {/* TITLE */}
                        <Text 
                            style={{ fontFamily: 'Outfit_900Black', fontSize: 24, lineHeight: 30 }}
                            className="text-[#1a2b49] dark:text-white text-center mb-4"
                        >
                            {displayExp.title}
                        </Text>

                        {/* RATING & BADGES ROW */}
                        <View className="flex-row flex-wrap items-center justify-center gap-x-3 gap-y-2 mb-4">
                            {displayExp.isOriginal ? (
                                <View className="bg-[#cc2d4a] px-2 py-1 rounded">
                                    <Text style={{ fontFamily: 'Outfit_700Bold' }} className="text-white text-[11px] tracking-wider uppercase">
                                        ORIGINALS
                                    </Text>
                                </View>
                            ) : (
                                <View className="bg-[#cc2d4a] px-2 py-1 rounded">
                                    <Text style={{ fontFamily: 'Outfit_700Bold' }} className="text-white text-[11px] tracking-wider uppercase">
                                        {displayExp.category}
                                    </Text>
                                </View>
                            )}

                            <View className="flex-row items-center">
                                <Ionicons name="star" size={18} color={isDark ? "#ffffff" : "#1a2b49"} />
                                <Text style={{ fontFamily: 'Outfit_700Bold' }} className="text-[#1a2b49] dark:text-white text-[15px] ml-1">
                                    {displayExp.averageRating || displayExp.rating || 'New'}
                                </Text>
                            </View>

                            <Text style={{ fontFamily: 'Outfit_600SemiBold', textDecorationLine: 'underline' }} className="text-[#1a2b49] dark:text-white text-[15px]">
                                {displayExp.numReviews || displayExp.reviewsCount || 0} reviews
                            </Text>
                        </View>

                        {/* LOCATION & CERTIFIED */}
                        <View className="flex-row items-center justify-center gap-x-4 mb-4">
                            {(typeof displayExp.location === 'object' ? displayExp.location?.city : displayExp.location) && (
                                <View className="flex-row items-center">
                                    <Ionicons name="location" size={16} color="#6b7280" />
                                    <Text style={{ fontFamily: 'Outfit_500Medium' }} className="text-gray-600 dark:text-gray-400 text-[13px] ml-1">
                                        {typeof displayExp.location === 'object' ? displayExp.location?.city : displayExp.location}
                                    </Text>
                                </View>
                            )}

                            {displayExp.certified && (
                                <View className="flex-row items-center">
                                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                                    <Text style={{ fontFamily: 'Outfit_600SemiBold' }} className="text-green-600 dark:text-green-400 text-[12px] ml-1 uppercase tracking-wider">
                                        Certified
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* SHORT DESCRIPTION */}
                        {displayExp.shortDescription && (
                            <Text style={{ fontFamily: 'Outfit_500Medium' }} className="text-[#1a2b49] dark:text-gray-300 text-[15px] leading-6 text-center mt-2">
                                {displayExp.shortDescription}
                            </Text>
                        )}
                    </View>

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

                                        {displayExp.cancellationPolicy && (
                                            <View className="bg-gray-100 dark:bg-gray-800/50 px-4 py-2.5 rounded-xl flex-row items-center">
                                                <Ionicons name="shield-checkmark-outline" size={18} color="#6b7280" />
                                                <Text className="text-gray-700 dark:text-gray-300 font-semibold ml-2 text-sm">Free cancellation</Text>
                                            </View>
                                        )}
                                    </ScrollView>

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
                        {/* HIGHLIGHTS */}
                        {displayExp.highlights && displayExp.highlights.length > 0 && (
                            <View>
                                <View className="h-[1px] bg-gray-200 dark:bg-gray-800 -mx-5" />
                                <TouchableOpacity onPress={() => setActiveSection(activeSection === 'highlights' ? null : 'highlights')} className="flex-row items-center justify-between py-3">
                                    <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 18, color: isDark ? '#ffffff' : '#1a2b49' }}>Highlights</Text>
                                    <Ionicons name={activeSection === 'highlights' ? "chevron-up" : "chevron-down"} size={22} color={isDark ? "#ffffff" : "#1a2b49"} />
                                </TouchableOpacity>
                                {activeSection === 'highlights' && (
                                    <View className="mb-3">
                                        {displayExp.highlights.map((item: any, i: number) => (
                                            <View key={i} className="flex-row items-start mb-2 pl-1">
                                                <View className="w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-gray-400 mt-2.5 mr-3" />
                                                <Text style={{ fontFamily: 'Outfit_400Regular' }} className="text-gray-700 dark:text-gray-300 flex-1 leading-6">{item}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        )}

                        {/* FULL DESCRIPTION */}
                        <View>
                            {displayExp.highlights && displayExp.highlights.length > 0 && <View className="h-[1px] bg-gray-200 dark:bg-gray-800 -mx-5" />}
                            <TouchableOpacity onPress={() => setActiveSection(activeSection === 'description' ? null : 'description')} className="flex-row items-center justify-between py-3">
                                <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 18, color: isDark ? '#ffffff' : '#1a2b49' }}>Full description</Text>
                                <Ionicons name={activeSection === 'description' ? "chevron-up" : "chevron-down"} size={22} color={isDark ? "#ffffff" : "#1a2b49"} />
                            </TouchableOpacity>
                            {activeSection === 'description' && (
                                <View className="mb-3">
                                    <Text style={{ fontFamily: 'Outfit_400Regular' }} className="text-gray-700 dark:text-gray-300 leading-6">
                                        {displayExp.description || displayExp.shortDescription || "No description available."}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* INCLUDES / EXCLUDES */}
                        {(displayExp.includes && displayExp.includes.length > 0) || (displayExp.excludes && displayExp.excludes.length > 0) ? (
                            <View>
                                <View className="h-[1px] bg-gray-200 dark:bg-gray-800 -mx-5" />
                                <TouchableOpacity onPress={() => setActiveSection(activeSection === 'includes' ? null : 'includes')} className="flex-row items-center justify-between py-3">
                                    <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 18, color: isDark ? '#ffffff' : '#1a2b49' }}>Includes</Text>
                                    <Ionicons name={activeSection === 'includes' ? "chevron-up" : "chevron-down"} size={22} color={isDark ? "#ffffff" : "#1a2b49"} />
                                </TouchableOpacity>
                                {activeSection === 'includes' && (
                                    <View className="mb-3">
                                        {displayExp.includes && displayExp.includes.length > 0 && (
                                            <View className="flex-row flex-wrap">
                                                {displayExp.includes.map((item: any, i: number) => (
                                                    <View key={i} className="w-[50%] flex-row items-start mb-3 pr-2">
                                                        <Ionicons name="checkmark" size={20} color="#10b981" className="mr-2" />
                                                        <Text style={{ fontFamily: 'Outfit_400Regular' }} className="text-gray-700 dark:text-gray-300 flex-1 text-sm">{item}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                        {displayExp.excludes && displayExp.excludes.length > 0 && (
                                            <View className="mt-2">
                                                <Text style={{ fontFamily: 'Outfit_700Bold' }} className="text-[#1a2b49] dark:text-white text-lg mb-3">Not included</Text>
                                                {displayExp.excludes.map((item: any, i: number) => (
                                                    <View key={i} className="flex-row items-start mb-2 pl-1">
                                                        <Ionicons name="close" size={20} color="#ef4444" className="mr-2" />
                                                        <Text style={{ fontFamily: 'Outfit_400Regular' }} className="text-gray-700 dark:text-gray-300 flex-1 text-sm">{item}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                )}
                            </View>
                        ) : null}

                        {/* IMPORTANT INFORMATION */}
                        {(displayExp.meetingPoint || displayExp.whatToBring?.length > 0 || displayExp.knowBeforeYouGo?.length > 0 || displayExp.extraInformation?.notAllowed?.length > 0 || displayExp.extraInformation?.whatToBring?.length > 0 || displayExp.extraInformation?.knowBeforeYouGo?.length > 0 || displayExp.extraInformation?.petFriendly !== undefined) && (
                            <View>
                                <View className="h-[1px] bg-gray-200 dark:bg-gray-800 -mx-5" />
                                <TouchableOpacity onPress={() => setActiveSection(activeSection === 'info' ? null : 'info')} className="flex-row items-center justify-between py-3">
                                    <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 18, color: isDark ? '#ffffff' : '#1a2b49' }}>Important information</Text>
                                    <Ionicons name={activeSection === 'info' ? "chevron-up" : "chevron-down"} size={22} color={isDark ? "#ffffff" : "#1a2b49"} />
                                </TouchableOpacity>
                                {activeSection === 'info' && (
                                <View className="mb-3 gap-y-4">
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
                            </View>
                        )}

                        {/* ITINERARY */}
                        {displayExp.itinerary && displayExp.itinerary.length > 0 && (
                            <View className="mb-4">
                                <View className="h-[1px] bg-gray-200 dark:bg-gray-800 -mx-5 mb-4" />
                                <Text style={{ fontFamily: 'Outfit_900Black', fontSize: 22, color: isDark ? '#ffffff' : '#1a2b49' }} className="mb-3">Itinerary</Text>
                                <TouchableOpacity onPress={() => setIsItineraryModalVisible(true)} className="flex-row items-center justify-between py-2">
                                    <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 16, color: isDark ? '#ffffff' : '#1a2b49' }}>See itinerary</Text>
                                    <Ionicons name="chevron-forward" size={20} color={isDark ? "#ffffff" : "#1a2b49"} />
                                </TouchableOpacity>
                            </View>
                        )}
                        </>
                    )}

                        <View className="h-[1px] bg-gray-200 dark:bg-gray-800 my-6" />

                        <View className="h-[1px] bg-gray-200 dark:bg-gray-800 my-6" />

                        {/* SELECTION BOX (DARK BLUE) */}
                        <View 
                            onLayout={(e) => setBookingWidgetY(e.nativeEvent.layout.y)}
                            className="bg-[#1a2b49] rounded-2xl p-5 shadow-sm mb-4"
                        >
                            <Text className="text-white font-extrabold text-[17px] mb-4">Select participants and date</Text>
                            
                            {/* Participants Placeholder */}
                            <TouchableOpacity
                                onPress={() => setIsTicketModalVisible(true)}
                                className="flex-row items-center justify-between bg-white rounded-full px-4 py-3.5 mb-3"
                            >
                                <View className="flex-row items-center">
                                    <Ionicons name="people-outline" size={20} color="#1a2b49" style={{ marginRight: 12 }} />
                                    <Text className="text-[#1a2b49] font-bold text-base">
                                        {(() => {
                                            let parts: string[] = [];
                                            Object.entries(participantCounts).forEach(([type, count]) => {
                                                if (count > 0) parts.push(`${type.split(' ')[0]} x ${count}`);
                                            });
                                            return parts.length > 0 ? parts.join(', ') : 'Select participants';
                                        })()}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-down" size={20} color="#1a2b49" />
                            </TouchableOpacity>

                            {/* Date Placeholder */}
                            <TouchableOpacity
                                onPress={() => setIsDateModalVisible(true)}
                                className="flex-row items-center justify-between bg-white rounded-full px-4 py-3.5 mb-3"
                            >
                                <View className="flex-row items-center">
                                    <Ionicons name="calendar-outline" size={20} color="#1a2b49" style={{ marginRight: 12 }} />
                                    <Text className="text-[#1a2b49] font-bold text-base">
                                        {selectedDate ? selectedDate : "Select a date"}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-down" size={20} color="#1a2b49" />
                            </TouchableOpacity>
                            {/* Check Availability Button */}
                            <TouchableOpacity
                                onPress={() => {
                                    if (!selectedDate) {
                                        Alert.alert("Missing Details", "Please select a date before checking availability.");
                                    } else {
                                        setIsAvailabilityChecked(true);
                                    }
                                }}
                                className={`w-full py-3.5 rounded-full items-center mb-1 flex-row justify-center ${selectedDate ? 'bg-white' : 'bg-white/50'}`}
                            >
                                <Text className={`font-extrabold text-base ${selectedDate ? 'text-[#1a2b49]' : 'text-[#1a2b49]/50'}`}>
                                    Check availability
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* INLINE PAYMENT OPTIONS WIDGET */}
                        {isAvailabilityChecked && (
                            <View 
                                className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm mb-8 mt-2"
                            >
                                {/* Starting Time Options */}
                                {displayExp.timeSlots && displayExp.timeSlots.length > 0 && (
                                    <View className="mb-6">
                                        <View className="flex-row items-center mb-3">
                                            <Ionicons name="time" size={18} color="#9ca3af" className="mr-2" />
                                            <Text className="text-gray-700 dark:text-gray-300 font-bold text-base">Select starting time</Text>
                                        </View>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                            {displayExp.timeSlots.map((time: any, idx: number) => (
                                                <TouchableOpacity
                                                    key={idx}
                                                    onPress={() => setSelectedTime(time)}
                                                    className={`px-6 py-2.5 rounded-xl border mr-3 ${selectedTime === time ? 'border-[#002b5c] dark:border-[#58a6ff] bg-[#002b5c]/5 dark:bg-[#58a6ff]/10' : 'border-gray-300 dark:border-gray-700'}`}
                                                >
                                                    <Text className={`font-medium ${selectedTime === time ? 'text-[#002b5c] dark:text-[#58a6ff]' : 'text-gray-900 dark:text-white'}`}>{time}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}

                                <Text className="font-extrabold text-gray-900 dark:text-white text-lg mb-4">Select an Option</Text>

                                {displayExp.bookingOptions && displayExp.bookingOptions.length > 0 ? (
                                    <>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                                            {displayExp.bookingOptions.map((opt: any, index: number) => {
                                                const { total } = calculateTotalAndTiers(opt, participantCounts);
                                                const pricing = opt.availabilityAndPricing;
                                                const isSelected = selectedOptionIndex === index;
                                                
                                                return (
                                                    <TouchableOpacity 
                                                        key={index} 
                                                        onPress={() => setSelectedOptionIndex(index)}
                                                        style={{ width: 280, marginRight: 16 }} 
                                                        className={`border rounded-2xl p-4 bg-white dark:bg-[#252527] shadow-sm ${isSelected ? 'border-[#002b5c] dark:border-[#58a6ff]' : 'border-gray-200 dark:border-gray-800'}`}
                                                    >
                                                        <Text className="font-bold text-gray-900 dark:text-white text-lg mb-2" numberOfLines={2}>{opt.optionSetup?.title}</Text>
                                                        {opt.optionSetup?.description && (
                                                            <Text className="text-gray-500 dark:text-gray-400 text-sm mb-4" numberOfLines={3}>{opt.optionSetup.description}</Text>
                                                        )}
                                                        <View className="flex-row items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
                                                            <View>
                                                                <Text className="text-gray-500 dark:text-gray-400 text-xs font-medium">Total price</Text>
                                                                <Text className="text-xl font-extrabold text-[#1a2b49] dark:text-[#58a6ff]">
                                                                    {formatPrice(total.toString(), pricing?.currency || displayExp.currency)}
                                                                </Text>
                                                            </View>
                                                            <TouchableOpacity
                                                                onPress={() => addToCart(index)}
                                                                disabled={addingToCart}
                                                                className="bg-[#002b5c] dark:bg-[#58a6ff] px-6 py-3 rounded-full"
                                                            >
                                                                {addingToCart && selectedOptionIndex === index ? (
                                                                    <ActivityIndicator color="white" size="small" />
                                                                ) : (
                                                                    <Text className="text-white font-bold text-sm">Continue</Text>
                                                                )}
                                                            </TouchableOpacity>
                                                        </View>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </ScrollView>

                                        {/* Details for Selected Option */}
                                        {displayExp.bookingOptions[selectedOptionIndex] && (
                                            <View className="bg-gray-50 dark:bg-[#2a2a2c] rounded-2xl p-5 mb-4 border border-gray-100 dark:border-gray-800">
                                                <Text className="font-bold text-lg text-gray-900 dark:text-white mb-4">
                                                    Option Details: <Text className="font-medium text-gray-700 dark:text-gray-300">{displayExp.bookingOptions[selectedOptionIndex].optionSetup?.title}</Text>
                                                </Text>
                                                
                                                <View className="mb-4">
                                                    <View className="flex-row items-center mb-2">
                                                        <Ionicons name="time-outline" size={16} color="#002b5c" style={{ marginRight: 6 }} />
                                                        <Text className="font-bold text-sm text-gray-800 dark:text-gray-200">General Info</Text>
                                                    </View>
                                                    <Text className="text-sm text-gray-600 dark:text-gray-400 mb-1"><Text className="font-medium text-gray-900 dark:text-white">Group type:</Text> {displayExp.bookingOptions[selectedOptionIndex].optionSetup?.isPrivateActivity ? 'Private' : 'Shared'}</Text>
                                                    {displayExp.bookingOptions[selectedOptionIndex].optionSetup?.maxGroupSize && <Text className="text-sm text-gray-600 dark:text-gray-400 mb-1"><Text className="font-medium text-gray-900 dark:text-white">Max group:</Text> {displayExp.bookingOptions[selectedOptionIndex].optionSetup.maxGroupSize}</Text>}
                                                    {displayExp.bookingOptions[selectedOptionIndex].optionSetup?.languages?.length > 0 && <Text className="text-sm text-gray-600 dark:text-gray-400 mb-1"><Text className="font-medium text-gray-900 dark:text-white">Guide:</Text> {displayExp.bookingOptions[selectedOptionIndex].optionSetup.languages.join(', ')}</Text>}
                                                    {displayExp.bookingOptions[selectedOptionIndex].availabilityAndPricing?.capacity && <Text className="text-sm text-gray-600 dark:text-gray-400 mb-1"><Text className="font-medium text-gray-900 dark:text-white">Capacity:</Text> {displayExp.bookingOptions[selectedOptionIndex].availabilityAndPricing.capacity}</Text>}
                                                </View>

                                                {displayExp.bookingOptions[selectedOptionIndex].availabilityAndPricing?.pricingTiers?.length > 0 && (
                                                    <View className="mb-4">
                                                        <View className="flex-row items-center mb-2">
                                                            <Ionicons name="pricetag-outline" size={16} color="#002b5c" style={{ marginRight: 6 }} />
                                                            <Text className="font-bold text-sm text-gray-800 dark:text-gray-200">Pricing Tiers</Text>
                                                        </View>
                                                        {displayExp.bookingOptions[selectedOptionIndex].availabilityAndPricing.pricingTiers.map((tier: any, idx: number) => (
                                                            <View key={idx} className="flex-row justify-between items-center bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-gray-700 px-3 py-2 rounded-lg mb-2">
                                                                <Text className="font-medium text-sm text-gray-800 dark:text-gray-200">{tier.title} <Text className="text-xs text-gray-400">({tier.minAge}-{tier.maxAge} yrs)</Text></Text>
                                                                <Text className="font-bold text-sm text-gray-900 dark:text-white">{formatPrice(tier.price?.toString(), displayExp.bookingOptions[selectedOptionIndex].availabilityAndPricing?.currency || displayExp.currency)}</Text>
                                                            </View>
                                                        ))}
                                                    </View>
                                                )}

                                                <View className="mb-4">
                                                    <View className="flex-row items-center mb-2">
                                                        <Ionicons name="location-outline" size={16} color="#002b5c" style={{ marginRight: 6 }} />
                                                        <Text className="font-bold text-sm text-gray-800 dark:text-gray-200">Meeting & Pickup</Text>
                                                    </View>
                                                    <Text className="text-sm text-gray-600 dark:text-gray-400 mb-1"><Text className="font-medium text-xs uppercase bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1 py-0.5 rounded mr-1">{displayExp.bookingOptions[selectedOptionIndex].meetingPointOrPickup?.meetingType || 'MEET AT LOCATION'}</Text></Text>
                                                    {displayExp.bookingOptions[selectedOptionIndex].meetingPointOrPickup?.meetingAddress && <Text className="text-sm text-gray-600 dark:text-gray-400 mb-1"><Text className="font-medium text-gray-900 dark:text-white">Address:</Text> {displayExp.bookingOptions[selectedOptionIndex].meetingPointOrPickup.meetingAddress}</Text>}
                                                    {displayExp.bookingOptions[selectedOptionIndex].meetingPointOrPickup?.pickupType && <Text className="text-sm text-gray-600 dark:text-gray-400 mb-1"><Text className="font-medium text-gray-900 dark:text-white">Pickup:</Text> {displayExp.bookingOptions[selectedOptionIndex].meetingPointOrPickup.pickupType}</Text>}
                                                    {displayExp.bookingOptions[selectedOptionIndex].meetingPointOrPickup?.arrivalTime && <Text className="text-sm text-gray-600 dark:text-gray-400 mb-1"><Text className="font-medium text-gray-900 dark:text-white">Arrive:</Text> {displayExp.bookingOptions[selectedOptionIndex].meetingPointOrPickup.arrivalTime}</Text>}
                                                </View>

                                                {displayExp.bookingOptions[selectedOptionIndex].cutOff && (
                                                    <View>
                                                        <View className="flex-row items-center mb-2">
                                                            <Ionicons name="checkmark-circle-outline" size={16} color="#002b5c" style={{ marginRight: 6 }} />
                                                            <Text className="font-bold text-sm text-gray-800 dark:text-gray-200">Policies</Text>
                                                        </View>
                                                        <Text className="text-sm text-gray-600 dark:text-gray-400 mb-1"><Text className="font-medium text-gray-900 dark:text-white">Cancellation:</Text> {displayExp.bookingOptions[selectedOptionIndex].cutOff.cancellationPolicy.replace(/_/g, ' ').toUpperCase()}</Text>
                                                        <Text className="text-sm text-gray-600 dark:text-gray-400 mb-1"><Text className="font-medium text-gray-900 dark:text-white">Cut-off:</Text> {displayExp.bookingOptions[selectedOptionIndex].cutOff.cutoffHours} hours before</Text>
                                                    </View>
                                                )}
                                            </View>
                                        )}
                                    </>
                                ) : (
                                    <View className="border border-gray-200 dark:border-gray-800 rounded-2xl p-4 bg-white dark:bg-[#252527]">
                                        <Text className="text-gray-500 text-center">No options available for this date.</Text>
                                    </View>
                                )}

                                {/* Badges under Booking Actions */}
                                <View className="flex-row items-start mb-2 px-2 mt-4">
                                    <Ionicons name="checkmark-circle-outline" size={22} color="#10b981" className="mr-3" />
                                    <View className="flex-1">
                                        <Text className="text-gray-900 dark:text-white font-extrabold text-base mb-1">Free cancellation</Text>
                                        <Text className="text-gray-500 dark:text-gray-400 text-sm">Cancel up to 24 hours in advance for a full refund</Text>
                                    </View>
                                </View>
                            </View>
                        )}

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
                        onPress={() => {
                            if (bookingWidgetY > 0) {
                                scrollViewRef.current?.scrollTo({ y: bookingWidgetY + 400, animated: true });
                            }
                        }}
                        className="bg-[#1a2b49] dark:bg-[#58a6ff] px-6 py-3.5 rounded-full"
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
                            selectedOptionIndex={selectedOptionIndex}
                        />
                    )}

                {/* Ticket Selection Modal */}
                <Modal visible={isTicketModalVisible} transparent={true} animationType="slide">
                    <TouchableOpacity
                        className="flex-1 bg-black/50 justify-end"
                        activeOpacity={1}
                        onPress={() => setIsTicketModalVisible(false)}
                    >
                        <TouchableOpacity activeOpacity={1} className="bg-white dark:bg-[#1c1c1e] rounded-t-3xl p-6 pb-10">
                            <View className="flex-row justify-between items-center mb-6">
                                <Text className="text-2xl font-extrabold text-gray-900 dark:text-white">Select Tickets</Text>
                                <TouchableOpacity onPress={() => setIsTicketModalVisible(false)} className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center">
                                    <Ionicons name="close" size={20} color="#6b7280" />
                                </TouchableOpacity>
                            </View>

                            <View className="bg-gray-50 dark:bg-[#252527] rounded-3xl p-2 mb-6 border border-gray-200 dark:border-gray-800">
                                {Object.entries(participantCounts).map(([type, count], index) => {
                                    return (
                                        <React.Fragment key={index}>
                                            {index > 0 && <View className="h-[1px] bg-gray-200 dark:bg-gray-700 mx-3 my-1" />}
                                            <View className="flex-row items-center justify-between px-3 py-3">
                                                <View>
                                                    <Text className="text-gray-900 dark:text-white font-bold text-base">{type}</Text>
                                                </View>
                                                <View className="flex-row items-center gap-3">
                                                    <TouchableOpacity onPress={() => setParticipantCounts(prev => ({...prev, [type]: Math.max(type === 'Adult' ? 1 : 0, count - 1)}))} className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 items-center justify-center shadow-sm border border-gray-100 dark:border-gray-700">
                                                        <Ionicons name="remove" size={20} color="#111827" className="dark:text-white" style={{ opacity: type === 'Adult' && count <= 1 ? 0.3 : 1 }} />
                                                    </TouchableOpacity>
                                                    <Text className="text-gray-900 dark:text-white font-extrabold text-lg w-6 text-center">{count}</Text>
                                                    <TouchableOpacity onPress={() => setParticipantCounts(prev => ({...prev, [type]: count + 1}))} className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 items-center justify-center shadow-sm border border-gray-100 dark:border-gray-700">
                                                        <Ionicons name="add" size={20} color="#111827" className="dark:text-white" />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </React.Fragment>
                                    );
                                })}
                            </View>

                            <TouchableOpacity
                                onPress={() => setIsTicketModalVisible(false)}
                                className="bg-[#002b5c] dark:bg-[#58a6ff] w-full py-4 rounded-full flex-row items-center justify-center shadow-md"
                            >
                                <Text className="text-white font-extrabold text-lg">Apply</Text>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Modal>

                <FullItineraryModal 
                    visible={isItineraryModalVisible}
                    onClose={() => setIsItineraryModalVisible(false)}
                    onCheckAvailability={() => {
                        setIsItineraryModalVisible(false);
                        if (bookingWidgetY > 0) {
                            setTimeout(() => {
                                scrollViewRef.current?.scrollTo({ y: bookingWidgetY + 400, animated: true });
                            }, 300); // slight delay for modal close animation
                        }
                    }}
                    experience={displayExp}
                    isDark={isDark}
                />
            </View >
        </Modal >
    );
}
