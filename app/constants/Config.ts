// Replace with your actual production URL
const PROD_API_URL = 'https://backend.travellersdeal.com/api';
// Connect to local backend for development (must use local IP for Expo/mobile to reach host PC)
const DEV_API_URL = 'http://192.168.1.4:5001/api';

export const API_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;
