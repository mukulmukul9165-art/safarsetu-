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
  ScrollView,
  Dimensions,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import { COLORS } from '../../theme/colors';

const { width } = Dimensions.get('window');

export default function DriverDashboard({ navigation }) {
  const [activeJobs, setActiveJobs] = useState([]);
  const [stats, setStats] = useState({
    todayEarnings: 2450,
    tripsDone: 12,
    onlineHours: '6.5h',
    acceptance: '98%',
    rating: '4.95',
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useContext(AuthContext);

  const loadDriverData = useCallback(async () => {
    try {
      // Fetch driver stats
      const statsRes = await api.get('/api/bookings/driver-stats');
      if (statsRes.data) {
        setStats({
          todayEarnings: statsRes.data.todayEarnings || 2450,
          tripsDone: statsRes.data.tripsDone || 12,
          onlineHours: '6.5h',
          acceptance: '98%',
          rating: statsRes.data.rating || '4.95',
        });
      }

      // Fetch bookings and filter for this driver's active jobs
      const bookingsRes = await api.get('/api/bookings');
      const data = bookingsRes.data || [];
      const filtered = data.filter(
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

  const renderActiveJob = (item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.jobCard}
      onPress={() => navigation.navigate('My Jobs')}
    >
      <View style={styles.jobHeader}>
        <View>
          <Text style={styles.riderName}>{item.customer || 'Elite Rider'}</Text>
          <Text style={styles.carName}>{item.car || item.carName || 'Premium Cab'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.routeContainer}>
        <Text style={styles.routeText} numberOfLines={1}>
          🟢 {item.pickup}
        </Text>
        <Text style={styles.routeText} numberOfLines={1}>
          🔴 {item.drop}
        </Text>
      </View>

      <View style={styles.jobFooter}>
        <Text style={styles.jobFare}>₹{item.fare}</Text>
        <Text style={styles.jobDist}>{item.distance || item.distanceKm || '0'} km</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
      }
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* ── DRIVER WELCOME / INCOME BANNER ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.captainGreet}>Captain,</Text>
          <Text style={styles.driverName}>{user?.name || 'Pilot'}</Text>
          <Text style={styles.brandSub}>DAILY BONUS ELIGIBLE</Text>
        </View>
        
        {/* Today's Income Card */}
        <View style={styles.incomeCard}>
          <View style={styles.walletIconCircle}>
            <Text style={styles.walletIcon}>💰</Text>
          </View>
          <View>
            <Text style={styles.incomeLabel}>TODAY'S INCOME</Text>
            <Text style={styles.incomeAmount}>₹{stats.todayEarnings}</Text>
          </View>
        </View>
      </View>

      {/* ── STATS ROW (GRID) ── */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>⭐</Text>
          <Text style={styles.statLabel}>RATING</Text>
          <Text style={styles.statValue}>{stats.rating}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>🏁</Text>
          <Text style={styles.statLabel}>TRIPS DONE</Text>
          <Text style={styles.statValue}>{stats.tripsDone}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>⏱️</Text>
          <Text style={styles.statLabel}>ONLINE HOURS</Text>
          <Text style={styles.statValue}>{stats.onlineHours}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>✅</Text>
          <Text style={styles.statLabel}>ACCEPTANCE</Text>
          <Text style={styles.statValue}>{stats.acceptance}</Text>
        </View>
      </View>

      {/* ── DAILY TARGET PROGRESS CARD ── */}
      <View style={styles.targetCard}>
        <View style={styles.targetHeaderRow}>
          <Text style={styles.targetTitle}>DAILY TARGET PROGRESS</Text>
          <View style={styles.targetBadge}>
            <Text style={styles.targetBadgeText}>GOAL TRACKER</Text>
          </View>
        </View>
        
        <View style={styles.targetContent}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressText}>Current Progress</Text>
            <Text style={styles.progressPercent}>49% Complete</Text>
          </View>
          
          {/* Progress Bar */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '49%' }]} />
          </View>
          
          <Text style={styles.targetFooterText}>
            💡 Complete 4 more trips today to unlock a ₹500 elite incentive bonus!
          </Text>
        </View>

        {/* Periods Breakdown */}
        <View style={styles.periodsGrid}>
          <View style={styles.periodBox}>
            <Text style={styles.periodLabel}>TODAY</Text>
            <Text style={styles.periodValue}>₹{stats.todayEarnings}</Text>
          </View>
          <View style={styles.periodBox}>
            <Text style={styles.periodLabel}>THIS WEEK</Text>
            <Text style={styles.periodValue}>₹18.4K</Text>
          </View>
          <View style={styles.periodBox}>
            <Text style={styles.periodLabel}>THIS MONTH</Text>
            <Text style={styles.periodValue}>₹72.8K</Text>
          </View>
        </View>
      </View>

      {/* ── NEXT JOB NEARBY QUICK ACTION ── */}
      <TouchableOpacity
        style={styles.quickJobCta}
        onPress={() => navigation.navigate('My Jobs')}
      >
        <View style={styles.quickJobLeft}>
          <Text style={styles.quickJobIcon}>💼</Text>
          <View>
            <Text style={styles.quickJobTitle}>VIEW ACTIVE ASSIGNMENTS</Text>
            <Text style={styles.quickJobSub}>You have {activeJobs.length} active jobs pending</Text>
          </View>
        </View>
        <Text style={styles.quickJobArrow}>➔</Text>
      </TouchableOpacity>

      {/* ── ACTIVE ASSIGNED JOBS SECTION ── */}
      <View style={styles.activeSection}>
        <Text style={styles.sectionHeader}>Pending / Active Jobs</Text>
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 20 }} />
        ) : activeJobs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>☕</Text>
            <Text style={styles.emptyText}>All caught up! No active jobs assigned.</Text>
          </View>
        ) : (
          <View style={styles.jobsList}>
            {activeJobs.map(renderActiveJob)}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  captainGreet: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '800',
  },
  driverName: {
    fontSize: 24,
    fontWeight: '950',
    color: COLORS.text,
    lineHeight: 30,
  },
  brandSub: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.primaryDark,
    letterSpacing: 1.5,
    marginTop: 4,
  },
  incomeCard: {
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletIcon: {
    fontSize: 14,
  },
  incomeLabel: {
    fontSize: 7,
    fontWeight: '950',
    color: COLORS.success,
    letterSpacing: 0.5,
  },
  incomeAmount: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.text,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 18,
    gap: 8,
    marginBottom: 20,
  },
  statCard: {
    width: (width - 36 - 8) / 2,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statEmoji: {
    fontSize: 20,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '950',
    color: COLORS.text,
  },
  targetCard: {
    marginHorizontal: 24,
    backgroundColor: COLORS.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    marginBottom: 20,
  },
  targetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  targetTitle: {
    fontSize: 10,
    fontWeight: '950',
    color: COLORS.text,
    letterSpacing: 1,
  },
  targetBadge: {
    backgroundColor: 'rgba(232, 179, 75, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(232, 179, 75, 0.2)',
  },
  targetBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.primaryDark,
  },
  targetContent: {
    marginBottom: 16,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.text,
  },
  progressBarBg: {
    height: 12,
    backgroundColor: COLORS.background,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 2,
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  targetFooterText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    lineHeight: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  periodsGrid: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 14,
  },
  periodBox: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
    alignItems: 'center',
  },
  periodLabel: {
    fontSize: 7,
    fontWeight: '900',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  periodValue: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.text,
  },
  quickJobCta: {
    marginHorizontal: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 24,
  },
  quickJobLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quickJobIcon: {
    fontSize: 22,
  },
  quickJobTitle: {
    fontSize: 13,
    fontWeight: '950',
    color: COLORS.white,
  },
  quickJobSub: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.white,
    opacity: 0.8,
    marginTop: 2,
  },
  quickJobArrow: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '900',
  },
  activeSection: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '950',
    color: COLORS.text,
    marginBottom: 16,
  },
  jobsList: {
    gap: 14,
  },
  jobCard: {
    backgroundColor: COLORS.background,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  riderName: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.text,
  },
  carName: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primaryDark,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  routeContainer: {
    marginBottom: 12,
    gap: 4,
  },
  routeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
  },
  jobFare: {
    fontSize: 15,
    fontWeight: '950',
    color: COLORS.text,
  },
  jobDist: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
});
