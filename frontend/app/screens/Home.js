import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import axios from 'axios';
import CoffeeTable from './CoffeesTable';
import { API_URL } from '../config';

export default function Home({ navigation }) {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    axios.get(`${API_URL}/`)
      .then(res => setMessage(res.data.message))
      .catch(err => {
        console.error("Full Axios error:", err.toJSON ? err.toJSON() : err);
        setMessage("Error fetching welcome message");
      });
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <Text style={styles.title}>{message}</Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Endpoints')}>
        <Text style={styles.buttonText}>View available endpoints</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('PriceHistory')}>
        <Text style={styles.buttonText}>Price History</Text>
      </TouchableOpacity>

      <View style={{ marginTop: 30 }}>
        <CoffeeTable />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 24,
    backgroundColor: '#0d1117',
    minHeight: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#e6edf3',
  },
  button: {
    backgroundColor: '#21262d',
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#58a6ff',
    fontSize: 16,
    fontWeight: '600',
  },
});
