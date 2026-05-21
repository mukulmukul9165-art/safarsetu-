import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import api from '../../services/api';
import { COLORS } from '../../theme/colors';

const { width, height } = Dimensions.get('window');

const FLEET_CATEGORIES = [
  { id: 'mini', label: 'Mini', icon: '🚗' },
  { id: 'sedan', label: 'Sedan', icon: '🚘' },
  { id: 'suv', label: 'SUV', icon: '🚙' },
];

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

export default function AdminMapScreen({ route, navigation }) {
  const { bookingId } = route.params;
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);

  useEffect(() => {
    fetchActiveBooking();
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
      console.error('AdminMapScreen: Failed to load booking', e);
    } finally {
      setLoading(false);
    }
  };

  const fitRouteBounds = () => {
    if (mapRef.current && booking?.routeCoords && booking.routeCoords.length >= 2) {
      mapRef.current.fitToCoordinates(booking.routeCoords, {
        edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
        animated: true,
      });
    }
  };

  useEffect(() => {
    if (booking) {
      setTimeout(fitRouteBounds, 1200);
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
        <Text style={styles.loadingText}>Loading Map Data...</Text>
      </View>
    );
  }

  const selectedCarType = booking.car?.toLowerCase() || 'mini';
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
        {/* Glow Polyline for Premium shadow effect */}
        <Polyline
          coordinates={booking.routeCoords}
          strokeColor="rgba(217, 154, 54, 0.3)"
          strokeWidth={10}
        />
        {/* Main Active Gold Polyline */}
        <Polyline
          coordinates={booking.routeCoords}
          strokeColor="#D99A36" 
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
              borderColor: '#D99A36',
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

      {/* ── BOTTOM CARD ── */}
      <View style={styles.bottomCard}>
        
        {/* Locations */}
        <View style={styles.locationsWrapper}>
          <View style={styles.locationRow}>
            <View style={[styles.dot, { backgroundColor: COLORS.success }]} />
            <Text style={styles.locationText} numberOfLines={1}>{booking.pickup}</Text>
          </View>
          
          <View style={styles.lineConnector} />
          
          <View style={styles.locationRow}>
            <View style={[styles.dot, { backgroundColor: COLORS.danger }]} />
            <Text style={styles.locationText} numberOfLines={1}>{booking.drop}</Text>
          </View>
        </View>

        {/* Route Distance */}
        <Text style={styles.distanceText}>
          Total Distance: <Text style={styles.distanceValue}>{totalDist} km</Text>
        </Text>

        {/* Gold Action Button */}
        <TouchableOpacity style={styles.goldButton} onPress={() => navigation.goBack()}>
          <Text style={styles.goldButtonText}>⚡ BACK TO BOOKINGS</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F1EA',
  },
  map: {
    width: width,
    height: height,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F5F1EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F5F1EA',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  locationsWrapper: {
    backgroundColor: '#EBE5D8',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#F5F1EA',
  },
  locationText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  lineConnector: {
    width: 2,
    height: 20,
    backgroundColor: '#D6CEC0',
    marginLeft: 6,
    marginVertical: 4,
  },
  goldButton: {
    backgroundColor: '#D99A36', // Premium Gold
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#D99A36',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  goldButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  distanceText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '700',
    marginBottom: 24,
  },
  distanceValue: {
    color: COLORS.text,
    fontWeight: '900',
  },
  fleetHeader: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  fleetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fleetCard: {
    width: '30%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EBE5D8',
  },
  fleetCardSelected: {
    borderColor: '#D99A36',
    borderWidth: 2,
    backgroundColor: '#FFFBEB',
  },
  fleetIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  fleetLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textMuted,
  },
  fleetLabelSelected: {
    color: '#D99A36',
  },
});
