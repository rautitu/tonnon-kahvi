// pages/Endpoints.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native-web';
import axios from 'axios';

export default function Endpoints() {
  const [data, setData] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:8000/endpoints')
      .then(res => setData(res.data))
      .catch(() => setData({ message: "Failed to load endpoints", available_endpoints: [] }));
  }, []);

  return (
    <View>
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
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  endpoint: {
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  method: {
    fontWeight: 'bold',
  }
});
