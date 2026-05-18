import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  FaMapMarkerAlt, FaCalendarAlt, FaClock, FaCar,
  FaChevronRight, FaHeadset,
  FaPhoneAlt, FaRoute, FaUserCircle, FaCreditCard,
  FaPhone, FaChevronDown, FaChevronUp, FaCarSide, FaHistory,
  FaCrosshairs, FaLocationArrow
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { api, postMapRoute } from '../../lib/api.js';

const createCustomIcon = (color) => L.divIcon({
  html: `<div style="background-color: ${color}; width: 15px; height: 15px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 15px ${color}80; transform: scale(1.1);"></div>`,
  className: 'custom-map-marker',
  iconSize: [15, 15],
  iconAnchor: [7.5, 7.5]
});

const pickupIcon = createCustomIcon('#22c55e'); // Green
const dropIcon = createCustomIcon('#ef4444');   // Red

const ChangeView = ({ center }) => {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
};

const ResizeMap = ({ trigger }) => {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 400);
  }, [trigger, map]);
  return null;
};

const BookingPage = ({ activeTab, user }) => {
  const { t } = useTranslation();
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [cars, setCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [distance, setDistance] = useState(0);
  const [routeCoords, setRouteCoords] = useState([]);
  const [activeSelectionMode, setActiveSelectionMode] = useState(null); // 'pickup' or 'drop'
  const [status, setStatus] = useState('idle');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [showMobilePanel, setShowMobilePanel] = useState(true);
  const [allBookings, setAllBookings] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const routeTimer = useRef(null);

  const fetchAddressName = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
        headers: { 'Accept-Language': 'en' }
      });
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const place = addr.city || addr.town || addr.village || addr.suburb || addr.hamlet || addr.county || data.display_name.split(',')[0];
        const state = addr.state ? `, ${addr.state}` : '';
        return `${place}${state}`;
      }
    } catch (e) {
      console.error(e);
    }
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    const loadId = toast.loading("Fetching current location...");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const address = await fetchAddressName(latitude, longitude);
        setPickup(address);
        toast.dismiss(loadId);
        toast.success("Current location set!");
      },
      (error) => {
        toast.dismiss(loadId);
        toast.error("Failed to get current location. Please enter manually.");
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const startMapSelection = (mode) => {
    setActiveSelectionMode(mode);
    toast.success(`Click anywhere on the map to set ${mode} location!`, {
      icon: '📍',
      duration: 4000
    });
  };

  const MapEvents = () => {
    const map = useMap();
    useEffect(() => {
      const handleMapClick = async (e) => {
        const { lat, lng } = e.latlng;
        if (activeSelectionMode === 'pickup') {
          const loadId = toast.loading("Resolving pickup address...");
          const address = await fetchAddressName(lat, lng);
          setPickup(address);
          setActiveSelectionMode(null);
          toast.dismiss(loadId);
          toast.success("Pickup location marked!");
        } else if (activeSelectionMode === 'drop') {
          const loadId = toast.loading("Resolving drop address...");
          const address = await fetchAddressName(lat, lng);
          setDrop(address);
          setActiveSelectionMode(null);
          toast.dismiss(loadId);
          toast.success("Drop location marked!");
        }
      };
      map.on('click', handleMapClick);
      return () => {
        map.off('click', handleMapClick);
      };
    }, [map, activeSelectionMode]);
    return null;
  };

  const displayName = user?.name || t('booking.rider_fallback');

  const translateStatus = (status) => {
    const map = {
      Completed: 'admin.status_completed',
      Pending: 'admin.status_pending',
      Assigned: 'admin.status_assigned',
      Accepted: 'admin.status_accepted',
      Cancelled: 'admin.status_cancelled',
    };
    return map[status] ? t(map[status]) : status;
  };

  const loadBookings = useCallback(async () => {
    try {
      const list = await api('/api/bookings');
      setAllBookings(Array.isArray(list) ? list : []);
    } catch {
      /* keep list */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await api('/api/catalog/cars');
        if (!cancelled && Array.isArray(list) && list.length) {
          setCars(list);
          // Do not select any category by default
        }
      } catch {
        if (!cancelled) setCars([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    loadBookings();
    const interval = setInterval(loadBookings, 5000);
    return () => clearInterval(interval);
  }, [loadBookings]);

  useEffect(() => {
    if (routeTimer.current) clearTimeout(routeTimer.current);
    routeTimer.current = setTimeout(async () => {
      if (!pickup?.trim() || !drop?.trim()) return;
      try {
        const route = await postMapRoute(pickup.trim(), drop.trim());
        setDistance(route.distanceKm);
        setRouteCoords(route.coordinates);
      } catch (e) {
        toast.error(e.message || t('booking.toast_route_failed'));
      }
    }, 700);
    return () => {
      if (routeTimer.current) clearTimeout(routeTimer.current);
    };
  }, [pickup, drop]);

  const mapCenter = routeCoords.length
    ? [(routeCoords[0][0] + routeCoords[routeCoords.length - 1][0]) / 2, (routeCoords[0][1] + routeCoords[routeCoords.length - 1][1]) / 2]
    : [28.6139, 77.209];

  const fare = selectedCar ? Math.round(distance * selectedCar.pricePerKm) : 0;
  const adminCommission = Math.floor(fare * 0.12);
  const driverEarnings = fare - adminCommission;

  const handleBooking = async () => {
    if (!selectedCar) {
      toast.error(t('booking.toast_loading_cars'));
      return;
    }
    if (!bookingDate || !bookingTime) {
      toast.error(t('booking.toast_select_datetime'));
      return;
    }
    try {
      await api('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          pickup,
          drop,
          bookingDate,
          bookingTime,
          carName: selectedCar.name,
          fare,
          distanceKm: distance,
          routeCoords,
          pickupLat: routeCoords[0]?.[0],
          pickupLng: routeCoords[0]?.[1],
          dropLat: routeCoords[routeCoords.length - 1]?.[0],
          dropLng: routeCoords[routeCoords.length - 1]?.[1],
        }),
      });
      await loadBookings();
      setStatus('searching');
      toast.success(t('booking.toast_booking_sent'));
      setTimeout(() => toast(t('booking.toast_check_rides'), { icon: 'ℹ️' }), 2000);
    } catch (e) {
      toast.error(e.message || t('booking.toast_booking_failed'));
    }
  };

  const isBookingView = activeTab === 'Book Ride' || !activeTab;
  const isDashboardView = activeTab === 'Dashboard';

  return (
    <div className="pt-16 min-h-screen bg-background text-dark">

      {/* ── CUSTOMER DASHBOARD ─────────────────────────────────── */}
      {isDashboardView && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 sm:p-8 lg:p-12 max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div>
              <h2 className="text-3xl sm:text-5xl font-black italic tracking-tighter uppercase text-dark leading-none">
                {t('booking.hello')}, <span className="text-primary">{displayName}</span>
              </h2>
              <p className="text-muted text-[10px] sm:text-xs uppercase font-black tracking-widest mt-2">{t('booking.welcome_hub')}</p>
            </div>
            <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 px-4 sm:px-6 py-3 rounded-2xl shadow-lg shadow-primary/5">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-xl flex items-center justify-center text-dark text-xl sm:text-2xl shadow-inner"><FaCreditCard /></div>
              <div>
                <p className="text-[9px] sm:text-[10px] text-primary uppercase font-black tracking-tighter leading-none mb-1">{t('booking.wallet_balance')}</p>
                <p className="text-xl sm:text-2xl font-black text-dark leading-none">₹2,450</p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
             {[
               { labelKey: 'booking.stat_total_rides', val: allBookings.length, icon: <FaCar />, color: 'text-blue-600' },
               { labelKey: 'booking.stat_total_spent', val: `₹${allBookings.reduce((acc, b) => acc + (b.fare || 0), 0)}`, icon: <FaRoute />, color: 'text-green-600' },
               { labelKey: 'booking.stat_rating', val: '4.9/5', icon: <FaMapMarkerAlt />, color: 'text-yellow-600' },
               { labelKey: 'booking.stat_saved_places', val: '4', icon: <FaCalendarAlt />, color: 'text-primary' },
             ].map((stat, i) => (
               <div key={i} className="glass-card p-4 sm:p-8 group hover:border-primary/30 transition-all cursor-pointer">
                  <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-dark/5 flex items-center justify-center text-xl sm:text-2xl mb-4 sm:mb-6 ${stat.color} group-hover:scale-110 transition-transform`}>{stat.icon}</div>
                  <p className="text-muted text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-1">{t(stat.labelKey)}</p>
                  <p className="text-xl sm:text-3xl font-black text-dark">{stat.val}</p>
               </div>
             ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10">
            {/* Quick Actions */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <button onClick={() => window.location.hash = 'Book Ride'} className="glass-card p-6 sm:p-10 bg-primary group hover:bg-white transition-all text-black text-left relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-black/5 rounded-full -mr-10 -mt-10" />
                    <FaCarSide className="text-3xl sm:text-5xl mb-4 sm:mb-6 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl sm:text-3xl font-black uppercase italic tracking-tighter leading-tight">{t('booking.book_new_ride_1')}<br/>{t('booking.book_new_ride_2')}</h3>
                    <p className="text-[10px] font-bold uppercase mt-4 tracking-widest opacity-60">{t('booking.verified_drivers')}</p>
                 </button>
                 <button onClick={() => window.location.hash = 'Support'} className="glass-card p-6 sm:p-10 bg-dark/5 border-border hover:border-primary transition-all text-left group">
                    <FaHeadset className="text-3xl sm:text-5xl mb-4 sm:mb-6 text-primary group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl sm:text-3xl font-black uppercase italic tracking-tighter leading-tight text-dark">{t('booking.live_support_1')}<br/>{t('booking.live_support_2')}</h3>
                    <p className="text-[10px] font-bold uppercase mt-4 tracking-widest text-muted">{t('booking.local_language_assistance')}</p>
                 </button>
              </div>

              {/* Active / Recent Map Preview */}
              <div className="glass-card p-4 sm:p-8 h-[300px] sm:h-[400px] relative overflow-hidden group">
                 <div className="absolute inset-0 grayscale opacity-40 group-hover:grayscale-0 transition-all duration-700">
                    <MapContainer center={mapCenter} zoom={13} className="w-full h-full" zoomControl={false} dragging={false} scrollWheelZoom={false}>
                       <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    </MapContainer>
                 </div>
                 <div className="relative z-10 h-full flex flex-col justify-between">
                    <div className="bg-background/90 backdrop-blur-md p-3 sm:p-5 rounded-2xl border border-border inline-block self-start max-w-xs">
                       <p className="text-[9px] text-primary font-black uppercase tracking-widest mb-1">{t('booking.last_trip_track')}</p>
                       <p className="text-dark text-xs font-bold leading-tight">{allBookings[0]?.pickup} → {allBookings[0]?.drop}</p>
                    </div>
                    <div className="flex justify-between items-end">
                       <button className="bg-primary text-black px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black uppercase tracking-widest text-[10px] sm:text-xs shadow-xl shadow-primary/30">{t('booking.live_tracking')}</button>
                    </div>
                 </div>
              </div>
            </div>

            {/* Recent Activity Mini List */}
            <div className="space-y-6">
              <h3 className="text-xl sm:text-2xl font-black italic tracking-tighter uppercase text-dark">{t('booking.recent_activity')}</h3>
              <div className="space-y-3">
                 {allBookings.slice(0, 4).map((ride) => (
                   <div key={ride.id} className="glass-card p-4 sm:p-5 border-border hover:bg-dark/5 transition-all flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-dark/5 rounded-xl flex items-center justify-center text-muted group-hover:text-primary transition-colors"><FaHistory /></div>
                        <div>
                          <p className="text-[10px] sm:text-xs font-black text-dark uppercase truncate max-w-[120px]">{ride.drop}</p>
                          <p className="text-[9px] text-muted font-bold">{ride.date}</p>
                        </div>
                      </div>
                      <p className="text-sm sm:text-base font-black text-primary">₹{ride.fare}</p>
                   </div>
                 ))}
              </div>
              <button onClick={() => window.location.hash = 'My Rides'} className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-muted hover:text-dark border border-border rounded-2xl hover:bg-dark/5 transition-all">{t('booking.view_all_rides')}</button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── BOOKING VIEW ─────────────────────────────────── */}
      {isBookingView && (
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)] relative overflow-x-hidden">

          {/* ── MOBILE: collapsible panel toggle ── */}
          <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-background/90 backdrop-blur-xl border-b border-border z-30 sticky top-0">
            <div>
              <h1 className="text-lg font-black tracking-tighter italic text-dark uppercase">
                LOCAL<span className="text-primary">CABS</span>
              </h1>
              <p className="text-[10px] text-muted uppercase font-black tracking-widest">{t('booking.brand_subtitle')}</p>
            </div>
            <button
              onClick={() => setShowMobilePanel(p => !p)}
              className="flex items-center gap-2 bg-primary text-dark rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20"
            >
              {!showMobilePanel ? <FaMapMarkerAlt className="text-[10px]" /> : <FaCar className="text-[10px]" />}
              {!showMobilePanel ? t('booking.show_map') : t('booking.show_form')}
            </button>
          </div>

          {/* ── SIDE PANEL ── */}
          <div className={`w-full lg:w-[420px] transition-all duration-300 ${showMobilePanel ? 'hidden lg:block' : 'block'} lg:h-auto overflow-y-auto custom-scrollbar border-b lg:border-b-0 lg:border-r border-border bg-background/50 backdrop-blur-xl z-20 lg:flex-shrink-0`}>
             <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
                {/* Brand — desktop only */}
                <div className="hidden lg:block">
                  <h1 className="text-4xl font-black tracking-tighter mb-1 italic text-dark uppercase">
                    Safar<span className="text-primary">Setu</span>
                  </h1>
                  <p className="text-muted text-[10px] uppercase font-black tracking-widest">Premium Local Connectivity</p>
                </div>

                {/* Inputs */}
                <div className="space-y-4">
                  <div className="relative">
                    <label className="text-[10px] uppercase tracking-widest font-black text-primary ml-1 mb-2 block">{t('booking.pickup')}</label>
                    <div className="relative group">
                      <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center">
                         <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                      </div>
                      <input 
                        type="text" 
                        value={pickup || ''} 
                        onChange={e => setPickup(e.target.value)} 
                        className="input-field pl-12 pr-24 text-sm py-4 bg-dark/5 border-border hover:border-primary/30 transition-all" 
                        placeholder={t('booking.enter_pickup')} 
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-10">
                        <button 
                          type="button"
                          onClick={useCurrentLocation}
                          title="Use Current Location"
                          className="w-8 h-8 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-dark transition-all flex items-center justify-center cursor-pointer"
                        >
                          <FaCrosshairs className="text-xs" />
                        </button>
                        <button 
                          type="button"
                          onClick={() => startMapSelection('pickup')}
                          title="Select on Map"
                          className={`w-8 h-8 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                            activeSelectionMode === 'pickup'
                              ? 'bg-primary text-dark shadow-lg shadow-primary/20 scale-110'
                              : 'bg-dark/5 hover:bg-primary/20 text-muted hover:text-primary'
                          }`}
                        >
                          <FaMapMarkerAlt className="text-xs" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <label className="text-[10px] uppercase tracking-widest font-black text-red-500 ml-1 mb-2 block">{t('booking.drop')}</label>
                    <div className="relative group">
                       <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center">
                          <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                       </div>
                       <input 
                         type="text" 
                         value={drop || ''} 
                         onChange={e => setDrop(e.target.value)} 
                         className="input-field pl-12 pr-14 text-sm py-4 bg-dark/5 border-border hover:border-red-500/30 transition-all" 
                         placeholder={t('booking.enter_destination')} 
                       />
                       <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
                         <button 
                           type="button"
                           onClick={() => startMapSelection('drop')}
                           title="Select on Map"
                           className={`w-8 h-8 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                             activeSelectionMode === 'drop'
                               ? 'bg-red-500 text-white shadow-lg shadow-red-500/20 scale-110'
                               : 'bg-dark/5 hover:bg-red-500/20 text-muted hover:text-red-500'
                           }`}
                         >
                           <FaMapMarkerAlt className="text-xs" />
                         </button>
                       </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-primary text-sm pointer-events-none" />
                      <input type="date" value={bookingDate || ''} onChange={e => setBookingDate(e.target.value)} className="input-field pl-11 text-xs py-4 bg-dark/5 border-border" />
                    </div>
                    <div className="relative">
                      <FaClock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary text-sm pointer-events-none" />
                      <input type="time" value={bookingTime || ''} onChange={e => setBookingTime(e.target.value)} className="input-field pl-11 text-xs py-4 bg-dark/5 border-border" />
                    </div>
                  </div>
                </div>

                {/* Car Selection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-2">
                       <div className="w-8 h-[1px] bg-dark/10" /> {t('booking.categories')}
                    </h3>
                    <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
                      {['All', ...new Set(cars.map(c => c.name))].map(cat => (
                        <button
                          key={cat}
                          onClick={() => setActiveFilter(cat)}
                          className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter transition-all whitespace-nowrap ${
                            activeFilter === cat 
                              ? 'bg-primary text-dark shadow-lg shadow-primary/20' 
                              : 'bg-dark/5 text-muted hover:bg-dark/10'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar pb-4">
                    <AnimatePresence mode="popLayout">
                      {(cars || [])
                        .filter(car => activeFilter === 'All' || car.name === activeFilter)
                        .map((car) => (
                      <motion.div
                        key={car.id}
                        whileHover={{ x: 5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedCar(car)}
                        className={`cursor-pointer glass-card p-4 flex items-center justify-between border-2 transition-all ${
                          selectedCar && selectedCar.id === car.id
                            ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10 scale-[1.02]'
                            : 'border-border hover:border-primary/20'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-12 bg-dark/5 rounded-xl flex items-center justify-center p-1 overflow-hidden">
                             <img src={car.image} alt={car.name} className="w-full h-full object-contain" />
                          </div>
                          <div>
                            <h4 className="font-black text-dark text-sm sm:text-base">{car.name}</h4>
                            <p className="text-[9px] sm:text-[10px] text-muted font-bold uppercase tracking-wider">{car.seats} {t('cars.seats')} • {car.eta}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-dark">
                            ₹{car.pricePerKm}<span className="text-[9px] text-muted">{t('booking.per_km_short')}</span>
                          </p>
                        </div>
                      </motion.div>
                    ))}
                    </AnimatePresence>
                  </div>
                </div>
             </div>
          </div>

          {/* ── MAP SECTION ── */}
          <div className={`w-full relative transition-all duration-300 ${!showMobilePanel ? 'h-[300px]' : 'h-[80vh]'} lg:flex-1 lg:h-[calc(100vh-64px)]`}>
            <MapContainer
              center={mapCenter}
              zoom={11}
              className="w-full h-full z-10"
              style={{ height: '100%', width: '100%', background: 'white' }}
            >
              <TileLayer 
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" 
              />
              <ChangeView center={mapCenter} />
              <ResizeMap trigger={showMobilePanel} />
              <MapEvents />
              {routeCoords.length > 0 && (
                <>
                  <Marker position={routeCoords[0]} icon={pickupIcon}>
                    <Popup>{t('booking.pickup_popup', { location: pickup })}</Popup>
                  </Marker>
                  <Marker position={routeCoords[routeCoords.length - 1]} icon={dropIcon}>
                    <Popup>{t('booking.drop_popup', { location: drop })}</Popup>
                  </Marker>
                  {/* Bottom Thick Glow Shadow Line */}
                  <Polyline 
                    positions={routeCoords} 
                    color="#1557B0" 
                    weight={8} 
                    opacity={0.3} 
                  />
                  {/* Top Premium Google Maps Blue Route Line */}
                  <Polyline 
                    positions={routeCoords} 
                    color="#1A73E8" 
                    weight={5} 
                    opacity={0.95} 
                  />
                </>
              )}
            </MapContainer>

            {/* Floating Fare Card */}
            <AnimatePresence>
              {status === 'idle' && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 50 }}
                  className="absolute bottom-6 left-4 right-4 sm:left-auto sm:right-12 z-30 sm:w-[400px]"
                >
                  <div className="glass-card p-5 sm:p-10 bg-background/95 backdrop-blur-3xl border-primary/40 rounded-[25px] sm:rounded-[40px] shadow-2xl">
                    <div className="flex justify-between items-center mb-5 sm:mb-10">
                      <div className="space-y-1 sm:space-y-2">
                        <p className="text-[8px] sm:text-[10px] text-muted uppercase font-black tracking-widest">{t('booking.total_dist')}</p>
                        <p className="text-xl sm:text-4xl font-black text-dark">{distance} <span className="text-xs sm:text-lg font-normal text-muted uppercase">{t('booking.unit_km')}</span></p>
                      </div>
                      <div className="text-right space-y-1 sm:space-y-2">
                        <p className="text-[8px] sm:text-[10px] text-muted uppercase font-black tracking-widest">{t('booking.est_fare')}</p>
                        <p className="text-2xl sm:text-5xl font-black text-primary italic leading-none">₹{fare}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleBooking}
                      className="w-full bg-primary hover:bg-dark text-dark hover:text-background py-3.5 sm:py-5 rounded-[15px] sm:rounded-[25px] flex items-center justify-center gap-3 sm:gap-4 group font-black uppercase text-xs sm:text-base shadow-xl shadow-primary/20 transition-all"
                    >
                      {t('booking.book_request_btn')}
                      <FaChevronRight className="group-hover:translate-x-2 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              )}

              {status === 'searching' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute inset-0 z-40 flex items-center justify-center bg-background/60 backdrop-blur-md px-4"
                >
                  <div className="text-center p-8 sm:p-12 glass-card border-primary/30 w-full max-w-md">
                    <div className="w-16 h-16 sm:w-24 sm:h-24 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6 sm:mb-8" />
                    <h2 className="text-xl sm:text-3xl font-black mb-3 sm:mb-4 tracking-tighter uppercase italic text-dark">
                      {t('booking.finding_driver')}
                    </h2>
                    <p className="text-muted text-sm">{t('booking.admin_assigning')}</p>
                    <button
                      onClick={() => setStatus('idle')}
                      className="mt-6 sm:mt-8 text-xs text-red-500 font-bold uppercase tracking-widest hover:underline"
                    >
                      {t('booking.cancel_request')}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ── MY RIDES ─────────────────────────────────────── */}
      {activeTab === 'My Rides' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 sm:p-8 lg:p-12 max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-4xl font-black italic tracking-tighter uppercase text-dark">{t('booking.rides_history')}</h2>
            <div className="bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20">
              <span className="text-[10px] text-primary font-black uppercase tracking-widest">{t('booking.total_rides')}: {allBookings.length}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
            {allBookings.map((ride) => (
              <div key={ride.id} className="glass-card p-5 sm:p-8 border-border hover:border-primary/20 transition-all flex flex-col h-full">
                <div className="flex justify-between items-start mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-border">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-[9px] sm:text-[10px] text-muted uppercase font-black">{ride.date} • {ride.time}</p>
                    <h4 className="text-base sm:text-xl font-bold text-dark truncate">{ride.pickup} → {ride.drop}</h4>
                  </div>
                  <span className={`shrink-0 px-2 py-1 rounded-lg text-[9px] font-black uppercase ${
                    ride.status === 'Completed' ? 'bg-green-500/10 text-green-600' :
                    ride.status === 'Assigned' ? 'bg-blue-500/10 text-blue-600' :
                    ride.status === 'Accepted' ? 'bg-emerald-500/10 text-emerald-700' :
                    'bg-yellow-500/10 text-yellow-600 animate-pulse'
                  }`}>
                    {translateStatus(ride.status)}
                  </span>
                </div>

                <div className="space-y-2.5 mb-5 sm:mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full shrink-0" />
                    <p className="text-xs text-muted font-medium">{ride.pickup}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full shrink-0" />
                    <p className="text-xs text-muted font-medium">{ride.drop}</p>
                  </div>
                </div>

                {ride.driver ? (
                  <div className="mt-auto p-3 sm:p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                        <FaUserCircle />
                      </div>
                      <div>
                        <p className="text-xs font-black text-dark">{ride.driver.name}</p>
                        <p className="text-[9px] text-muted uppercase font-bold">{ride.driver.vehicleName} • {ride.driver.vehicleNumber}</p>
                      </div>
                    </div>
                    <a 
                      href="tel:+916261828036"
                      className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-dark hover:scale-110 transition-all shadow-lg shadow-primary/20"
                      title={t('booking.contact_support')}
                    >
                      <FaPhone className="text-sm" />
                    </a>
                  </div>
                ) : (
                  <div className="mt-auto p-3 sm:p-4 bg-dark/5 rounded-2xl border border-border text-center">
                    <p className="text-[9px] sm:text-[10px] text-muted uppercase font-black">{t('booking.waiting_assign')}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── SUPPORT ──────────────────────────────────────── */}
      {activeTab === 'Support' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 sm:p-8 lg:p-12 max-w-4xl mx-auto">
          <div className="glass-card p-6 sm:p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-primary/5 rounded-full blur-[100px]" />
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 text-primary text-2xl sm:text-4xl shadow-xl shadow-primary/5">
              <FaHeadset />
            </div>
            <h2 className="text-2xl sm:text-4xl font-black italic tracking-tighter uppercase mb-3 sm:mb-4">{t('booking.support_title')}</h2>
            <p className="text-muted mb-8 sm:mb-12 max-w-md mx-auto text-sm">
              {t('booking.support_desc')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <button className="p-6 sm:p-8 bg-dark/5 rounded-2xl sm:rounded-3xl border border-border hover:border-primary/30 transition-all text-left group">
                <FaRoute className="text-primary text-xl sm:text-2xl mb-3 sm:mb-4 group-hover:scale-110 transition-all" />
                <h4 className="font-bold mb-1 text-sm sm:text-base text-dark">{t('booking.ride_issues')}</h4>
                <p className="text-xs text-muted">{t('booking.ride_issues_desc')}</p>
              </button>
              <button className="p-6 sm:p-8 bg-dark/5 rounded-2xl sm:rounded-3xl border border-border hover:border-primary/30 transition-all text-left group">
                <FaCreditCard className="text-primary text-xl sm:text-2xl mb-3 sm:mb-4 group-hover:scale-110 transition-all" />
                <h4 className="font-bold mb-1 text-sm sm:text-base text-dark">{t('booking.payment_wallet')}</h4>
                <p className="text-xs text-muted">{t('booking.payment_wallet_desc')}</p>
              </button>
            </div>
            <a 
              href="tel:+916261828036"
              className="mt-8 sm:mt-12 p-4 sm:p-6 bg-primary text-dark rounded-2xl sm:rounded-3xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-105 transition-all text-sm shadow-xl shadow-primary/20"
            >
              <FaPhoneAlt /> {t('booking.call_helpdesk')}
            </a>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default BookingPage;
