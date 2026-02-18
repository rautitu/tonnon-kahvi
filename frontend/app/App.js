import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// screens
import Home from './screens/Home';
import Endpoints from './screens/Endpoints';
import PriceHistory from './screens/PriceHistory';

// Dark theme matching our palette
const AppDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#58a6ff',
    background: '#0d1117',
    card: '#161b22',
    text: '#e6edf3',
    border: '#30363d',
    notification: '#58a6ff',
  },
};

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer theme={AppDarkTheme}>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: '#161b22' },
          headerTintColor: '#e6edf3',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Endpoints" component={Endpoints} />
        <Stack.Screen name="PriceHistory" component={PriceHistory} options={{ title: 'Price History' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
