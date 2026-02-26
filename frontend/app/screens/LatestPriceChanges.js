import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { API_URL, MOBILE_SCREEN_WIDTH_THRESHOLD } from '../config';

export default function LatestPriceChanges() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => subscription?.remove();
  }, []);

  const isMobile = screenWidth < MOBILE_SCREEN_WIDTH_THRESHOLD;

  useEffect(() => {
    fetch(`${API_URL}/coffees/latest-price-changes?limit=50`)
      .then((res) => res.json())
      .then((rows) => {
        setData(rows);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching latest price changes:', err);
        setLoading(false);
      });
  }, []);

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('fi-FI');
    } catch {
      return dateStr;
    }
  };

  const formatChange = (before, after) => {
    const diff = after - before;
    const sign = diff > 0 ? '+' : '';
    return `${sign}${diff.toFixed(2)} €`;
  };

  const renderMobileCard = (row, index) => {
    const diff = row.price_after - row.price_before;
    const changeColor = diff > 0 ? '#f85149' : '#3fb950';

    return (
      <View
        key={index}
        style={[
          styles.card,
          index % 2 === 0 && { backgroundColor: '#1c2129' },
        ]}
      >
        <Text style={styles.cardProduct} numberOfLines={2}>
          {row.product_name}
        </Text>
        <Text style={styles.cardSource}>{row.data_source}</Text>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>
            {row.price_before.toFixed(2)} € → {row.price_after.toFixed(2)} €
          </Text>
          <Text style={[styles.cardChange, { color: changeColor }]}>
            {formatChange(row.price_before, row.price_after)}
          </Text>
        </View>
        <Text style={styles.cardDate}>{formatDate(row.change_date)}</Text>
      </View>
    );
  };

  const renderDesktopTable = () => (
    <View style={styles.tableContainer}>
      {/* Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.headerCell, { flex: 3 }]}>Product</Text>
        <Text style={[styles.headerCell, { flex: 1.5 }]}>Market</Text>
        <Text style={[styles.headerCell, { flex: 1 }]}>Before</Text>
        <Text style={[styles.headerCell, { flex: 1 }]}>After</Text>
        <Text style={[styles.headerCell, { flex: 1 }]}>Change</Text>
        <Text style={[styles.headerCell, { flex: 1.2 }]}>Date</Text>
      </View>

      {/* Rows */}
      {data.map((row, index) => {
        const diff = row.price_after - row.price_before;
        const changeColor = diff > 0 ? '#f85149' : '#3fb950';

        return (
          <View
            key={index}
            style={[
              styles.tableRow,
              index % 2 === 0 && { backgroundColor: '#1c2129' },
            ]}
          >
            <Text style={[styles.cell, { flex: 3 }]} numberOfLines={2}>
              {row.product_name}
            </Text>
            <Text style={[styles.cell, { flex: 1.5 }]}>
              {row.data_source}
            </Text>
            <Text style={[styles.cell, { flex: 1 }]}>
              {row.price_before.toFixed(2)} €
            </Text>
            <Text style={[styles.cell, { flex: 1 }]}>
              {row.price_after.toFixed(2)} €
            </Text>
            <Text style={[styles.cell, { flex: 1, color: changeColor }]}>
              {formatChange(row.price_before, row.price_after)}
            </Text>
            <Text style={[styles.cell, { flex: 1.2 }]}>
              {formatDate(row.change_date)}
            </Text>
          </View>
        );
      })}
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Latest Price Changes</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#58a6ff" />
      ) : data.length === 0 ? (
        <Text style={styles.noData}>No price changes found.</Text>
      ) : isMobile ? (
        <View style={styles.cardContainer}>
          {data.map((row, index) => renderMobileCard(row, index))}
        </View>
      ) : (
        renderDesktopTable()
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: '#131720',
    minHeight: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#e6edf3',
  },
  noData: {
    marginTop: 20,
    fontSize: 16,
    color: '#8b949e',
    textAlign: 'center',
  },
  // Desktop table styles
  tableContainer: {
    backgroundColor: '#131720',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#3b4252',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#3b4252',
    paddingBottom: 8,
    marginBottom: 4,
  },
  headerCell: {
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
    color: '#e6edf3',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#272d37',
    backgroundColor: '#131720',
    alignItems: 'center',
  },
  cell: {
    fontSize: 13,
    textAlign: 'center',
    color: '#c9d1d9',
  },
  // Mobile card styles
  cardContainer: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b4252',
    overflow: 'hidden',
  },
  card: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#272d37',
    backgroundColor: '#131720',
  },
  cardProduct: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e6edf3',
    marginBottom: 2,
  },
  cardSource: {
    fontSize: 11,
    color: '#8b949e',
    marginBottom: 6,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 13,
    color: '#c9d1d9',
  },
  cardChange: {
    fontSize: 13,
    fontWeight: '600',
  },
  cardDate: {
    fontSize: 11,
    color: '#8b949e',
    marginTop: 4,
  },
});
