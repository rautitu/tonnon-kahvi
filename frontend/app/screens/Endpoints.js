import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import axios from 'axios';
import { API_URL } from '../config';

export default function Endpoints() {
  const [data, setData] = useState(null);

  useEffect(() => {
    axios.get(`${API_URL}/endpoints`)
      .then(res => setData(res.data))
      .catch(() => setData({ message: "Failed to load endpoints", available_endpoints: [] }));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{data?.message || "Loading..."}</Text>
      {data?.available_endpoints?.map((route, idx) => (
        <Text key={idx} style={styles.endpoint}>
          <Text style={styles.method}>{route.methods.join(", ")} </Text>
          {route.path}
        </Text>
      ))}
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
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#e6edf3',
  },
  endpoint: {
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: 4,
    color: '#c9d1d9',
  },
  method: {
    fontWeight: 'bold',
    color: '#58a6ff',
  },
});
