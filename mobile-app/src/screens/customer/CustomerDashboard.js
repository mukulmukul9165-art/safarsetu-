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

export default function CustomerDashboard({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ totalRides: 0, totalSpent: 0, rating: '4.9/5', savedPlaces: 4 });

  const { user } = useContext(AuthContext);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await api.get('/api/bookings');
      const data = res.data || [];
      setBookings(data);
      
      // Calculate dashboard stats dynamically
      const completed = data.filter((b) => b.status === 'Completed');
      const spent = completed.reduce((acc, curr) => acc + (curr.fare || 0), 0);
      setStats({
        totalRides: data.length,
        totalSpent: spent,
        rating: '4.9/5',
        savedPlaces: 4,
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

  const renderRecentItem = (ride) => (
    <TouchableOpacity
      key={ride.id}
      style={styles.recentCard}
      onPress={() => navigation.navigate('MyRides')}
    >
      <View style={styles.recentLeft}>
        <View style={styles.recentIconBox}>
          <Text style={styles.recentIcon}>🕒</Text>
        </View>
        <View style={styles.recentLocationWrapper}>
          <Text style={styles.recentLocation} numberOfLines={1}>
            {ride.drop}
          </Text>
          <Text style={styles.recentDate}>{ride.date || ride.bookingDate}</Text>
        </View>
      </View>
      <View style={styles.recentRight}>
        <Text style={styles.recentFare}>₹{ride.fare}</Text>
        <Text style={[styles.recentStatus, { color: getStatusColor(ride.status) }]}>
          {ride.status}
        </Text>
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

      {/* ── TOP HEADER / WELCOME ROW ── */}
      <View style={styles.welcomeContainer}>
        <View>
          <Text style={styles.greetText}>Namaste,</Text>
          <Text style={styles.userName}>{user?.name || 'Rider'}</Text>
          <Text style={styles.brandSubtitle}>WELCOME TO YOUR SAFAR HUB</Text>
        </View>
        
        {/* Wallet Display */}
        <View style={styles.walletCard}>
          <View style={styles.walletIconCircle}>
            <Text style={styles.walletIcon}>💳</Text>
          </View>
          <View>
            <Text style={styles.walletLabel}>WALLET BALANCE</Text>
            <Text style={styles.walletValue}>₹2,450</Text>
          </View>
        </View>
      </View>

      {/* ── 4 STATS ROW (GRID) ── */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>🚖</Text>
          <Text style={styles.statLabel}>TOTAL RIDES</Text>
          <Text style={styles.statValue}>{stats.totalRides}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>💰</Text>
          <Text style={styles.statLabel}>TOTAL SPENT</Text>
          <Text style={styles.statValue}>₹{stats.totalSpent}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>⭐</Text>
          <Text style={styles.statLabel}>RIDER RATING</Text>
          <Text style={styles.statValue}>{stats.rating}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>📍</Text>
          <Text style={styles.statLabel}>SAVED PLACES</Text>
          <Text style={styles.statValue}>{stats.savedPlaces}</Text>
        </View>
      </View>

      {/* ── QUICK ACTIONS ── */}
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity
          style={styles.bookCta}
          onPress={() => navigation.navigate('BookRide')}
        >
          <View style={styles.ctaIconContainer}>
            <Text style={styles.ctaIcon}>🚗</Text>
          </View>
          <Text style={styles.ctaTitle}>BOOK NEW RIDE</Text>
          <Text style={styles.ctaSubtitle}>Verified Professional Elite Drivers</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.supportCta}
          onPress={() => navigation.navigate('Support')}
        >
          <View style={styles.ctaIconContainerSecondary}>
            <Text style={styles.ctaIcon}>🎧</Text>
          </View>
          <Text style={styles.ctaTitleSecondary}>LIVE SUPPORT</Text>
          <Text style={styles.ctaSubtitleSecondary}>24/7 Local Assistance</Text>
        </TouchableOpacity>
      </View>

      {/* ── MAP PREVIEW (LAST TRIP) ── */}
      {bookings.length > 0 && (
        <View style={styles.mapPreviewCard}>
          <View style={styles.mapHeaderRow}>
            <View>
              <Text style={styles.mapHeadingLabel}>LAST TRIP TRACK</Text>
              <Text style={styles.mapHeadingText} numberOfLines={1}>
                {bookings[0].pickup} → {bookings[0].drop}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.trackMinBtn}
              onPress={() => navigation.navigate('MyRides')}
            >
              <Text style={styles.trackMinText}>VIEW DETAILS</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderText}>🗺️ Interactive Route Map Preview</Text>
            <Text style={styles.mapPlaceholderSubText}>Distance: {bookings[0].distance || bookings[0].distanceKm || '0'} km • Fare: ₹{bookings[0].fare}</Text>
          </View>
        </View>
      )}

      {/* ── RECENT ACTIVITY LIST ── */}
      <View style={styles.recentSection}>
        <View style={styles.recentHeaderRow}>
          <Text style={styles.recentTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MyRides')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 20 }} />
        ) : bookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No recent rides found.</Text>
            <TouchableOpacity
              style={styles.emptyBookBtn}
              onPress={() => navigation.navigate('BookRide')}
            >
              <Text style={styles.emptyBookBtnText}>Book Your First Ride</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.recentList}>
            {bookings.slice(0, 4).map(renderRecentItem)}
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
  welcomeContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '800',
  },
  userName: {
    fontSize: 24,
    fontWeight: '950',
    color: COLORS.text,
    lineHeight: 30,
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.primaryDark,
    letterSpacing: 1.5,
    marginTop: 4,
  },
  walletCard: {
    backgroundColor: 'rgba(232, 179, 75, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(232, 179, 75, 0.25)',
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
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletIcon: {
    fontSize: 14,
  },
  walletLabel: {
    fontSize: 7,
    fontWeight: '950',
    color: COLORS.primaryDark,
    letterSpacing: 0.5,
  },
  walletValue: {
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
  quickActionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 20,
  },
  bookCta: {
    flex: 1.2,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  supportCta: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ctaIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  ctaIconContainerSecondary: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  ctaIcon: {
    fontSize: 18,
  },
  ctaTitle: {
    fontSize: 14,
    fontWeight: '950',
    color: COLORS.white,
  },
  ctaSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.white,
    opacity: 0.8,
    marginTop: 2,
  },
  ctaTitleSecondary: {
    fontSize: 14,
    fontWeight: '950',
    color: COLORS.text,
  },
  ctaSubtitleSecondary: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginTop: 2,
  },
  mapPreviewCard: {
    marginHorizontal: 24,
    backgroundColor: COLORS.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 24,
  },
  mapHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mapHeadingLabel: {
    fontSize: 8,
    fontWeight: '950',
    color: COLORS.primaryDark,
    letterSpacing: 1,
  },
  mapHeadingText: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.text,
    maxWidth: width * 0.5,
    marginTop: 2,
  },
  trackMinBtn: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  trackMinText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.text,
  },
  mapPlaceholder: {
    height: 120,
    backgroundColor: COLORS.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  mapPlaceholderText: {
    fontSize: 13,
    fontWeight: '850',
    color: COLORS.text,
  },
  mapPlaceholderSubText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  recentSection: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '950',
    color: COLORS.text,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.primaryDark,
  },
  recentList: {
    gap: 12,
  },
  recentCard: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  recentIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(30,30,30,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentIcon: {
    fontSize: 16,
  },
  recentLocationWrapper: {
    flex: 1,
  },
  recentLocation: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.text,
  },
  recentDate: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 2,
  },
  recentRight: {
    alignItems: 'flex-end',
  },
  recentFare: {
    fontSize: 15,
    fontWeight: '950',
    color: COLORS.text,
  },
  recentStatus: {
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyBookBtn: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  emptyBookBtnText: {
    color: COLORS.primaryDark,
    fontWeight: '900',
    fontSize: 12,
  },
});
