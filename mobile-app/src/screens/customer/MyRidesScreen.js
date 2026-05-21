import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Alert,
} from 'react-native';
import api from '../../services/api';
import { COLORS } from '../../theme/colors';

export default function MyRidesScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');

  const fetchBookings = useCallback(async () => {
    try {
      const res = await api.get('/api/bookings');
      const data = res.data || [];
      // Sort: newest first
      const sorted = [...data].sort((a, b) => b.id - a.id);
      setBookings(sorted);
      applyFilter(activeFilter, sorted);
    } catch (e) {
      console.error('MyRidesScreen: Failed to load bookings', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter]);

  const applyFilter = (filter, dataList = bookings) => {
    if (filter === 'All') {
      setFilteredBookings(dataList);
    } else {
      setFilteredBookings(dataList.filter(b => b.status === filter));
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    applyFilter(filter);
  };

  const handleCancelBooking = async (bookingId) => {
    Alert.alert(
      'Cancel Ride?',
      'Are you sure you want to cancel this ride request?',
      [
        { text: 'No, Keep It', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              // Call API to cancel the booking
              await api.patch(`/api/bookings/${bookingId}`, { status: 'Cancelled' });
              Alert.alert('Cancelled', 'Your ride has been successfully cancelled.');
              fetchBookings();
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Unable to cancel ride. Please try again.');
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return COLORS.success;
      case 'Pending': return COLORS.warning;
      case 'Assigned':
      case 'Accepted': return COLORS.primaryDark;
      case 'Cancelled': return COLORS.danger;
      default: return COLORS.textMuted;
    }
  };

  const renderBookingCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.carName}>{item.car || item.carName || 'Premium Cab'}</Text>
          <Text style={styles.dateTimeText}>{item.date || item.bookingDate} • {item.time || item.bookingTime}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
        </View>
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
        <View>
          <Text style={styles.distanceText}>{item.distance || item.distanceKm || '0'} km</Text>
        </View>
        <Text style={styles.fareText}>₹{item.fare}</Text>
      </View>

      {/* Driver info if assigned */}
      {item.driver && (
        <View style={styles.driverBar}>
          <Text style={styles.driverTitle}>Driver Assigned:</Text>
          <Text style={styles.driverInfo}>{item.driver.name} ({item.driver.vehicleNumber || item.driver.vehicleName})</Text>
        </View>
      )}

      <View style={styles.actionsRow}>
        {/* Live Track for active trips */}
        {(item.status === 'Assigned' || item.status === 'Accepted') && (
          <TouchableOpacity
            style={styles.trackButton}
            onPress={() => navigation.navigate('LiveTracking', { bookingId: item.id })}
          >
            <Text style={styles.trackButtonText}>🖲️ LIVE TRACK RIDE</Text>
          </TouchableOpacity>
        )}

        {/* Cancel option for pending bookings */}
        {item.status === 'Pending' && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelBooking(item.id)}
          >
            <Text style={styles.cancelButtonText}>❌ CANCEL REQUEST</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const filters = ['All', 'Pending', 'Accepted', 'Completed', 'Cancelled'];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* ── FILTER HEADER ── */}
      <View style={styles.filterContainer}>
        <FlatList
          data={filters}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filterListContent}
          renderItem={({ item }) => {
            const active = activeFilter === item;
            return (
              <TouchableOpacity
                onPress={() => handleFilterChange(item)}
                style={[styles.filterChip, active && styles.activeFilterChip]}
              >
                <Text style={[styles.filterChipText, active && styles.activeFilterChipText]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* ── BOOKINGS LIST ── */}
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderBookingCard}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No rides found under this category.</Text>
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
  filterContainer: {
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterListContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeFilterChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  activeFilterChipText: {
    color: COLORS.white,
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
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  carName: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
  },
  dateTimeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
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
    marginBottom: 4,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textMuted,
  },
  fareText: {
    fontSize: 18,
    fontWeight: '950',
    color: COLORS.text,
  },
  driverBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(232, 179, 75, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(232, 179, 75, 0.15)',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  driverTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.primaryDark,
  },
  driverInfo: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
  },
  actionsRow: {
    marginTop: 10,
  },
  trackButton: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  trackButtonText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.danger,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.danger,
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.5,
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
