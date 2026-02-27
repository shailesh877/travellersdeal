import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import { Dimensions, FlatList, Image, ImageBackground, Platform, ScrollView, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ExperienceDetail from "../../components/ExperienceDetail";
import { API_URL } from "../../constants/Config";
import { router, useFocusEffect } from "expo-router";
import { formatPrice } from "../../utils/currency";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get('window');

const categories = [
  { id: '1', name: 'Culture', icon: 'color-palette-outline' },
  { id: '2', name: 'Food', icon: 'restaurant-outline' },
  { id: '3', name: 'Nature', icon: 'leaf-outline' },
  { id: '4', name: 'Sports', icon: 'football-outline' },
  { id: '5', name: 'Trips', icon: 'boat-outline' },
];

export default function Home() {
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState('3');
  const [selectedExperience, setSelectedExperience] = useState<any | null>(null);
  const [experiences, setExperiences] = useState([]);
  const [attractions, setAttractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchWishlistIds();
    }, [])
  );

  const fetchWishlistIds = async () => {
    try {
      const userInfo = await AsyncStorage.getItem('userInfo');
      if (!userInfo) return;
      const { token } = JSON.parse(userInfo);

      const response = await fetch(`${API_URL}/users/wishlist`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setWishlistIds(new Set(data.map((item: any) => item._id)));
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    }
  };

  const toggleWishlist = async (experienceId: string) => {
    try {
      const userInfo = await AsyncStorage.getItem('userInfo');
      if (!userInfo) {
        // Redirect to login if needed, or show alert
        router.push("/(auth)/login");
        return;
      }
      const { token } = JSON.parse(userInfo);

      const isInWishlist = wishlistIds.has(experienceId);

      // Optimistic update
      setWishlistIds(prev => {
        const next = new Set(prev);
        if (isInWishlist) next.delete(experienceId);
        else next.add(experienceId);
        return next;
      });

      const method = isInWishlist ? 'DELETE' : 'POST';
      const response = await fetch(`${API_URL}/users/wishlist/${experienceId}`, {
        method,
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        // Revert
        fetchWishlistIds();
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      fetchWishlistIds();
    }
  };

  const fetchData = async () => {
    try {
      const [expRes, destRes] = await Promise.all([
        fetch(`${API_URL}/experiences?pageNumber=1`),
        fetch(`${API_URL}/experiences/destinations`)
      ]);

      const expData = await expRes.json();
      const destData = await destRes.json();

      setExperiences(expData.experiences || []);
      setAttractions(destData || []);
    } catch (error) {
      console.error("Error fetching home data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const submitSearch = () => {
    if (searchQuery.trim().length > 0) {
      router.push({ pathname: '/search', params: { query: searchQuery } });
      setSearchQuery('');
    }
  };

  const renderExperienceCard = ({ item }: { item: any }) => {
    const isLiked = wishlistIds.has(item._id);
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          console.log("Opening Experience:", item.title);
          setSelectedExperience(item);
        }}
        style={{ width: width * 0.65 }}
        className="mr-5 bg-gray-100 dark:bg-[#1c1c1e] rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800 mb-4"
      >
        <View className="relative">
          <Image source={{ uri: item.images?.[0] || 'https://via.placeholder.com/400x300' }} className="w-full h-44" />
          {item.isOriginal && (
            <View className="absolute top-3 left-3 flex-row items-center bg-black/20 px-2 py-1 rounded-md">
              <View className="w-4 h-4 rounded-full bg-orange-500 items-center justify-center mr-1">
                <Text className="text-[10px] text-white font-bold">TD</Text>
              </View>
              <Text className="text-white text-[10px] font-medium">Originals by TravellersDeal</Text>
            </View>
          )}
          <TouchableOpacity
            onPress={() => toggleWishlist(item._id)}
            className="absolute top-3 right-3 w-9 h-9 bg-white dark:bg-gray-800 rounded-full items-center justify-center shadow-lg"
          >
            <Ionicons name={isLiked ? "heart" : "heart-outline"} size={20} color={isLiked ? "#ef4444" : "#6b7280"} />
          </TouchableOpacity>
        </View>

        <View className="p-5">
          <Text className="text-gray-500 dark:text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-1">{item.category}</Text>
          <Text className="text-gray-900 dark:text-white font-bold text-[20px] leading-tight" numberOfLines={3}>{item.title}</Text>

          <Text className="text-gray-500 dark:text-gray-400 text-[15px] mt-2" numberOfLines={1}>
            {item.duration} hours • {typeof item.location === 'object' ? item.location?.city || 'Unknown' : item.location}
          </Text>

          {item.certified && (
            <View className="flex-row items-center mt-2 gap-1">
              <Ionicons name="checkmark-circle-outline" size={16} color="#9ca3af" />
              <Text className="text-gray-600 dark:text-gray-300 text-[13px]">Certified by Travellers Deal</Text>
            </View>
          )}

          <View className="flex-row items-center mt-3 gap-1">
            <View className="flex-row">
              {[1, 2, 3, 4, 5].map((s) => (
                <Ionicons key={s} name="star" size={12} color={s <= Math.floor(item.rating || 0) ? "#fbbf24" : "#4b5563"} />
              ))}
            </View>
            <Text className="text-gray-900 dark:text-white font-bold text-md">{item.rating || 0}</Text>
            <Text className="text-gray-500 dark:text-gray-400 text-md">({item.numReviews || 0})</Text>
          </View>

          <View className="mt-3 py-5">
            <Text className="text-gray-500 dark:text-gray-400 text-[10px]">From</Text>
            <View className="flex-row items-baseline gap-1">
              <Text className="text-gray-900 dark:text-white font-extrabold text-lg">{formatPrice(item.price, item.currency)}</Text>
              <Text className="text-gray-500 dark:text-gray-400 text-[10px]">per person</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderAttractionCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => router.push({ pathname: '/search', params: { query: item.city || item.title } })}
      style={{ width: width * 0.58 }}
      className="mr-4 rounded-2xl overflow-hidden aspect-[4/3] bg-gray-100 dark:bg-[#1c1c1e]"
    >
      <Image source={{ uri: item.image || item.images?.[0] || 'https://via.placeholder.com/400x300' }} className="absolute inset-0 w-full h-full" />
      <View className="absolute inset-0 bg-black/10 dark:bg-black/30" />
      <View className="p-3 justify-start">
        <View className="bg-black/80 self-start px-2 py-1 rounded-md mb-1 border border-white/20">
          <Text className="text-white font-bold text-[12px]">{item.city || item.title}</Text>
        </View>
        <View className="bg-white/90 dark:bg-gray-800/90 self-start px-2 py-0.5 rounded-md">
          <Text className="text-gray-900 dark:text-white text-[10px] font-medium">{item.count || 0} activities</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-black">
        <ActivityIndicator size="large" color="#002b5c" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-black">
      {/* FIXED SEARCH HEADER */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          paddingTop: (insets?.top ?? 0) + (Platform.OS === 'android' ? 10 : 0),
          backgroundColor: 'transparent',
        }}
        className="px-4 pb-4 flex-row items-center gap-2"
      >
        <View className="flex-1 flex-row items-center bg-white dark:bg-[#1c1c1e] rounded-full px-4 h-14 shadow-2xl elevation-10 border border-transparent dark:border-gray-800">
          <Image
            source={require("../../assets/images/icon.png")}
            className="w-8 h-8 rounded-lg mr-2"
            resizeMode="contain"
          />
          <Ionicons name="search" size={20} color="#6b7280" />
          <TextInput
            placeholder="Find places and things to do"
            className="flex-1 ml-3 text-gray-800 dark:text-white text-md"
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
        <TouchableOpacity className="w-14 h-14 bg-white dark:bg-[#1c1c1e] rounded-full items-center justify-center shadow-2xl elevation-10 border border-transparent dark:border-gray-800">
          <Ionicons name="map-outline" size={24} color="#6b7280" />
        </TouchableOpacity>
        <TouchableOpacity className="w-14 h-14 bg-white dark:bg-[#1c1c1e] rounded-full items-center justify-center shadow-2xl elevation-10 border border-transparent dark:border-gray-800">
          <Ionicons name="notifications-outline" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* HERO SECTION */}
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80' }}
          className="w-full h-[550px]"
        >
          {/* HERO TEXT */}
          <View className="flex-1 justify-end px-6 pb-28">
            <Text className="text-white text-5xl font-extrabold leading-tight">
              Find your next{"\n"}travel experience
            </Text>
            <TouchableOpacity className="flex-row items-center mt-6">
              <Text className="text-white font-bold text-xl underline">Learn more</Text>
              <Ionicons name="chevron-forward" size={24} color="white" className="ml-1" />
            </TouchableOpacity>
          </View>

          {/* CATEGORY NAV (OVERLAP) */}
          <View className="absolute bottom-0 left-0 right-0 bg-transparent">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="bg-black/50 "
              contentContainerStyle={{ alignItems: 'center', height: '100%' }}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setActiveCategory(cat.id)}
                  style={{ minWidth: 90 }}
                  className={`flex-col items-center justify-center h-20  rounded-t-2xl mx-1 px-4 ${activeCategory === cat.id ? 'bg-white dark:bg-[#1c1c1e]' : 'transparent'
                    }`}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={26}
                    color={activeCategory === cat.id ? (activeCategory === cat.id && activeCategory === cat.id ? '#000000' : '#ffffff') : '#ffffff'}
                    style={{ color: activeCategory === cat.id ? (undefined) : '#ffffff' }}
                  />
                  <Text
                    className={`text-xs font-bold mt-1 ${activeCategory === cat.id ? 'text-black dark:text-white' : 'text-white'
                      }`}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </ImageBackground>

        {/* EXPERIENCES LIST - Handles both default and search results */}
        <View className="px-6 mt-12 mb-8">
          <Text className="text-2xl font-extrabold text-[#002b5c] dark:text-[#58a6ff] mb-6">
            Unforgettable travel experiences
          </Text>

          <FlatList
            data={experiences}
            renderItem={renderExperienceCard}
            keyExtractor={(item: any) => item._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 20 }}
          />
        </View>

        {/* ATTRACTIONS YOU CAN'T MISS */}
        <View className="px-6 mb-24">
          <Text className="text-2xl font-extrabold text-[#002b5c] dark:text-[#58a6ff] mb-6">
            Things to do wherever you're going
          </Text>

          <FlatList
            data={attractions}
            renderItem={renderAttractionCard}
            keyExtractor={(item: any) => item._id || item.city}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 20 }}
          />
        </View>
      </ScrollView>

      <ExperienceDetail
        visible={!!selectedExperience}
        experience={selectedExperience}
        onClose={() => setSelectedExperience(null)}
      />
    </View>
  );
}



