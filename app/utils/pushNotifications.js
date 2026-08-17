import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/Config';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    try {
      // Project ID is needed in Expo SDK 49+
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      
      // Save token to backend
      await savePushTokenToBackend(token);
    } catch (e) {
      console.log('Push notification token generation failed (likely missing Firebase config):', e.message);
    }
    
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

async function savePushTokenToBackend(token) {
  try {
    const userInfo = await AsyncStorage.getItem('userInfo');
    if (!userInfo) return; // User not logged in
    
    const parsedUser = JSON.parse(userInfo);
    if (!parsedUser.token) return;

    // We assume your base API url is available. Update the URL if needed.
    const BASE_URL = API_URL;

    await fetch(`${BASE_URL}/users/push-token`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${parsedUser.token}`,
      },
      body: JSON.stringify({ expoPushToken: token }),
    });
    console.log('Push token saved to backend successfully');
  } catch (error) {
    console.error('Error saving push token to backend:', error);
  }
}
