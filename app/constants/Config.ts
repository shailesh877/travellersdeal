// Replace with your actual production URL
// const PROD_API_URL = 'https://backend.travellersdeal.com/api';
const ip = '10.148.155.73';
const PROD_API_URL = `http://${ip}:5001/api`;
// Connect to local backend for development (must use local IP for Expo/mobile to reach host PC)
// However, User requested to fetch from the live PRODUCTION server directly instead of local
// const DEV_API_URL = 'https://backend.travellersdeal.com/api';
const DEV_API_URL = `http://${ip}:5001/api`;


export const API_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;