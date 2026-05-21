import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StatusBar,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import { COLORS } from '../../theme/colors';

export default function DriverDashboard({ navigation }) {
  const [activeJobs, setActiveJobs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useContext(AuthContext);

  const loadDriverData = useCallback(async () => {
    try {
      // Fetch dynamic driver stats
      const statsRes = await api.get('/api/bookings/driver-stats');
      setStats(statsRes.data);

      // Fetch all bookings and filter for this driver's active jobs (Assigned or Accepted)
      const bookingsRes = await api.get('/api/bookings');
      const filtered = bookingsRes.data.filter(
        (b) => b.status === 'Assigned' || b.status === 'Accepted'
      );
      setActiveJobs(filtered);
    } catch (e) {
      console.error('DriverDashboard: Error loading driver data', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDriverData();
  }, [loadDriverData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDriverData();
  };

  const handleAcceptJob = async (id) => {
    try {
      setLoading(true);
      await api.patch(`/api/bookings/${id}`, { action: 'accept' });
      setLoading(false);
      Alert.alert('Job Accepted! 👍', 'You have accepted the ride. Please proceed to pickup location.');
      loadDriverData();
    } catch (e) {
      setLoading(false);
      const msg = e.response?.data?.message || 'Failed to accept job.';
      Alert.alert('Action Failed', msg);
    }
  };

  const handleCompleteJob = async (id) => {
    try {
      setLoading(true);
      await api.patch(`/api/bookings/${id}`, { action: 'complete' });
      setLoading(false);
      Alert.alert('Job Completed! 🎉', 'Ride completed successfully. Payments will be updated.');
      loadDriverData();
    } catch (e) {
      setLoading(false);
      const msg = e.response?.data?.message || 'Failed to complete job.';
      Alert.alert('Action Failed', msg);
    }
  };

  const renderJobCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.customerName}>Client: {item.customer}</Text>
        <View
          style={[
            styles.badge,
            { backgroundColor: item.status === 'Accepted' ? COLORS.success + '15' : COLORS.warning + '15' },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              { color: item.status === 'Accepted' ? COLORS.success : COLORS.warning },
            ]}
          >
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.routeNode}>
          <Text style={styles.dot}>🟢</Text>
          <Text style={styles.routeText} numberOfLines={1}>{item.pickup}</Text>
        </View>
        <View style={styles.line} />
        <View style={styles.routeNode}>
          <Text style={styles.dot}>🔴</Text>
          <Text style={styles.routeText} numberOfLines={1}>{item.drop}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.fare}>Fare: ₹{item.fare}</Text>
        <Text style={styles.distance}>{item.distance}</Text>
      </View>

      <TouchableOpacity
        style={styles.trackButton}
        onPress={() => navigation.navigate('LiveTracking', { bookingId: item.id })}
      >
        <Text style={styles.trackButtonText}>🖲️ LIVE TRACK RIDE</Text>
      </TouchableOpacity>

      {item.status === 'Assigned' ? (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleAcceptJob(item.id)}
        >
          <Text style={styles.actionButtonText}>ACCEPT RIDE JOB</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: COLORS.success }]}
          onPress={() => handleCompleteJob(item.id)}
        >
          <Text style={styles.actionButtonText}>MARK RIDE COMPLETED</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* ── DRIVER WELCOME PANEL ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.subText}>Welcome back,</Text>
          <Text style={styles.driverName}>{user?.name} (Driver)</Text>
        </View>
        <View style={styles.statusPill}>
          <Text style={styles.statusPillText}>APPROVED</Text>
        </View>
      </View>

      {/* ── DRIVER METRICS PANEL ── */}
      {stats && (
        <View style={styles.metricsContainer}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>TODAY'S INCOME</Text>
            <Text style={styles.metricVal}>₹{stats.todayEarnings}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>TOTAL TRIPS</Text>
            <Text style={styles.metricVal}>{stats.tripsDone}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>RATING</Text>
            <Text style={styles.metricVal}>⭐ {stats.rating}</Text>
          </View>
        </View>
      )}

      {/* ── ACTIVE JOB LOGS ── */}
      <View style={styles.listSection}>
        <Text style={styles.sectionHeader}>Active Assigned Jobs</Text>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={activeJobs}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderJobCard}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>☕</Text>
                <Text style={styles.emptyText}>All caught up! No active jobs assigned.</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  subText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  driverName: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
  },
  statusPill: {
    backgroundColor: COLORS.success + '20',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.success,
    letterSpacing: 0.5,
  },
  metricsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 10,
    marginBottom: 20,
  },
  metricItem: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricVal: {
    fontSize: 18,
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
  customerName: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.text,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 9,
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
  dot: {
    fontSize: 12,
  },
  routeText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  line: {
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
    paddingTop: 10,
    marginBottom: 12,
  },
  fare: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.text,
  },
  distance: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  actionButton: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  trackButton: {
    backgroundColor: 'rgba(232, 179, 75, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(232, 179, 75, 0.3)',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  trackButtonText: {
    color: COLORS.primaryDark,
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
});
