import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  Dimensions,
  TextInput,
  Image,
} from 'react-native';
import api from '../../services/api';
import { COLORS } from '../../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { LanguageContext } from '../../context/LanguageContext';
import { AuthContext } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const TABS = ['Dashboard', 'Bookings', 'Customers', 'Drivers', 'Cars', 'Payments', 'Reports'];

export default function AdminDashboard({ navigation }) {
  const { t, locale, changeLanguage } = useContext(LanguageContext);
  const { logout } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('Dashboard');
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cars, setCars] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  
  // Web Replicated CRUD overlay state variables
  const [searchQuery, setSearchQuery] = useState('');
  
  // Customer modal
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custLocation, setCustLocation] = useState('');
  const [custPassword, setCustPassword] = useState('');

  // Driver modal
  const [driverModalVisible, setDriverModalVisible] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [drvName, setDrvName] = useState('');
  const [drvPhone, setDrvPhone] = useState('');
  const [drvLocation, setDrvLocation] = useState('');
  const [drvVehicleName, setDrvVehicleName] = useState('');
  const [drvVehicleNumber, setDrvVehicleNumber] = useState('');
  const [drvPassword, setDrvPassword] = useState('');

  // Car modal
  const [carModalVisible, setCarModalVisible] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [carNameVal, setCarNameVal] = useState('');
  const [carTypeVal, setCarTypeVal] = useState('');
  const [carPriceVal, setCarPriceVal] = useState('');
  const [carSeatsVal, setCarSeatsVal] = useState('');

  // View-only detail modals
  const [customerViewModalVisible, setCustomerViewModalVisible] = useState(false);
  const [viewingCustomer, setViewingCustomer] = useState(null);
  const [driverViewModalVisible, setDriverViewModalVisible] = useState(false);
  const [viewingDriver, setViewingDriver] = useState(null);

  // Password visibility toggles
  const [showCustPassword, setShowCustPassword] = useState(false);
  const [showDrvPassword, setShowDrvPassword] = useState(false);

  // Dummy Booking modal
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [dummyCustomerName, setDummyCustomerName] = useState('');
  const [dummyPhone, setDummyPhone] = useState('');
  const [dummyPickup, setDummyPickup] = useState('');
  const [dummyDrop, setDummyDrop] = useState('');
  const [dummyCar, setDummyCar] = useState('Mini');
  const [dummyFare, setDummyFare] = useState('');
  const [dummyDate, setDummyDate] = useState('24 May 2026');
  const [dummyTime, setDummyTime] = useState('10:30 AM');

  // Reset search on tab transition
  useEffect(() => {
    setSearchQuery('');
  }, [activeTab]);

  const loadAdminData = useCallback(async () => {
    try {
      const statsRes = await api.get('/api/admin/dashboard-stats');
      setStats(statsRes.data);

      const bookingsRes = await api.get('/api/bookings');
      setBookings(bookingsRes.data);

      const driversRes = await api.get('/api/admin/drivers');
      setDrivers(driversRes.data);

      const customersRes = await api.get('/api/admin/customers');
      setCustomers(customersRes.data);

      const carsRes = await api.get('/api/admin/cars');
      setCars(carsRes.data);

      const paymentsRes = await api.get('/api/admin/payments');
      setPayments(paymentsRes.data);
    } catch (e) {
      console.error('AdminDashboard: Failed to load admin data', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAdminData();
  };

  const toggleLanguage = () => {
    const nextLang = locale === 'en' ? 'hi' : locale === 'hi' ? 'nimadi' : 'en';
    changeLanguage(nextLang);
  };

  const handleCancelBooking = (bookingId) => {
    Alert.alert(
      t('booking.cancel_request') || 'Cancel Ride',
      'Are you sure you want to cancel this booking request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await api.patch(`/api/bookings/${bookingId}`, { status: 'Cancelled' });
              Alert.alert('Success', 'Ride booking has been cancelled successfully.');
              loadAdminData();
            } catch (e) {
              setLoading(false);
              Alert.alert('Error', e.response?.data?.message || 'Failed to cancel booking.');
            }
          }
        }
      ]
    );
  };

  const handleApproveDriver = async (userId) => {
    try {
      setLoading(true);
      await api.patch(`/api/admin/drivers/${userId}/approval`, { status: 'APPROVED' });
      Alert.alert('Success', 'Driver has been approved.');
      loadAdminData();
    } catch (e) {
      setLoading(false);
      Alert.alert('Error', e.response?.data?.message || 'Approval failed.');
    }
  };

  const handleAssignDriver = async (driverId) => {
    if (!selectedBooking) return;
    try {
      setLoading(true);
      setAssignModalVisible(false);
      await api.patch(`/api/bookings/${selectedBooking.id}`, { driverId });
      setSelectedBooking(null);
      Alert.alert('Assigned!', 'Driver assigned successfully.');
      loadAdminData();
    } catch (e) {
      setLoading(false);
      Alert.alert('Error', e.response?.data?.message || 'Assignment failed.');
    }
  };

  // CRUD handlers for Replicated Web Admin panels
  const handleSaveCustomer = async () => {
    if (!custName || !custPhone) {
      Alert.alert('Error', 'Please fill name and phone.');
      return;
    }
    try {
      setLoading(true);
      setCustomerModalVisible(false);
      const payload = { name: custName, phone: custPhone, location: custLocation, password: custPassword || '123456' };
      if (editingCustomer) {
        await api.patch(`/api/admin/customers/${editingCustomer.id}`, payload);
        Alert.alert('Success', 'Customer details updated successfully.');
      } else {
        await api.post('/api/admin/customers', payload);
        Alert.alert('Success', 'Customer registered successfully.');
      }
      loadAdminData();
    } catch (e) {
      setLoading(false);
      Alert.alert('Error', e.response?.data?.message || 'Action failed.');
    }
  };

  const handleDeleteCustomer = (userId) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this customer? This will also clear their booking and payment records.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          setLoading(true);
          await api.delete(`/api/admin/customers/${userId}`);
          Alert.alert('Deleted', 'Customer deleted successfully.');
          loadAdminData();
        } catch (e) {
          setLoading(false);
          Alert.alert('Error', e.response?.data?.message || 'Delete failed.');
        }
      }}
    ]);
  };

  const handleSaveDriver = async () => {
    if (!drvName || !drvPhone) {
      Alert.alert('Error', 'Please fill name and phone.');
      return;
    }
    try {
      setLoading(true);
      setDriverModalVisible(false);
      const payload = { 
        name: drvName, 
        phone: drvPhone, 
        location: drvLocation, 
        vehicleName: drvVehicleName || 'Mini', 
        vehicleNumber: drvVehicleNumber || 'MP 09 BD 1111', 
        password: drvPassword || '123456' 
      };
      if (editingDriver) {
        await api.patch(`/api/admin/drivers/${editingDriver.id}`, payload);
        Alert.alert('Success', 'Driver details updated successfully.');
      } else {
        await api.post('/api/admin/drivers', payload);
        Alert.alert('Success', 'Driver registered successfully.');
      }
      loadAdminData();
    } catch (e) {
      setLoading(false);
      Alert.alert('Error', e.response?.data?.message || 'Action failed.');
    }
  };

  const handleDeleteDriver = (userId) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this driver profile?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          setLoading(true);
          await api.delete(`/api/admin/drivers/${userId}`);
          Alert.alert('Deleted', 'Driver profile deleted successfully.');
          loadAdminData();
        } catch (e) {
          setLoading(false);
          Alert.alert('Error', e.response?.data?.message || 'Delete failed.');
        }
      }}
    ]);
  };

  const handleSaveCar = async () => {
    if (!carNameVal || !carPriceVal) {
      Alert.alert('Error', 'Please fill name and price per km.');
      return;
    }
    try {
      setLoading(true);
      setCarModalVisible(false);
      const payload = { 
        name: carNameVal, 
        type: carTypeVal || 'Standard', 
        pricePerKm: Number(carPriceVal), 
        seats: Number(carSeatsVal || 4),
        eta: '5 mins'
      };
      if (editingCar) {
        await api.patch(`/api/admin/cars/${editingCar.id}`, payload);
        Alert.alert('Success', 'Vehicle rates updated successfully.');
      } else {
        await api.post('/api/admin/cars', payload);
        Alert.alert('Success', 'New vehicle fleet added successfully.');
      }
      loadAdminData();
    } catch (e) {
      setLoading(false);
      Alert.alert('Error', e.response?.data?.message || 'Action failed.');
    }
  };

  const handleDeleteCar = (id) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this vehicle fleet?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          setLoading(true);
          await api.delete(`/api/admin/cars/${id}`);
          Alert.alert('Deleted', 'Vehicle fleet category deleted successfully.');
          loadAdminData();
        } catch (e) {
          setLoading(false);
          Alert.alert('Error', e.response?.data?.message || 'Delete failed.');
        }
      }}
    ]);
  };

  const handleSaveDummyBooking = async () => {
    if (!dummyCustomerName || !dummyPhone || !dummyPickup || !dummyDrop) {
      Alert.alert('Error', 'Please fill all required fields.');
      return;
    }
    try {
      setLoading(true);
      setBookingModalVisible(false);
      const payload = {
        customer: dummyCustomerName,
        phone: dummyPhone,
        pickup: dummyPickup,
        drop: dummyDrop,
        car: dummyCar || 'Mini',
        date: dummyDate || '24 May 2026',
        time: dummyTime || '10:30 AM',
        fare: dummyFare ? Number(dummyFare) : undefined
      };
      await api.post('/api/bookings/admin', payload);
      Alert.alert('Success', 'Dummy ride booking created successfully.');
      loadAdminData();
    } catch (e) {
      setLoading(false);
      Alert.alert('Error', e.response?.data?.message || 'Booking creation failed.');
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED': return COLORS.success;
      case 'PENDING': return COLORS.warning;
      case 'ASSIGNED': return '#3B82F6'; // Blue for assigned
      case 'ACCEPTED': return '#F59E0B'; // Orange/Yellow
      case 'CANCELLED': return COLORS.danger;
      default: return COLORS.textMuted;
    }
  };

  const renderBookingItem = ({ item }) => {
    // Generate mock details for visual perfection matching web
    const phone = item.customerPhone || '+91 9999999999';
    const distance = item.distance || '155.0';
    const date = item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : '2026-05-18';
    const time = item.createdAt ? new Date(item.createdAt).toISOString().split('T')[1].substring(0,5) : '19:37';
    const fare = item.fare || 1860;
    const commission = Math.round(fare * 0.12);
    const driverPayout = fare - commission;
    const isPending = item.status === 'Pending';

    return (
      <View style={styles.bookingCard}>
        {/* Header Row */}
        <View style={styles.bcHeader}>
          <Text style={styles.bcCustomerName}>{item.customer}</Text>
          <View style={[styles.bcBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
            <Text style={[styles.bcBadgeText, { color: getStatusColor(item.status) }]}>{item.status?.toUpperCase()}</Text>
          </View>
        </View>

        {/* Sub Header */}
        <View style={styles.bcSubHeader}>
          <Ionicons name="call" size={12} color={COLORS.success} />
          <Text style={styles.bcPhone}>{phone}</Text>
          <Text style={styles.bcCarRequested}> {item.car?.toUpperCase()} REQUESTED</Text>
        </View>

        {/* Locations */}
        <View style={styles.bcLocations}>
          <View style={styles.locRow}>
            <View style={[styles.dot, { backgroundColor: COLORS.success }]} />
            <Text style={styles.locText} numberOfLines={1}>{item.pickup}</Text>
          </View>
          <View style={styles.locRow}>
            <View style={[styles.dot, { backgroundColor: COLORS.danger }]} />
            <Text style={styles.locText} numberOfLines={1}>{item.drop}</Text>
          </View>
        </View>

        {/* Date Time Box */}
        <View style={styles.bcDateTimeBox}>
          <View style={styles.bcDtRow}>
            <View style={styles.bcDtItem}>
              <Ionicons name="calendar-outline" size={12} color={COLORS.primaryDark} />
              <Text style={styles.bcDtText}>{date}</Text>
            </View>
            <View style={styles.bcDtItem}>
              <Ionicons name="time-outline" size={12} color={COLORS.primaryDark} />
              <Text style={styles.bcDtText}>{time}</Text>
            </View>
          </View>
          <View style={styles.bcDtItem}>
            <Ionicons name="swap-horizontal" size={12} color={COLORS.primaryDark} />
            <Text style={styles.bcDtTextBold}>TOTAL DISTANCE {distance} KM</Text>
          </View>
        </View>

        {/* Driver Assigned Box */}
        {!isPending && (
          <View style={styles.bcDriverBox}>
            <Text style={styles.bcDriverLabel}>👤 ASSIGNED TRIPS</Text>
            <View style={styles.bcDriverDetails}>
              <View>
                <Text style={styles.bcDriverName}>{item.driver?.name || 'vishnu'}</Text>
                <Text style={styles.bcDriverCar}>{item.car?.toUpperCase() || 'VAN'}</Text>
              </View>
              <View style={styles.bcNumberPlate}>
                <Text style={styles.bcNumberPlateText}>{item.driver?.vehicleNumber || 'MP 09 BD 5334'}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Financials */}
        <View style={styles.bcFinancials}>
          <View style={styles.finCol}>
            <Text style={styles.finLabel}>{t('admin.total_paid')?.toUpperCase()}</Text>
            <Text style={styles.finValMain}>₹{fare}</Text>
          </View>
          <View style={styles.finCol}>
            <Text style={styles.finLabel}>{t('admin.commission')?.toUpperCase()}</Text>
            <Text style={styles.finValComm}>₹{commission}</Text>
          </View>
          <View style={styles.finCol}>
            <Text style={styles.finLabel}>{t('admin.driver_payout_label')?.toUpperCase()}</Text>
            <Text style={styles.finValDriver}>₹{driverPayout}</Text>
          </View>
        </View>

        {/* Buttons */}
        {isPending ? (
          <TouchableOpacity
            style={styles.btnAssign}
            onPress={() => { setSelectedBooking(item); setAssignModalVisible(true); }}
          >
            <Text style={styles.btnAssignText}>{t('admin.assign_driver')?.toUpperCase()}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.btnUpdate}
            onPress={() => { setSelectedBooking(item); setAssignModalVisible(true); }}
          >
            <Ionicons name="create-outline" size={14} color="#FFF" style={{marginRight: 4}}/>
            <Text style={styles.btnUpdateText}>{t('admin.update_driver')?.toUpperCase()}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.bcActionRow}>
          <TouchableOpacity 
            style={styles.btnMap}
            onPress={() => navigation.navigate('AdminMap', { bookingId: item.id })}
          >
            <Ionicons name="map" size={14} color={COLORS.text} style={{marginRight: 4}}/>
            <Text style={styles.btnMapText}>{t('admin.map')?.toUpperCase()}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnCancel} onPress={() => handleCancelBooking(item.id)}>
            <Text style={styles.btnCancelText}>{t('booking.cancel_request')?.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

      </View>
    );
  };

  const renderDriverItem = ({ item }) => (
    <View style={styles.webRowCard}>
      <View style={styles.webAvatarCol}>
        <View style={[styles.webAvatarCircle, { backgroundColor: '#FEF3C7' }]}>
          <Text style={[styles.webAvatarText, { color: '#D97706' }]}>{(item.name || 'D')[0].toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.webCustomerName}>{item.name}</Text>
          <Text style={styles.webPhone}><Ionicons name="call" size={11} color={COLORS.success} /> {item.phone}</Text>
        </View>
      </View>
      
      <View style={styles.webDetailRow}>
        <View style={styles.webDetailItem}>
          <Text style={styles.webLabel}>LOCATION</Text>
          <Text style={styles.webVal}>{item.location || 'Indore'}</Text>
        </View>
        <View style={styles.webDetailItem}>
          <Text style={styles.webLabel}>VEHICLE</Text>
          <Text style={styles.webVal}>{item.carType} • {item.vehicleNumber}</Text>
        </View>
      </View>

      <View style={styles.webStatsRow}>
        <View style={[styles.statusBadgeWeb, { backgroundColor: item.status === 'Available' ? '#D1FAE5' : '#FFEDD5' }]}>
          <Text style={[styles.statusBadgeTextWeb, { color: item.status === 'Available' ? '#059669' : '#D97706' }]}>
            {item.status?.toUpperCase()}
          </Text>
        </View>
        
        {/* Document Thumbnail Previews */}
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <View style={styles.docThumbnail}><Text style={{ fontSize: 9, fontWeight: '700', color: COLORS.textMuted }}>📄 V.Img</Text></View>
          <View style={styles.docThumbnail}><Text style={{ fontSize: 9, fontWeight: '700', color: COLORS.textMuted }}>📄 Lic</Text></View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        {item.approvalStatus === 'Pending' ? (
          <TouchableOpacity
            style={styles.webApproveBtn}
            onPress={() => handleApproveDriver(item.userId)}
          >
            <Text style={styles.webApproveBtnText}>APPROVE</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.webApprovedBorder}>
            <Text style={styles.webApprovedBorderText}>APPROVED</Text>
          </View>
        )}

        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={styles.iconBtn}
            onPress={() => {
              setViewingDriver(item);
              setDriverViewModalVisible(true);
            }}
          >
            <Ionicons name="eye-outline" size={16} color={COLORS.text} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.iconBtn}
            onPress={() => {
              setEditingDriver(item);
              setDrvName(item.name);
              setDrvPhone(item.phone);
              setDrvLocation(item.location || '');
              setDrvVehicleName(item.carType || '');
              setDrvVehicleNumber(item.vehicleNumber || '');
              setDrvPassword(item.password || '');
              setDriverModalVisible(true);
            }}
          >
            <Ionicons name="create-outline" size={16} color={COLORS.text} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.iconBtn}
            onPress={() => handleDeleteDriver(item.userId)}
          >
            <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderCustomerItem = ({ item }) => (
    <View style={styles.webRowCard}>
      <View style={styles.webAvatarCol}>
        <View style={styles.webAvatarCircle}>
          <Text style={styles.webAvatarText}>{(item.name || 'C')[0].toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.webCustomerName}>{item.name}</Text>
          <Text style={styles.webPhone}><Ionicons name="call" size={11} color={COLORS.success} /> {item.phone}</Text>
        </View>
      </View>
      
      <View style={styles.webDetailRow}>
        <View style={styles.webDetailItem}>
          <Text style={styles.webLabel}>LOCATION</Text>
          <Text style={styles.webVal}>{item.location || 'Not Set'}</Text>
        </View>
        <View style={styles.webDetailItem}>
          <Text style={styles.webLabel}>JOINED</Text>
          <Text style={styles.webVal}>{item.joined || '16/05/2026'}</Text>
        </View>
      </View>

      <View style={styles.webStatsRow}>
        <View style={styles.webBadge}>
          <Text style={styles.webBadgeText}>{item.totalRides || 0} RIDES</Text>
        </View>
        <Text style={styles.webSpentVal}>₹{item.spent || 0}</Text>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <View />
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={styles.iconBtn}
            onPress={() => {
              setViewingCustomer(item);
              setCustomerViewModalVisible(true);
            }}
          >
            <Ionicons name="eye-outline" size={16} color={COLORS.text} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.iconBtn}
            onPress={() => {
              setEditingCustomer(item);
              setCustName(item.name);
              setCustPhone(item.phone);
              setCustLocation(item.location || '');
              setCustPassword(item.password || '');
              setCustomerModalVisible(true);
            }}
          >
            <Ionicons name="create-outline" size={16} color={COLORS.text} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.iconBtn}
            onPress={() => handleDeleteCustomer(item.id)}
          >
            <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderCarItem = ({ item }) => (
    <View style={styles.carWebCard}>
      <View style={styles.carImageContainer}>
        <Text style={{ fontSize: 44 }}>🚖</Text>
      </View>
      <Text style={styles.carWebTitle}>{item.name.toUpperCase()}</Text>
      <Text style={styles.carWebSubtitle}>{item.type.toUpperCase()} • {item.seats} SEATS</Text>
      <View style={styles.rateBadge}>
        <Text style={styles.rateLabel}>RATE</Text>
        <Text style={styles.rateVal}>₹{item.pricePerKm}/km</Text>
      </View>
      
      <View style={{ flexDirection: 'row', width: '100%', gap: 10 }}>
        <TouchableOpacity 
          style={[styles.updateCarBtn, { flex: 1 }]}
          onPress={() => {
            setEditingCar(item);
            setCarNameVal(item.name);
            setCarTypeVal(item.type);
            setCarPriceVal(String(item.pricePerKm));
            setCarSeatsVal(String(item.seats));
            setCarModalVisible(true);
          }}
        >
          <Text style={styles.updateCarBtnText}>UPDATE</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.iconBtn, { backgroundColor: '#FEE2E2', paddingHorizontal: 12, justifyContent: 'center' }]}
          onPress={() => handleDeleteCar(item.id)}
        >
          <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPaymentItem = ({ item }) => {
    const amt = item.amount || 120;
    const comm = Math.round(amt * 0.12);
    const driverPay = amt - comm;

    return (
      <View style={styles.paymentCardWeb}>
        <View style={styles.paymentIconCircle}>
          <Ionicons name="card-outline" size={18} color="#22C55E" />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.payTripTitle}>Trip Payment #{item.id || ''}</Text>
          <Text style={styles.payCustomerText}>{item.customer || 'Priya Singh'} • {item.date || '22 May 2026'}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.paySplitText}>Admin: ₹{comm} | Driver: ₹{driverPay}</Text>
          <Text style={styles.payAmountText}>₹{amt}</Text>
          <Text style={styles.payMethodText}>{item.method?.toUpperCase() || 'WALLET'}</Text>
        </View>
      </View>
    );
  };

  const handleDownloadReport = (reportName) => {
    Alert.alert(
      'Generating Report',
      `Exporting standard printable ${reportName}...`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Download', onPress: () => {
            Alert.alert('Export Complete', `${reportName} downloaded successfully in your internal SafarSetu admin storage!`);
          }
        }
      ]
    );
  };

  const renderReportSection = () => (
    <ScrollView style={{ padding: 20 }}>
      <View style={styles.reportHeaderCard}>
        <Ionicons name="document-text" size={32} color={COLORS.primary} />
        <Text style={styles.reportTitle}>PRINTABLE INVOICE REPORTS</Text>
        <Text style={styles.reportSubtitle}>Select standard report formats to print or export.</Text>
      </View>
      
      <TouchableOpacity style={styles.reportActionRow} onPress={() => handleDownloadReport('Daily Operational Summary.pdf')}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Ionicons name="arrow-down-circle" size={20} color={COLORS.text} />
          <Text style={styles.reportActionText}>Daily Operational Summary.pdf</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.reportActionRow} onPress={() => handleDownloadReport('Monthly Revenue Report.xlsx')}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Ionicons name="arrow-down-circle" size={20} color={COLORS.text} />
          <Text style={styles.reportActionText}>Monthly Revenue Report.xlsx</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.reportActionRow} onPress={() => handleDownloadReport('Driver Commission Details.pdf')}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Ionicons name="arrow-down-circle" size={20} color={COLORS.text} />
          <Text style={styles.reportActionText}>Driver Commission Details.pdf</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
      </TouchableOpacity>
    </ScrollView>
  );

  const renderDashboardCharts = () => {
    if (!stats) return null;
    
    const revenueData = {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          data: [3000, 1500, 10000, 4000, 4500, 3800, 4200],
          color: (opacity = 1) => `rgba(232, 179, 75, ${opacity})`,
          strokeWidth: 2
        },
        {
          data: [500, 200, 1500, 600, 700, 500, 600],
          color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
          strokeWidth: 2
        }
      ],
    };

    const pieData = [
      { name: 'Completed', population: 65, color: '#22C55E', legendFontColor: COLORS.textMuted },
      { name: 'Pending', population: 25, color: '#F59E0B', legendFontColor: COLORS.textMuted },
      { name: 'Cancelled', population: 10, color: '#EF4444', legendFontColor: COLORS.textMuted },
    ];

    return (
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerStyle={{ padding: 20 }}>
        {/* STAT CARDS 2x2 GRID */}
        <View style={styles.statsGrid}>
          <View style={styles.statBoxWeb}>
            <View style={styles.statHeader}>
              <View style={[styles.iconCircle, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="time" size={16} color="#2563EB" />
              </View>
              <Text style={styles.trendGreen}>↑ +12%</Text>
            </View>
            <Text style={styles.statBoxLabel}>{t('nav.bookings')?.toUpperCase()}</Text>
            <Text style={styles.statBoxVal}>{stats.totalBookings || '0'}</Text>
          </View>

          <View style={styles.statBoxWeb}>
            <View style={styles.statHeader}>
              <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="car" size={16} color="#D97706" />
              </View>
              <Text style={styles.trendGreen}>↑ +2</Text>
            </View>
            <Text style={styles.statBoxLabel}>DRIVER APPROVALS</Text>
            <Text style={styles.statBoxVal}>{stats.approvedDrivers || '0'}</Text>
          </View>

          <View style={styles.statBoxWeb}>
            <View style={styles.statHeader}>
              <View style={[styles.iconCircle, { backgroundColor: '#FFEDD5' }]}>
                <Ionicons name="wallet" size={16} color="#EA580C" />
              </View>
              <Text style={styles.trendGreen}>↑ +12%</Text>
            </View>
            <Text style={styles.statBoxLabel}>TOTAL COMMISSIONS</Text>
            <Text style={styles.statBoxVal}>₹{stats.totalCommissions || '0'}</Text>
          </View>

          <View style={styles.statBoxWeb}>
            <View style={styles.statHeader}>
              <View style={[styles.iconCircle, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="cash" size={16} color="#059669" />
              </View>
              <Text style={styles.trendGreen}>↑ +18%</Text>
            </View>
            <Text style={styles.statBoxLabel}>WALLET BALANCE</Text>
            <Text style={styles.statBoxVal}>₹{stats.walletBalance || '0'}</Text>
          </View>
        </View>

        {/* Weekly Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>PAYOUT VS COMMISSION (WEEKLY)</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Text style={{ fontSize: 9, color: COLORS.primary, fontWeight: 'bold' }}>● PAYOUT</Text>
              <Text style={{ fontSize: 9, color: COLORS.success, fontWeight: 'bold' }}>● COMMISSION</Text>
            </View>
          </View>
          <LineChart
            data={revenueData}
            width={width - 80}
            height={220}
            chartConfig={{
              backgroundColor: '#FFFFFF',
              backgroundGradientFrom: '#FFFFFF',
              backgroundGradientTo: '#FFFFFF',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              labelColor: (opacity = 1) => COLORS.textMuted,
              style: { borderRadius: 16 },
              propsForDots: { r: "0" },
            }}
            bezier
            style={{ marginVertical: 8, borderRadius: 16 }}
            withVerticalLines={false}
          />
        </View>

        {/* Operational Performance (Image 5) */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>OPERATIONAL PERFORMANCE</Text>
          <View style={{ gap: 14, marginTop: 10 }}>
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.text }}>Booking Success Rate</Text>
                <Text style={{ fontSize: 11, fontWeight: '900', color: COLORS.success }}>98%</Text>
              </View>
              <View style={{ height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                <View style={{ width: '98%', height: '100%', backgroundColor: COLORS.success }} />
              </View>
            </View>

            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.text }}>Driver Response Time</Text>
                <Text style={{ fontSize: 11, fontWeight: '900', color: COLORS.primary }}>2.5m</Text>
              </View>
              <View style={{ height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                <View style={{ width: '75%', height: '100%', backgroundColor: COLORS.primary }} />
              </View>
            </View>

            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.text }}>Customer Satisfaction</Text>
                <Text style={{ fontSize: 11, fontWeight: '900', color: '#3B82F6' }}>4.8/5</Text>
              </View>
              <View style={{ height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                <View style={{ width: '96%', height: '100%', backgroundColor: '#3B82F6' }} />
              </View>
            </View>

            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.text }}>Fleet Utilization</Text>
                <Text style={{ fontSize: 11, fontWeight: '900', color: COLORS.danger }}>76%</Text>
              </View>
              <View style={{ height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                <View style={{ width: '76%', height: '100%', backgroundColor: COLORS.danger }} />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* TOP HEADER */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.logoIcon}><Ionicons name="car" size={16} color="#000" /></View>
          <Text style={styles.logoText}>SAFAR<Text style={styles.logoBold}>SETU</Text></Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.langBadge} onPress={toggleLanguage}>
            <Ionicons name="globe-outline" size={12} color={COLORS.text} />
            <Text style={styles.langText}>
              {locale === 'en' ? 'English' : locale === 'hi' ? 'हिंदी' : 'निमड़ी'} ▼
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Ionicons name="log-out-outline" size={14} color={COLORS.danger} />
            <Text style={styles.logoutText}>{t('nav.logout')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* HORIZONTAL MENU */}
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.menuScroll}>
          {TABS.map(tab => {
            const label = t(`nav.${tab.toLowerCase()}`) || tab;
            return (
              <TouchableOpacity 
                key={tab} 
                style={[styles.menuItem, activeTab === tab && styles.menuItemActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.menuItemText, activeTab === tab && styles.menuItemTextActive]}>
                  {tab === 'Dashboard' ? '⊞ ' : tab === 'Bookings' ? '📄 ' : ''}{label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* MAIN CONTENT */}
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />
      ) : activeTab === 'Dashboard' ? (
        renderDashboardCharts()
      ) : activeTab === 'Reports' ? (
        renderReportSection()
      ) : (
        <View style={styles.listSection}>
          {/* Section Headers with ADD buttons matching web */}
          <View style={styles.manageBookingsHeader}>
            <Text style={styles.manageBookingsTitle}>
              {activeTab === 'Bookings' 
                ? t('admin.manage_bookings')?.toUpperCase()
                : activeTab === 'Customers' 
                  ? 'CUSTOMER DIRECTORY'
                  : activeTab === 'Drivers'
                    ? 'DRIVER APPROVALS'
                    : activeTab === 'Cars'
                      ? 'MANAGE VEHICLES'
                      : 'TRANSACTION LOG'}
            </Text>
            
            {activeTab === 'Payments' ? (
              <View style={styles.webWalletBox}>
                <Text style={styles.webWalletLabel}>ADMIN WALLET BALANCE</Text>
                <Text style={styles.webWalletVal}>₹124,564</Text>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.dummyBtn}
                onPress={() => {
                  if (activeTab === 'Bookings') {
                    setDummyCustomerName('');
                    setDummyPhone('');
                    setDummyPickup('');
                    setDummyDrop('');
                    setDummyCar('Mini');
                    setDummyFare('');
                    setBookingModalVisible(true);
                  } else if (activeTab === 'Customers') {
                    setEditingCustomer(null);
                    setCustName('');
                    setCustPhone('');
                    setCustLocation('');
                    setCustPassword('');
                    setCustomerModalVisible(true);
                  } else if (activeTab === 'Drivers') {
                    setEditingDriver(null);
                    setDrvName('');
                    setDrvPhone('');
                    setDrvLocation('');
                    setDrvVehicleName('');
                    setDrvVehicleNumber('');
                    setDrvPassword('');
                    setDriverModalVisible(true);
                  } else if (activeTab === 'Cars') {
                    setEditingCar(null);
                    setCarNameVal('');
                    setCarTypeVal('Standard');
                    setCarPriceVal('');
                    setCarSeatsVal('4');
                    setCarModalVisible(true);
                  }
                }}
              >
                <Text style={styles.dummyBtnText}>
                  {activeTab === 'Bookings'
                    ? `+ ${t('admin.add_dummy_booking')}`
                    : activeTab === 'Customers'
                      ? '+ ADD CUSTOMER'
                      : activeTab === 'Drivers'
                        ? '+ ADD DRIVER'
                        : '+ ADD VEHICLE'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Search bar matching web */}
          <View style={styles.webSearchWrapper}>
            <Ionicons name="search" size={14} color={COLORS.textMuted} style={{ marginRight: 8 }} />
            <TextInput 
              placeholder={`Search ${activeTab.toLowerCase()}...`}
              placeholderTextColor={COLORS.textMuted}
              style={styles.webSearchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <FlatList
            data={
              activeTab === 'Bookings' 
                ? bookings.filter(b => 
                    (b.pickup || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (b.drop || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (b.customer || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (b.phone || '').toLowerCase().includes(searchQuery.toLowerCase())
                  ) 
                : activeTab === 'Drivers' 
                  ? drivers.filter(d => 
                      (d.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (d.phone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (d.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (d.carType || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (d.vehicleNumber || '').toLowerCase().includes(searchQuery.toLowerCase())
                    ) 
                  : activeTab === 'Customers'
                    ? customers.filter(c => 
                        (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (c.phone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (c.location || '').toLowerCase().includes(searchQuery.toLowerCase())
                      )
                    : activeTab === 'Cars'
                      ? cars.filter(c => 
                          (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (c.type || '').toLowerCase().includes(searchQuery.toLowerCase())
                        )
                      : payments.filter(p => 
                          (p.customer || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.method || '').toLowerCase().includes(searchQuery.toLowerCase())
                        )
            }
            keyExtractor={(item, index) => String(item.id || index)}
            renderItem={
              activeTab === 'Bookings' 
                ? renderBookingItem 
                : activeTab === 'Drivers' 
                  ? renderDriverItem 
                  : activeTab === 'Customers'
                    ? renderCustomerItem
                    : activeTab === 'Cars'
                      ? renderCarItem
                      : renderPaymentItem
            }
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
            ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>No data available.</Text></View>}
            contentContainerStyle={styles.listContent}
          />
        </View>
      )}

      {/* UPDATE DRIVER DETAILS MODAL (WEB MATCH) */}
      <Modal visible={assignModalVisible} transparent animationType="fade" onRequestClose={() => setAssignModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentWeb}>
            <Text style={styles.modalTitleWeb}>{t('admin.update_driver')?.toUpperCase()}</Text>
            
            <View style={styles.inputGroup}>
              <Ionicons name="location-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput style={styles.modalInput} value={selectedBooking?.pickup} editable={false} />
            </View>

            <View style={styles.inputGroup}>
              <Ionicons name="location-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput style={styles.modalInput} value={selectedBooking?.drop} editable={false} />
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Ionicons name="calendar-outline" size={16} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput style={styles.modalInput} value="2026-05-18" editable={false} />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Ionicons name="time-outline" size={16} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput style={styles.modalInput} value="19:37" editable={false} />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Ionicons name="cash-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput style={styles.modalInput} value={String(selectedBooking?.fare || 1860)} editable={false} />
            </View>

            <ScrollView style={styles.driverSelectList} nestedScrollEnabled>
               {drivers.filter(d => d.approvalStatus === 'Approved').map(driver => (
                 <TouchableOpacity 
                   key={driver.id} 
                   style={styles.driverSelectItemWeb} 
                   onPress={() => handleAssignDriver(driver.userId)}
                 >
                   <Ionicons name="person" size={16} color={COLORS.textMuted} style={styles.inputIcon} />
                   <Text style={styles.selectDriverNameWeb}>{driver.name} ({driver.carType?.toLowerCase()})</Text>
                 </TouchableOpacity>
               ))}
            </ScrollView>
            
            <TouchableOpacity style={styles.btnAssignWeb} onPress={() => setAssignModalVisible(false)}>
              <Text style={styles.btnAssignTextWeb}>{t('admin.update_driver')?.toUpperCase()}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnCancelWeb} onPress={() => setAssignModalVisible(false)}>
              <Text style={styles.btnCancelTextWeb}>Close</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

      {/* CUSTOMER VIEW DETAIL MODAL */}
      <Modal visible={customerViewModalVisible} transparent animationType="slide" onRequestClose={() => setCustomerViewModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContentWeb, { maxHeight: '80%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={styles.modalTitleWeb}>CUSTOMER PROFILE</Text>
              <TouchableOpacity onPress={() => setCustomerViewModalVisible(false)}>
                <Ionicons name="close-circle" size={26} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Avatar */}
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View style={[styles.webAvatarCircle, { width: 64, height: 64, borderRadius: 32 }]}>
                <Text style={[styles.webAvatarText, { fontSize: 26 }]}>{(viewingCustomer?.name || 'C')[0].toUpperCase()}</Text>
              </View>
              <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.text, marginTop: 10 }}>{viewingCustomer?.name}</Text>
              <Text style={{ fontSize: 13, color: COLORS.textMuted, fontWeight: '600', marginTop: 2 }}>Customer • SafarSetu Member</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { icon: 'call-outline', label: 'Phone Number', value: viewingCustomer?.phone },
                { icon: 'location-outline', label: 'Location', value: viewingCustomer?.location || 'Not Set' },
                { icon: 'calendar-outline', label: 'Joined Date', value: viewingCustomer?.joined || 'N/A' },
                { icon: 'car-outline', label: 'Total Rides', value: String(viewingCustomer?.totalRides || 0) },
                { icon: 'cash-outline', label: 'Total Spent', value: `₹${viewingCustomer?.spent || 0}` },
              ].map((row, i) => (
                <View key={i} style={styles.viewDetailRow}>
                  <View style={styles.viewDetailIcon}>
                    <Ionicons name={row.icon} size={16} color={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.viewDetailLabel}>{row.label}</Text>
                    <Text style={styles.viewDetailValue}>{row.value}</Text>
                  </View>
                </View>
              ))}

              {/* Password Row with show/hide */}
              <View style={[styles.viewDetailRow, { backgroundColor: '#FFFBEB', borderColor: 'rgba(217,154,54,0.3)', borderWidth: 1 }]}>
                <View style={styles.viewDetailIcon}>
                  <Ionicons name="lock-closed-outline" size={16} color='#D99A36' />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.viewDetailLabel, { color: '#D99A36' }]}>Login Password</Text>
                  <Text style={[styles.viewDetailValue, { fontFamily: 'monospace', letterSpacing: 2 }]}>
                    {showCustPassword ? (viewingCustomer?.password || 'Not Set') : '••••••••'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowCustPassword(v => !v)} style={{ padding: 8 }}>
                  <Ionicons name={showCustPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color='#D99A36' />
                </TouchableOpacity>
              </View>
            </ScrollView>

            <TouchableOpacity 
              style={[styles.btnAssignWeb, { marginTop: 16 }]}
              onPress={() => {
                setCustomerViewModalVisible(false);
                setEditingCustomer(viewingCustomer);
                setCustName(viewingCustomer?.name || '');
                setCustPhone(viewingCustomer?.phone || '');
                setCustLocation(viewingCustomer?.location || '');
                setCustPassword(viewingCustomer?.password || '');
                setShowCustPassword(false);
                setCustomerModalVisible(true);
              }}
            >
              <Text style={styles.btnAssignTextWeb}>✏️ EDIT THIS CUSTOMER</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* DRIVER VIEW DETAIL MODAL */}
      <Modal visible={driverViewModalVisible} transparent animationType="slide" onRequestClose={() => setDriverViewModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContentWeb, { maxHeight: '90%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={styles.modalTitleWeb}>DRIVER PROFILE</Text>
              <TouchableOpacity onPress={() => setDriverViewModalVisible(false)}>
                <Ionicons name="close-circle" size={26} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Avatar & Name */}
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <View style={[styles.webAvatarCircle, { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.webAvatarText, { fontSize: 26, color: '#D97706' }]}>{(viewingDriver?.name || 'D')[0].toUpperCase()}</Text>
                </View>
                <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.text, marginTop: 10 }}>{viewingDriver?.name}</Text>
                <View style={[styles.statusBadgeWeb, { marginTop: 6, backgroundColor: viewingDriver?.status === 'Available' ? '#D1FAE5' : '#FFEDD5' }]}>
                  <Text style={[styles.statusBadgeTextWeb, { color: viewingDriver?.status === 'Available' ? '#059669' : '#D97706' }]}>
                    {viewingDriver?.status?.toUpperCase() || 'AVAILABLE'}
                  </Text>
                </View>
              </View>

              {/* Detail Rows */}
              {[
                { icon: 'call-outline', label: 'Phone Number', value: viewingDriver?.phone },
                { icon: 'location-outline', label: 'Location', value: viewingDriver?.location || 'Not Set' },
                { icon: 'car-outline', label: 'Vehicle Type', value: viewingDriver?.carType || 'N/A' },
                { icon: 'barcode-outline', label: 'Vehicle Number', value: viewingDriver?.vehicleNumber || 'N/A' },
                { icon: 'shield-checkmark-outline', label: 'Approval Status', value: viewingDriver?.approvalStatus || 'Pending' },
              ].map((row, i) => (
                <View key={i} style={styles.viewDetailRow}>
                  <View style={styles.viewDetailIcon}>
                    <Ionicons name={row.icon} size={16} color={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.viewDetailLabel}>{row.label}</Text>
                    <Text style={styles.viewDetailValue}>{row.value}</Text>
                  </View>
                </View>
              ))}

              {/* Password Row */}
              <View style={[styles.viewDetailRow, { backgroundColor: '#FFFBEB', borderColor: 'rgba(217,154,54,0.3)', borderWidth: 1 }]}>
                <View style={styles.viewDetailIcon}>
                  <Ionicons name="lock-closed-outline" size={16} color='#D99A36' />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.viewDetailLabel, { color: '#D99A36' }]}>Login Password</Text>
                  <Text style={[styles.viewDetailValue, { fontFamily: 'monospace', letterSpacing: 2 }]}>
                    {showDrvPassword ? (viewingDriver?.password || 'Not Set') : '••••••••'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowDrvPassword(v => !v)} style={{ padding: 8 }}>
                  <Ionicons name={showDrvPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color='#D99A36' />
                </TouchableOpacity>
              </View>

              {/* Vehicle & License Photo Section */}
              <Text style={[styles.viewDetailLabel, { marginTop: 20, marginBottom: 10, fontSize: 11, letterSpacing: 0.5 }]}>UPLOADED DOCUMENTS</Text>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={styles.imgPreviewLabel}>🚗 Vehicle Photo</Text>
                  {viewingDriver?.vehiclePhoto && viewingDriver.vehiclePhoto !== 'https://placehold.co/120x80?text=Vehicle' ? (
                    <Image 
                      source={{ uri: viewingDriver.vehiclePhoto }} 
                      style={styles.docImageFull}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.docImageFull, styles.docImagePlaceholder]}>
                      <Ionicons name="car-outline" size={32} color={COLORS.textMuted} />
                      <Text style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 4 }}>Not Uploaded</Text>
                    </View>
                  )}
                </View>

                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={styles.imgPreviewLabel}>📄 License Photo</Text>
                  {viewingDriver?.licensePhoto && viewingDriver.licensePhoto !== 'https://placehold.co/120x80?text=License' ? (
                    <Image 
                      source={{ uri: viewingDriver.licensePhoto }} 
                      style={styles.docImageFull}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.docImageFull, styles.docImagePlaceholder]}>
                      <Ionicons name="document-outline" size={32} color={COLORS.textMuted} />
                      <Text style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 4 }}>Not Uploaded</Text>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity 
              style={[styles.btnAssignWeb, { marginTop: 16 }]}
              onPress={() => {
                setDriverViewModalVisible(false);
                setEditingDriver(viewingDriver);
                setDrvName(viewingDriver?.name || '');
                setDrvPhone(viewingDriver?.phone || '');
                setDrvLocation(viewingDriver?.location || '');
                setDrvVehicleName(viewingDriver?.carType || '');
                setDrvVehicleNumber(viewingDriver?.vehicleNumber || '');
                setDrvPassword(viewingDriver?.password || '');
                setShowDrvPassword(false);
                setDriverModalVisible(true);
              }}
            >
              <Text style={styles.btnAssignTextWeb}>✏️ EDIT THIS DRIVER</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* CUSTOMER REGISTER/UPDATE MODAL */}
      <Modal visible={customerModalVisible} transparent animationType="fade" onRequestClose={() => setCustomerModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentWeb}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={styles.modalTitleWeb}>{editingCustomer ? 'UPDATE CUSTOMER DETAILS' : 'ADD CUSTOMER'}</Text>
              <TouchableOpacity onPress={() => setCustomerModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Ionicons name="person-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput style={styles.modalInput} placeholder="Full Name" placeholderTextColor={COLORS.textMuted} value={custName} onChangeText={setCustName} />
            </View>

            <View style={styles.inputGroup}>
              <Ionicons name="call-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput style={styles.modalInput} placeholder="Mobile / WhatsApp Number" placeholderTextColor={COLORS.textMuted} keyboardType="phone-pad" value={custPhone} onChangeText={setCustPhone} />
            </View>

            <View style={styles.inputGroup}>
              <Ionicons name="location-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput style={styles.modalInput} placeholder="Location / Village Name" placeholderTextColor={COLORS.textMuted} value={custLocation} onChangeText={setCustLocation} />
            </View>

            <View style={styles.inputGroup}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput 
                style={[styles.modalInput, { flex: 1 }]} 
                placeholder="Password" 
                placeholderTextColor={COLORS.textMuted} 
                secureTextEntry={!showCustPassword} 
                value={custPassword} 
                onChangeText={setCustPassword} 
              />
              <TouchableOpacity onPress={() => setShowCustPassword(v => !v)} style={{ padding: 4 }}>
                <Ionicons name={showCustPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.btnAssignWeb} onPress={handleSaveCustomer}>
              <Text style={styles.btnAssignTextWeb}>{editingCustomer ? 'UPDATE CUSTOMER DETAILS' : 'REGISTER AS'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* DRIVER REGISTER/UPDATE MODAL */}
      <Modal visible={driverModalVisible} transparent animationType="fade" onRequestClose={() => setDriverModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentWeb}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={styles.modalTitleWeb}>{editingDriver ? 'UPDATE DRIVER DETAILS' : 'ADD DRIVER'}</Text>
              <TouchableOpacity onPress={() => setDriverModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Ionicons name="person-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput style={styles.modalInput} placeholder="Full Name" placeholderTextColor={COLORS.textMuted} value={drvName} onChangeText={setDrvName} />
            </View>

            <View style={styles.inputGroup}>
              <Ionicons name="call-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput style={styles.modalInput} placeholder="Mobile / WhatsApp Number" placeholderTextColor={COLORS.textMuted} keyboardType="phone-pad" value={drvPhone} onChangeText={setDrvPhone} />
            </View>

            <View style={styles.inputGroup}>
              <Ionicons name="location-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput style={styles.modalInput} placeholder="Location / Village Name" placeholderTextColor={COLORS.textMuted} value={drvLocation} onChangeText={setDrvLocation} />
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Ionicons name="car-outline" size={16} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput style={styles.modalInput} placeholder="Vehicle Name" placeholderTextColor={COLORS.textMuted} value={drvVehicleName} onChangeText={setDrvVehicleName} />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Ionicons name="card-outline" size={16} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput style={styles.modalInput} placeholder="Vehicle No" placeholderTextColor={COLORS.textMuted} value={drvVehicleNumber} onChangeText={setDrvVehicleNumber} />
              </View>
            </View>

            {/* Vehicle & License Photo Previews in Update Modal */}
            {editingDriver && (editingDriver.vehiclePhoto || editingDriver.licensePhoto) && (
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                {editingDriver.vehiclePhoto && (
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={styles.imgPreviewLabel}>🚗 Vehicle Photo</Text>
                    <Image 
                      source={{ uri: editingDriver.vehiclePhoto }} 
                      style={styles.docImageThumb}
                      resizeMode="cover"
                    />
                  </View>
                )}
                {editingDriver.licensePhoto && (
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={styles.imgPreviewLabel}>📄 License Photo</Text>
                    <Image 
                      source={{ uri: editingDriver.licensePhoto }} 
                      style={styles.docImageThumb}
                      resizeMode="cover"
                    />
                  </View>
                )}
              </View>
            )}

            <View style={styles.inputGroup}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput 
                style={[styles.modalInput, { flex: 1 }]} 
                placeholder="Password" 
                placeholderTextColor={COLORS.textMuted} 
                secureTextEntry={!showDrvPassword} 
                value={drvPassword} 
                onChangeText={setDrvPassword} 
              />
              <TouchableOpacity onPress={() => setShowDrvPassword(v => !v)} style={{ padding: 4 }}>
                <Ionicons name={showDrvPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.btnAssignWeb} onPress={handleSaveDriver}>
              <Text style={styles.btnAssignTextWeb}>{editingDriver ? 'UPDATE DRIVER DETAILS' : 'REGISTER DRIVER'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* VEHICLE Rates MODAL */}
      <Modal visible={carModalVisible} transparent animationType="fade" onRequestClose={() => setCarModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentWeb}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={styles.modalTitleWeb}>{editingCar ? 'UPDATE FLEET CATEGORY' : 'ADD FLEET CATEGORY'}</Text>
              <TouchableOpacity onPress={() => setCarModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Ionicons name="car-sport-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput style={styles.modalInput} placeholder="Category Name (e.g. Sedan)" placeholderTextColor={COLORS.textMuted} value={carNameVal} onChangeText={setCarNameVal} />
            </View>

            <View style={styles.inputGroup}>
              <Ionicons name="options-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput style={styles.modalInput} placeholder="Fleet Type (e.g. Standard)" placeholderTextColor={COLORS.textMuted} value={carTypeVal} onChangeText={setCarTypeVal} />
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Ionicons name="cash-outline" size={16} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput style={styles.modalInput} placeholder="Rate (₹ per km)" placeholderTextColor={COLORS.textMuted} keyboardType="numeric" value={carPriceVal} onChangeText={setCarPriceVal} />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Ionicons name="people-outline" size={16} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput style={styles.modalInput} placeholder="Seats Limit" placeholderTextColor={COLORS.textMuted} keyboardType="numeric" value={carSeatsVal} onChangeText={setCarSeatsVal} />
              </View>
            </View>

            <TouchableOpacity style={styles.btnAssignWeb} onPress={handleSaveCar}>
              <Text style={styles.btnAssignTextWeb}>{editingCar ? 'UPDATE RATES' : 'ADD VEHICLE'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* CREATE DUMMY BOOKING MODAL */}
      <Modal visible={bookingModalVisible} transparent animationType="fade" onRequestClose={() => setBookingModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentWeb}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={styles.modalTitleWeb}>CREATE DUMMY BOOKING</Text>
              <TouchableOpacity onPress={() => setBookingModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Ionicons name="person-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput style={styles.modalInput} placeholder="Customer Name" placeholderTextColor={COLORS.textMuted} value={dummyCustomerName} onChangeText={setDummyCustomerName} />
            </View>

            <View style={styles.inputGroup}>
              <Ionicons name="call-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput style={styles.modalInput} placeholder="Customer Phone" placeholderTextColor={COLORS.textMuted} keyboardType="phone-pad" value={dummyPhone} onChangeText={setDummyPhone} />
            </View>

            <View style={styles.inputGroup}>
              <Ionicons name="pin-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput style={styles.modalInput} placeholder="Pickup Location" placeholderTextColor={COLORS.textMuted} value={dummyPickup} onChangeText={setDummyPickup} />
            </View>

            <View style={styles.inputGroup}>
              <Ionicons name="flag-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput style={styles.modalInput} placeholder="Drop Location" placeholderTextColor={COLORS.textMuted} value={dummyDrop} onChangeText={setDummyDrop} />
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Ionicons name="calendar-outline" size={16} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput style={styles.modalInput} placeholder="Date (e.g. 24 May)" placeholderTextColor={COLORS.textMuted} value={dummyDate} onChangeText={setDummyDate} />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Ionicons name="time-outline" size={16} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput style={styles.modalInput} placeholder="Time (e.g. 10:30 AM)" placeholderTextColor={COLORS.textMuted} value={dummyTime} onChangeText={setDummyTime} />
              </View>
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Ionicons name="car-sport-outline" size={16} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput style={styles.modalInput} placeholder="Car (Mini/Sedan/SUV)" placeholderTextColor={COLORS.textMuted} value={dummyCar} onChangeText={setDummyCar} />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Ionicons name="cash-outline" size={16} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput style={styles.modalInput} placeholder="Fare (₹)" placeholderTextColor={COLORS.textMuted} keyboardType="numeric" value={dummyFare} onChangeText={setDummyFare} />
              </View>
            </View>

            <TouchableOpacity style={styles.btnAssignWeb} onPress={handleSaveDummyBooking}>
              <Text style={styles.btnAssignTextWeb}>ADD BOOKING</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F1EA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 45, paddingBottom: 15 },
  logoIcon: { backgroundColor: COLORS.primary, padding: 6, borderRadius: 8, marginRight: 8 },
  logoText: { fontSize: 16, fontWeight: '400', color: COLORS.text },
  logoBold: { fontWeight: '900' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  langBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EBE5D8', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 },
  langText: { fontSize: 12, color: COLORS.text, fontWeight: '600' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 },
  logoutText: { fontSize: 12, color: COLORS.danger, fontWeight: 'bold' },
  menuScroll: { paddingHorizontal: 20, gap: 10, paddingBottom: 10 },
  menuItem: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  menuItemActive: { backgroundColor: '#EBE5D8' },
  menuItemText: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted },
  menuItemTextActive: { color: COLORS.text },
  
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  statBoxWeb: { backgroundColor: COLORS.card, borderRadius: 20, padding: 16, width: '48%', marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  iconCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  trendGreen: { fontSize: 10, fontWeight: 'bold', color: COLORS.success },
  statBoxLabel: { fontSize: 9, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 4 },
  statBoxVal: { fontSize: 22, fontWeight: '900', color: COLORS.text },
  chartCard: { backgroundColor: COLORS.card, borderRadius: 20, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  chartTitle: { fontSize: 14, fontWeight: '900', color: COLORS.text, fontStyle: 'italic', marginBottom: 10 },
  
  listSection: { flex: 1 },
  manageBookingsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  manageBookingsTitle: { fontSize: 16, fontWeight: '900', color: COLORS.text, fontStyle: 'italic' },
  dummyBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  dummyBtnText: { fontSize: 10, fontWeight: 'bold', color: COLORS.text },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  
  // Detailed Web Booking Card
  bookingCard: { backgroundColor: COLORS.card, borderRadius: 24, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  bcHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  bcCustomerName: { fontSize: 18, fontWeight: '900', color: COLORS.text },
  bcBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  bcBadgeText: { fontSize: 10, fontWeight: '900' },
  bcSubHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  bcPhone: { fontSize: 12, fontWeight: 'bold', color: COLORS.success, marginLeft: 4 },
  bcCarRequested: { fontSize: 10, fontWeight: '800', color: COLORS.textMuted, marginLeft: 8 },
  bcLocations: { marginBottom: 16 },
  locRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  locText: { fontSize: 14, color: COLORS.textMuted, flex: 1 },
  
  bcDateTimeBox: { backgroundColor: '#F9F7F3', borderRadius: 12, padding: 12, marginBottom: 16 },
  bcDtRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  bcDtItem: { flexDirection: 'row', alignItems: 'center' },
  bcDtText: { fontSize: 12, color: COLORS.textMuted, marginLeft: 6, fontWeight: '600' },
  bcDtTextBold: { fontSize: 12, color: COLORS.primaryDark, marginLeft: 6, fontWeight: '900' },
  
  bcDriverBox: { backgroundColor: '#FFFBEB', borderRadius: 12, padding: 12, marginBottom: 16 },
  bcDriverLabel: { fontSize: 10, fontWeight: '900', color: COLORS.primaryDark, marginBottom: 8 },
  bcDriverDetails: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bcDriverName: { fontSize: 16, fontWeight: '900', color: COLORS.text },
  bcDriverCar: { fontSize: 12, color: COLORS.textMuted, fontWeight: '700' },
  bcNumberPlate: { backgroundColor: '#EAB308', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  bcNumberPlateText: { fontSize: 10, fontWeight: '900', color: '#000', textTransform: 'uppercase' },
  
  bcFinancials: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.border, paddingVertical: 12, marginBottom: 16 },
  finCol: { flex: 1 },
  finLabel: { fontSize: 9, fontWeight: '900', color: COLORS.textMuted, marginBottom: 4 },
  finValMain: { fontSize: 18, fontWeight: '900', color: COLORS.text },
  finValComm: { fontSize: 16, fontWeight: '900', color: COLORS.primaryDark },
  finValDriver: { fontSize: 16, fontWeight: '900', color: COLORS.success },
  
  btnAssign: { backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  btnAssignText: { fontSize: 12, fontWeight: '900', color: COLORS.text },
  btnUpdate: { flexDirection: 'row', backgroundColor: COLORS.success, paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  btnUpdateText: { fontSize: 12, fontWeight: '900', color: '#FFF' },
  bcActionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  btnMap: { flex: 1, flexDirection: 'row', backgroundColor: '#F3F4F6', paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  btnMapText: { fontSize: 12, fontWeight: '900', color: COLORS.text },
  btnCancel: { flex: 1, backgroundColor: '#FEE2E2', paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnCancelText: { fontSize: 12, fontWeight: '900', color: COLORS.danger },
  
  // UPDATE DRIVER DETAILS MODAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(245, 241, 234, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContentWeb: { backgroundColor: COLORS.card, width: '100%', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 10, maxHeight: '80%' },
  modalTitleWeb: { fontSize: 18, fontWeight: '900', fontStyle: 'italic', color: COLORS.text, marginBottom: 20 },
  inputGroup: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 12, marginBottom: 12, backgroundColor: '#FAFAFA' },
  inputIcon: { marginRight: 10 },
  modalInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: COLORS.text, fontWeight: '500' },
  rowInputs: { flexDirection: 'row', justifyContent: 'space-between' },
  driverSelectList: { maxHeight: 150, marginBottom: 16 },
  driverSelectItemWeb: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 12, marginBottom: 8, backgroundColor: '#FAFAFA' },
  selectDriverNameWeb: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  btnAssignWeb: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  btnAssignTextWeb: { fontSize: 14, fontWeight: '900', color: COLORS.text },
  btnCancelWeb: { paddingVertical: 10, alignItems: 'center' },
  btnCancelTextWeb: { fontSize: 14, fontWeight: 'bold', color: COLORS.textMuted },
  
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
  routeText: { fontSize: 12, fontWeight: '600', color: COLORS.text, lineHeight: 18 },

  // Replicated Web Admin View Styles
  webRowCard: { backgroundColor: COLORS.card, borderRadius: 20, padding: 18, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  webAvatarCol: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  webAvatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center' },
  webAvatarText: { fontSize: 16, fontWeight: '900', color: '#2563EB' },
  webCustomerName: { fontSize: 16, fontWeight: '900', color: COLORS.text },
  webPhone: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  
  webDetailRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F9F7F3', borderRadius: 12, padding: 12, marginBottom: 12 },
  webDetailItem: { flex: 1 },
  webLabel: { fontSize: 8, fontWeight: '900', color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 4 },
  webVal: { fontSize: 12, fontWeight: '700', color: COLORS.text },

  webStatsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F0EBE0', paddingTop: 12 },
  webBadge: { backgroundColor: '#F0EBE0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  webBadgeText: { fontSize: 10, fontWeight: '900', color: COLORS.text },
  webSpentVal: { fontSize: 16, fontWeight: '900', color: COLORS.primaryDark },

  actionsRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  iconBtn: { padding: 6, backgroundColor: '#F3F4F6', borderRadius: 8 },

  // Driver Document thumbnails & status
  statusBadgeWeb: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusBadgeTextWeb: { fontSize: 10, fontWeight: '900' },
  docThumbnail: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#E5E7EB' },
  webApproveBtn: { backgroundColor: COLORS.success, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  webApproveBtnText: { fontSize: 11, fontWeight: '900', color: '#FFF' },
  webApprovedBorder: { borderWidth: 1, borderColor: COLORS.success, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  webApprovedBorderText: { fontSize: 11, fontWeight: '900', color: COLORS.success },

  // Cars UI (Image 3)
  carWebCard: { backgroundColor: COLORS.card, borderRadius: 20, padding: 20, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, alignItems: 'center' },
  carImageContainer: { width: 100, height: 70, backgroundColor: '#F9F7F3', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  carWebTitle: { fontSize: 18, fontWeight: '900', color: COLORS.text, letterSpacing: 0.5, marginBottom: 4 },
  carWebSubtitle: { fontSize: 10, fontWeight: '800', color: COLORS.textMuted, marginBottom: 14 },
  rateBadge: { flexDirection: 'row', backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6, marginBottom: 16 },
  rateLabel: { fontSize: 10, fontWeight: '900', color: '#D97706' },
  rateVal: { fontSize: 12, fontWeight: '900', color: '#D97706' },
  updateCarBtn: { backgroundColor: COLORS.primary, width: '100%', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  updateCarBtnText: { fontSize: 12, fontWeight: '900', color: COLORS.text },

  // Payments UI (Image 4)
  paymentCardWeb: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 20, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  paymentIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#D1FAE5', justifyContent: 'center', alignItems: 'center' },
  payTripTitle: { fontSize: 14, fontWeight: '900', color: COLORS.text },
  payCustomerText: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  paySplitText: { fontSize: 9, fontWeight: '800', color: COLORS.textMuted, marginBottom: 4 },
  payAmountText: { fontSize: 16, fontWeight: '900', color: COLORS.success },
  payMethodText: { fontSize: 9, fontWeight: '900', color: COLORS.primaryDark, marginTop: 2 },

  // Reports UI
  reportHeaderCard: { backgroundColor: '#FEF3C7', borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 20, gap: 8 },
  reportTitle: { fontSize: 16, fontWeight: '900', color: COLORS.text, letterSpacing: 0.5 },
  reportSubtitle: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center' },
  reportActionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.card, padding: 18, borderRadius: 16, marginBottom: 12 },
  reportActionText: { fontSize: 13, fontWeight: '700', color: COLORS.text },

  // Replicated Wallet & Search
  webWalletBox: { alignItems: 'flex-end' },
  webWalletLabel: { fontSize: 8, fontWeight: '900', color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 2 },
  webWalletVal: { fontSize: 14, fontWeight: '900', color: COLORS.success },
  webSearchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F0EBE0', borderRadius: 14, marginHorizontal: 20, marginBottom: 15, paddingHorizontal: 12, paddingVertical: 10 },
  webSearchInput: { flex: 1, fontSize: 13, color: COLORS.text, fontWeight: '600', padding: 0 },

  // View Detail Modal Styles (Customer & Driver Profile)
  viewDetailRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F9F7F3', 
    borderRadius: 14, 
    padding: 14, 
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  viewDetailIcon: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: '#FFF', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  viewDetailLabel: { 
    fontSize: 9, 
    fontWeight: '900', 
    color: COLORS.textMuted, 
    letterSpacing: 0.8, 
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  viewDetailValue: { 
    fontSize: 15, 
    fontWeight: '800', 
    color: COLORS.text, 
  },

  // Document Image Styles for Driver Profile
  imgPreviewLabel: { 
    fontSize: 10, 
    fontWeight: '800', 
    color: COLORS.textMuted, 
    marginBottom: 8, 
    textAlign: 'center',
  },
  docImageFull: { 
    width: '100%', 
    height: 120, 
    borderRadius: 14, 
    backgroundColor: '#F3F4F6',
  },
  docImageThumb: { 
    width: '100%', 
    height: 80, 
    borderRadius: 10, 
    backgroundColor: '#F3F4F6',
  },
  docImagePlaceholder: { 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1.5, 
    borderColor: '#E5E7EB', 
    borderStyle: 'dashed',
  },
});
