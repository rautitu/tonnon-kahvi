// pages/Coffees.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import axios from 'axios';
import { API_URL } from '../config';

export default function Coffees() {
  const [coffees, setCoffees] = useState(null);

  useEffect(() => {
    axios.get(`${API_URL}/coffees`)
      .then(res => setCoffees(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <View>
      <Text style={styles.header}>Available Coffees</Text>
      {coffees?.length > 0 ? coffees.map((coffee, idx) => (
        <View key={idx} style={styles.card}>
          <Text>{coffee.name_finnish}</Text>
          <Text>€{coffee.normal_price.toFixed(2)} • {coffee.net_weight}g</Text>
          <Text style={styles.source}>{coffee.data_source}</Text>
        </View>
      )) : <Text>Loading or no coffee data yet...</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    marginBottom: 12,
    padding: 8,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  source: {
    fontSize: 12,
    color: '#777',
  }
});
