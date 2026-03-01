import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useState } from "react";
import { Dimensions, FlatList, Image, Text, TouchableOpacity, View, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ExperienceDetail from "../../components/ExperienceDetail";
import { API_URL } from "../../constants/Config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { formatPrice } from "../../utils/currency";

const { width } = Dimensions.get('window');

interface WishlistItem {
    id: string;
    title: string;
    category: string;
    image: string;
    price: string;
    rating: number;
    reviews: string;
    features: string;
    isOriginal?: boolean;
    certified?: boolean;
    currency?: string;
    description?: string;
}

export default function WishlistScreen() {
    const [selectedExperience, setSelectedExperience] = useState<WishlistItem | null>(null);
    const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchWishlist = async () => {
        try {
            const userInfo = await AsyncStorage.getItem('userInfo');
            if (!userInfo) {
                setLoading(false);
                return;
            }
            const { token } = JSON.parse(userInfo);

            const response = await fetch(`${API_URL}/users/wishlist`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok && Array.isArray(data)) {
                const mappedWishlist = data.map((item: any) => ({
                    id: item._id,
                    title: item.title,
                    category: item.category,
                    image: item.images?.[0] || 'https://via.placeholder.com/400x300',
                    price: item.price ? item.price.toString() : 'N/A',
                    rating: item.rating || 0,
                    reviews: item.numReviews ? item.numReviews.toString() : '0',
                    features: item.duration ? `${item.duration} • ${item.location?.city || 'Unknown'}` : 'Details inside',
                    isOriginal: false, // Defaulting as backend doesn't seem to have this flag yet
                    certified: false, // Defaulting
                    description: item.description,
                    currency: item.currency || 'USD'
                }));
                setWishlist(mappedWishlist);
            }
        } catch (error) {
            console.error("Error fetching wishlist:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchWishlist();
        }, [])
    );

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchWishlist();
    }, []);

    const handleRemoveFromWishlist = async (id: string) => {
        try {
            const userInfo = await AsyncStorage.getItem('userInfo');
            if (!userInfo) return;
            const { token } = JSON.parse(userInfo);

            // Optimistic update
            setWishlist(current => current.filter(item => item.id !== id));

            const response = await fetch(`${API_URL}/users/wishlist/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                // Revert if failed (optional, or just fetch again)
                fetchWishlist();
                Alert.alert("Error", "Failed to remove item");
            }
        } catch (error) {
            console.error("Error removing from wishlist:", error);
            fetchWishlist();
        }
    };

    const renderWishlistCard = ({ item }: { item: WishlistItem }) => (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setSelectedExperience(item)}
            className="bg-white dark:bg-[#1c1c1e] rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 mb-6 shadow-sm mx-1"
        >
            <View className="relative">
                <Image source={{ uri: item.image }} className="w-full h-48" />
                {item.isOriginal && (
                    <View className="absolute top-3 left-3 flex-row items-center bg-black/20 px-2 py-1 rounded-md">
                        <View className="w-4 h-4 rounded-full bg-orange-500 items-center justify-center mr-1">
                            <Text className="text-[10px] text-white font-bold">TD</Text>
                        </View>
                        <Text className="text-white text-[10px] font-medium">Originals by TravellersDeal</Text>
                    </View>
                )}

                <TouchableOpacity
                    onPress={() => handleRemoveFromWishlist(item.id)}
                    className="absolute top-3 right-3 w-9 h-9 bg-white dark:bg-gray-800 rounded-full items-center justify-center shadow-lg"
                >
                    <Ionicons name="heart" size={20} color="#ef4444" />
                </TouchableOpacity>
            </View>

            <View className="p-5">
                <Text className="text-gray-500 dark:text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-1">{item.category}</Text>
                <Text className="text-gray-900 dark:text-white font-bold text-[18px] leading-tight" numberOfLines={2}>{item.title}</Text>

                <View className="flex-row items-center mt-3 gap-1">
                    <View className="flex-row">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <Ionicons
                                key={s}
                                name="star"
                                size={12}
                                color={s <= Math.floor(item.rating || 0) ? "#1f2937" : "#d1d5db"}
                                className={s <= Math.floor(item.rating || 0) ? "text-gray-900 dark:text-gray-200" : "text-gray-300 dark:text-gray-700"}
                            />
                        ))}
                    </View>
                    <Text className="text-gray-900 dark:text-white font-bold text-xs">{item.rating}</Text>
                    <Text className="text-gray-500 dark:text-gray-400 text-xs">({item.reviews})</Text>
                </View>

                <View className="flex-row items-center justify-between mt-4">
                    <View>
                        <Text className="text-gray-500 dark:text-gray-400 text-[10px]">From</Text>
                        <Text className="text-gray-900 dark:text-white font-extrabold text-xl">{formatPrice(item.price, item.currency || 'USD')}</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => setSelectedExperience(item)}
                        className="bg-[#002b5c] dark:bg-[#58a6ff] px-6 py-2.5 rounded-full"
                    >
                        <Text className="text-white font-bold text-sm">View details</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-black">
            <View className="px-6 py-4 flex-row items-center justify-between">
                <Text className="text-3xl font-extrabold text-[#002b5c] dark:text-white">Wishlist</Text>
                <TouchableOpacity onPress={fetchWishlist}>
                    {/* Using refresh icon instead of ellipsis for explicit refresh action */}
                    <Ionicons name="refresh" size={24} color="#6b7280" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#002b5c" />
                </View>
            ) : wishlist.length > 0 ? (
                <FlatList
                    data={wishlist}
                    renderItem={renderWishlistCard}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, paddingTop: 10 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                />
            ) : (
                <View className="flex-1 items-center justify-center px-10">
                    <View className="w-20 h-20 bg-gray-100 dark:bg-[#1c1c1e] rounded-full items-center justify-center mb-4">
                        <Ionicons name="heart-outline" size={40} color="#9ca3af" />
                    </View>
                    <Text className="text-xl font-bold text-gray-900 dark:text-white text-center">No heart-throbs yet</Text>
                    <Text className="text-gray-500 dark:text-gray-400 text-center mt-2 leading-6">
                        Start exploring and tap the heart icon to save your favorite experiences.
                    </Text>
                </View>
            )}

            <ExperienceDetail
                visible={!!selectedExperience}
                experience={selectedExperience as any}
                onClose={() => setSelectedExperience(null)}
            />
        </SafeAreaView>
    );
}

