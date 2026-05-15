import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  FaThLarge, FaCar, FaUsers, FaMoneyBillWave, FaClock, 
  FaCheckCircle, FaTimesCircle, FaMapMarkedAlt, FaChevronRight,
  FaPhoneAlt, FaUserTie, FaWallet, FaChartBar, FaUserCircle, FaCreditCard, 
  FaArrowUp, FaArrowDown, FaEye, FaEdit, FaTrash, FaPlus, FaMapMarkerAlt, FaLock, FaImage, FaIdCard, FaCamera, FaCalendarAlt, FaRoute
} from 'react-icons/fa';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import toast from 'react-hot-toast';
import RouteMap from '../../components/RouteMap';
import { api } from '../../lib/api.js';

function parseKm(distanceStr) {
  if (!distanceStr) return null;
  return parseFloat(String(distanceStr).replace(/[^0-9.]/g, '')) || null;
}

const AdminDashboard = ({ activeTab }) => {
  const { t } = useTranslation();

  const translateStatus = (status) => {
    const map = {
      Completed: 'admin.status_completed',
      Pending: 'admin.status_pending',
      Assigned: 'admin.status_assigned',
      Accepted: 'admin.status_accepted',
      Cancelled: 'admin.status_cancelled',
      Available: 'admin.status_available',
      Busy: 'admin.status_busy',
      Approved: 'admin.status_approved',
      Rejected: 'admin.status_rejected',
    };
    return map[status] ? t(map[status]) : status;
  };

  const revenueData = [
    { name: t('admin.day_mon'), revenue: 2400, commission: 288, driverPay: 2112 },
    { name: t('admin.day_tue'), revenue: 1398, commission: 167, driverPay: 1231 },
    { name: t('admin.day_wed'), revenue: 9800, commission: 1176, driverPay: 8624 },
    { name: t('admin.day_thu'), revenue: 3908, commission: 469, driverPay: 3439 },
    { name: t('admin.day_fri'), revenue: 4800, commission: 576, driverPay: 4224 },
    { name: t('admin.day_sat'), revenue: 3800, commission: 456, driverPay: 3344 },
    { name: t('admin.day_sun'), revenue: 4300, commission: 516, driverPay: 3784 },
  ];

  const pieData = [
    { name: t('admin.pie_completed'), value: 85, color: '#22c55e' },
    { name: t('admin.pie_pending'), value: 10, color: '#eab308' },
    { name: t('admin.pie_cancelled'), value: 5, color: '#ef4444' },
  ];

  const operationalMetrics = [
    { labelKey: 'admin.booking_success_rate', val: '98%', color: 'bg-green-500' },
    { labelKey: 'admin.driver_response_time', val: '2.5m', color: 'bg-primary' },
    { labelKey: 'admin.customer_satisfaction', val: '4.8/5', color: 'bg-blue-500' },
    { labelKey: 'admin.fleet_utilization', val: '76%', color: 'bg-red-500' },
  ];
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showBookingEditModal, setShowBookingEditModal] = useState(false);
  const [showCreateBookingModal, setShowCreateBookingModal] = useState(false);
  const [newBookingForm, setNewBookingForm] = useState({ customer: '', phone: '', pickup: '', drop: '', car: 'Mini', date: '', time: '', fare: '' });
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  const [drivers, setDrivers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [adminCars, setAdminCars] = useState([]);
  const [payments, setPayments] = useState([]);
  const [showCarModal, setShowCarModal] = useState(false);
  const [carForm, setCarForm] = useState({ id: null, name: '', type: '', pricePerKm: '', seats: '', eta: '', image: null });
  const [allBookings, setAllBookings] = useState([]);

  const handleFileUpload = (e, field, setter = setDriverForm) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter((prev) => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const loadAll = async () => {
    try {
      const [bookings, d, c, carsData, pay] = await Promise.all([
        api('/api/bookings'),
        api('/api/admin/drivers'),
        api('/api/admin/customers'),
        api('/api/admin/cars'),
        api('/api/admin/payments'),
      ]);
      setAllBookings(Array.isArray(bookings) ? bookings : []);
      setDrivers(Array.isArray(d) ? d : []);
      setCustomers(Array.isArray(c) ? c : []);
      setAdminCars(Array.isArray(carsData) ? carsData : []);
      setPayments(Array.isArray(pay) ? pay : []);
    } catch (e) {
      toast.error(e.message || 'Failed to load admin data');
    }
  };

  useEffect(() => {
    loadAll();
    const t = setInterval(loadAll, 5000);
    return () => clearInterval(t);
  }, []);

  const [bookingForm, setBookingForm] = useState({ pickup: '', drop: '', fare: '', date: '', time: '' });
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentEntity, setCurrentEntity] = useState(null);
  
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', location: '', password: '' });
  const [driverForm, setDriverForm] = useState({ 
    name: '', phone: '', location: '', vehicleName: '', vehicleNumber: '', 
    vehiclePhoto: null, licenseFront: null, licenseBack: null, password: '' 
  });

  const stats = [
    { label: t('nav.bookings'), value: allBookings.length, icon: <FaClock />, color: "text-blue-500", trend: "+12%" },
    { label: t('admin.driver_approvals'), value: drivers.filter(d => d.approvalStatus === 'Approved').length, icon: <FaCar />, color: "text-yellow-500", trend: "+2" },
    { label: t('admin.total_commissions'), value: "₹5,433", icon: <FaWallet />, color: "text-primary", trend: "+12%" },
    { label: t('admin.wallet_balance'), value: "₹1,24,500", icon: <FaMoneyBillWave />, color: "text-green-500", trend: "+18%" },
  ];

  const handleApproveDriver = async (id) => {
    try {
      await api(`/api/admin/drivers/${id}/approval`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'APPROVED' }),
      });
      await loadAll();
      toast.success('Driver Approved Successfully!');
    } catch (e) {
      toast.error(e.message || 'Failed');
    }
  };

  const handleRejectDriver = async (id) => {
    try {
      await api(`/api/admin/drivers/${id}/approval`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'REJECTED' }),
      });
      await loadAll();
      toast.error('Driver Registration Rejected');
    } catch (e) {
      toast.error(e.message || 'Failed');
    }
  };

  const handleDeleteDriver = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await api(`/api/admin/drivers/${id}`, { method: 'DELETE' });
      await loadAll();
      toast.error(`Driver ${name} removed.`);
    } catch (e) {
      toast.error(e.message || 'Failed');
    }
  };

  const handleDriverModal = (mode, driver = null) => {
    setModalMode(mode);
    setCurrentEntity(driver);
    if (driver) {
      setDriverForm({
        name: driver.name,
        phone: driver.phone,
        location: driver.location,
        vehicleName: driver.carType,
        vehicleNumber: driver.vehicleNumber,
        vehiclePhoto: driver.vehiclePhoto,
        licensePhoto: driver.licensePhoto,
        password: driver.password || '',
      });
    } else {
      setDriverForm({
        name: '',
        phone: '',
        location: '',
        vehicleName: '',
        vehicleNumber: '',
        vehiclePhoto: null,
        licensePhoto: null,
        password: '',
      });
    }
    setShowDriverModal(true);
  };

  const handleSaveDriver = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        await api('/api/admin/drivers', {
          method: 'POST',
          body: JSON.stringify({
            name: driverForm.name,
            phone: driverForm.phone,
            location: driverForm.location,
            vehicleName: driverForm.vehicleName,
            vehicleNumber: driverForm.vehicleNumber,
            password: driverForm.password || 'driver123',
            vehiclePhotoUrl: driverForm.vehiclePhoto,
            licensePhotoUrl: driverForm.licensePhoto,
          }),
        });
        toast.success('Driver Registered Successfully!');
      } else if (modalMode === 'edit' && currentEntity) {
        await api(`/api/admin/drivers/${currentEntity.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: driverForm.name,
            phone: driverForm.phone,
            location: driverForm.location,
            vehicleName: driverForm.vehicleName,
            vehicleNumber: driverForm.vehicleNumber,
            ...(driverForm.password ? { password: driverForm.password } : {}),
            ...(driverForm.vehiclePhoto ? { vehiclePhotoUrl: driverForm.vehiclePhoto } : {}),
            ...(driverForm.licensePhoto ? { licensePhotoUrl: driverForm.licensePhoto } : {}),
          }),
        });
        toast.success('Driver Profile Updated!');
      }
      await loadAll();
      setShowDriverModal(false);
    } catch (err) {
      toast.error(err.message || 'Save failed');
    }
  };

  const handleDeleteCustomer = async (id, name, phone) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await api(`/api/admin/customers/${id}`, { method: 'DELETE' });
      await loadAll();
      toast.error(`Customer ${name} deleted.`);
    } catch (e) {
      toast.error(e.message || 'Failed');
    }
  };

  const handleCustomerModal = (mode, customer = null) => {
    setModalMode(mode);
    setCurrentEntity(customer);
    if (customer) { setCustomerForm({ name: customer.name, phone: customer.phone, location: customer.location, password: customer.password || '' }); }
    else { setCustomerForm({ name: '', phone: '', location: '', password: '' }); }
    setShowCustomerModal(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        await api('/api/admin/customers', {
          method: 'POST',
          body: JSON.stringify({
            name: customerForm.name,
            phone: customerForm.phone,
            location: customerForm.location,
            password: customerForm.password || 'user123',
          }),
        });
        toast.success('Customer Added Successfully!');
      } else if (modalMode === 'edit' && currentEntity) {
        await api(`/api/admin/customers/${currentEntity.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: customerForm.name,
            phone: customerForm.phone,
            location: customerForm.location,
            ...(customerForm.password ? { password: customerForm.password } : {}),
          }),
        });
        toast.success('Customer Updated Successfully!');
      }
      await loadAll();
      setShowCustomerModal(false);
    } catch (err) {
      toast.error(err.message || 'Save failed');
    }
  };

  const handleAssignDriver = async (driver) => {
    try {
      await api(`/api/bookings/${selectedBooking.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ driverId: driver.id }),
      });
      await loadAll();
      toast.success(`Assigned ${driver.name} to ${selectedBooking.customer}`);
      setShowAssignModal(false);
    } catch (e) {
      toast.error(e.message || 'Assign failed');
    }
  };

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking request?')) return;
    try {
      await api(`/api/bookings/${id}`, { method: 'DELETE' });
      await loadAll();
      toast.error('Booking Cancelled');
    } catch (e) {
      toast.error(e.message || 'Failed');
    }
  };

  const handleEditBooking = (booking) => {
    setSelectedBooking(booking);
    setBookingForm({
      pickup: booking.pickup,
      drop: booking.drop,
      fare: booking.fare,
      date: booking.date,
      time: booking.time,
      driverId: booking.driverUserId || '',
      driverName: booking.driver?.name || '',
      vehicleName: booking.driver?.vehicleName || '',
      vehicleNumber: booking.driver?.vehicleNumber || '',
    });
    setShowBookingEditModal(true);
  };

  const handleSaveBooking = async (e) => {
    e.preventDefault();
    try {
      const body = {
        pickup: bookingForm.pickup,
        drop: bookingForm.drop,
        fare: Number(bookingForm.fare),
        date: bookingForm.date,
        time: bookingForm.time,
      };
      if (bookingForm.driverId) body.driverId = bookingForm.driverId;
      await api(`/api/bookings/${selectedBooking.id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      await loadAll();
      toast.success('Booking Details Updated!');
      setShowBookingEditModal(false);
    } catch (err) {
      toast.error(err.message || 'Update failed');
    }
  };

  const handleSaveCar = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        await api('/api/admin/cars', {
          method: 'POST',
          body: JSON.stringify(carForm),
        });
        toast.success('Vehicle added successfully');
      } else {
        await api(`/api/admin/cars/${carForm.id}`, {
          method: 'PATCH',
          body: JSON.stringify(carForm),
        });
        toast.success('Vehicle updated successfully');
      }
      await loadAll();
      setShowCarModal(false);
    } catch (err) {
      toast.error(err.message || 'Save failed');
    }
  };

  const handleDeleteCar = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await api(`/api/admin/cars/${id}`, { method: 'DELETE' });
      await loadAll();
      toast.error(`Vehicle ${name} deleted.`);
    } catch (e) {
      toast.error(e.message || 'Failed');
    }
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    try {
      await api('/api/bookings/admin', {
        method: 'POST',
        body: JSON.stringify({
          customer: newBookingForm.customer,
          phone: newBookingForm.phone,
          pickup: newBookingForm.pickup,
          drop: newBookingForm.drop,
          car: newBookingForm.car,
          date: newBookingForm.date,
          time: newBookingForm.time,
          fare: newBookingForm.fare ? Number(newBookingForm.fare) : undefined,
        }),
      });
      await loadAll();
      toast.success('Booking created successfully!');
      setShowCreateBookingModal(false);
      setNewBookingForm({ customer: '', phone: '', pickup: '', drop: '', car: 'Mini', date: '', time: '', fare: '' });
    } catch (err) {
      toast.error(err.message || 'Create failed');
    }
  };

  return (
    <div className="pt-20 pb-8 px-3 sm:px-4 lg:px-6 bg-background min-h-screen text-dark">
      <div className="max-w-7xl mx-auto">
        
        {activeTab === 'Dashboard' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 sm:space-y-10 lg:space-y-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {stats.map((stat, i) => (
                <div key={i} className="glass-card p-4 sm:p-6 lg:p-8 group hover:border-primary/30 transition-all">
                  <div className="flex justify-between items-start mb-3 sm:mb-6">
                    <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-dark/5 flex items-center justify-center text-lg sm:text-2xl ${stat.color}`}>{stat.icon}</div>
                    <span className="text-[9px] sm:text-[10px] font-black text-green-600 flex items-center gap-1"><FaArrowUp /> {stat.trend}</span>
                  </div>
                  <p className="text-muted text-[9px] sm:text-xs font-bold uppercase tracking-widest mb-1 leading-tight">{stat.label}</p>
                  <p className="text-xl sm:text-3xl font-black text-dark">{stat.value}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
              <div className="glass-card p-4 sm:p-8">
                <div className="flex flex-wrap justify-between items-center gap-2 mb-4 sm:mb-8">
                  <h3 className="text-base sm:text-xl font-bold italic uppercase tracking-tighter">{t('admin.revenue_analysis')}</h3>
                  <div className="flex gap-3 text-[10px] font-black uppercase tracking-widest">
                    <span className="flex items-center gap-1 text-primary"><div className="w-2 h-2 bg-primary rounded-full" /> {t('admin.total')}</span>
                    <span className="flex items-center gap-1 text-green-500"><div className="w-2 h-2 bg-green-500 rounded-full" /> {t('admin.commission')}</span>
                  </div>
                </div>
                <div className="h-[300px] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%" debounce={100}>
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#E8B34B" stopOpacity={0.3}/><stop offset="95%" stopColor="#E8B34B" stopOpacity={0}/></linearGradient>
                        <linearGradient id="colorComm" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0}/></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5DED3" vertical={false} /><XAxis dataKey="name" stroke="#5F5F5F" fontSize={10} /><YAxis stroke="#5F5F5F" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#FFFDF9', border: '1px solid #E5DED3', borderRadius: '12px' }} itemStyle={{ fontSize: '12px' }} />
                      <Area type="monotone" dataKey="revenue" stroke="#E8B34B" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                      <Area type="monotone" dataKey="commission" stroke="#22c55e" fillOpacity={1} fill="url(#colorComm)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="glass-card p-4 sm:p-8">
                <h3 className="text-base sm:text-xl font-bold mb-4 sm:mb-8 italic uppercase tracking-tighter">{t('admin.ride_dist')}</h3>
                <div className="h-[300px] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%" debounce={100}>
                    <PieChart>
                      <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#FFFDF9', border: '1px solid #E5DED3', borderRadius: '12px' }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'Bookings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex justify-between items-center bg-dark/5 p-4 rounded-2xl border border-border">
              <h3 className="text-xl font-black italic uppercase tracking-tighter text-dark">{t('admin.manage_bookings')}</h3>
              <button onClick={() => setShowCreateBookingModal(true)} className="btn-primary px-4 py-2 flex items-center gap-2 font-black uppercase tracking-widest text-xs"><FaPlus /> {t('admin.add_dummy_booking')}</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {allBookings.map((booking) => (
              <div key={booking.id} className="glass-card p-6 border-border hover:border-primary/20 transition-all group flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="text-xl font-black flex items-center gap-2 text-dark">
                      {booking.customer}
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                      {booking.phone && (
                        <a href={`tel:+91${booking.phone}`} title={t('admin.call_customer')} className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all text-xs font-black tracking-widest">
                          <FaPhoneAlt size={10} /> +91 {booking.phone}
                        </a>
                      )}
                      <p className="text-[10px] text-muted uppercase font-bold tracking-widest">{t('admin.car_requested', { car: booking.car })}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase ${booking.status === 'Completed' ? 'bg-green-500/10 text-green-600' : booking.status === 'Assigned' ? 'bg-blue-500/10 text-blue-600' : 'bg-yellow-500/10 text-yellow-600'}`}>{translateStatus(booking.status)}</span>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3"><div className="mt-1.5 w-2 h-2 bg-green-500 rounded-full shrink-0 shadow-[0_0_10px_rgba(34,197,94,0.5)]" /><p className="text-sm text-muted font-medium">{booking.pickup}</p></div>
                  <div className="flex items-start gap-3"><div className="mt-1.5 w-2 h-2 bg-red-500 rounded-full shrink-0 shadow-[0_0_10px_rgba(239,68,68,0.5)]" /><p className="text-sm text-muted font-medium">{booking.drop}</p></div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-dark/5 rounded-2xl border border-border">
                   <div className="flex items-center gap-3 text-xs text-muted font-bold uppercase tracking-tighter"><FaCalendarAlt className="text-primary" /> {booking.date}</div>
                   <div className="flex items-center gap-3 text-xs text-muted font-bold uppercase tracking-tighter"><FaClock className="text-primary" /> {booking.time}</div>
                   <div className="col-span-2 flex items-center gap-3 text-xs text-primary font-black uppercase tracking-widest"><FaRoute /> {t('booking.total_dist')} {booking.distance}</div>
                </div>

                {booking.driver && (
                  <div className="mb-6 p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                    <p className="text-[9px] text-primary uppercase font-black mb-2 flex items-center gap-1"><FaUserTie /> {t('driver.assigned_trips')}</p>
                    <div className="flex justify-between items-center">
                       <div><p className="text-dark font-black">{booking.driver.name}</p><p className="text-[10px] text-muted uppercase font-bold tracking-widest">{booking.driver.vehicleName}</p></div>
                       <p className="text-[10px] bg-primary text-dark px-2 py-1 rounded-md font-black">{booking.driver.vehicleNumber}</p>
                    </div>
                  </div>
                )}

                <div className="mt-auto">
                  <div className="flex justify-between pt-6 border-t border-border mb-6">
                    <div><p className="text-[9px] text-muted uppercase font-black">{t('admin.total_paid')}</p><p className="text-xl font-black text-dark">₹{booking.fare}</p></div>
                    <div className="text-center"><p className="text-[9px] text-primary uppercase font-black">{t('admin.commission')}</p><p className="text-primary font-black">₹{Math.floor(booking.fare * 0.12)}</p></div>
                    <div className="text-right"><p className="text-[9px] text-green-600 uppercase font-black">{t('admin.driver_payout_label')}</p><p className="text-green-600 font-black text-xl">₹{booking.fare - Math.floor(booking.fare * 0.12)}</p></div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {booking.status === 'Pending' ? (
                      <button onClick={() => { setSelectedBooking(booking); setShowAssignModal(true); }} className="col-span-2 btn-primary py-4 text-xs uppercase font-black shadow-lg shadow-primary/20">{t('admin.assign_driver')}</button>
                    ) : (
                      <button onClick={() => handleEditBooking(booking)} className="col-span-2 bg-green-500 text-dark py-4 rounded-xl text-xs font-black uppercase hover:bg-green-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"><FaEdit /> {t('admin.update_booking')}</button>
                    )}
                    <button onClick={() => { setSelectedBooking(booking); setShowMapModal(true); }} className="bg-dark/5 py-4 rounded-xl text-xs font-black uppercase hover:bg-dark/10 transition-all flex items-center justify-center gap-2 text-dark border border-border"><FaMapMarkedAlt /> {t('admin.map')}</button>
                    <button onClick={() => handleCancelBooking(booking.id)} className="bg-red-500/10 text-red-500 py-4 rounded-xl text-xs font-black uppercase hover:bg-red-500 hover:text-white transition-all border border-red-500/20">{t('booking.cancel_request')}</button>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'Customers' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4 sm:p-8">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-6 sm:mb-8">
               <h3 className="text-lg sm:text-2xl font-black tracking-tighter uppercase italic">{t('admin.customer_dir')}</h3>
               <button onClick={() => handleCustomerModal('add')} className="btn-primary px-4 sm:px-6 py-2.5 sm:py-3 flex items-center gap-2 font-black uppercase tracking-widest text-xs"><FaPlus /> {t('admin.add_customer')}</button>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead><tr className="text-muted text-[10px] uppercase tracking-widest border-b border-border"><th className="pb-4">{t('nav.customers')}</th><th className="pb-4">{t('admin.location')}</th><th className="pb-4">{t('admin.joined')}</th><th className="pb-4">{t('admin.total_rides_col')}</th><th className="pb-4">{t('admin.total_spent')}</th><th className="pb-4 text-right">{t('admin.actions')}</th></tr></thead>
                  <tbody className="text-sm">
                    {customers.map(c => (
                      <tr key={c.id} className="border-b border-border hover:bg-muted/10 transition-all group">
                        <td className="py-5"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold">{c.name.charAt(0)}</div><div><p className="font-bold text-foreground">{c.name}</p><div className="flex items-center gap-1.5 mt-0.5"><a href={`tel:+91${c.phone}`} title={t('admin.call_customer')} className="text-green-600 bg-green-500/10 p-1 rounded-md hover:bg-green-600 hover:text-white transition-all"><FaPhoneAlt size={10} /></a><p className="text-xs text-muted font-medium tracking-wide">+91 {c.phone}</p></div></div></div></td>
                        <td className="py-5 text-muted font-medium italic">{c.location}</td><td className="py-5 text-muted text-xs">{c.joined}</td><td className="py-5 font-bold text-foreground uppercase text-xs">{t('admin.rides_count', { count: c.totalRides })}</td><td className="py-5 font-black text-primary">₹{c.spent}</td>
                        <td className="py-5 text-right"><div className="flex justify-end gap-2"><button onClick={() => handleCustomerModal('view', c)} className="p-2 bg-muted/10 rounded-lg text-muted hover:text-primary transition-all border border-border"><FaEye /></button><button onClick={() => handleCustomerModal('edit', c)} className="p-2 bg-muted/10 rounded-lg text-muted hover:text-green-600 transition-all border border-border"><FaEdit /></button><button onClick={() => handleDeleteCustomer(c.id, c.name, c.phone)} className="p-2 bg-muted/10 rounded-lg text-muted hover:text-red-500 transition-all border border-border"><FaTrash /></button></div></td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'Drivers' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4 sm:p-8">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-6 sm:mb-8">
               <h3 className="text-lg sm:text-2xl font-black tracking-tighter italic uppercase">{t('admin.driver_approvals')}</h3>
               <button onClick={() => handleDriverModal('add')} className="btn-primary px-4 sm:px-6 py-2.5 sm:py-3 flex items-center gap-2 font-black uppercase tracking-widest text-xs"><FaPlus /> {t('admin.add_driver')}</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="text-muted text-[10px] uppercase tracking-widest border-b border-border"><th className="pb-4">{t('nav.drivers')}</th><th className="pb-4">{t('admin.location')}</th><th className="pb-4">{t('admin.vehicle')}</th><th className="pb-4">{t('admin.status')}</th><th className="pb-4">{t('admin.docs')}</th><th className="pb-4 text-right">{t('admin.actions')}</th></tr></thead>
                <tbody className="text-sm">
                  {drivers.map((driver) => (
                    <tr key={driver.id} className="border-b border-border hover:bg-muted/10 transition-all">
                      <td className="py-5"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">{driver.name.charAt(0)}</div><div><p className="font-bold text-foreground">{driver.name}</p><div className="flex items-center gap-1.5 mt-0.5"><a href={`tel:+91${driver.phone}`} title={t('admin.call_driver')} className="text-green-600 bg-green-500/10 p-1 rounded-md hover:bg-green-600 hover:text-white transition-all"><FaPhoneAlt size={10} /></a><p className="text-[10px] text-muted uppercase tracking-widest">+91 {driver.phone}</p></div></div></div></td>
                      <td className="py-5 text-muted font-medium italic">{driver.location}</td>
                      <td className="py-5"><p className="font-bold text-foreground">{driver.carType}</p><p className="text-[10px] text-muted">{driver.vehicleNumber}</p></td>
                      <td className="py-5"><span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${driver.status === 'Available' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-500'}`}>{translateStatus(driver.status)}</span></td>
                      <td className="py-5">
                         <div className="flex gap-2">
                           <div className="w-10 h-10 rounded-lg bg-muted/10 border border-border p-1 cursor-zoom-in" title={t('admin.vehicle_photo')}><img src={driver.vehiclePhoto} className="w-full h-full object-cover rounded-md" alt="Vehicle" /></div>
                           <div className="w-10 h-10 rounded-lg bg-muted/10 border border-border p-1 cursor-zoom-in" title={t('admin.license_photo')}><img src={driver.licensePhoto} className="w-full h-full object-cover rounded-md" alt="License" /></div>
                         </div>
                      </td>
                      <td className="py-5 text-right">
                         <div className="flex justify-end gap-2">
                           {driver.approvalStatus === 'Pending' ? (
                             <>
                               <button onClick={() => handleApproveDriver(driver.id)} className="p-2 bg-green-500/10 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all border border-green-500/20" title={t('admin.approve')}><FaCheckCircle /></button>
                               <button onClick={() => handleRejectDriver(driver.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all border border-red-500/20" title={t('admin.reject')}><FaTimesCircle /></button>
                             </>
                           ) : (
                             <span className={`px-2 py-1 rounded text-[8px] font-black uppercase border ${driver.approvalStatus === 'Approved' ? 'border-green-600 text-green-600' : 'border-red-500 text-red-500'}`}>{translateStatus(driver.approvalStatus)}</span>
                           )}
                           <div className="w-px h-8 bg-border mx-1"></div>
                           <button onClick={() => handleDriverModal('view', driver)} className="p-2 bg-muted/10 rounded-lg text-muted hover:text-primary transition-all border border-border"><FaEye /></button>
                           <button onClick={() => handleDriverModal('edit', driver)} className="p-2 bg-muted/10 rounded-lg text-muted hover:text-green-600 transition-all border border-border"><FaEdit /></button>
                           <button onClick={() => handleDeleteDriver(driver.id, driver.name)} className="p-2 bg-muted/10 rounded-lg text-muted hover:text-red-500 transition-all border border-border"><FaTrash /></button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'Cars' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex justify-between items-center bg-dark/5 p-4 rounded-2xl border border-border">
              <h3 className="text-xl font-black italic uppercase tracking-tighter text-dark">{t('admin.manage_vehicles')}</h3>
              <button 
                onClick={() => {
                  setModalMode('add');
                  setCarForm({ id: null, name: '', type: '', pricePerKm: '', seats: '', eta: '5 mins', image: null });
                  setShowCarModal(true);
                }} 
                className="btn-primary px-4 py-2 flex items-center gap-2 font-black uppercase tracking-widest text-xs"
              >
                <FaPlus /> {t('admin.add_vehicle')}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
              {adminCars.map((car) => (
                <div key={car.id} className="glass-card p-4 sm:p-8 group relative overflow-hidden text-center">
                  <button 
                    onClick={() => handleDeleteCar(car.id, car.name)}
                    className="absolute top-4 right-4 z-10 p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                  >
                    <FaTrash size={12} />
                  </button>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
                  <img src={car.image} alt={car.name} className="w-24 sm:w-40 h-40 object-contain mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-all duration-500" />
                  <h4 className="text-lg sm:text-2xl font-black mb-1 sm:mb-2 text-foreground">{car.name}</h4>
                  <p className="text-[9px] sm:text-[10px] text-muted uppercase font-black tracking-widest mb-3 sm:mb-6">{car.type} • {car.seats} {t('cars.seats')}</p>
                  <div className="bg-muted/10 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-border mb-3 sm:mb-6 text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] sm:text-[10px] text-muted uppercase font-bold">{t('admin.rate')}</span>
                      <span className="text-primary font-black text-sm">₹{car.pricePerKm}{t('cars.per_km')}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setModalMode('edit');
                      setCarForm({ ...car });
                      setShowCarModal(true);
                    }}
                    className="w-full py-3 bg-muted/10 hover:bg-primary hover:text-background rounded-xl text-xs font-black uppercase transition-all border border-border"
                  >
                    {t('admin.update')}
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'Payments' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4 sm:p-8">
             <div className="flex flex-wrap justify-between items-center gap-4 mb-8 sm:mb-12"><h3 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter text-foreground">{t('admin.transaction_log')}</h3><div className="bg-primary/10 border border-primary/20 px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl"><p className="text-[9px] text-primary uppercase font-black mb-1">{t('admin.wallet_balance')}</p><p className="text-xl sm:text-2xl font-black text-foreground">₹1,24,500</p></div></div>
             <div className="space-y-4">
                {payments.map(p => (
                   <div key={p.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-muted/10 rounded-3xl border border-border hover:border-primary/20 transition-all group">
                    <div className="flex items-center gap-6 mb-4 md:mb-0"><div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-600 text-xl group-hover:bg-primary/10 group-hover:text-primary transition-all"><FaCreditCard /></div><div><p className="font-black text-lg text-foreground">{t('admin.trip_payment', { id: p.bookingId })}</p><p className="text-xs text-muted uppercase font-bold tracking-widest">{p.customer} • {p.date}</p></div></div>
                    <div className="flex items-center gap-12 text-right"><div className="hidden lg:block"><p className="text-[9px] text-muted uppercase font-black">{t('admin.split')}</p><p className="text-xs text-foreground font-bold">{t('admin.split_detail', { admin: Math.floor(p.amount * 0.12), driver: p.amount - Math.floor(p.amount * 0.12) })}</p></div><div><p className="text-2xl font-black text-primary">₹{p.amount}</p><p className="text-[10px] text-muted uppercase font-black">{p.method}</p></div></div>
                  </div>
                ))}
             </div>
          </motion.div>
        )}

        {activeTab === 'Reports' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8">
                <div className="glass-card p-5 sm:p-8 text-center"><p className="text-[9px] sm:text-[10px] text-muted uppercase font-black mb-2">{t('admin.total_commissions')}</p><p className="text-2xl sm:text-4xl font-black text-primary">₹5,433</p><div className="mt-3 flex items-center justify-center gap-2 text-xs text-green-600 font-bold"><FaArrowUp /> {t('admin.vs_last_month', { percent: 12 })}</div></div>
                <div className="glass-card p-5 sm:p-8 text-center"><p className="text-[9px] sm:text-[10px] text-muted uppercase font-black mb-2">{t('admin.driver_payouts')}</p><p className="text-2xl sm:text-4xl font-black text-green-600">₹39,847</p><div className="mt-3 flex items-center justify-center gap-2 text-xs text-green-600 font-bold"><FaArrowUp /> {t('admin.vs_last_month', { percent: 8 })}</div></div>
                <div className="glass-card p-5 sm:p-8 text-center"><p className="text-[9px] sm:text-[10px] text-muted uppercase font-black mb-2">{t('admin.platform_growth')}</p><p className="text-2xl sm:text-4xl font-black text-blue-600">28%</p><div className="mt-3 flex items-center justify-center gap-2 text-xs text-green-600 font-bold"><FaArrowUp /> {t('admin.consistent')}</div></div>
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                <div className="glass-card p-4 sm:p-8"><h3 className="text-base sm:text-xl font-black italic uppercase tracking-tighter mb-4 sm:mb-8 text-foreground">{t('admin.payout_weekly')}</h3><div className="h-[300px] w-full min-w-0"><ResponsiveContainer width="100%" height="100%" debounce={100}><BarChart data={revenueData}><CartesianGrid strokeDasharray="3 3" stroke="#E5DED3" vertical={false} /><XAxis dataKey="name" stroke="#5F5F5F" fontSize={10} /><YAxis stroke="#5F5F5F" fontSize={10} /><Tooltip contentStyle={{ backgroundColor: '#FFFDF9', border: '1px solid #E5DED3', borderRadius: '12px' }} /><Legend /><Bar dataKey="driverPay" fill="#22c55e" name={t('admin.driver_payout_chart')} radius={[4, 4, 0, 0]} /><Bar dataKey="commission" fill="#E8B34B" name={t('admin.admin_profit')} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></div>
                <div className="glass-card p-4 sm:p-8"><h3 className="text-base sm:text-xl font-black italic uppercase tracking-tighter mb-4 sm:mb-8 text-foreground">{t('admin.operational_perf')}</h3><div className="space-y-6">{operationalMetrics.map((m, i) => (<div key={i}><div className="flex justify-between text-xs mb-2"><span className="text-muted font-bold uppercase">{t(m.labelKey)}</span><span className="text-foreground font-black">{m.val}</span></div><div className="w-full h-1.5 bg-muted/10 rounded-full overflow-hidden border border-border"><motion.div initial={{ width: 0 }} animate={{ width: '80%' }} transition={{ delay: i*0.1 }} className={`h-full ${m.color}`} /></div></div>))}</div></div>
             </div>
          </motion.div>
        )}

      </div>

      {/* Map Modal */}
      <AnimatePresence>
        {showMapModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMapModal(false)} className="absolute inset-0 bg-background/95 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass-card w-full max-w-4xl h-[70vh] sm:h-[80vh] relative z-10 border-primary/20 flex flex-col">
              <div className="p-6 border-b border-border flex justify-between items-center bg-muted/10">
                 <div><h3 className="text-2xl font-black text-foreground italic uppercase tracking-tighter">{t('admin.live_route')}</h3><p className="text-[10px] text-muted uppercase font-bold tracking-widest">{selectedBooking?.pickup} → {selectedBooking?.drop}</p></div>
                 <button onClick={() => setShowMapModal(false)} className="text-muted hover:text-foreground"><FaTimesCircle size={24} /></button>
              </div>
              <div className="flex-1 relative overflow-hidden bg-surface p-4">
                 <RouteMap
                   pickup={selectedBooking?.pickup}
                   drop={selectedBooking?.drop}
                   routeCoords={selectedBooking?.routeCoords || null}
                   distanceKm={parseKm(selectedBooking?.distance)}
                 />
                 
                 <div className="absolute top-12 right-12 z-[1000] p-6 glass-card border-primary/30 max-w-xs shadow-2xl">
                    <div className="flex items-center gap-4 mb-4">
                       <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-background text-xl"><FaMapMarkerAlt /></div>
                       <div><p className="text-3xl font-black text-foreground">450 <span className="text-xs uppercase text-muted font-bold tracking-widest">{t('admin.meters')}</span></p><p className="text-[10px] text-primary uppercase font-black">{t('driver.turn_left')}</p></div>
                    </div>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Booking Update Modal */}
      <AnimatePresence>
        {showBookingEditModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowBookingEditModal(false)} className="absolute inset-0 bg-background/95 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="glass-card w-full max-w-md p-5 sm:p-8 relative z-10 border-primary/20 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-8 text-dark">{t('admin.update_booking')}</h3>
              <form onSubmit={handleSaveBooking} className="space-y-6">
                <div className="space-y-4">
                  <div className="relative"><FaMapMarkerAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" /><input type="text" placeholder={t('booking.pickup')} value={bookingForm.pickup || ''} onChange={e => setBookingForm({...bookingForm, pickup: e.target.value})} className="input-field pl-12" required /></div>
                  <div className="relative"><FaMapMarkerAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" /><input type="text" placeholder={t('booking.drop')} value={bookingForm.drop || ''} onChange={e => setBookingForm({...bookingForm, drop: e.target.value})} className="input-field pl-12" required /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative"><FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" /><input type="text" placeholder={t('booking.date')} value={bookingForm.date || ''} onChange={e => setBookingForm({...bookingForm, date: e.target.value})} className="input-field pl-12" required /></div>
                    <div className="relative"><FaClock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" /><input type="text" placeholder={t('booking.time')} value={bookingForm.time || ''} onChange={e => setBookingForm({...bookingForm, time: e.target.value})} className="input-field pl-12" required /></div>
                  </div>
                  <div className="relative"><FaMoneyBillWave className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" /><input type="number" placeholder={t('admin.commission')} value={bookingForm.fare || ''} onChange={e => setBookingForm({...bookingForm, fare: e.target.value})} className="input-field pl-12" required /></div>
                  <div className="relative">
                    <FaUserTie className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <select
                      value={bookingForm.driverId || ''}
                      onChange={(e) => {
                        const drv = drivers.find((d) => d.id === e.target.value);
                        setBookingForm({
                          ...bookingForm,
                          driverId: e.target.value,
                          driverName: drv?.name,
                          vehicleName: drv?.carType,
                          vehicleNumber: drv?.vehicleNumber,
                        });
                      }}
                      className="input-field pl-12 appearance-none bg-surface"
                    >
                      <option value="">Select Driver</option>
                      {drivers.filter((d) => d.approvalStatus === 'Approved').map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.carType})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button type="submit" className="w-full btn-primary py-4 font-black uppercase tracking-widest shadow-xl shadow-primary/20">{t('admin.update_booking')}</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Dummy Booking Modal */}
      <AnimatePresence>
        {showCreateBookingModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreateBookingModal(false)} className="absolute inset-0 bg-background/95 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass-card w-full max-w-md p-5 sm:p-8 relative z-10 border-primary/20 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-dark">Create Dummy Booking</h3>
                <button onClick={() => setShowCreateBookingModal(false)} className="text-muted hover:text-dark"><FaTimesCircle size={20} /></button>
              </div>
              <form onSubmit={handleCreateBooking} className="space-y-4">
                <div className="relative"><FaUserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" /><input type="text" placeholder="Customer Name" value={newBookingForm.customer} onChange={e => setNewBookingForm({...newBookingForm, customer: e.target.value})} className="input-field pl-12" required /></div>
                <div className="relative"><FaPhoneAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" /><input type="text" placeholder="Customer Phone" value={newBookingForm.phone} onChange={e => setNewBookingForm({...newBookingForm, phone: e.target.value})} className="input-field pl-12" required /></div>
                <div className="relative"><FaMapMarkerAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" /><input type="text" placeholder="Pickup Location" value={newBookingForm.pickup} onChange={e => setNewBookingForm({...newBookingForm, pickup: e.target.value})} className="input-field pl-12" required /></div>
                <div className="relative"><FaMapMarkerAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" /><input type="text" placeholder="Drop Location" value={newBookingForm.drop} onChange={e => setNewBookingForm({...newBookingForm, drop: e.target.value})} className="input-field pl-12" required /></div>
                <div className="grid grid-cols-2 gap-3">
                   <div className="relative"><FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" /><input type="text" placeholder="Date (e.g. 24 May)" value={newBookingForm.date} onChange={e => setNewBookingForm({...newBookingForm, date: e.target.value})} className="input-field pl-12" required /></div>
                   <div className="relative"><FaClock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" /><input type="text" placeholder="Time (e.g. 10:30 AM)" value={newBookingForm.time} onChange={e => setNewBookingForm({...newBookingForm, time: e.target.value})} className="input-field pl-12" required /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <div className="relative"><FaCar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" /><input type="text" placeholder="Car (Mini/SUV)" value={newBookingForm.car} onChange={e => setNewBookingForm({...newBookingForm, car: e.target.value})} className="input-field pl-12" required /></div>
                   <div className="relative"><FaMoneyBillWave className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" /><input type="number" placeholder="Fare (₹)" value={newBookingForm.fare} onChange={e => setNewBookingForm({...newBookingForm, fare: e.target.value})} className="input-field pl-12" required /></div>
                </div>
                <button type="submit" className="w-full btn-primary py-4 mt-4 font-black uppercase tracking-widest shadow-xl shadow-primary/20">Add Booking</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Customer Modal */}
      <AnimatePresence>
        {showCustomerModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCustomerModal(false)} className="absolute inset-0 bg-background/95 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass-card w-full max-w-md p-5 sm:p-8 relative z-10 border-primary/20 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-dark">
                  {modalMode === 'add' ? t('admin.add_customer') : modalMode === 'edit' ? t('admin.add_customer') : t('admin.customer_dir')}
                </h3>
                <button onClick={() => setShowCustomerModal(false)} className="text-muted hover:text-dark"><FaTimesCircle size={20} /></button>
              </div>
              <form onSubmit={handleSaveCustomer} className="space-y-6">
                <div className="space-y-4">
                  <div className="relative"><FaUserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" /><input type="text" placeholder={t('auth.full_name')} value={customerForm.name || ''} onChange={e => setCustomerForm({...customerForm, name: e.target.value})} className="input-field pl-12" readOnly={modalMode === 'view'} required /></div>
                  <div className="relative"><FaPhoneAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" /><input type="text" placeholder={t('auth.phone')} value={customerForm.phone || ''} onChange={e => setCustomerForm({...customerForm, phone: e.target.value})} className="input-field pl-12" readOnly={modalMode === 'view'} required /></div>
                  <div className="relative"><FaMapMarkerAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" /><input type="text" placeholder={t('auth.location')} value={customerForm.location || ''} onChange={e => setCustomerForm({...customerForm, location: e.target.value})} className="input-field pl-12" readOnly={modalMode === 'view'} required /></div>
                  <div className="relative"><FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" /><input type="text" placeholder={t('auth.password')} value={customerForm.password || ''} onChange={e => setCustomerForm({...customerForm, password: e.target.value})} className="input-field pl-12" readOnly={modalMode === 'view'} required /></div>
                </div>
                {modalMode !== 'view' && (
                  <button type="submit" className="w-full btn-primary py-4 font-black uppercase tracking-widest shadow-xl shadow-primary/20">
                    {modalMode === 'add' ? t('auth.register_btn') : t('admin.update_customer')}
                  </button>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Driver Modal */}
      <AnimatePresence>
        {showDriverModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDriverModal(false)} className="absolute inset-0 bg-background/95 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass-card w-full max-w-lg p-5 sm:p-8 relative z-10 border-primary/20 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-dark">
                  {modalMode === 'add' ? t('admin.add_driver') : modalMode === 'edit' ? t('admin.add_driver') : t('admin.driver_approvals')}
                </h3>
                <button onClick={() => setShowDriverModal(false)} className="text-muted hover:text-dark"><FaTimesCircle size={20} /></button>
              </div>
              <form onSubmit={handleSaveDriver} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative"><FaUserTie className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" /><input type="text" placeholder={t('auth.full_name')} value={driverForm.name || ''} onChange={e => setDriverForm({...driverForm, name: e.target.value})} className="input-field pl-12" readOnly={modalMode === 'view'} required /></div>
                  <div className="relative"><FaPhoneAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" /><input type="text" placeholder={t('auth.phone')} value={driverForm.phone || ''} onChange={e => setDriverForm({...driverForm, phone: e.target.value})} className="input-field pl-12" readOnly={modalMode === 'view'} required /></div>
                  <div className="relative col-span-2"><FaMapMarkerAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" /><input type="text" placeholder={t('auth.location')} value={driverForm.location || ''} onChange={e => setDriverForm({...driverForm, location: e.target.value})} className="input-field pl-12" readOnly={modalMode === 'view'} required /></div>
                  <div className="relative"><FaCar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" /><input type="text" placeholder={t('auth.vehicle_name')} value={driverForm.vehicleName || ''} onChange={e => setDriverForm({...driverForm, vehicleName: e.target.value})} className="input-field pl-12" readOnly={modalMode === 'view'} required /></div>
                  <div className="relative"><FaIdCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" /><input type="text" placeholder={t('auth.vehicle_no')} value={driverForm.vehicleNumber || ''} onChange={e => setDriverForm({...driverForm, vehicleNumber: e.target.value})} className="input-field pl-12" readOnly={modalMode === 'view'} required /></div>
                  <div className="relative col-span-2"><FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" /><input type="text" placeholder={t('auth.password')} value={driverForm.password || ''} onChange={e => setDriverForm({...driverForm, password: e.target.value})} className="input-field pl-12" readOnly={modalMode === 'view'} required /></div>
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] text-muted uppercase font-black tracking-widest">Document Previews</p>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="aspect-video glass-card border-border flex flex-col items-center justify-center p-2 group cursor-pointer hover:border-primary/30 transition-all overflow-hidden relative">
                      {modalMode === 'add' && !driverForm.vehiclePhoto ? <FaCamera className="text-muted mb-1" /> : (
                        driverForm.vehiclePhoto && !driverForm.vehiclePhoto.includes('placehold.co') ? (
                          <img src={driverForm.vehiclePhoto} className="w-full h-full object-cover rounded-lg" alt="Vehicle" />
                        ) : (
                          <div className="w-full h-full bg-dark/5 rounded-lg flex items-center justify-center text-[10px] text-muted uppercase font-black">No Photo</div>
                        )
                      )}
                      <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-dark/60 px-2 py-0.5 rounded text-[8px] text-muted uppercase font-black backdrop-blur-sm">Vehicle Photo</span>
                      {modalMode !== 'view' && <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'vehiclePhoto')} />}
                    </label>
                    <label className="aspect-video glass-card border-border flex flex-col items-center justify-center p-2 group cursor-pointer hover:border-primary/30 transition-all overflow-hidden relative">
                      {modalMode === 'add' && !driverForm.licensePhoto ? <FaCamera className="text-muted mb-1" /> : (
                        driverForm.licensePhoto && !driverForm.licensePhoto.includes('placehold.co') ? (
                          <img src={driverForm.licensePhoto} className="w-full h-full object-cover rounded-lg" alt="License" />
                        ) : (
                          <div className="w-full h-full bg-dark/5 rounded-lg flex items-center justify-center text-[10px] text-muted uppercase font-black">No Photo</div>
                        )
                      )}
                      <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-dark/60 px-2 py-0.5 rounded text-[8px] text-muted uppercase font-black backdrop-blur-sm">License Photo</span>
                      {modalMode !== 'view' && <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'licensePhoto')} />}
                    </label>
                  </div>
                </div>

                {modalMode !== 'view' && (
                  <button type="submit" className="w-full btn-primary py-4 font-black uppercase tracking-widest shadow-xl shadow-primary/20 mt-4">
                    {modalMode === 'add' ? t('auth.register_btn') : t('admin.update_driver')}
                  </button>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCarModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCarModal(false)} className="absolute inset-0 bg-background/95 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="glass-card w-full max-w-md p-5 sm:p-8 relative z-10 border-primary/20 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-8 text-dark">
                {modalMode === 'add' ? 'Add New Vehicle' : 'Update Vehicle'}
              </h3>
              <form onSubmit={handleSaveCar} className="space-y-6">
                <div className="space-y-4">
                  <div className="relative"><FaCar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" /><input type="text" placeholder="Vehicle Name (e.g. Echo)" value={carForm.name || ''} onChange={e => setCarForm({...carForm, name: e.target.value})} className="input-field pl-12" required /></div>
                  <div className="relative"><FaThLarge className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" /><input type="text" placeholder="Type (e.g. Standard)" value={carForm.type || ''} onChange={e => setCarForm({...carForm, type: e.target.value})} className="input-field pl-12" required /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative"><FaUsers className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" /><input type="number" placeholder="Seats" value={carForm.seats || ''} onChange={e => setCarForm({...carForm, seats: e.target.value})} className="input-field pl-12" required /></div>
                    <div className="relative"><FaMoneyBillWave className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" /><input type="number" placeholder="Rate /km" value={carForm.pricePerKm || ''} onChange={e => setCarForm({...carForm, pricePerKm: e.target.value})} className="input-field pl-12" required /></div>
                  </div>
                  <div className="relative"><FaClock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" /><input type="text" placeholder="ETA (e.g. 5 mins)" value={carForm.eta || ''} onChange={e => setCarForm({...carForm, eta: e.target.value})} className="input-field pl-12" required /></div>
                  
                  <div className="space-y-2">
                    <p className="text-[10px] text-muted uppercase font-black tracking-widest">Vehicle Image</p>
                    <label className="aspect-video glass-card border-border flex flex-col items-center justify-center p-2 group cursor-pointer hover:border-primary/30 transition-all overflow-hidden relative h-32">
                      {carForm.image ? (
                        <img src={carForm.image} className="w-full h-full object-contain rounded-lg" alt="Preview" />
                      ) : (
                        <>
                          <FaCamera className="text-muted group-hover:text-primary text-sm" />
                          <span className="text-[9px] text-muted font-bold uppercase text-center">Select Photo</span>
                        </>
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'image', setCarForm)} />
                    </label>
                  </div>
                </div>
                <button type="submit" className="w-full btn-primary py-4 font-black uppercase tracking-widest shadow-xl shadow-primary/20">
                  {modalMode === 'add' ? 'Create Vehicle' : 'Save Changes'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Assign Driver Modal */}
      <AnimatePresence>
        {showAssignModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAssignModal(false)} className="absolute inset-0 bg-background/95 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass-card w-full max-w-md p-5 sm:p-8 relative z-10 border-primary/20 max-h-[80vh] flex flex-col">
              <div className="flex justify-between items-center mb-6 sm:mb-8">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black uppercase italic tracking-tighter text-dark">{t('admin.assign_driver')}</h3>
                  <p className="text-[10px] text-muted uppercase font-bold tracking-widest mt-1">Available & Verified Drivers</p>
                </div>
                <button onClick={() => setShowAssignModal(false)} className="text-muted hover:text-dark transition-colors"><FaTimesCircle size={24} /></button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                {drivers.filter(d => d.approvalStatus === 'Approved' && d.status === 'Available').length > 0 ? (
                  drivers.filter(d => d.approvalStatus === 'Approved' && d.status === 'Available').map(driver => (
                    <motion.div 
                      key={driver.id}
                      whileHover={{ x: 5 }}
                      onClick={() => handleAssignDriver(driver)}
                      className="glass-card p-4 border-border hover:border-primary/40 cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary text-xl group-hover:bg-primary group-hover:text-dark transition-all font-bold">
                          {driver.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-dark">{driver.name}</p>
                          <p className="text-[10px] text-muted uppercase font-bold tracking-widest">{driver.carType} • {driver.location}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-primary font-black uppercase tracking-widest mb-1">{driver.vehicleNumber}</p>
                        <div className="flex items-center gap-1 text-[8px] text-green-500 font-black uppercase">
                          <FaCheckCircle /> Ready
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted font-bold uppercase text-xs">No available drivers found</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminDashboard;
