import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Dimensions,
  Image,
  ScrollView,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import api from '../../services/api';
import { COLORS } from '../../theme/colors';

const { width, height } = Dimensions.get('window');

// Bezier Curve generator for route curves
function generateCurvedRoute(p1, p2) {
  const steps = 15;
  const coords = [];
  const midLat = (p1.latitude + p2.latitude) / 2;
  const midLng = (p1.longitude + p2.longitude) / 2;
  const deltaLat = p2.latitude - p1.latitude;
  const deltaLng = p2.longitude - p1.longitude;
  const offsetLat = -deltaLng * 0.1;
  const offsetLng = deltaLat * 0.1;
  const controlPoint = { latitude: midLat + offsetLat, longitude: midLng + offsetLng };
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    coords.push({
      latitude: mt * mt * p1.latitude + 2 * mt * t * controlPoint.latitude + t * t * p2.latitude,
      longitude: mt * mt * p1.longitude + 2 * mt * t * controlPoint.longitude + t * t * p2.longitude,
    });
  }
  return coords;
}

export default function DriverJobsScreen() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Map sub-view states
  const [activeView, setActiveView] = useState('list'); // 'list', 'navigation'
  const [activeRide, setActiveRide] = useState(null);
  const [navState, setNavState] = useState('accepted'); // 'accepted', 'arrived', 'started'
  
  const mapRef = useRef(null);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await api.get('/api/bookings');
      const data = res.data || [];
      setBookings(data);
    } catch (e) {
      console.error('DriverJobsScreen: Failed to fetch assignments', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 8000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  const handleAccept = async (ride) => {
    try {
      setLoading(true);
      await api.patch(`/api/bookings/${ride.id}`, { status: 'Accepted' });
      Alert.alert('Accepted! 🎉', 'You have successfully accepted this ride assignment.');
      fetchJobs();
    } catch (e) {
      Alert.alert('Accept Error', 'Could not accept job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startNavigation = (ride) => {
    let pickupCoords = { latitude: ride.pickupLat || 22.0248, longitude: ride.pickupLng || 74.8964 };
    let dropCoords = { latitude: ride.dropLat || 22.9676, longitude: ride.dropLng || 76.0534 };
    let coordinates = [];

    if (ride.routeCoords && Array.isArray(ride.routeCoords) && ride.routeCoords.length > 0) {
      coordinates = ride.routeCoords.map(c => ({ latitude: c[0], longitude: c[1] }));
    } else {
      coordinates = generateCurvedRoute(pickupCoords, dropCoords);
    }

    setActiveRide({
      ...ride,
      pickupCoords,
      dropCoords,
      coordinates,
    });
    setNavState(ride.status === 'Accepted' ? 'accepted' : 'started');
    setActiveView('navigation');
  };

  const handleArrived = () => {
    setNavState('arrived');
    Alert.alert('Arrived', 'Customer has been notified of your arrival.');
  };

  const handleStartTrip = async () => {
    try {
      setLoading(true);
      // Backend status stays Accepted but navigates to live started mode
      setNavState('started');
      Alert.alert('Trip Started 🚖', 'Stay safe. Safe driving!');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTrip = async () => {
    try {
      setLoading(true);
      await api.patch(`/api/bookings/${activeRide.id}`, { status: 'Completed' });
      Alert.alert('Trip Completed! 🏁', `Good job! Earnings of ₹${activeRide.fare} logged.`);
      setActiveView('list');
      setActiveRide(null);
      fetchJobs();
    } catch (e) {
      Alert.alert('Error', 'Unable to log trip completion.');
    } finally {
      setLoading(false);
    }
  };

  const fitNavBounds = () => {
    if (mapRef.current && activeRide?.coordinates) {
      mapRef.current.fitToCoordinates(activeRide.coordinates, {
        edgePadding: { top: 80, right: 60, bottom: 80, left: 60 },
        animated: true,
      });
    }
  };

  useEffect(() => {
    if (activeView === 'navigation' && activeRide) {
      setTimeout(fitNavBounds, 1000);
    }
  }, [activeView, activeRide]);

  // Filters
  const pendingJobs = bookings.filter(b => b.status === 'Assigned' || b.status === 'Pending');
  const acceptedJobs = bookings.filter(b => b.status === 'Accepted');

  const renderJobCard = (item, isPending) => (
    <View style={styles.card} key={item.id}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.customerName}>{item.customer || 'Elite Rider'}</Text>
          <Text style={styles.categorySub}>{item.carName || item.car || 'Premium Cab'}</Text>
        </View>
        <Text style={styles.fareText}>₹{item.fare}</Text>
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
        <Text style={styles.footerInfo}>{item.distanceKm || item.distance || '0'} km • {item.date} {item.time}</Text>
      </View>

      <View style={styles.actionsRow}>
        {isPending ? (
          <>
            <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(item)}>
              <Text style={styles.acceptBtnText}>ACCEPT JOB ✅</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mapBtn} onPress={() => startNavigation(item)}>
              <Text style={styles.mapBtnText}>MAP 🗺️</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.navBtn} onPress={() => startNavigation(item)}>
            <Text style={styles.navBtnText}>START NAVIGATION MAP 🖲️</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (activeView === 'navigation' && activeRide) {
    return (
      <View style={styles.navContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        
        {/* Full-screen navigation map */}
        <MapView
          ref={mapRef}
          provider={PROVIDER_DEFAULT}
          style={styles.navMap}
          initialRegion={{
            latitude: activeRide.pickupCoords.latitude,
            longitude: activeRide.pickupCoords.longitude,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }}
        >
          <Polyline
            coordinates={activeRide.coordinates}
            strokeColor={COLORS.primaryDark}
            strokeWidth={5}
          />
          <Marker coordinate={activeRide.pickupCoords} title="Pickup Point" pinColor="#22C55E" />
          <Marker coordinate={activeRide.dropCoords} title="Drop Point" pinColor="#EF4444" />
        </MapView>

        {/* TOP HUD NAV BAR */}
        <View style={styles.hudOverlay}>
          <View style={styles.hudCircle}>
            <Text style={styles.hudArrow}>🧭</Text>
          </View>
          <View style={styles.hudTextContainer}>
            <Text style={styles.hudHeading}>
              {navState === 'started' ? 'Heading to Drop point' : 'Heading to Pickup point'}
            </Text>
            <Text style={styles.hudSubheading} numberOfLines={1}>
              {navState === 'started' ? activeRide.drop : activeRide.pickup}
            </Text>
          </View>
        </View>

        {/* BOTTOM HUD CONTROLLER CARD */}
        <View style={styles.controlPanelCard}>
          <View style={styles.riderProfileRow}>
            <View style={styles.profileBox}>
              <Text style={styles.profileEmoji}>👤</Text>
            </View>
            <View>
              <Text style={styles.profileRiderName}>{activeRide.customer || 'Elite Rider'}</Text>
              <Text style={styles.profileSub}>Concierge Premium Ride</Text>
            </View>
          </View>

          <View style={styles.navStatsRow}>
            <View>
              <Text style={styles.navStatLabel}>DISTANCE</Text>
              <Text style={styles.navStatValue}>{activeRide.distanceKm || activeRide.distance || '0'} KM</Text>
            </View>
            <View>
              <Text style={styles.navStatLabel}>EST. FARE</Text>
              <Text style={styles.navStatValue}>₹{activeRide.fare}</Text>
            </View>
          </View>

          <View style={styles.hudActions}>
            {navState === 'accepted' && (
              <TouchableOpacity style={styles.arrivedBtn} onPress={handleArrived}>
                <Text style={styles.arrivedBtnText}>ARRIVED AT PICKUP 🏁</Text>
              </TouchableOpacity>
            )}

            {navState === 'arrived' && (
              <TouchableOpacity style={styles.startTripBtn} onPress={handleStartTrip}>
                <Text style={styles.startTripBtnText}>START TRIP 🚖</Text>
              </TouchableOpacity>
            )}

            {navState === 'started' && (
              <TouchableOpacity style={styles.completeTripBtn} onPress={handleCompleteTrip}>
                <Text style={styles.completeTripBtnText}>COMPLETE TRIP 🏁</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.backBtn} onPress={() => setActiveView('list')}>
              <Text style={styles.backBtnText}>BACK TO JOBS LIST</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
      }
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* ── ACTIVE / ACCEPTED JOBS SECTION ── */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Your Active List</Text>
        {acceptedJobs.length === 0 ? (
          <View style={styles.emptyCardBox}>
            <Text style={styles.emptyCardText}>No active bookings under navigation.</Text>
          </View>
        ) : (
          acceptedJobs.map(item => renderJobCard(item, false))
        )}
      </View>

      {/* ── PENDING ASSIGNMENTS SECTION ── */}
      <View style={[styles.section, { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 20 }]}>
        <Text style={styles.sectionHeader}>Pending Fleet Assignments</Text>
        {loading && !refreshing ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : pendingJobs.length === 0 ? (
          <View style={styles.emptyCardBox}>
            <Text style={styles.emptyCardText}>Waiting for new administrator assignments.</Text>
          </View>
        ) : (
          pendingJobs.map(item => renderJobCard(item, true))
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
  section: {
    padding: 20,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '950',
    color: COLORS.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  emptyCardBox: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    alignItems: 'center',
  },
  emptyCardText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 16,
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
    marginBottom: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
  },
  categorySub: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primaryDark,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  fareText: {
    fontSize: 18,
    fontWeight: '950',
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
    marginBottom: 14,
  },
  footerInfo: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptBtn: {
    flex: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  acceptBtnText: {
    color: COLORS.white,
    fontWeight: '950',
    fontSize: 12,
  },
  mapBtn: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  mapBtnText: {
    color: COLORS.text,
    fontWeight: '900',
    fontSize: 11,
  },
  navBtn: {
    flex: 1,
    backgroundColor: COLORS.primaryDark,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  navBtnText: {
    color: COLORS.white,
    fontWeight: '950',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  navContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  navMap: {
    flex: 1,
  },
  hudOverlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(232, 179, 75, 0.4)',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 999,
  },
  hudCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hudArrow: {
    fontSize: 20,
  },
  hudTextContainer: {
    flex: 1,
  },
  hudHeading: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hudSubheading: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: 2,
  },
  controlPanelCard: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  riderProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 14,
    marginBottom: 14,
  },
  profileBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  profileEmoji: {
    fontSize: 18,
  },
  profileRiderName: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.text,
  },
  profileSub: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginTop: 1,
  },
  navStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  navStatLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  navStatValue: {
    fontSize: 14,
    fontWeight: '950',
    color: COLORS.text,
  },
  hudActions: {
    gap: 10,
  },
  arrivedBtn: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  arrivedBtnText: {
    color: COLORS.white,
    fontWeight: '950',
    fontSize: 13,
  },
  startTripBtn: {
    backgroundColor: COLORS.success,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  startTripBtnText: {
    color: COLORS.white,
    fontWeight: '950',
    fontSize: 13,
  },
  completeTripBtn: {
    backgroundColor: COLORS.success,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  completeTripBtnText: {
    color: COLORS.white,
    fontWeight: '950',
    fontSize: 13,
  },
  backBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  backBtnText: {
    color: COLORS.textMuted,
    fontWeight: '900',
    fontSize: 12,
  },
});
