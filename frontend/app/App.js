import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// screens
import Home from './screens/Home';
import Endpoints from './screens/Endpoints';
import Coffees from './screens/Coffees';
import Coffees_v2 from './screens/Coffees_v2';

// creating navigator
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Endpoints" component={Endpoints} />
        <Stack.Screen name="Coffees" component={Coffees} />
        <Stack.Screen name="Coffees_v2" component={Coffees_v2} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
});