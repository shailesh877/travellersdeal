import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from "nativewind";
import React, { useEffect, useState, useRef } from 'react';
import 'react-native-reanimated';
import { registerForPushNotificationsAsync } from '../utils/pushNotifications';
import * as Notifications from 'expo-notifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_900Black
} from '@expo-google-fonts/outfit';
import "../global.css";
import "../constants/i18n";

const THEME_KEY = 'user-theme';

// Prevent splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_900Black,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_KEY);
        if (savedTheme) {
          setColorScheme(savedTheme as any);
        } else {
          setColorScheme('system');
        }
      } catch (error) {
        console.log('Error loading theme', error);
      }
    };
    loadTheme();

    // Check for user login status
    const checkUser = async () => {
      try {
        const userInfo = await AsyncStorage.getItem('userInfo');
        if (userInfo) {
          // Register for push notifications once we confirm user is logged in
          registerForPushNotificationsAsync();
          
          setTimeout(() => {
            router.replace('/(tabs)');
          }, 0);
        }
      } catch (error) {
        console.log('Error checking auth', error);
      }
    }
    checkUser();
  }, []);

  if (!fontsLoaded) {
    return null; // Return null until fonts are loaded to prevent style flash
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} backgroundColor="transparent" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
