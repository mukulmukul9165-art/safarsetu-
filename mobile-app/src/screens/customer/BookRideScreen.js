import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import api from '../../services/api';
import { COLORS } from '../../theme/colors';
import LocationPickerModal from '../shared/LocationPickerModal';

const { width, height } = Dimensions.get('window');

export default function BookRideScreen({ navigation }) {
  // Location states — store both name & coordinates
  const [pickup, setPickup] = useState('');
  const [pickupCoords, setPickupCoords] = useState(null); // { latitude, longitude }
  const [drop, setDrop] = useState('');
  const [dropCoords, setDropCoords] = useState(null);

  // Modal visibility
  const [pickupModalVisible, setPickupModalVisible] = useState(false);
  const [dropModalVisible, setDropModalVisible] = useState(false);

  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);

  // Date & Time states
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');

  // Fleet categories & selection
  const [cars, setCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);

  // Search status overlay
  const [status, setStatus] = useState('idle'); // 'idle' | 'searching'
  const [currentBookingId, setCurrentBookingId] = useState(null);

  // Route details
  const [routeInfo, setRouteInfo] = useState(null);

  const defaultCarCategories = [
    { id: 1, name: 'Mini', pricePerKm: 12, seats: 4, eta: '3 mins', image: '🚗' },
    { id: 2, name: 'Sedan', pricePerKm: 15, seats: 4, eta: '5 mins', image: '🚘' },
    { id: 3, name: 'SUV', pricePerKm: 20, seats: 6, eta: '6 mins', image: '🚙' },
  ];

  // Fetch cars on mount
  useEffect(() => {
    const fetchCars = async () => {
      try {
        const res = await api.get('/api/catalog/cars');
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setCars(res.data);
          setSelectedCar(res.data[0]);
        } else {
          setCars(defaultCarCategories);
          setSelectedCar(defaultCarCategories[0]);
        }
      } catch {
        setCars(defaultCarCategories);
        setSelectedCar(defaultCarCategories[0]);
      }
    };

    fetchCars();

    // Default booking date & time
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const timeStr = today.toTimeString().split(' ')[0].substring(0, 5);
    setBookingDate(dateStr);
    setBookingTime(timeStr);
  }, []);

  // Calculate route — uses coordinates if available, else text
  const calculateRoute = async () => {
    if (!pickup.trim() || !drop.trim()) {
      Alert.alert('Incomplete Fields', 'Please select both pickup and drop locations.');
      return;
    }

    setCalculating(true);
    setRouteInfo(null);

    try {
      const payload = { pickup, drop };

      // If we have exact coordinates, pass them directly (more accurate)
      if (pickupCoords) {
        payload.pickupLat = pickupCoords.latitude;
        payload.pickupLng = pickupCoords.longitude;
      }
      if (dropCoords) {
        payload.dropLat = dropCoords.latitude;
        payload.dropLng = dropCoords.longitude;
      }

      const res = await api.post('/api/maps/route', payload);
      const { pickup: p, drop: d, coordinates, distanceKm } = res.data;

      setRouteInfo({
        pickupCoords: { latitude: p.lat, longitude: p.lng },
        dropCoords: { latitude: d.lat, longitude: d.lng },
        coordinates: coordinates.map(c => ({ latitude: c[0], longitude: c[1] })),
        distance: distanceKm,
      });
    } catch {
      // Fallback: if we have coordinates, compute a straight-line estimate
      if (pickupCoords && dropCoords) {
        const dlat = pickupCoords.latitude - dropCoords.latitude;
        const dlng = pickupCoords.longitude - dropCoords.longitude;
        const straightLineKm = Math.sqrt(dlat * dlat + dlng * dlng) * 111;
        const estimatedKm = Math.round(straightLineKm * 1.3 * 10) / 10; // road factor ~1.3x

        setRouteInfo({
          pickupCoords,
          dropCoords,
          coordinates: [pickupCoords, dropCoords],
          distance: estimatedKm,
        });
      } else {
        // Last resort fallback
        setRouteInfo({
          pickupCoords: { latitude: 22.0248, longitude: 74.8964 },
          dropCoords: { latitude: 22.9676, longitude: 76.0534 },
          coordinates: [
            { latitude: 22.0248, longitude: 74.8964 },
            { latitude: 22.9676, longitude: 76.0534 },
          ],
          distance: 15.4,
        });
      }
    } finally {
      setCalculating(false);
    }
  };

  const handleBooking = async () => {
    if (!routeInfo) {
      Alert.alert('Route Required', 'Please select locations and estimate route first.');
      return;
    }
    if (!bookingDate.trim() || !bookingTime.trim()) {
      Alert.alert('Date & Time Required', 'Please specify scheduling date and time.');
      return;
    }
    if (!selectedCar) {
      Alert.alert('Vehicle Required', 'Please choose your preferred ride category.');
      return;
    }

    setLoading(true);
    try {
      const fare = Math.round(routeInfo.distance * (selectedCar.pricePerKm || selectedCar.baseRate || 12));

      const bookingPayload = {
        pickup,
        drop,
        bookingDate,
        bookingTime,
        carName: selectedCar.name,
        fare,
        pickupLat: routeInfo.pickupCoords.latitude,
        pickupLng: routeInfo.pickupCoords.longitude,
        dropLat: routeInfo.dropCoords.latitude,
        dropLng: routeInfo.dropCoords.longitude,
        routeCoords: routeInfo.coordinates.map(c => [c.latitude, c.longitude]),
        distanceKm: routeInfo.distance,
      };

      const res = await api.post('/api/bookings', bookingPayload);
      const bookingData = res.data;
      setCurrentBookingId(bookingData.id);
      setLoading(false);
      setStatus('searching');
    } catch (e) {
      setLoading(false);
      const msg = e.response?.data?.message || 'Failed to create booking.';
      Alert.alert('Booking Error', msg);
    }
  };

  const handleCancelRequest = async () => {
    if (!currentBookingId) { setStatus('idle'); return; }
    setLoading(true);
    try {
      await api.patch(`/api/bookings/${currentBookingId}`, { status: 'Cancelled' });
      setStatus('idle');
      Alert.alert('Cancelled', 'Your booking request has been successfully cancelled.');
    } catch {
      setStatus('idle');
    } finally {
      setLoading(false);
    }
  };

  const setPresetTime = (offsetHours) => {
    const d = new Date();
    if (offsetHours > 0) d.setHours(d.getHours() + offsetHours);
    if (offsetHours === 24) d.setDate(d.getDate() + 1);
    setBookingDate(d.toISOString().split('T')[0]);
    setBookingTime(d.toTimeString().split(' ')[0].substring(0, 5));
  };

  // Computed map region when route is available
  const mapRegion = routeInfo
    ? {
        latitude: (routeInfo.pickupCoords.latitude + routeInfo.dropCoords.latitude) / 2,
        longitude: (routeInfo.pickupCoords.longitude + routeInfo.dropCoords.longitude) / 2,
        latitudeDelta: Math.abs(routeInfo.pickupCoords.latitude - routeInfo.dropCoords.latitude) * 1.8 + 0.05,
        longitudeDelta: Math.abs(routeInfo.pickupCoords.longitude - routeInfo.dropCoords.longitude) * 1.8 + 0.05,
      }
    : {
        latitude: pickupCoords ? pickupCoords.latitude : 22.7196,
        longitude: pickupCoords ? pickupCoords.longitude : 75.8577,
        latitudeDelta: 3,
        longitudeDelta: 3,
      };

  return (
    <View style={styles.container}>
      {/* ── MAP ── */}
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_DEFAULT}
          style={styles.map}
          region={mapRegion}
        >
          {routeInfo && (
            <>
              <Marker coordinate={routeInfo.pickupCoords} title="Pickup" pinColor="#22C55E" />
              <Marker coordinate={routeInfo.dropCoords} title="Drop" pinColor="#EF4444" />
              <Polyline
                coordinates={routeInfo.coordinates}
                strokeColor={COLORS.primaryDark}
                strokeWidth={4}
              />
            </>
          )}
          {!routeInfo && pickupCoords && (
            <Marker coordinate={pickupCoords} title="Pickup" pinColor="#22C55E" />
          )}
          {!routeInfo && dropCoords && (
            <Marker coordinate={dropCoords} title="Drop" pinColor="#EF4444" />
          )}
        </MapView>
      </View>

      {/* ── CONTROL PANEL ── */}
      <View style={styles.controlPanel}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>

          {/* Pickup / Drop location selector buttons */}
          <View style={styles.inputsCard}>
            {/* PICKUP */}
            <TouchableOpacity
              style={styles.locationRow}
              onPress={() => setPickupModalVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.locationDot}>🟢</Text>
              <View style={styles.locationTextWrap}>
                <Text style={styles.locationLabel}>PICKUP</Text>
                <Text
                  style={[styles.locationValue, !pickup && styles.locationPlaceholder]}
                  numberOfLines={1}
                >
                  {pickup || 'Tap to select pickup location'}
                </Text>
              </View>
              <Text style={styles.locationArrow}>›</Text>
            </TouchableOpacity>

            <View style={styles.separator} />

            {/* DROP */}
            <TouchableOpacity
              style={styles.locationRow}
              onPress={() => setDropModalVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.locationDot}>🔴</Text>
              <View style={styles.locationTextWrap}>
                <Text style={styles.locationLabel}>DROP</Text>
                <Text
                  style={[styles.locationValue, !drop && styles.locationPlaceholder]}
                  numberOfLines={1}
                >
                  {drop || 'Tap to select drop location'}
                </Text>
              </View>
              <Text style={styles.locationArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.calculateBtn, (!pickup || !drop) && styles.calculateBtnDisabled]}
              onPress={calculateRoute}
              disabled={calculating || !pickup || !drop}
            >
              {calculating ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.calculateBtnText}>⚡ ESTIMATE ROUTE & FARE</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Schedule Ride */}
          <Text style={styles.sectionHeader}>Schedule Ride</Text>
          <View style={styles.dateTimeGrid}>
            <View style={styles.dateTimeField}>
              <Text style={styles.dateTimeLabel}>DATE (YYYY-MM-DD)</Text>
              <TouchableOpacity style={styles.dateTimeInput} onPress={() => {}}>
                <Text style={styles.dateTimeValue}>{bookingDate}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.dateTimeField}>
              <Text style={styles.dateTimeLabel}>TIME (HH:MM)</Text>
              <TouchableOpacity style={styles.dateTimeInput} onPress={() => {}}>
                <Text style={styles.dateTimeValue}>{bookingTime}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Preset time CTAs */}
          <View style={styles.presetsRow}>
            <TouchableOpacity style={styles.presetChip} onPress={() => setPresetTime(0)}>
              <Text style={styles.presetChipText}>🔥 Now</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetChip} onPress={() => setPresetTime(1)}>
              <Text style={styles.presetChipText}>⏱️ +1 Hr</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetChip} onPress={() => setPresetTime(24)}>
              <Text style={styles.presetChipText}>📅 Tomorrow</Text>
            </TouchableOpacity>
          </View>

          {/* Route details + car selector (only after estimate) */}
          {routeInfo && (
            <View style={styles.routeDetailsContainer}>
              <View style={styles.distanceRow}>
                <Text style={styles.distanceBadge}>📏 {routeInfo.distance.toFixed(1)} km</Text>
                <Text style={styles.distanceNote}>(estimated road distance)</Text>
              </View>

              <Text style={styles.sectionHeader}>Select Premium Fleet Category</Text>
              <View style={styles.carsRow}>
                {cars.map((car) => {
                  const active = selectedCar && selectedCar.id === car.id;
                  const estimatedFare = Math.round(routeInfo.distance * (car.pricePerKm || car.baseRate || 12));
                  return (
                    <TouchableOpacity
                      key={car.id}
                      style={[styles.carCard, active && styles.activeCarCard]}
                      onPress={() => setSelectedCar(car)}
                    >
                      <Text style={styles.carIcon}>{car.image || '🚗'}</Text>
                      <Text style={styles.carName}>{car.name}</Text>
                      <Text style={styles.carSeats}>{car.seats || 4} Seats</Text>
                      <Text style={styles.carFare}>₹{estimatedFare}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={styles.bookButton}
                onPress={handleBooking}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.bookButtonText}>CONFIRM & RIDE NOW 🚖</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </View>

      {/* ── SEARCHING OVERLAY ── */}
      {status === 'searching' && (
        <View style={styles.searchOverlay}>
          <View style={styles.searchCard}>
            <ActivityIndicator size="large" color={COLORS.primary} style={styles.searchSpinner} />
            <Text style={styles.searchTitle}>FINDING YOUR DRIVER</Text>
            <Text style={styles.searchSubtitle}>
              Connecting with premium fleet pilots near you. An elite driver will accept shortly.
            </Text>
            <View style={styles.searchProgress}>
              <Text style={styles.progressText}>🚀 Allocating luxury concierge pilot...</Text>
            </View>
            <TouchableOpacity
              style={styles.cancelRequestBtn}
              onPress={handleCancelRequest}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.danger} />
              ) : (
                <Text style={styles.cancelRequestText}>CANCEL RIDE REQUEST</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── LOCATION PICKER MODALS ── */}
      <LocationPickerModal
        visible={pickupModalVisible}
        onClose={() => setPickupModalVisible(false)}
        title="Select Pickup Location"
        onSelect={(name, lat, lng) => {
          setPickup(name);
          setPickupCoords({ latitude: lat, longitude: lng });
          setRouteInfo(null); // reset route when location changes
        }}
      />
      <LocationPickerModal
        visible={dropModalVisible}
        onClose={() => setDropModalVisible(false)}
        title="Select Drop Location"
        onSelect={(name, lat, lng) => {
          setDrop(name);
          setDropCoords({ latitude: lat, longitude: lng });
          setRouteInfo(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  mapContainer: {
    height: height * 0.35,
    width: width,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  controlPanel: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 10,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  inputsCard: {
    backgroundColor: COLORS.background,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  locationDot: {
    fontSize: 14,
  },
  locationTextWrap: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  locationValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  locationPlaceholder: {
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  locationArrow: {
    fontSize: 20,
    color: COLORS.textMuted,
    fontWeight: '300',
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 14,
  },
  calculateBtn: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    margin: 12,
    marginTop: 14,
  },
  calculateBtnDisabled: {
    backgroundColor: COLORS.border,
  },
  calculateBtnText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
  },
  dateTimeGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  dateTimeField: {
    flex: 1,
  },
  dateTimeLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: 6,
    marginLeft: 4,
  },
  dateTimeInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  dateTimeValue: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '700',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  presetChip: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  presetChipText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.text,
  },
  routeDetailsContainer: {
    marginTop: 4,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  distanceBadge: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.primaryDark,
    backgroundColor: 'rgba(232, 179, 75, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(232, 179, 75, 0.2)',
  },
  distanceNote: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  carsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  carCard: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  activeCarCard: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(232, 179, 75, 0.08)',
  },
  carIcon: { fontSize: 26, marginBottom: 4 },
  carName: { fontSize: 12, fontWeight: '900', color: COLORS.text },
  carSeats: { fontSize: 9, fontWeight: '700', color: COLORS.textMuted, marginTop: 2 },
  carFare: { fontSize: 14, fontWeight: '900', color: COLORS.primaryDark, marginTop: 6 },
  bookButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  bookButtonText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  searchOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30,30,30,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 999,
  },
  searchCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(232,179,75,0.3)',
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  searchSpinner: { marginBottom: 20 },
  searchTitle: {
    fontSize: 18,
    fontWeight: '950',
    color: COLORS.text,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  searchSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  searchProgress: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  progressText: {
    fontSize: 11,
    color: COLORS.primaryDark,
    fontWeight: '800',
  },
  cancelRequestBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.danger,
    borderRadius: 12,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  cancelRequestText: {
    color: COLORS.danger,
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
