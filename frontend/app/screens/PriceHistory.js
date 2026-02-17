import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { LineChart } from 'react-native-chart-kit';
import { API_URL } from '../config';

const PriceHistory = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSource, setSelectedSource] = useState('all');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => sub?.remove();
  }, []);

  // Fetch product list
  useEffect(() => {
    fetch(`${API_URL}/coffees/products`)
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error('Error fetching products:', err));
  }, []);

  // Get unique data sources from products
  const dataSources = useMemo(() => {
    const sources = [...new Set(products.map((p) => p.data_source))];
    return sources.sort();
  }, [products]);

  // Filter products by selected source
  const filteredProducts = useMemo(() => {
    if (selectedSource === 'all') return products;
    return products.filter((p) => p.data_source === selectedSource);
  }, [products, selectedSource]);

  // Fetch history when product changes
  useEffect(() => {
    if (!selectedProduct) {
      setHistory([]);
      return;
    }
    setLoading(true);
    fetch(`${API_URL}/coffees/${selectedProduct}/history`)
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

  // Prepare chart data
  const chartData = useMemo(() => {
    if (history.length === 0) return null;

    const labels = history.map((row) => {
      const d = new Date(row.valid_from);
      return `${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`;
    });

    const normalPrices = history.map((row) => row.normal_price ?? 0);
    const batchPrices = history.map((row) => row.batch_price ?? null);
    const hasBatch = batchPrices.some((p) => p !== null);

    const datasets = [
      {
        data: normalPrices,
        color: (opacity = 1) => `rgba(54, 162, 235, ${opacity})`,
        strokeWidth: 2,
      },
    ];

    if (hasBatch) {
      datasets.push({
        data: batchPrices.map((p) => p ?? 0),
        color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
        strokeWidth: 2,
      });
    }

    // Thin out labels if too many
    const maxLabels = Math.floor(screenWidth / 80);
    const step = Math.max(1, Math.ceil(labels.length / maxLabels));
    const displayLabels = labels.map((l, i) => (i % step === 0 ? l : ''));

    return {
      labels: displayLabels,
      datasets,
      legend: hasBatch ? ['Normal price', 'Batch price'] : ['Normal price'],
    };
  }, [history, screenWidth]);

  const selectedProductName = useMemo(() => {
    const p = products.find((p) => p.id === selectedProduct);
    return p ? p.name_finnish : '';
  }, [products, selectedProduct]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Price History</Text>

      {/* Source filter */}
      <View style={styles.pickerContainer}>
        <Text style={styles.label}>Store:</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={selectedSource}
            onValueChange={(val) => {
              setSelectedSource(val);
              setSelectedProduct(null);
            }}
            style={styles.picker}
          >
            <Picker.Item label="All stores" value="all" />
            {dataSources.map((src) => (
              <Picker.Item key={src} label={src} value={src} />
            ))}
          </Picker>
        </View>
      </View>

      {/* Product picker */}
      <View style={styles.pickerContainer}>
        <Text style={styles.label}>Product:</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={selectedProduct}
            onValueChange={(val) => setSelectedProduct(val)}
            style={styles.picker}
          >
            <Picker.Item label="Select a product..." value={null} />
            {filteredProducts.map((p) => (
              <Picker.Item
                key={`${p.id}-${p.data_source}`}
                label={`${p.name_finnish} (${p.data_source})`}
                value={p.id}
              />
            ))}
          </Picker>
        </View>
      </View>

      {/* Loading */}
      {loading && (
        <ActivityIndicator size="large" color="#36a2eb" style={{ marginTop: 20 }} />
      )}

      {/* Chart */}
      {chartData && !loading && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>{selectedProductName}</Text>
          <ScrollView horizontal>
            <LineChart
              data={chartData}
              width={Math.max(screenWidth - 32, history.length * 60)}
              height={280}
              yAxisSuffix=" €"
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 2,
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                propsForDots: {
                  r: '4',
                  strokeWidth: '1',
                  stroke: '#36a2eb',
                },
                propsForBackgroundLines: {
                  strokeDasharray: '4',
                  stroke: '#e0e0e0',
                },
              }}
              bezier={false}
              style={styles.chart}
            />
          </ScrollView>
        </View>
      )}

      {/* Data table */}
      {history.length > 0 && !loading && (
        <View style={styles.tableContainer}>
          <Text style={styles.tableTitle}>Price changes</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, { flex: 2 }]}>Period</Text>
            <Text style={styles.headerCell}>Price</Text>
            <Text style={styles.headerCell}>Batch</Text>
            <Text style={styles.headerCell}>€/kg</Text>
          </View>
          {history.map((row, i) => {
            const from = new Date(row.valid_from).toLocaleDateString('fi-FI');
            const to = row.valid_to
              ? new Date(row.valid_to).toLocaleDateString('fi-FI')
              : 'now';
            const isBatch = row.batch_price != null && row.batch_price < row.normal_price;
            return (
              <View
                key={i}
                style={[
                  styles.tableRow,
                  isBatch && { backgroundColor: '#d9fdd3' },
                  i % 2 === 0 && !isBatch && { backgroundColor: '#f9f9f9' },
                ]}
              >
                <Text style={[styles.cell, { flex: 2 }]}>
                  {from} – {to}
                </Text>
                <Text style={styles.cell}>
                  {row.normal_price?.toFixed(2)} €
                </Text>
                <Text style={styles.cell}>
                  {row.batch_price ? `${row.batch_price.toFixed(2)} €` : '–'}
                </Text>
                <Text style={styles.cell}>
                  {row.price_per_weight ? `${row.price_per_weight.toFixed(2)}` : '–'}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Empty state */}
      {!loading && selectedProduct && history.length === 0 && (
        <Text style={styles.emptyText}>No price history found.</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: '#555',
  },
  pickerContainer: {
    marginBottom: 12,
  },
  pickerWrapper: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  picker: {
    height: 48,
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 8,
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    padding: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  headerCell: {
    flex: 1,
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cell: {
    flex: 1,
    fontSize: 13,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40,
    fontSize: 16,
  },
});

export default PriceHistory;
