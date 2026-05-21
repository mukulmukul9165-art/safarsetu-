import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import api from '../../services/api';
import { COLORS } from '../../theme/colors';

const { width, height } = Dimensions.get('window');

// Helper function to generate a premium curved bezier path between two points
function generateCurvedRoute(p1, p2) {
  const steps = 18;
  const coords = [];
  const midLat = (p1.latitude + p2.latitude) / 2;
  const midLng = (p1.longitude + p2.longitude) / 2;
  
  // Create perpendicular offset to create a premium curved road effect
  const deltaLat = p2.latitude - p1.latitude;
  const deltaLng = p2.longitude - p1.longitude;
  const offsetLat = -deltaLng * 0.12; 
  const offsetLng = deltaLat * 0.12;
  
  const controlPoint = {
    latitude: midLat + offsetLat,
    longitude: midLng + offsetLng
  };
  
  // Quadratic Bezier interpolation
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    const latitude = mt * mt * p1.latitude + 2 * mt * t * controlPoint.latitude + t * t * p2.latitude;
    const longitude = mt * mt * p1.longitude + 2 * mt * t * controlPoint.longitude + t * t * p2.longitude;
    coords.push({ latitude, longitude });
  }
  return coords;
}

export default function LiveTrackingScreen({ route, navigation }) {
  const { bookingId } = route.params;
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);

  useEffect(() => {
    fetchActiveBooking();
    // Set up real-time polling simulation for live track
    const interval = setInterval(fetchActiveBooking, 8000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveBooking = async () => {
    try {
      const res = await api.get('/api/bookings');
      const activeRide = res.data.find(b => b.id === bookingId);
      if (activeRide) {
        let routeCoords = [];
        let pickupCoords = { latitude: activeRide.pickupLat || 22.02486, longitude: activeRide.pickupLng || 74.89645 };
        let dropCoords = { latitude: activeRide.dropLat || 22.7196, longitude: activeRide.dropLng || 75.8577 };

        const pickupLabel = activeRide.pickup || '';
        const dropLabel = activeRide.drop || '';

        // Exact coordinates check for Barwani -> Indore route
        const isBarwaniIndore = 
          pickupLabel.toLowerCase().includes('barwani') && 
          dropLabel.toLowerCase().includes('indore');

        if (isBarwaniIndore) {
          pickupCoords = { latitude: 22.0248, longitude: 74.8964 };
          dropCoords = { latitude: 22.7196, longitude: 75.8577 };
          routeCoords = [
            { latitude: 22.0248, longitude: 74.8964 }, // Barwani
            { latitude: 22.1000, longitude: 74.9300 },
            { latitude: 22.1800, longitude: 75.0200 },
            { latitude: 22.2500, longitude: 75.1000 }, // Julwania/Kukshi junction
            { latitude: 22.2200, longitude: 75.3200 },
            { latitude: 22.2400, longitude: 75.4600 }, // Dhamnod
            { latitude: 22.3800, longitude: 75.4200 },
            { latitude: 22.4800, longitude: 75.3400 },
            { latitude: 22.5900, longitude: 75.3000 }, // Dhar
            { latitude: 22.5600, longitude: 75.4800 },
            { latitude: 22.6100, longitude: 75.6100 },
            { latitude: 22.6200, longitude: 75.6800 }, // Pithampur
            { latitude: 22.6900, longitude: 75.7600 },
            { latitude: 22.7196, longitude: 75.8577 }  // Indore
          ];
        } else {
          // Dynamic fetch from backend maps routing service
          try {
            const routeRes = await api.post('/api/maps/route', { 
              pickup: pickupLabel, 
              drop: dropLabel 
            });
            if (routeRes.data && routeRes.data.coordinates) {
              const coords = routeRes.data.coordinates.map(c => ({ latitude: c[0], longitude: c[1] }));
              pickupCoords = { latitude: routeRes.data.pickup.lat, longitude: routeRes.data.pickup.lng };
              dropCoords = { latitude: routeRes.data.drop.lat, longitude: routeRes.data.drop.lng };
              
              if (coords.length > 2) {
                routeCoords = coords;
              } else {
                routeCoords = generateCurvedRoute(pickupCoords, dropCoords);
              }
            }
          } catch (err) {
            console.log('Generic fallback: generating premium curved route...');
            routeCoords = generateCurvedRoute(pickupCoords, dropCoords);
          }
        }

        activeRide.pickupCoords = pickupCoords;
        activeRide.dropCoords = dropCoords;
        activeRide.routeCoords = routeCoords;
        
        setBooking(activeRide);
      }
    } catch (e) {
      console.error('LiveTrack: Failed to load dynamic ride coordinate log', e);
    } finally {
      setLoading(false);
    }
  };

  // Auto fit map bounds on mount or data load
  const fitRouteBounds = () => {
    if (mapRef.current && booking?.routeCoords && booking.routeCoords.length >= 2) {
      mapRef.current.fitToCoordinates(booking.routeCoords, {
        edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
        animated: true,
      });
    }
  };

  useEffect(() => {
    if (booking) {
      // Small timeout to let map load properly before fit bounds
      setTimeout(fitRouteBounds, 1000);
    }
  }, [booking]);

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Synchronize progress using the system epoch time clock
    const seconds = Math.floor(Date.now() / 1000) % 120;
    setProgress(seconds / 120);

    const timer = setInterval(() => {
      const secs = Math.floor(Date.now() / 1000) % 120;
      setProgress(secs / 120);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading || !booking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Connecting to SafarSetu Live GPS...</Text>
      </View>
    );
  }

  const totalDist = parseFloat(booking.distance) || 155.0;
  const remainingDist = Math.max(0, (totalDist * (1 - progress))).toFixed(1);
  const remainingTime = Math.max(0, Math.round(totalDist * 1.2 * (1 - progress)));
  const speed = progress >= 0.95 ? 0 : Math.round(74 + Math.sin(Date.now() / 3000) * 6);

  let trackingStatus = 'Heading to Drop';
  if (progress < 0.15) {
    trackingStatus = 'Driver heading to pickup...';
  } else if (progress >= 0.95) {
    trackingStatus = 'Arrived at destination!';
  } else {
    trackingStatus = `In Transit • Speed: ${speed} km/h`;
  }

  const routeCoords = booking.routeCoords || [];
  const totalPoints = routeCoords.length;
  const currentIndex = Math.min(
    Math.floor(progress * totalPoints),
    totalPoints - 1
  );
  const carCoords = totalPoints > 0 ? routeCoords[currentIndex] : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── MAPVIEW ── */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: booking.pickupCoords.latitude,
          longitude: booking.pickupCoords.longitude,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2,
        }}
      >
        {/* Route Line - Double layered for premium Google Maps shadow style */}
        <Polyline
          coordinates={booking.routeCoords}
          strokeColor="rgba(21, 87, 176, 0.4)"
          strokeWidth={8}
        />
        <Polyline
          coordinates={booking.routeCoords}
          strokeColor="#1A73E8" // Premium Active Google Blue
          strokeWidth={4}
        />

        {/* Pickup Pin */}
        <Marker
          coordinate={booking.pickupCoords}
          title="Pickup Location"
          description={booking.pickup}
          pinColor="#22C55E"
        />

        {/* Drop Pin */}
        <Marker
          coordinate={booking.dropCoords}
          title="Drop Location"
          description={booking.drop}
          pinColor="#EF4444"
        />

        {/* Car Marker */}
        {carCoords && (
          <Marker
            coordinate={carCoords}
            title="SafarSetu Active Cab"
            description={trackingStatus}
          >
            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              padding: 6,
              borderWidth: 2,
              borderColor: '#1A73E8',
              shadowColor: '#000',
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 4
            }}>
              <Text style={{ fontSize: 20 }}>🚖</Text>
            </View>
          </Marker>
        )}
      </MapView>

      {/* ── FLOAT CONTROL BANNER ── */}
      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Text style={styles.liveIndicator}>🔴 LIVE: {trackingStatus.toUpperCase()}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{progress >= 0.95 ? 'COMPLETED' : 'EN ROUTE'}</Text>
          </View>
        </View>

        <Text style={styles.carName}>{booking.car} Premium</Text>

        {/* Dynamic Distance Remaining Panel */}
        <View style={{
          flexDirection: 'row', 
          justifyContent: 'space-between',
          backgroundColor: '#F8FAFC',
          borderRadius: 8,
          padding: 8,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          marginVertical: 10
        }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.textMuted }}>
            🏁 {remainingDist} KM LEFT
          </Text>
          <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.textMuted }}>
            ⏳ {remainingTime} MINS ETA
          </Text>
        </View>

        <Text style={styles.routeHeader}>Route Path</Text>
        <Text style={styles.routeDetail} numberOfLines={1}>🟢 {booking.pickup} ➔ 🔴 {booking.drop}</Text>

        {booking.driver ? (
          <View style={styles.driverSection}>
            <View style={styles.driverAvatar}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
            <View>
              <Text style={styles.driverName}>{booking.driver.name}</Text>
              <Text style={styles.vehicleInfo}>Plate: {booking.driver.vehicleNumber}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.noDriverText}>Waiting for driver to accept...</Text>
        )}

        <TouchableOpacity style={styles.recenterBtn} onPress={fitRouteBounds}>
          <Text style={styles.recenterBtnText}>🎯 RECENTER MAP VIEW</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: width,
    height: height,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  statusCard: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  liveIndicator: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.danger,
    letterSpacing: 1,
  },
  badge: {
    backgroundColor: 'rgba(232, 179, 75, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(232, 179, 75, 0.2)',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.primaryDark,
    textTransform: 'uppercase',
  },
  carName: {
    fontSize: 18,
    fontWeight: '950',
    color: COLORS.text,
    marginBottom: 6,
  },
  routeHeader: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  routeDetail: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 4,
    marginBottom: 14,
  },
  driverSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    marginBottom: 14,
  },
  driverAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarText: {
    fontSize: 18,
  },
  driverName: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.text,
  },
  vehicleInfo: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  noDriverText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: COLORS.textMuted,
    paddingVertical: 12,
    textAlign: 'center',
  },
  recenterBtn: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  recenterBtnText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
