import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native-web';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function Home() {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    axios.get('http://localhost:8000/')
      .then(res => setMessage(res.data.message))
      .catch(err => setMessage("Error fetching welcome message"));
  }, []);

  return (
    <View>
      <Text style={styles.title}>{message}</Text>
      <Link to="/endpoints" style={styles.link}>View available endpoints</Link>
      <Link to="/coffees" style={styles.link}>View coffee prices</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  link: {
    fontSize: 18,
    color: 'blue',
    marginVertical: 10,
  },
});
