import { Platform } from 'react-native';

const getHost = () => {
  // Handle web platform first with proper window check
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  }
  if (Platform.OS === 'android') return '10.0.2.2';
  if (Platform.OS === 'ios') return 'localhost';
  return 'localhost';
};

export const API_URL = `http://${getHost()}:8000`;

// Determine if we should show mobile layout on frontend based on this screen width value
export const MOBILE_SCREEN_WIDTH_THRESHOLD = 768;