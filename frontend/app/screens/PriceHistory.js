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
            borderRadius: 6,
            border: '1px solid #30363d',
            backgroundColor: '#0d1117',
            color: '#e6edf3',
            width: '100%',
            boxSizing: 'border-box',
            outline: 'none',
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
              backgroundColor: '#161b22',
              border: '1px solid #30363d',
              borderRadius: 6,
              zIndex: 100,
            }}
          >
            {filteredItems.length === 0 && (
              <div style={{ padding: 10, color: '#8b949e' }}>No results</div>
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
                  color: '#e6edf3',
                  backgroundColor: item.value === selectedValue ? '#1c2128' : '#161b22',
                }}
                onMouseEnter={(e) => { e.target.style.backgroundColor = '#21262d'; }}
                onMouseLeave={(e) => { e.target.style.backgroundColor = item.value === selectedValue ? '#1c2128' : '#161b22'; }}
              >
                {item.label}
              </div>
            ))}
          </div>
        )}
      </View>
    );
  }

  // Native fallback
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

  const dropdownItems = useMemo(() => {
    return products.map((p) => ({
      label: `${p.name_finnish} (${p.data_source})`,
      value: p.id,
    }));
  }, [products]);

  const chartData = useMemo(() => {
    if (history.length === 0) return null;

    const labels = history.map((h) => {
      const d = new Date(h.valid_from);
      return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
    });

    const prices = history.map((h) => h.normal_price ?? 0);

    const maxLabels = 8;
    const step = Math.max(1, Math.floor(labels.length / maxLabels));
    const sparseLabels = labels.map((l, i) => (i % step === 0 ? l : ''));

    return {
      labels: sparseLabels,
      datasets: [
        {
          data: prices,
          color: (opacity = 1) => `rgba(88, 166, 255, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  }, [history]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Price History</Text>

      {productsLoading ? (
        <ActivityIndicator size="large" color="#58a6ff" />
      ) : (
        <Dropdown
          items={dropdownItems}
          selectedValue={selectedProduct}
          onValueChange={setSelectedProduct}
          placeholder="Select a product..."
        />
      )}

      {loading && <ActivityIndicator size="large" color="#58a6ff" style={{ marginTop: 20 }} />}

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
                backgroundColor: '#0d1117',
                backgroundGradientFrom: '#161b22',
                backgroundGradientTo: '#0d1117',
                decimalPlaces: 2,
                color: (opacity = 1) => `rgba(88, 166, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(139, 148, 158, ${opacity})`,
                style: { borderRadius: 8 },
                propsForDots: {
                  r: '4',
                  strokeWidth: '1',
                  stroke: '#58a6ff',
                },
                propsForBackgroundLines: {
                  stroke: '#21262d',
                  strokeWidth: 1,
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

          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>From</Text>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>To</Text>
            <Text style={styles.tableHeaderCell}>Price</Text>
            <Text style={styles.tableHeaderCell}>€/kg</Text>
          </View>

          {history.map((row, index) => (
            <View
              key={index}
              style={[
                styles.tableRow,
                index % 2 === 0 && { backgroundColor: '#161b22' },
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
    backgroundColor: '#0d1117',
    minHeight: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#e6edf3',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#e6edf3',
  },
  chartContainer: {
    marginTop: 16,
    backgroundColor: '#161b22',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#30363d',
  },
  tableContainer: {
    marginTop: 20,
    backgroundColor: '#0d1117',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#30363d',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#30363d',
    paddingBottom: 8,
    marginBottom: 4,
  },
  tableHeaderCell: {
    flex: 1,
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
    color: '#e6edf3',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#21262d',
    backgroundColor: '#0d1117',
  },
  tableCell: {
    flex: 1,
    fontSize: 13,
    textAlign: 'center',
    color: '#c9d1d9',
  },
  noData: {
    marginTop: 20,
    fontSize: 16,
    color: '#8b949e',
    textAlign: 'center',
  },
  nativeDropdown: {
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
    backgroundColor: '#161b22',
  },
  dropdownPlaceholder: {
    color: '#8b949e',
    marginBottom: 8,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#21262d',
    color: '#e6edf3',
  },
  dropdownItemSelected: {
    backgroundColor: '#1c2128',
  },
});
