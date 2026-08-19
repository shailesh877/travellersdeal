import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Image, Text, TouchableOpacity, View, ActivityIndicator, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BookingDetail from "../../components/BookingDetail";
import ReviewForm from "../../components/ReviewForm";
import { API_URL } from "../../constants/Config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { getImageUrl } from "../../utils/image";
import { formatPrice } from "../../utils/currency";

// Backend Booking Interface
interface Booking {
    _id: string;
    experience: {
        _id: string;
        title: string;
        images: string[];
        location?: { city: string; country: string };
        duration: string;
        itinerary: { title: string; description: string }[];
        currency?: string;
        bookingOptions?: any[];
    }; // Populated
    date: string;
    totalPrice: number;
    currency?: string;
    status: string;
    paymentStatus: string;
    paymentId?: string;
}

// Map backend booking to frontend display item
// derived from BookingCard props usage
interface BookingDisplayItem {
    id: string;
    title: string;
    date: string;
    amount: string;
    status: string;
    image: string;
    // Extra fields for BookingDetail if needed
    itinerary?: any[];
    payment?: any;
    raw: Booking;
}

const getStatusStyles = (status: string) => {
    switch (status?.toLowerCase()) {
        case 'confirmed':
        case 'approved':
            return {
                bg: 'bg-green-50 dark:bg-green-900/10',
                text: 'text-green-700 dark:text-green-400'
            };
        case 'pending':
            return {
                bg: 'bg-orange-50 dark:bg-orange-900/10',
                text: 'text-orange-700 dark:text-orange-400'
            };
        case 'completed':
            return {
                bg: 'bg-blue-50 dark:bg-blue-900/10',
                text: 'text-blue-700 dark:text-blue-400'
            };
        case 'cancelled':
        case 'rejected':
            return {
                bg: 'bg-red-50 dark:bg-red-900/10',
                text: 'text-red-700 dark:text-red-400'
            };
        default:
            return {
                bg: 'bg-gray-50 dark:bg-gray-800',
                text: 'text-gray-600 dark:text-gray-400'
            };
    }
};

