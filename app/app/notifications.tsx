import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/Config';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const userInfo = await AsyncStorage.getItem('userInfo');
      if (!userInfo) {
        router.replace('/(auth)/login');
        return;
      }
      const { token } = JSON.parse(userInfo);

      // Fetch notifications
      const response = await fetch(`${API_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }

      // Mark all as read in background
      await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    return (
      <View
        className={`p-4 mb-2 rounded-xl flex-row items-start ${item.isRead ? 'bg-white dark:bg-[#1c1c1e]' : 'bg-orange-50 dark:bg-orange-950/20'
          }`}
      >
        <View className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/40 items-center justify-center mr-3 mt-1">
          <Ionicons
            name={item.type === 'booking_update' ? 'calendar' : 'notifications'}
            size={20}
            color="#ea580c"
          />
        </View>
        <View className="flex-1">
          <Text className="text-[#1a2b49] dark:text-white font-bold text-base mb-1">
            {item.title}
          </Text>
          <Text className="text-gray-600 dark:text-gray-300 text-[14px] leading-5">
            {item.message}
          </Text>
          <Text className="text-gray-400 dark:text-gray-500 text-xs mt-2">
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
          </Text>
        </View>
        {!item.isRead && (
          <View className="w-2 h-2 rounded-full bg-orange-500 mt-2" />
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black">
      <Stack.Screen options={{ title: 'Notifications' }} />

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#ea580c" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View className="flex-1 justify-center items-center mt-20">
              <Ionicons name="notifications-off-outline" size={64} color="#9ca3af" />
              <Text className="text-gray-500 dark:text-gray-400 text-lg mt-4 font-medium">
                No notifications yet
              </Text>
              <Text className="text-gray-400 dark:text-gray-500 text-center mt-2 px-8">
                When you get updates about your bookings or account, they'll show up here.
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
