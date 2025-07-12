//import { View, Text } from 'react-native';
//
//export default function App() {
//  return (
//    <View>
//      <Text>Hello Web!</Text>
//    </View>
//  );
//}

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { View, Text, StyleSheet } from 'react-native-web'; 
import Home from './pages/Home';
import Endpoints from './pages/Endpoints';
import Coffees from './pages/Coffees';

export default function App() {
  return (
    <Router>
      <View style={styles.container}>
        <Text>Available subpages:</Text>
{
//        <Routes>
//          <Route path="/" element={<Home />} />
//          <Route path="/endpoints" element={<Endpoints />} />
//          <Route path="/coffees" element={<Coffees />} />
//        </Routes>
}
      </View>
    </Router>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
});
