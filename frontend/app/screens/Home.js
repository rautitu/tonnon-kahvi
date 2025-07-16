import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, ScrollView  } from 'react-native';
import axios from 'axios';
import CoffeeTable from './CoffeesTable';

export default function Home({ navigation }) {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    axios.get('http://backend:8000/')
      .then(res => setMessage(res.data.message))
      .catch(err => setMessage("Error fetching welcome message"));
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <Text style={styles.title}>{message}</Text>
      <Button title="View available endpoints" onPress={() => navigation.navigate('Endpoints')} />
      <View style={{ marginTop: 10 }} />
      {/* Removed Coffees button */}
      {/* <Button title="View coffee prices" onPress={() => navigation.navigate('Coffees')} /> */}
      {/* Removed Coffees_v2 button */}
      {/* <View style={{ marginTop: 10 }} />
      <Button title="View coffee prices v2" onPress={() => navigation.navigate('Coffees_v2')} /> */}

      <View style={{ marginTop: 30 }}>
        <CoffeeTable />
      </View>
    </ScrollView>
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
