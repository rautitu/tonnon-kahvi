import { Platform } from 'react-native';

const getHost = () => {
  if (Platform.OS === 'android') return '10.0.2.2';       // Android emulator
  if (Platform.OS === 'ios') return 'localhost';          // iOS simulator
  if (Platform.OS === 'web') {
    // Check if running in a browser (client-side)
    if (typeof window !== 'undefined') {
      // If accessing from host browser, Docker's API might be on 'localhost' or a specific IP
      // Use window.location.hostname if API is on the same domain, else hardcode host IP
      return window.location.hostname === 'localhost' ? 'localhost' : '192.168.1.243';
    }
    // Fallback for SSR or non-browser environments
    return 'localhost';
  }
  return 'localhost'; // Default fallback
};

export const API_URL = `http://${getHost()}:8000`;