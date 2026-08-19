import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const userInfo = await AsyncStorage.getItem('userInfo');
        setIsLoggedIn(!!userInfo);
      } catch (e) {}
    };
    checkLogin();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={isDark ? "light" : "dark"} backgroundColor="transparent" translucent />

      {/* GLOBAL STATUS BAR OVERLAY FOR ALL TABS */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: insets?.top ?? 0,
          backgroundColor: isDark ? '#000000' : 'transparent',
          zIndex: 999,
        }}
      />

      <Tabs
        screenOptions={{
          tabBarActiveTintColor: isDark ? '#ffffff' : 'rgba(19, 18, 18, 1)',
          tabBarInactiveTintColor: '#6b7280',
          headerShown: false,
          tabBarStyle: {
            height: 65 + (insets?.bottom ?? 0),
            backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
            borderTopWidth: 1,
            borderTopColor: isDark ? '#333333' : '#f3f4f6',
            position: 'absolute',
            paddingBottom: insets?.bottom ?? 0,
            paddingTop: 10,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginBottom: 10,
          }
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Discover',
            tabBarIcon: ({ color, focused }) => (
              <View className="items-center justify-center w-full h-full">
                {focused && (
                  <View
                    style={{
                      position: 'absolute',
                      top: -10,
                      width: '250%',
                      borderTopWidth: 4,
                      borderTopColor: '#ea580c',
                      borderRadius: 2
                    }}
                  />
                )}
                <Ionicons name={focused ? 'search' : 'search-outline'} size={24} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="wishlist"
          options={{
            title: 'Wishlist',
            tabBarIcon: ({ color, focused }) => (
              <View className="items-center justify-center w-full h-full">
                {focused && (
                  <View
                    style={{
                      position: 'absolute',
                      top: -10,
                      width: '250%',
                      borderTopWidth: 4,
                      borderTopColor: '#ea580c',
                      borderRadius: 2
                    }}
                  />
                )}
                <Ionicons name={focused ? 'heart' : 'heart-outline'} size={24} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="cart"
          options={{
            title: 'Cart',
            tabBarIcon: ({ color, focused }) => (
              <View className="items-center justify-center w-full h-full">
                {focused && (
                  <View
                    style={{
                      position: 'absolute',
                      top: -10,
                      width: '250%',
                      borderTopWidth: 4,
                      borderTopColor: '#ea580c',
                      borderRadius: 2
                    }}
                  />
                )}
                <Ionicons name={focused ? 'cart' : 'cart-outline'} size={24} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="bookings"
          options={{
            title: 'My Bookings',
            tabBarIcon: ({ color, focused }) => (
              <View className="items-center justify-center w-full h-full">
                {focused && (
                  <View
                    style={{
                      position: 'absolute',
                      top: -10,
                      width: '250%',
                      borderTopWidth: 4,
                      borderTopColor: '#ea580c',
                      borderRadius: 2
                    }}
                  />
                )}
                <Ionicons name={focused ? 'map' : 'map-outline'} size={24} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: isLoggedIn ? 'Profile' : 'Log in',
            tabBarIcon: ({ color, focused }) => (
              <View className="items-center justify-center w-full h-full">
                {focused && (
                  <View
                    style={{
                      position: 'absolute',
                      top: -10,
                      width: '250%',
                      borderTopWidth: 4,
                      borderTopColor: '#ea580c',
                      borderRadius: 2
                    }}
                  />
                )}
                <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
              </View>
            ),
          }}
        />
      </Tabs>
    </View>
  );
}


