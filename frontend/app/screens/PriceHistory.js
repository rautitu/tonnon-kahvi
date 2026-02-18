import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { API_URL } from '../config';

// Simple dropdown using a native <select> on web, or a basic picker-like component
// For POC, we use a simple approach that works on web
const Dropdown = ({ items, selectedValue, onValueChange, placeholder }) => {
  const [searchText, setSearchText] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredItems = useMemo(() => {
    if (!searchText) return items;
    const lower = searchText.toLowerCase();
    return items.filter((item) => item.label.toLowerCase().includes(lower));
  }, [items, searchText]);

  const selectedLabel = useMemo(() => {
    const found = items.find((i) => i.value === selectedValue);
    return found ? found.label : '';
  }, [items, selectedValue]);

  if (Platform.OS === 'web') {
    return (
      <View style={{ position: 'relative', marginBottom: 12, zIndex: 10 }}>
        <input
          type="text"
          value={isOpen ? searchText : selectedLabel}
          placeholder={placeholder || 'Search...'}
          onFocus={() => { setIsOpen(true); setSearchText(''); }}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          onChange={(e) => setSearchText(e.target.value)}
          style={{
            padding: 10,
            fontSize: 16,
            borderRadius: 4,
            border: '1px solid #ddd',
            backgroundColor: 'white',
            width: '100%',
            boxSizing: 'border-box',
          }}
        />
        {isOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              maxHeight: 250,
              overflowY: 'auto',
              backgroundColor: 'white',
              border: '1px solid #ddd',
              borderRadius: 4,
              zIndex: 100,
            }}
          >
            {filteredItems.length === 0 && (
              <div style={{ padding: 10, color: '#888' }}>No results</div>
            )}
            {filteredItems.map((item) => (
              <div
                key={item.value}
                onMouseDown={() => {
                  onValueChange(item.value);
                  setSearchText('');
                  setIsOpen(false);
                }}
                style={{
                  padding: 10,
                  cursor: 'pointer',
                  backgroundColor: item.value === selectedValue ? '#e3f2fd' : 'white',
                }}
                onMouseEnter={(e) => { e.target.style.backgroundColor = '#f0f0f0'; }}
                onMouseLeave={(e) => { e.target.style.backgroundColor = item.value === selectedValue ? '#e3f2fd' : 'white'; }}
              >
                {item.label}
              </div>
            ))}
          </div>
        )}
      </View>
    );
  }

  // For native, fall back to buttons (or install @react-native-picker/picker)
  return (
    <View style={styles.nativeDropdown}>
      <Text style={styles.dropdownPlaceholder}>{placeholder}</Text>
      <ScrollView style={{ maxHeight: 200 }}>
        {items.map((item) => (
          <Text
            key={item.value}
            style={[
              styles.dropdownItem,
              selectedValue === item.value && styles.dropdownItemSelected,
            ]}
            onPress={() => onValueChange(item.value)}
          >
            {item.label}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
};

export default function PriceHistory() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const screenWidth = Dimensions.get('window').width;

  // Fetch product list
  useEffect(() => {
    fetch(`${API_URL}/coffees/products`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setProductsLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching products:', err);
        setProductsLoading(false);
      });
  }, []);

  // Fetch price history when product changes
  useEffect(() => {
    if (!selectedProduct) {
      setHistory([]);
      return;
    }
    setLoading(true);
    fetch(`${API_URL}/coffees/${encodeURIComponent(selectedProduct)}/history`)
      .then((res) => res.json())
      .then((data) => {
        setHistory(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching history:', err);
        setLoading(false);
      });
  }, [selectedProduct]);

  // Prepare dropdown items
  const dropdownItems = useMemo(() => {
    return products.map((p) => ({
      label: `${p.name_finnish} (${p.data_source})`,
      value: p.id,
    }));
  }, [products]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (history.length === 0) return null;

    const labels = history.map((h) => {
      const d = new Date(h.valid_from);
      return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
    });

    const prices = history.map((h) => h.normal_price ?? 0);

    // Limit labels to avoid crowding
    const maxLabels = 8;
    const step = Math.max(1, Math.floor(labels.length / maxLabels));
    const sparseLabels = labels.map((l, i) => (i % step === 0 ? l : ''));

    return {
      labels: sparseLabels,
      datasets: [
        {
          data: prices,
          color: (opacity = 1) => `rgba(75, 122, 192, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  }, [history]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Price History</Text>

      {productsLoading ? (
        <ActivityIndicator size="large" />
      ) : (
        <Dropdown
          items={dropdownItems}
          selectedValue={selectedProduct}
          onValueChange={setSelectedProduct}
          placeholder="Select a product..."
        />
      )}

      {loading && <ActivityIndicator size="large" style={{ marginTop: 20 }} />}

      {/* Chart */}
      {chartData && !loading && (
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>
            {history[0]?.name_finnish} — Price over time
          </Text>
          <ScrollView horizontal>
            <LineChart
              data={chartData}
              width={Math.max(screenWidth - 40, history.length * 40)}
              height={260}
              yAxisSuffix=" €"
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#f5f5f5',
                decimalPlaces: 2,
                color: (opacity = 1) => `rgba(75, 122, 192, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: { borderRadius: 8 },
                propsForDots: {
                  r: '4',
                  strokeWidth: '1',
                  stroke: '#4b7ac0',
                },
              }}
              bezier
              style={{ borderRadius: 8 }}
            />
          </ScrollView>
        </View>
      )}

      {/* Data table */}
      {history.length > 0 && !loading && (
        <View style={styles.tableContainer}>
          <Text style={styles.sectionTitle}>Data points</Text>

          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>From</Text>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>To</Text>
            <Text style={styles.tableHeaderCell}>Price</Text>
            <Text style={styles.tableHeaderCell}>€/kg</Text>
          </View>

          {/* Rows */}
          {history.map((row, index) => (
            <View
              key={index}
              style={[
                styles.tableRow,
                index % 2 === 0 && { backgroundColor: '#f9f9f9' },
              ]}
            >
              <Text style={[styles.tableCell, { flex: 2 }]}>
                {new Date(row.valid_from).toLocaleDateString('fi-FI')}
              </Text>
              <Text style={[styles.tableCell, { flex: 2 }]}>
                {row.valid_to
                  ? new Date(row.valid_to).toLocaleDateString('fi-FI')
                  : '—'}
              </Text>
              <Text style={styles.tableCell}>
                {row.normal_price?.toFixed(2)} €
              </Text>
              <Text style={styles.tableCell}>
                {row.price_per_weight?.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {selectedProduct && history.length === 0 && !loading && (
        <Text style={styles.noData}>No price history found for this product.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  chartContainer: {
    marginTop: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tableContainer: {
    marginTop: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#ddd',
    paddingBottom: 8,
    marginBottom: 4,
  },
  tableHeaderCell: {
    flex: 1,
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tableCell: {
    flex: 1,
    fontSize: 13,
    textAlign: 'center',
  },
  noData: {
    marginTop: 20,
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  nativeDropdown: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
  },
  dropdownPlaceholder: {
    color: '#888',
    marginBottom: 8,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItemSelected: {
    backgroundColor: '#e3f2fd',
  },
});
