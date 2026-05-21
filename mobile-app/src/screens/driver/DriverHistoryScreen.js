import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import api from '../../services/api';
import { COLORS } from '../../theme/colors';

export default function DriverHistoryScreen() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await api.get('/api/bookings');
      const data = res.data || [];
      // Filter for completed or cancelled bookings for history, sorted newest first
      const sorted = data
        .filter(b => b.status === 'Completed' || b.status === 'Cancelled')
        .sort((a, b) => b.id - a.id);
      setHistory(sorted);
    } catch (e) {
      console.error('DriverHistoryScreen: Failed to fetch bookings history', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const renderHistoryItem = ({ item }) => {
    const isCompleted = item.status === 'Completed';
    // Shorten long IDs: show first 12 chars only
    const rawId = String(item.id || '');
    const displayId = rawId.length > 8 ? rawId.substring(0, 8) + '...' : rawId;
    const distanceVal = item.distanceKm || item.distance || '0';
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.tripInfo}>
            <Text style={styles.tripNumber} numberOfLines={1} ellipsizeMode="tail">
              TRIP #{displayId}
            </Text>
            <Text style={styles.dateTimeText} numberOfLines={1}>
              {item.date || item.bookingDate || '—'} • {item.time || item.bookingTime || '—'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: (isCompleted ? COLORS.success : COLORS.danger) + '15' }]}>
            <Text style={[styles.statusText, { color: isCompleted ? COLORS.success : COLORS.danger }]}>
              {isCompleted ? 'DONE' : 'CNCLD'}
            </Text>
          </View>
        </View>

        <View style={styles.customerRow}>
          <Text style={styles.customerLabel}>Customer:</Text>
          <Text style={styles.customerValue} numberOfLines={1}>{item.customer || 'Elite Rider'}</Text>
        </View>

        <View style={styles.routeContainer}>
          <View style={styles.routeNode}>
            <Text style={styles.nodeDot}>🟢</Text>
            <Text style={styles.routeText} numberOfLines={1}>{item.pickup}</Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routeNode}>
            <Text style={styles.nodeDot}>🔴</Text>
            <Text style={styles.routeText} numberOfLines={1}>{item.drop}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.distanceText}>{distanceVal} km Completed</Text>
          <View style={styles.fareContainer}>
            <Text style={styles.fareText}>₹{item.fare}</Text>
            {isCompleted && <Text style={styles.paidText}>PAID</Text>}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderHistoryItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No completed trips in your history.</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 12,
    marginBottom: 12,
  },
  tripInfo: {
    flex: 1,
    marginRight: 8,
  },
  tripNumber: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.text,
    flexShrink: 1,
  },
  dateTimeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    flexShrink: 0,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    minWidth: 52,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  customerLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.primaryDark,
    textTransform: 'uppercase',
  },
  customerValue: {
    fontSize: 12,
    fontWeight: '750',
    color: COLORS.text,
  },
  routeContainer: {
    marginBottom: 14,
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 12,
  },
  routeNode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nodeDot: {
    fontSize: 12,
  },
  routeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  routeLine: {
    width: 1,
    height: 12,
    backgroundColor: COLORS.border,
    marginLeft: 6,
    marginVertical: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  distanceText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
  },
  fareContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fareText: {
    fontSize: 18,
    fontWeight: '950',
    color: COLORS.text,
  },
  paidText: {
    fontSize: 9,
    fontWeight: '950',
    color: COLORS.success,
    backgroundColor: COLORS.success + '15',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '700',
  },
});
