import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { usePathname, useRouter } from 'expo-router';

const TABS = [
  { label: 'Home', path: '/' },
  { label: 'Price History', path: '/history' },
];

const NavBar = () => {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>☕ tonnon-kahvi</Text>
      <View style={styles.tabs}>
        {TABS.map((tab) => {
          const isActive =
            pathname === tab.path ||
            (tab.path !== '/' && pathname.startsWith(tab.path));
          return (
            <TouchableOpacity
              key={tab.path}
              onPress={() => router.push(tab.path)}
              style={[styles.tab, isActive && styles.activeTab]}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2c3e50',
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 12,
  },
  logo: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 24,
  },
  tabs: {
    flexDirection: 'row',
    gap: 4,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  tabText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: 'white',
  },
});

export default NavBar;
