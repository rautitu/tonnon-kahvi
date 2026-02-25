import { Platform } from 'react-native';

const getApiUrl = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    // In production (HTTPS), use same origin with /api prefix (Caddy proxies to backend)
    // In development (HTTP), use direct backend port
    const { protocol, hostname, port } = window.location;
    if (protocol === 'https:') {
      return `${protocol}//${hostname}/api`;
    }
    return `http://${hostname}:8000`;
  }
  if (Platform.OS === 'android') return 'http://10.0.2.2:8000';
  if (Platform.OS === 'ios') return 'http://localhost:8000';
  return 'http://localhost:8000';
};

export const API_URL = getApiUrl();

// Determine if we should show mobile layout on frontend based on this screen width value
export const MOBILE_SCREEN_WIDTH_THRESHOLD = 768;
