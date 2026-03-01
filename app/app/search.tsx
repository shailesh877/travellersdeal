import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    FlatList,
    Image,
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ExperienceDetail from "../components/ExperienceDetail";
import { API_URL } from "../constants/Config";
import { formatPrice } from "../utils/currency";

const { width } = Dimensions.get("window");

const CATEGORIES = [
    { label: "All", icon: "globe-outline" },
    { label: "Tours", icon: "map-outline" },
    { label: "Tickets", icon: "ticket-outline" },
    { label: "Day Trips", icon: "sunny-outline" },
    { label: "Food", icon: "restaurant-outline" },
    { label: "Nature", icon: "leaf-outline" },
    { label: "Adventure", icon: "flash-outline" },
    { label: "Culture", icon: "library-outline" },
    { label: "Sports", icon: "football-outline" },
];

const PRICE_RANGES = [
    { label: "Under ₹1000", min: 0, max: 1000 },
    { label: "₹1000 – ₹5000", min: 1000, max: 5000 },
    { label: "₹5000 – ₹15000", min: 5000, max: 15000 },
    { label: "Over ₹15000", min: 15000, max: 10000000 },
];

const SORT_OPTIONS = [
    { label: "Recommended", value: "" },
    { label: "Price: Low to High", value: "price_asc" },
    { label: "Price: High to Low", value: "price_desc" },
    { label: "Top Rated", value: "rating" },
    { label: "Most Popular", value: "reviews" },
];

// Skeleton Card
function SkeletonCard() {
    const anim = useRef(new Animated.Value(0.3)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
                Animated.timing(anim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
            ])
        ).start();
    }, []);
    return (
        <Animated.View style={{ opacity: anim }} className="bg-white dark:bg-[#1c1c1e] rounded-2xl overflow-hidden mb-4 border border-gray-100 dark:border-gray-800">
            <View className="w-full h-48 bg-gray-200 dark:bg-gray-800" />
            <View className="p-4">
                <View className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full mb-2 w-4/5" />
                <View className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full mb-3 w-2/5" />
                <View className="flex-row justify-between">
                    <View className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full w-1/4" />
                    <View className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-1/3" />
                </View>
            </View>
        </Animated.View>
    );
}

