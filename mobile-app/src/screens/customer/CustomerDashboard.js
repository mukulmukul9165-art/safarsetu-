import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import { COLORS } from '../../theme/colors';

export default function CustomerDashboard({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ totalRides: 0, totalSpent: 0 });

  const { user } = useContext(AuthContext);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await api.get('/api/bookings');
      const data = res.data;
      setBookings(data);
      
      // Calculate basic customer dashboard stats dynamically
      const completed = data.filter((b) => b.status === 'Completed');
      const spent = completed.reduce((acc, curr) => acc + curr.fare, 0);
      setStats({
        totalRides: completed.length,
        totalSpent: spent,
      });
    } catch (e) {
      console.error('CustomerDashboard: Failed to load bookings', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
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
        <Text style={styles.carName}>{item.car}</Text>
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
          <Text style={styles.dateText}>{item.date} • {item.time}</Text>
          <Text style={styles.distanceText}>{item.distance}</Text>
        </View>
        <Text style={styles.fareText}>₹{item.fare}</Text>
      </View>

      {/* Driver info if assigned */}
      {item.driver && (
        <View style={styles.driverBar}>
          <Text style={styles.driverTitle}>Driver Assigned:</Text>
          <Text style={styles.driverInfo}>{item.driver.name} ({item.driver.vehicleNumber})</Text>
        </View>
      )}

      {/* Live Track for active trips */}
      {(item.status === 'Assigned' || item.status === 'Accepted') && (
        <TouchableOpacity
          style={styles.trackButton}
          onPress={() => navigation.navigate('LiveTracking', { bookingId: item.id })}
        >
          <Text style={styles.trackButtonText}>🖲️ LIVE TRACK RIDE</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* ── HEADER PANEL ── */}
      <View style={styles.welcomePanel}>
        <View>
          <Text style={styles.greetText}>Namaste,</Text>
          <Text style={styles.userName}>{user?.name}</Text>
        </View>
        <TouchableOpacity
          style={styles.bookFloatingButton}
          onPress={() => navigation.navigate('BookRide')}
        >
          <Text style={styles.bookFloatingText}>+ BOOK RIDE</Text>
        </TouchableOpacity>
      </View>

      {/* ── STATS ROW ── */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>COMPLETED RIDES</Text>
          <Text style={styles.statValue}>{stats.totalRides}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>TOTAL INVESTED</Text>
          <Text style={styles.statValue}>₹{stats.totalSpent}</Text>
        </View>
      </View>

      {/* ── BOOKING LOGS ── */}
      <View style={styles.listSection}>
        <Text style={styles.sectionHeader}>Your Ride History</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={bookings}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderBookingCard}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No rides booked yet.</Text>
                <TouchableOpacity
                  style={styles.emptyBookBtn}
                  onPress={() => navigation.navigate('BookRide')}
                >
                  <Text style={styles.emptyBookBtnText}>Book Your First Ride</Text>
                </TouchableOpacity>
              </View>
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  welcomePanel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  greetText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  userName: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
  },
  bookFloatingButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  bookFloatingText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '950',
    color: COLORS.text,
  },
  listSection: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  carName: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.text,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  routeContainer: {
    marginBottom: 12,
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
    fontWeight: '600',
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
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  distanceText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 2,
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
    borderRadius: 8,
    padding: 8,
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
  trackButton: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  trackButtonText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginBottom: 16,
  },
  emptyBookBtn: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  emptyBookBtnText: {
    color: COLORS.primaryDark,
    fontWeight: '900',
    fontSize: 13,
  },
});