const BookingCard = React.memo(({ item, onReviewPress }: { item: BookingDisplayItem; onReviewPress?: (booking: BookingDisplayItem) => void }) => {
    if (!item) return null;
    const styles = getStatusStyles(item.status);
    const isCompleted = item.status?.toLowerCase() === 'completed';

    return (
        <View className="bg-white dark:bg-[#1c1c1e] rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 mb-5 shadow-sm">
            <View className="flex-row p-4">
                <Image
                    source={{ uri: item.image || 'https://via.placeholder.com/150' }}
                    className="w-24 h-24 rounded-2xl bg-gray-200"
                />
                <View className="flex-1 ml-4 justify-between">
                    <View>
                        <View className="flex-row justify-between items-start mb-1">
                            <Text className="text-gray-400 dark:text-gray-500 text-[10px]" numberOfLines={1}>ID: {item?.id?.toUpperCase() || "N/A"}</Text>
                            <View className={`px-2 py-0.5 rounded-full ${styles.bg}`}>
                                <Text className={`text-[10px] font-bold ${styles.text} uppercase`}>{item.status}</Text>
                            </View>
                        </View>
                        <Text className="text-gray-900 dark:text-white font-medium text-sm leading-tight mb-1" numberOfLines={2}>
                            {item.title}
                        </Text>
                        <View className="flex-row items-center mb-1">
                            <Ionicons name="calendar-outline" size={12} color="#9ca3af" />
                            <Text className="text-gray-500 dark:text-gray-400 text-xs ml-1">
                                {new Date(item.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </Text>
                        </View>
                    </View>
                    <View className="flex-row justify-between items-center mt-1">
                        <Text className="text-[#002b5c] dark:text-[#58a6ff] font-black text-base">{item?.amount || "₹0"}</Text>
                        {isCompleted && onReviewPress && (
                            <TouchableOpacity onPress={() => onReviewPress(item)} className="bg-amber-100 dark:bg-amber-900/30 px-3 py-1 rounded-full flex-row items-center">
                                <Ionicons name="star" size={12} color="#F59E0B" />
                                <Text className="text-amber-700 dark:text-amber-400 font-bold text-xs ml-1">Review</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </View>
    );
});


export default function BookingsScreen() {
    const insets = useSafeAreaInsets();
    const [bookings, setBookings] = useState<BookingDisplayItem[]>([]);
    const [selectedBooking, setSelectedBooking] = useState<BookingDisplayItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [reviewFormVisible, setReviewFormVisible] = useState(false);
    const [reviewingBooking, setReviewingBooking] = useState<BookingDisplayItem | null>(null);

    const fetchBookings = async () => {
        try {
            const userInfo = await AsyncStorage.getItem('userInfo');
            if (!userInfo) return;
            const { token } = JSON.parse(userInfo);

            const response = await fetch(`${API_URL}/bookings/mybookings`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (response.ok) {
                // Map backend data to frontend display items
                const mappedBookings: BookingDisplayItem[] = data.map((b: Booking) => ({
                    id: b._id,
                    title: b.experience?.title || 'Untitled Experience',
                    date: b.date,
                    amount: formatPrice(b.totalPrice, b.currency || b.experience?.currency || 'INR'),
                    status: b.status,
                    image: getImageUrl(b.experience, 'https://via.placeholder.com/150'),

                    // Synthesize itinerary from experience description or backend itinerary
                    itinerary: b.experience?.itinerary?.map(it => ({
                        title: it.title,
                        location: b.experience?.location?.city || '',
                        time: 'TBD', // Backend doesn't have time per itinerary item yet
                        date: new Date(b.date).toDateString(),
                        type: 'stop'
                    })) || [],

                    payment: {
                        basePrice: formatPrice(b.totalPrice, b.currency || b.experience?.currency || 'INR'), // Simplified
                        taxes: 'Included',
                        total: formatPrice(b.totalPrice, b.currency || b.experience?.currency || 'INR'),
                        method: b.paymentStatus === 'paid' ? 'Online' : 'Pending',
                        transactionId: b.paymentId || 'N/A'
                    },
                    raw: b
                }));
                // Sort by date descending
                mappedBookings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setBookings(mappedBookings);
            }
        } catch (error) {
            console.error("Error fetching bookings:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchBookings();
        }, [])
    );

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchBookings();
    }, []);

    const renderItem = React.useCallback(({ item }: { item: BookingDisplayItem }) => (
        <TouchableOpacity onPress={() => setSelectedBooking(item)} activeOpacity={0.9}>
            <BookingCard item={item} />
        </TouchableOpacity>
    ), [setSelectedBooking]);

    const EmptyListComponent = () => (
        <View className="flex-1 items-center justify-center px-10 pt-20">
            <View className="w-20 h-20 bg-gray-100 dark:bg-[#1c1c1e] rounded-full items-center justify-center mb-4">
                <Ionicons name="briefcase-outline" size={32} color="#9ca3af" />
            </View>
            <Text className="text-xl font-bold text-gray-900 dark:text-white text-center">No trips found</Text>
            <Text className="text-gray-500 dark:text-gray-400 text-center mt-2 leading-6">
                Looks like you haven't booked any adventures yet.
            </Text>
        </View>
    );

    return (
        <View style={{ flex: 1, paddingTop: insets?.top ?? 0 }} className="bg-white dark:bg-black">
            <View className="px-6 py-4 flex-row justify-between items-center">
                <Text className="text-3xl font-extrabold text-[#002b5c] dark:text-white">My Bookings</Text>
                <TouchableOpacity activeOpacity={0.7} onPress={fetchBookings}>
                    <Ionicons name="refresh-outline" size={24} color="#002b5c" className="dark:text-white" />
                </TouchableOpacity>
            </View>

            {/* LIST SECTION */}
            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#002b5c" />
                </View>
            ) : bookings.length > 0 ? (
                <FlatList
                    data={bookings}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => setSelectedBooking(item)}>
                            <BookingCard item={item} onReviewPress={(booking) => {
                                setReviewingBooking(booking);
                                setReviewFormVisible(true);
                            }} />
                        </TouchableOpacity>
                    )}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: (insets?.bottom ?? 0) + 100 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                />
            ) : (
                <View className="flex-1 justify-center items-center px-10">
                    <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
                    <Text className="text-gray-900 dark:text-white font-bold text-xl mt-4">No bookings yet</Text>
                    <Text className="text-gray-500 dark:text-gray-400 text-center mt-2">Start exploring and book your first experience!</Text>
                </View>
            )}

            <BookingDetail
                visible={!!selectedBooking}
                booking={selectedBooking}
                onClose={() => setSelectedBooking(null)}
            />

            {reviewingBooking && (
                <ReviewForm
                    visible={reviewFormVisible}
                    onClose={() => {
                        setReviewFormVisible(false);
                        setReviewingBooking(null);
                    }}
                    experienceId={reviewingBooking.raw.experience._id}
                    experienceTitle={reviewingBooking.title}
                    onReviewSubmitted={() => {
                        fetchBookings();
                    }}
                />
            )}
        </View>
    );
}

