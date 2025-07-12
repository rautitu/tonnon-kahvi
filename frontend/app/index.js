import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import axios from 'axios';

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:8000/endpoints')
      .then((res) => {
        console.log('Backend response:', res.data);
        setData(res.data);
      })
      .catch((err) => {
        console.error("API Error:", err);
        setError("Failed to fetch data. Make sure the backend server is running.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Use a conditional check to ensure data exists before trying to render */}
      {data ? (
        <>
          <Text style={styles.message}>Message: {data.message}</Text>
          <Text style={styles.header}>Available endpoints:</Text>
          {data.available_endpoints?.map((route, index) => (
            <Text key={index} style={styles.endpoint}>
              <Text style={styles.method}>{route.methods.join(", ")}</Text> {route.path}
            </Text>
          ))}
        </>
      ) : (
        <Text>No data received from the server.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  message: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  header: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  endpoint: {
    fontFamily: 'monospace',
    fontSize: 14,
    marginBottom: 4,
  },
  method: {
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  }
});