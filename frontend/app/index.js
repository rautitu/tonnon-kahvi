// App.js or index.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { View, Text, StyleSheet } from 'react-native-web';  // Use react-native-web for web compat
import Home from './pages/Home';
import Endpoints from './pages/Endpoints';
import Coffees from './pages/Coffees';

export default function App() {
  return (
    <Router>
      <View style={styles.container}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/endpoints" element={<Endpoints />} />
          <Route path="/coffees" element={<Coffees />} />
        </Routes>
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
