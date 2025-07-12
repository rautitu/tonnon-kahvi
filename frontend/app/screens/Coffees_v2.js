import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { DataTable, TextInput } from 'react-native-paper';

const CoffeesScreen = () => {
  const [coffeeList, setCoffeeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetch('http://localhost:8000/coffees')
      .then((res) => res.json())
      .then((data) => {
        setCoffeeList(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching coffee data:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} />;

  const filtered = coffeeList.filter((item) =>
    item.name_finnish.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <View style={{ padding: 16 }}>
      <TextInput
        label="Filter by name"
        value={filter}
        onChangeText={setFilter}
        style={{ marginBottom: 16 }}
      />
      <DataTable>
        <DataTable.Header>
          <DataTable.Title>Name</DataTable.Title>
          <DataTable.Title numeric>Price</DataTable.Title>
          <DataTable.Title numeric>Weight</DataTable.Title>
          <DataTable.Title>Source</DataTable.Title>
        </DataTable.Header>

        {filtered.map((coffee, index) => (
          <DataTable.Row key={index}>
            <DataTable.Cell>{coffee.name_finnish}</DataTable.Cell>
            <DataTable.Cell numeric>{coffee.normal_price}</DataTable.Cell>
            <DataTable.Cell numeric>{coffee.net_weight}</DataTable.Cell>
            <DataTable.Cell>{coffee.data_source}</DataTable.Cell>
          </DataTable.Row>
        ))}
      </DataTable>
    </View>
  );
};

export default CoffeesScreen;
