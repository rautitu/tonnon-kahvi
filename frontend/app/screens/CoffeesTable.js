import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { API_URL } from '../config';

const CoffeeTable = () => {
  const [coffeeData, setCoffeeData] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filters, setFilters] = useState({
    name: '',
    dataSource: '',
    minPrice: '',
    maxPrice: '',
  });

  // Fetch data from your backend
  useEffect(() => {
    fetchCoffeeData();
  }, []);

  const fetchCoffeeData = async () => {
    try {
      const response = await fetch(`${API_URL}/coffees`);
      const data = await response.json();
      setCoffeeData(data);
    } catch (error) {
      console.error('Error fetching coffee data:', error);
    }
  };

  // Sorting logic
  const sortedAndFilteredData = useMemo(() => {
    let filtered = coffeeData.filter(item => {
      const matchesName = item.name_finnish.toLowerCase().includes(filters.name.toLowerCase());
      const matchesDataSource = item.data_source.toLowerCase().includes(filters.dataSource.toLowerCase());
      const matchesMinPrice = filters.minPrice === '' || item.normal_price >= parseFloat(filters.minPrice);
      const matchesMaxPrice = filters.maxPrice === '' || item.normal_price <= parseFloat(filters.maxPrice);
      
      return matchesName && matchesDataSource && matchesMinPrice && matchesMaxPrice;
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [coffeeData, sortConfig, filters]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key === columnKey) {
      return sortConfig.direction === 'asc' ? '↑' : '↓';
    }
    return '↕';
  };

  const TableHeader = () => (
    <View style={styles.headerRow}>
      <TouchableOpacity 
        style={styles.headerCell} 
        onPress={() => handleSort('name_finnish')}
      >
        <Text style={styles.headerText}>Name {getSortIcon('name_finnish')}</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.headerCell} 
        onPress={() => handleSort('normal_price')}
      >
        <Text style={styles.headerText}>Price {getSortIcon('normal_price')}</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.headerCell} 
        onPress={() => handleSort('net_weight')}
      >
        <Text style={styles.headerText}>Weight {getSortIcon('net_weight')}</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.headerCell} 
        onPress={() => handleSort('data_source')}
      >
        <Text style={styles.headerText}>Source {getSortIcon('data_source')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRow = ({ item }) => (
    <View style={styles.row}>
      <View style={styles.cell}>
        <Text style={styles.cellText}>{item.name_finnish}</Text>
      </View>
      <View style={styles.cell}>
        <Text style={styles.cellText}>{item.normal_price.toFixed(2)} €</Text>
      </View>
      <View style={styles.cell}>
        <Text style={styles.cellText}>{item.net_weight.toFixed(2)} kg</Text>
      </View>
      <View style={styles.cell}>
        <Text style={styles.cellText}>{item.data_source}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Filters */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filtersTitle}>Filters</Text>
        <TextInput
          style={styles.filterInput}
          placeholder="Filter by name..."
          value={filters.name}
          onChangeText={(text) => setFilters({...filters, name: text})}
        />
        <TextInput
          style={styles.filterInput}
          placeholder="Filter by data source..."
          value={filters.dataSource}
          onChangeText={(text) => setFilters({...filters, dataSource: text})}
        />
        <View style={styles.priceFilters}>
          <TextInput
            style={[styles.filterInput, styles.priceInput]}
            placeholder="Min price"
            value={filters.minPrice}
            onChangeText={(text) => setFilters({...filters, minPrice: text})}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.filterInput, styles.priceInput]}
            placeholder="Max price"
            value={filters.maxPrice}
            onChangeText={(text) => setFilters({...filters, maxPrice: text})}
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Table */}
      <View style={styles.tableContainer}>
        <TableHeader />
        <FlatList
          data={sortedAndFilteredData}
          renderItem={renderRow}
          keyExtractor={(item, index) => index.toString()}
          style={styles.table}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  filtersContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
    backgroundColor: 'white',
  },
  priceFilters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceInput: {
    flex: 0.48,
  },
  tableContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerCell: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  table: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cell: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default CoffeeTable;