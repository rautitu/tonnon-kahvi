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
    <View style={styles.container}>
      <Text style={styles.header}>Available Coffees</Text>
      {coffees?.length > 0 ? coffees.map((coffee, idx) => (
        <View key={idx} style={styles.card}>
          <Text style={styles.name}>{coffee.name_finnish}</Text>
          <Text style={styles.price}>€{coffee.normal_price.toFixed(2)} • {coffee.net_weight}g</Text>
          <Text style={styles.source}>{coffee.data_source}</Text>
        </View>
      )) : <Text style={styles.loading}>Loading or no coffee data yet...</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#0d1117',
    minHeight: '100%',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#e6edf3',
  },
  card: {
    marginBottom: 12,
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#30363d',
  },
  name: {
    color: '#e6edf3',
    fontSize: 15,
  },
  price: {
    color: '#c9d1d9',
    fontSize: 14,
  },
  source: {
    fontSize: 12,
    color: '#8b949e',
  },
  loading: {
    color: '#8b949e',
  },
});
