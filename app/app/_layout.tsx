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
import { Text, TextInput, StyleSheet } from 'react-native';

// --- GLOBAL FONT OVERRIDE ---
if (!(Text as any).__isCustomRenderSet) {
  const oldTextRender = (Text as any).render;
  (Text as any).render = function (...args: any[]) {
      const origin = oldTextRender.call(this, ...args);
      if (!origin || !origin.props) return origin;

      let fontFamily = 'Outfit_400Regular';
      let newStyle = StyleSheet.flatten(origin.props.style) || {};
      
      // Ignore if it's already a different custom font family (like vector icons)
      if (newStyle.fontFamily && !newStyle.fontFamily.startsWith('Outfit')) {
           return origin; 
      }

      if (newStyle.fontWeight) {
          const fw = String(newStyle.fontWeight);
          if (fw === '500') fontFamily = 'Outfit_500Medium';
          else if (fw === '600') fontFamily = 'Outfit_600SemiBold';
          else if (fw === '700' || fw === 'bold') fontFamily = 'Outfit_700Bold';
          else if (fw === '800' || fw === '900' || fw === 'black' || fw === 'extrabold') fontFamily = 'Outfit_900Black';
          delete newStyle.fontWeight;
      }
      
      if (newStyle.fontFamily && newStyle.fontFamily.startsWith('Outfit_')) {
          fontFamily = newStyle.fontFamily;
      }

      newStyle.fontFamily = fontFamily;

      return React.cloneElement(origin, {
          style: newStyle
      });
  };
  (Text as any).__isCustomRenderSet = true;
}

if (!(TextInput as any).__isCustomRenderSet) {
  const oldTextInputRender = (TextInput as any).render;
  (TextInput as any).render = function (...args: any[]) {
      const origin = oldTextInputRender.call(this, ...args);
      if (!origin || !origin.props) return origin;

      let fontFamily = 'Outfit_400Regular';
      let newStyle = StyleSheet.flatten(origin.props.style) || {};
      
      if (newStyle.fontFamily && !newStyle.fontFamily.startsWith('Outfit')) {
           return origin; 
      }

      if (newStyle.fontWeight) {
          const fw = String(newStyle.fontWeight);
          if (fw === '500') fontFamily = 'Outfit_500Medium';
          else if (fw === '600') fontFamily = 'Outfit_600SemiBold';
          else if (fw === '700' || fw === 'bold') fontFamily = 'Outfit_700Bold';
          else if (fw === '800' || fw === '900' || fw === 'black' || fw === 'extrabold') fontFamily = 'Outfit_900Black';
          delete newStyle.fontWeight;
      }
      
      if (newStyle.fontFamily && newStyle.fontFamily.startsWith('Outfit_')) {
          fontFamily = newStyle.fontFamily;
      }

      newStyle.fontFamily = fontFamily;

      return React.cloneElement(origin, {
          style: newStyle
      });
  };
  (TextInput as any).__isCustomRenderSet = true;
}
// -----------------------------

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
    if (!fontsLoaded) return; // Wait until fonts load and RootLayout is actually rendering the Stack

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

    // Check for user login status and onboarding
    const checkStatus = async () => {
      try {
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
        if (!hasSeenOnboarding) {
          setTimeout(() => {
            router.replace('/onboarding');
          }, 0);
          return;
        }

        const userInfo = await AsyncStorage.getItem('userInfo');
        if (userInfo) {
          // Register for push notifications once we confirm user is logged in
          registerForPushNotificationsAsync();
          
          setTimeout(() => {
            router.replace('/(tabs)');
          }, 0);
        } else {
          setTimeout(() => {
            router.replace('/(auth)/login');
          }, 0);
        }
      } catch (error) {
        console.log('Error checking auth/onboarding', error);
      }
    }
    checkStatus();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null; // Return null until fonts are loaded to prevent style flash
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} backgroundColor="transparent" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
