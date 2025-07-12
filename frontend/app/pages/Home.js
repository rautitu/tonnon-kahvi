import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import axios from 'axios';

export default function Home({ navigation }) {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    axios.get('http://localhost:8000/')
      .then(res => setMessage(res.data.message))
      .catch(err => setMessage("Error fetching welcome message"));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{message}</Text>
      <Button title="View available endpoints" onPress={() => navigation.navigate('Endpoints')} />
      <View style={{ marginTop: 10 }} />
      <Button title="View coffee prices" onPress={() => navigation.navigate('Coffees')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