export default function SearchScreen() {
    const { colorScheme } = useColorScheme();
    const params = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [query, setQuery] = useState((params.query as string) || "");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
    const [selectedExperience, setSelectedExperience] = useState<any | null>(null);

    // Filters & Sort
    const [showFilters, setShowFilters] = useState(false);
    const [activeCategory, setActiveCategory] = useState("All");
    const [selectedPriceIdx, setSelectedPriceIdx] = useState<number | null>(null);
    const [sortBy, setSortBy] = useState("");

    // View mode: list or grid
    const [viewMode, setViewMode] = useState<"list" | "grid">("list");

    const isDark = colorScheme === "dark";
    const iconColor = isDark ? "#ffffff" : "#111827";

    // Active filter count badge
    const filterCount =
        (activeCategory !== "All" ? 1 : 0) +
        (selectedPriceIdx !== null ? 1 : 0) +
        (sortBy ? 1 : 0);

    useEffect(() => {
        const q = (params.query as string) || '';
        if (q && q !== query) setQuery(q);
        fetchResults(q);
        fetchWishlistIds();
    }, [params.query]);

    useEffect(() => {
        fetchResults(query);
    }, [activeCategory, selectedPriceIdx, sortBy]);

    const fetchWishlistIds = async () => {
        try {
            const userInfo = await AsyncStorage.getItem("userInfo");
            if (!userInfo) return;
            const { token } = JSON.parse(userInfo);
            const res = await fetch(`${API_URL}/users/wishlist`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok && Array.isArray(data)) {
                setWishlistIds(new Set(data.map((i: any) => i._id)));
            }
        } catch { }
    };

    const fetchResults = async (searchQuery?: string) => {
        const q = searchQuery !== undefined ? searchQuery : query;
        setLoading(true);
        try {
            let url = `${API_URL}/experiences?pageNumber=1`;
            if (q.trim()) url += `&keyword=${encodeURIComponent(q.trim())}`;
            if (activeCategory !== 'All') url += `&category=${encodeURIComponent(activeCategory)}`;
            if (selectedPriceIdx !== null) {
                const p = PRICE_RANGES[selectedPriceIdx];
                url += `&minPrice=${p.min}&maxPrice=${p.max}`;
            }
            if (sortBy) url += `&sort=${sortBy}`;

            const res = await fetch(url);
            const data = await res.json();
            setResults(data.experiences || []);
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const toggleWishlist = async (id: string) => {
        try {
            const userInfo = await AsyncStorage.getItem("userInfo");
            if (!userInfo) { router.push("/(auth)/login"); return; }
            const { token } = JSON.parse(userInfo);
            const inWishlist = wishlistIds.has(id);
            setWishlistIds(prev => {
                const next = new Set(prev);
                inWishlist ? next.delete(id) : next.add(id);
                return next;
            });
            await fetch(`${API_URL}/users/wishlist/${id}`, {
                method: inWishlist ? "DELETE" : "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch { fetchWishlistIds(); }
    };

    const clearFilters = () => {
        setActiveCategory("All");
        setSelectedPriceIdx(null);
        setSortBy("");
    };

    const renderListCard = ({ item }: { item: any }) => {
        const isLiked = wishlistIds.has(item._id);
        return (
            <TouchableOpacity
                activeOpacity={0.92}
                onPress={() => setSelectedExperience(item)}
                className="bg-white dark:bg-[#1c1c1e] rounded-2xl overflow-hidden mb-4 border border-gray-100 dark:border-gray-800"
                style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
            >
                <View className="relative">
                    <Image
                        source={{ uri: item.images?.[0] || "https://via.placeholder.com/400x300" }}
                        className="w-full h-48"
                        resizeMode="cover"
                    />
                    {/* Gradient overlay */}
                    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, backgroundColor: 'transparent' }} />

                    <TouchableOpacity
                        onPress={() => toggleWishlist(item._id)}
                        className="absolute top-3 right-3 w-9 h-9 bg-white/90 dark:bg-black/60 rounded-full items-center justify-center"
                        style={{ shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, elevation: 3 }}
                    >
                        <Ionicons name={isLiked ? "heart" : "heart-outline"} size={18} color={isLiked ? "#ef4444" : "#6b7280"} />
                    </TouchableOpacity>

                    <View className="absolute top-3 left-3 bg-[#002b5c]/90 px-3 py-1 rounded-full">
                        <Text className="text-white text-[10px] font-black uppercase tracking-wider">{item.category}</Text>
                    </View>

                    {item.rating >= 4.5 && (
                        <View className="absolute bottom-3 left-3 bg-amber-400 px-2 py-0.5 rounded-full flex-row items-center">
                            <Ionicons name="star" size={10} color="#fff" />
                            <Text className="text-white text-[10px] font-black ml-1">Top Rated</Text>
                        </View>
                    )}
                </View>

                <View className="p-4">
                    <Text className="text-gray-900 dark:text-white font-bold text-base leading-snug mb-1" numberOfLines={2}>
                        {item.title}
                    </Text>

                    <View className="flex-row items-center mb-3">
                        <Ionicons name="location-outline" size={13} color="#9ca3af" />
                        <Text className="text-gray-400 text-xs ml-1">
                            {[item.location?.city, item.location?.country].filter(Boolean).join(", ") || "Location unknown"}
                        </Text>
                    </View>

                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg">
                            <Ionicons name="star" size={13} color="#f59e0b" />
                            <Text className="text-amber-700 dark:text-amber-400 font-bold text-sm ml-1">{item.rating?.toFixed(1) || "N/A"}</Text>
                            <Text className="text-gray-400 text-xs ml-1">({item.numReviews || 0})</Text>
                        </View>
                        <View className="items-end">
                            <Text className="text-gray-400 text-[10px]">From</Text>
                            <Text className="text-gray-900 dark:text-white font-black text-lg">{formatPrice(item.price, item.currency)}</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderGridCard = ({ item }: { item: any }) => {
        const isLiked = wishlistIds.has(item._id);
        const cardW = (width - 48) / 2;
        return (
            <TouchableOpacity
                activeOpacity={0.92}
                onPress={() => setSelectedExperience(item)}
                style={{ width: cardW, marginBottom: 12, marginRight: 12 }}
                className="bg-white dark:bg-[#1c1c1e] rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800"
            >
                <View className="relative">
                    <Image source={{ uri: item.images?.[0] }} style={{ width: cardW, height: cardW * 0.75 }} resizeMode="cover" />
                    <TouchableOpacity
                        onPress={() => toggleWishlist(item._id)}
                        className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full items-center justify-center"
                    >
                        <Ionicons name={isLiked ? "heart" : "heart-outline"} size={14} color={isLiked ? "#ef4444" : "#6b7280"} />
                    </TouchableOpacity>
                </View>
                <View className="p-3">
                    <Text className="text-gray-900 dark:text-white font-bold text-xs leading-tight mb-1" numberOfLines={2}>{item.title}</Text>
                    <View className="flex-row items-center justify-between mt-1">
                        <View className="flex-row items-center">
                            <Ionicons name="star" size={10} color="#f59e0b" />
                            <Text className="text-gray-600 dark:text-gray-300 text-[10px] ml-0.5">{item.rating?.toFixed(1)}</Text>
                        </View>
                        <Text className="text-gray-900 dark:text-white font-black text-xs">{formatPrice(item.price, item.currency)}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View className="flex-1 bg-gray-50 dark:bg-black" style={{ paddingTop: insets.top }}>

            {/* Search Header */}
            <View className="bg-white dark:bg-[#1c1c1e] px-4 pt-3 pb-0 border-b border-gray-100 dark:border-gray-800">
                <View className="flex-row items-center mb-3">
                    <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
                        <Ionicons name="arrow-back" size={24} color={iconColor} />
                    </TouchableOpacity>

                    <View className="flex-1 flex-row items-center bg-gray-100 dark:bg-gray-900 rounded-xl px-3 h-11 border border-gray-200 dark:border-gray-700">
                        <Ionicons name="search" size={18} color="#9ca3af" />
                        <TextInput
                            value={query}
                            onChangeText={setQuery}
                            onSubmitEditing={() => fetchResults(query)}
                            placeholder="Search experiences..."
                            className="flex-1 ml-2 text-base dark:text-white"
                            returnKeyType="search"
                            placeholderTextColor="#9ca3af"
                            autoFocus={!query}
                        />
                        {query.length > 0 && (
                            <TouchableOpacity onPress={() => { setQuery(""); }}>
                                <Ionicons name="close-circle" size={18} color="#9ca3af" />
                            </TouchableOpacity>
                        )}
                    </View>

                    <TouchableOpacity
                        onPress={() => setShowFilters(true)}
                        className="ml-3 w-11 h-11 bg-[#002b5c] rounded-xl items-center justify-center relative"
                    >
                        <Ionicons name="options-outline" size={20} color="white" />
                        {filterCount > 0 && (
                            <View className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full items-center justify-center">
                                <Text className="text-white text-[10px] font-black">{filterCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Category Pills */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3" contentContainerStyle={{ paddingRight: 16 }}>
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat.label}
                            onPress={() => setActiveCategory(cat.label)}
                            className={`flex-row items-center mr-2 px-4 py-2 rounded-full border ${activeCategory === cat.label
                                ? "bg-[#002b5c] border-[#002b5c]"
                                : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                                }`}
                        >
                            <Ionicons
                                name={cat.icon as any}
                                size={13}
                                color={activeCategory === cat.label ? "#fff" : "#9ca3af"}
                            />
                            <Text className={`ml-1.5 text-sm font-semibold ${activeCategory === cat.label ? "text-white" : "text-gray-600 dark:text-gray-400"}`}>
                                {cat.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Results */}
            {loading ? (
                <ScrollView contentContainerStyle={{ padding: 16 }}>
                    {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
                </ScrollView>
            ) : (
                <FlatList
                    key={viewMode}
                    data={results}
                    renderItem={viewMode === "list" ? renderListCard : renderGridCard}
                    keyExtractor={(item: any) => item._id}
                    numColumns={viewMode === "grid" ? 2 : 1}
                    contentContainerStyle={{ padding: 16 }}
                    columnWrapperStyle={viewMode === "grid" ? { justifyContent: "flex-start" } : undefined}
                    ListHeaderComponent={
                        <View className="flex-row items-center justify-between mb-4">
                            <View>
                                {query ? (
                                    <Text className="text-xl font-black dark:text-white" numberOfLines={1}>
                                        "{query}"
                                    </Text>
                                ) : (
                                    <Text className="text-xl font-black dark:text-white">All Experiences</Text>
                                )}
                                <Text className="text-gray-400 text-sm mt-0.5">
                                    {results.length} {results.length === 1 ? "result" : "results"} found
                                </Text>
                            </View>
                            <View className="flex-row items-center">
                                <TouchableOpacity
                                    onPress={() => setViewMode(viewMode === "list" ? "grid" : "list")}
                                    className="w-9 h-9 bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-gray-700 rounded-xl items-center justify-center"
                                >
                                    <Ionicons name={viewMode === "list" ? "grid-outline" : "list-outline"} size={18} color={iconColor} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    }
                    ListEmptyComponent={
                        <View className="items-center mt-16 px-8">
                            <View className="w-24 h-24 bg-gray-100 dark:bg-gray-900 rounded-full items-center justify-center mb-6">
                                <Ionicons name="search-outline" size={48} color="#9ca3af" />
                            </View>
                            <Text className="text-gray-900 dark:text-white font-black text-xl text-center mb-2">No results found</Text>
                            <Text className="text-gray-400 text-center text-sm leading-5">
                                {query ? `We couldn't find anything for "${query}"` : "No experiences available with the selected filters"}
                            </Text>
                            {filterCount > 0 && (
                                <TouchableOpacity onPress={clearFilters} className="mt-6 bg-[#002b5c] px-6 py-3 rounded-full">
                                    <Text className="text-white font-bold">Clear Filters</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Filter Modal */}
            <Modal visible={showFilters} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowFilters(false)}>
                <View className="flex-1 bg-white dark:bg-[#1c1c1e]">

                    {/* Filter Header */}
                    <View className="px-5 py-4 flex-row items-center justify-between border-b border-gray-100 dark:border-gray-800">
                        <TouchableOpacity onPress={clearFilters}>
                            <Text className="text-gray-500 font-medium text-sm">Clear all</Text>
                        </TouchableOpacity>
                        <Text className="text-gray-900 dark:text-white font-black text-lg">Filters & Sort</Text>
                        <TouchableOpacity onPress={() => setShowFilters(false)}>
                            <Ionicons name="close" size={24} color={iconColor} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>

                        {/* Sort */}
                        <Text className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-[11px] mb-3">Sort By</Text>
                        <View className="mb-6">
                            {SORT_OPTIONS.map((opt) => (
                                <TouchableOpacity
                                    key={opt.value}
                                    onPress={() => setSortBy(opt.value)}
                                    className={`flex-row items-center justify-between px-4 py-3.5 rounded-xl mb-2 border ${sortBy === opt.value
                                        ? "bg-[#002b5c]/10 border-[#002b5c] dark:bg-[#002b5c]/30"
                                        : "bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800"
                                        }`}
                                >
                                    <Text className={`font-semibold ${sortBy === opt.value ? "text-[#002b5c] dark:text-blue-400" : "text-gray-700 dark:text-gray-300"}`}>
                                        {opt.label}
                                    </Text>
                                    {sortBy === opt.value && <Ionicons name="checkmark-circle" size={20} color="#002b5c" />}
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Price */}
                        <Text className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-[11px] mb-3">Price Range</Text>
                        <View className="mb-6">
                            {PRICE_RANGES.map((p, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    onPress={() => setSelectedPriceIdx(selectedPriceIdx === idx ? null : idx)}
                                    className={`flex-row items-center justify-between px-4 py-3.5 rounded-xl mb-2 border ${selectedPriceIdx === idx
                                        ? "bg-[#002b5c]/10 border-[#002b5c] dark:bg-[#002b5c]/30"
                                        : "bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800"
                                        }`}
                                >
                                    <Text className={`font-semibold ${selectedPriceIdx === idx ? "text-[#002b5c] dark:text-blue-400" : "text-gray-700 dark:text-gray-300"}`}>
                                        {p.label}
                                    </Text>
                                    {selectedPriceIdx === idx && <Ionicons name="checkmark-circle" size={20} color="#002b5c" />}
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Category */}
                        <Text className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-[11px] mb-3">Category</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
                            {CATEGORIES.filter(c => c.label !== "All").map((cat) => (
                                <TouchableOpacity
                                    key={cat.label}
                                    onPress={() => setActiveCategory(activeCategory === cat.label ? "All" : cat.label)}
                                    className={`flex-row items-center px-4 py-2 rounded-full border ${activeCategory === cat.label
                                        ? "bg-[#002b5c] border-[#002b5c]"
                                        : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                                        }`}
                                >
                                    <Ionicons name={cat.icon as any} size={14} color={activeCategory === cat.label ? "#fff" : "#6b7280"} />
                                    <Text className={`ml-1.5 text-sm font-semibold ${activeCategory === cat.label ? "text-white" : "text-gray-600 dark:text-gray-400"}`}>
                                        {cat.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>

                    {/* Apply Button */}
                    <View className="p-5 border-t border-gray-100 dark:border-gray-800">
                        <TouchableOpacity
                            onPress={() => setShowFilters(false)}
                            className="bg-[#002b5c] w-full py-4 rounded-2xl items-center flex-row justify-center"
                        >
                            <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                            <Text className="text-white font-black text-lg ml-2">
                                Show {results.length} Results
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Experience Detail */}
            <ExperienceDetail
                visible={!!selectedExperience}
                experience={selectedExperience}
                onClose={() => setSelectedExperience(null)}
            />
        </View>
    );
}
