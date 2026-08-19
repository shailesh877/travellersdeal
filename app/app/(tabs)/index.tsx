import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import { Dimensions, FlatList, Image, ImageBackground, Platform, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Modal } from "react-native";
import { useColorScheme } from "nativewind";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ExperienceDetail from "../../components/ExperienceDetail";
import { API_URL } from "../../constants/Config";
import { router, useFocusEffect } from "expo-router";
import { formatPrice, getDisplayPrice } from "../../utils/currency";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getImageUrl } from "../../utils/image";
import Animated, { FadeInUp, FadeInRight } from "react-native-reanimated";

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
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [activeCategory, setActiveCategory] = useState('3');
  const [selectedExperience, setSelectedExperience] = useState<any | null>(null);
  const [experiences, setExperiences] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [attractions, setAttractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    await fetchWishlistIds();
    await fetchUnreadCount();
    setRefreshing(false);
  }, []);

  const [showLoginPopup, setShowLoginPopup] = useState(false);

  useEffect(() => {
    fetchData();
    checkGuestAndPrompt();
  }, []);

  const checkGuestAndPrompt = async () => {
    try {
      const userInfo = await AsyncStorage.getItem('userInfo');
      if (!userInfo) {
        // If not logged in, wait 10 seconds then show popup
        setTimeout(() => {
          setShowLoginPopup(true);
        }, 10000);
      }
    } catch (e) {
      console.log(e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchWishlistIds();
      fetchUnreadCount();
    }, [])
  );

  const fetchUnreadCount = async () => {
    try {
      const userInfo = await AsyncStorage.getItem('userInfo');
      if (!userInfo) return;
      const { token } = JSON.parse(userInfo);

      const response = await fetch(`${API_URL}/notifications/unread-count`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

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
      const [expRes, destRes, attrRes] = await Promise.all([
        fetch(`${API_URL}/experiences?pageNumber=1&limit=10`),
        fetch(`${API_URL}/homepage/destinations`),
        fetch(`${API_URL}/homepage/attractions`)
      ]);

      const expData = await expRes.json();
      const destData = await destRes.json();
      const attrData = await attrRes.json();

      setExperiences(expData.experiences || []);
      setDestinations(destData || []);
      setAttractions(attrData || []);
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

  const renderExperienceCard = ({ item, index }: { item: any, index: number }) => {
    const isLiked = wishlistIds.has(item._id);
    return (
      <Animated.View entering={FadeInRight.delay(index * 100).springify()}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            console.log("Opening Experience:", item.title);
            setSelectedExperience(item);
          }}
          style={{ width: width * 0.65 }}
          className="mr-5 bg-gray-100 dark:bg-[#1c1c1e] rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800 mb-4 flex-col"
        >
          <View className="relative">
            <Image
              source={{ uri: getImageUrl(item) }}
              className="w-full h-52"
            />
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

          <View className="p-4 flex-1">
            <View>
              <Text className="text-gray-500 dark:text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-1">{item.category}</Text>
              <Text className="text-gray-900 dark:text-white font-medium text-base leading-tight" numberOfLines={2}>{item.title}</Text>

              {(typeof item.location === 'object' ? item.location?.city : item.location) ? (
                <Text className="text-gray-500 dark:text-gray-400 text-[13px] mt-1" numberOfLines={1}>
                  {typeof item.location === 'object' ? item.location?.city : item.location}
                </Text>
              ) : null}

              {item.certified && (
                <View className="flex-row items-center mt-2 gap-1">
                  <Ionicons name="checkmark-circle-outline" size={16} color="#9ca3af" />
                  <Text className="text-gray-600 dark:text-gray-300 text-[13px]">Certified by Travellers Deal</Text>
                </View>
              )}
            </View>

            <View className="mt-2 flex-row justify-between items-end border-t border-gray-100 dark:border-gray-800 pt-2">
              <View className="flex-col pb-0.5">
                <View className="flex-row items-center mb-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Ionicons key={s} name={s <= Math.floor(item.averageRating || item.rating || 0) ? "star" : "star-outline"} size={12} color="#F59E0B" />
                  ))}
                  <Text className="text-gray-900 dark:text-white font-extrabold text-xs ml-1">{item.averageRating || item.rating || '0.0'}</Text>
                </View>
                <Text className="text-gray-600 dark:text-gray-400 text-[10px] tracking-tight underline">{item.numReviews || item.reviewsCount || '0'} reviews</Text>
              </View>

              <View className="items-end">
                <Text className="text-gray-500 dark:text-gray-400 text-[10px]">From</Text>
                <View className="flex-row items-baseline gap-1">
                  <Text className="text-gray-900 dark:text-white font-extrabold text-[16px] leading-none">{formatPrice(getDisplayPrice(item), item.currency)}</Text>
                  <Text className="text-gray-500 dark:text-gray-400 text-[10px]">per person</Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderDestinationCard = ({ item, index }: { item: any, index: number }) => (
    <Animated.View entering={FadeInUp.delay(index * 100).springify()}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push({ pathname: '/search', params: { query: item.city } })}
        style={{ width: width * 0.38 }}
        className="mr-3"
      >
        <View className="aspect-square rounded-2xl overflow-hidden mb-2 shadow-sm bg-gray-100 dark:bg-[#1c1c1e]">
          <Image source={{ uri: item.image || 'https://via.placeholder.com/400x400' }} className="w-full h-full object-cover" />
        </View>
        <Text className="text-[#1a2b49] dark:text-white font-bold text-base leading-tight ml-1">{item.city}</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderAttractionCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => router.push({ pathname: '/search', params: { query: item.title } })}
      style={{ width: width * 0.6 }}
      className="mr-3"
    >
      <View className="h-44 rounded-2xl overflow-hidden mb-2 shadow-sm bg-gray-100 dark:bg-[#1c1c1e]">
        <Image source={{ uri: item.image || item.images?.[0] || 'https://via.placeholder.com/400x300' }} className="w-full h-full object-cover" />
      </View>
      <Text className="text-[#1a2b49] dark:text-white font-bold text-lg leading-tight ml-1">{item.title}</Text>
      <Text className="text-gray-500 dark:text-gray-400 text-sm mt-0.5 ml-1">{item.activities} activities</Text>
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
        className="px-4 pb-4 flex-row items-center gap-3"
      >
        <View className="flex-1 flex-row items-center bg-white dark:bg-[#1c1c1e] rounded-full px-5 h-12 shadow-sm border border-transparent dark:border-gray-800">
          <Ionicons name="search" size={20} color={isDark ? "#ffffff" : "#1a2b49"} className="mr-3" />
          <TextInput
            placeholder="Find places and things to do"
            className="flex-1 ml-3 text-[#1a2b49] dark:text-white font-medium text-[15px]"
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={handleSearch}
            onSubmitEditing={submitSearch}
            returnKeyType="search"
            onFocus={submitSearch}
          />
        </View>
        <TouchableOpacity
          onPress={() => router.push('/notifications')}
          className="w-12 h-12 bg-white dark:bg-[#1c1c1e] rounded-full items-center justify-center shadow-sm border border-transparent dark:border-gray-800 relative"
        >
          <Ionicons name="notifications-outline" size={22} color={isDark ? "#ffffff" : "#1a2b49"} />
          {unreadCount > 0 && (
            <View className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border border-white dark:border-[#1c1c1e]" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#002b5c']}
            tintColor="#002b5c"
          />
        }
      >
        {/* HERO SECTION */}
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80' }}
          className="w-full aspect-[4/5] md:aspect-[3/4]"
        >
          {/* Top subtle dark gradient so the white text/nav stands out */}
          <View className="absolute top-0 left-0 right-0 h-48 bg-black/40" />

          {/* HERO TEXT - Positioned closely under header */}
          <View style={{ paddingTop: (insets?.top ?? 0) + 70 }} className="px-5">
            <Text className="text-white text-[32px] font-extrabold leading-tight shadow-md">
              Discover & book{"\n"}things to do
            </Text>
          </View>
        </ImageBackground>

        {/* THINGS TO DO WHEREVER YOU'RE GOING */}
        <View className="px-6 mt-12 mb-12">
          <Text className="text-2xl font-bold text-[#1a2b49] dark:text-white mb-5">
            Things to do wherever you're going
          </Text>

          <FlatList
            data={destinations}
            renderItem={renderDestinationCard}
            keyExtractor={(item: any) => item.city}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 20 }}
          />
        </View>

        {/* ATTRACTIONS YOU CAN'T MISS */}
        <View className="px-6 mb-12">
          <Text className="text-2xl font-bold text-[#1a2b49] dark:text-white mb-5">
            Attractions you can't miss
          </Text>

          <FlatList
            data={attractions}
            renderItem={renderAttractionCard}
            keyExtractor={(item: any) => item._id || item.title}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 20 }}
          />
        </View>

        {/* TOP RATED EXPERIENCES */}
        <View style={{ paddingBottom: (insets?.bottom ?? 0) + 100 }} className="px-6 mt-4">
          <Text className="text-2xl font-bold text-[#1a2b49] dark:text-white mb-5">
            Top Rated Experiences
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
      </ScrollView>

      <ExperienceDetail
        visible={!!selectedExperience}
        experience={selectedExperience}
        onClose={() => setSelectedExperience(null)}
      />

      {/* 10-Second Auto Login Prompt */}
      <Modal visible={showLoginPopup} transparent animationType="slide">
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white dark:bg-[#1c1c1e] rounded-t-3xl p-6 pb-12 shadow-2xl">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-[#1a2b49] dark:text-white text-2xl font-bold">Sign in for the best experience</Text>
              <TouchableOpacity onPress={() => setShowLoginPopup(false)} className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full">
                <Ionicons name="close" size={24} color={isDark ? "white" : "black"} />
              </TouchableOpacity>
            </View>
            <Text className="text-gray-600 dark:text-gray-400 mb-6 text-base">
              Create an account or log in to save your favorite experiences, get personalized recommendations, and access exclusive travel deals.
            </Text>
            <TouchableOpacity 
              onPress={() => {
                setShowLoginPopup(false);
                router.push('/(auth)/login');
              }}
              className="bg-[#0071eb] py-4 rounded-xl items-center"
            >
              <Text className="text-white font-bold text-lg">Continue to Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}



