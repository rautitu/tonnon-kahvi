import { Platform } from 'react-native';

const getHost = () => {
  if (Platform.OS === 'android') return '10.0.2.2';       // Android emulator
  if (Platform.OS === 'ios') return 'localhost';          // iOS simulator
  if (Platform.OS === 'web') return window.location.hostname; // Browser (maybe Docker or host)
  return 'localhost';
};

export const API_URL = `http://${getHost()}:8000`;
