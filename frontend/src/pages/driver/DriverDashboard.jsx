import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  FaWallet, FaRoute, FaClipboardList, FaMapMarkerAlt,
  FaPhoneAlt, FaCheckCircle, FaTimesCircle, FaLocationArrow,
  FaChevronRight, FaClock, FaCalendarAlt, FaTimes
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import RouteMap from '../../components/RouteMap';
import { api } from '../../lib/api.js';

const DriverDashboard = ({ activeTab, user, setDriverTab }) => {
  const { t } = useTranslation();
  const [allBookings, setAllBookings] = useState([]);

  const [activeView, setActiveView] = useState('dashboard');
  const [currentRide, setCurrentRide] = useState(null);
  const [activeTrip, setActiveTrip] = useState(null);
  const [isArrived, setIsArrived] = useState(false);

  const [driverStats, setDriverStats] = useState(null);

  const loadBookings = useCallback(async () => {
    try {
      const [list, stats] = await Promise.all([
        api('/api/bookings'),
        api('/api/bookings/driver-stats')
      ]);
      setAllBookings(Array.isArray(list) ? list : []);
      setDriverStats(stats);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    setActiveView('dashboard');
  }, [activeTab]);

  useEffect(() => {
    loadBookings();
    const interval = setInterval(loadBookings, 4000);
    return () => clearInterval(interval);
  }, [loadBookings]);

  const driverJobs = allBookings.filter((b) => b.status === 'Assigned');
  const driverAcceptedJobs = allBookings.filter((b) => b.status === 'Accepted');

  const handleAccept = async (ride) => {
    try {
      await api(`/api/bookings/${ride.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'accept' }),
      });
      await loadBookings();
      toast.success(t('driver.toast_ride_accepted'));
    } catch (e) {
      toast.error(e.message || t('driver.toast_accept_failed'));
    }
  };

  const startNavigation = (ride) => {
    setCurrentRide(ride);
    setIsArrived(false);
    setActiveView('map');
  };

  const handleArrived = () => {
    setIsArrived(true);
    toast.success(t('driver.toast_arrived'));
  };

  const exitMapToMyJobs = () => {
    setActiveView('dashboard');
    setCurrentRide(null);
    setIsArrived(false);
    setDriverTab?.('My Jobs');
  };

  return (
    <div className="pt-20 pb-8 px-3 sm:px-4 lg:px-6 bg-background min-h-screen text-dark">
      <div className="max-w-7xl mx-auto">

        {activeView === 'dashboard' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 sm:space-y-10 lg:space-y-12"
          >
            {/* ── DRIVER DASHBOARD ── */}
            {(activeTab === 'Dashboard' || !activeTab) && (
              <div className="space-y-8 sm:space-y-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-3xl sm:text-5xl font-black italic tracking-tighter uppercase text-dark leading-none">
                      {t('driver.captain')}, <span className="text-primary">{user?.name || t('driver.driver_fallback')}</span>
                    </h2>
                    <p className="text-muted text-[10px] sm:text-xs uppercase font-black tracking-widest mt-2 italic">{t('driver.daily_bonus_track')}</p>
                  </div>
                  <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 px-4 sm:px-6 py-3 rounded-2xl">
                    <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-dark text-xl shadow-lg shadow-green-500/20"><FaWallet /></div>
                    <div>
                      <p className="text-[9px] text-green-500 uppercase font-black mb-0.5">{t('driver.today_earnings')}</p>
                      <p className="text-xl sm:text-2xl font-black text-dark">₹{driverStats ? driverStats.todayEarnings.toLocaleString() : "2,450"}</p>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {[
                    { labelKey: 'driver.rating', val: driverStats?.rating || '4.95', icon: <FaCheckCircle />, color: 'text-blue-600' },
                    { labelKey: 'driver.trips_done', val: driverStats?.tripsDone || '12', icon: <FaRoute />, color: 'text-primary' },
                    { labelKey: 'driver.online_hours', val: driverStats?.onlineHours || '6.5h', icon: <FaClock />, color: 'text-green-600' },
                    { labelKey: 'driver.acceptance', val: driverStats?.acceptance || '98%', icon: <FaCheckCircle />, color: 'text-yellow-600' },
                  ].map((stat, i) => (
                    <div key={i} className="glass-card p-4 sm:p-8 group hover:border-primary/30 transition-all">
                       <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-dark/5 flex items-center justify-center text-xl sm:text-2xl mb-4 sm:mb-6 ${stat.color} group-hover:scale-110 transition-transform`}>{stat.icon}</div>
                       <p className="text-muted text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-1">{t(stat.labelKey)}</p>
                       <p className="text-xl sm:text-3xl font-black text-dark">{stat.val}</p>
                    </div>
                  ))}
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10">
                  {/* Daily Target */}
                  <div className="lg:col-span-2 glass-card p-6 sm:p-12 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32" />
                     <div className="flex justify-between items-center mb-8 sm:mb-12 relative z-10">
                        <h3 className="text-xl sm:text-3xl font-black italic uppercase tracking-tighter text-dark">{t('driver.daily_target')}</h3>
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-lg border border-primary/20">{t('driver.goal_badge')}</span>
                     </div>
                     <div className="space-y-8 relative z-10">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                           <span className="text-muted">{t('driver.progress')}</span>
                           <span className="text-dark">{t('driver.percent_complete', { percent: 49 })}</span>
                        </div>
                        <div className="w-full h-4 sm:h-6 bg-dark/5 rounded-full overflow-hidden p-1 border border-border">
                           <motion.div initial={{ width: 0 }} animate={{ width: '49%' }} className="h-full bg-primary rounded-full shadow-lg shadow-primary/20" />
                        </div>
                        <p className="text-center text-[10px] sm:text-xs text-muted font-bold uppercase tracking-widest italic">{t('driver.bonus_tip')}</p>
                        
                        <div className="grid grid-cols-3 gap-4 pt-4">
                           {[
                             { labelKey: 'driver.period_today', val: driverStats ? `₹${driverStats.todayEarnings.toLocaleString()}` : '₹2,450' },
                             { labelKey: 'driver.period_week', val: driverStats ? `₹${(driverStats.weekEarnings / 1000).toFixed(1)}K` : '₹18.4K' },
                             { labelKey: 'driver.period_month', val: driverStats ? `₹${(driverStats.monthEarnings / 1000).toFixed(1)}K` : '₹72.8K' }
                           ].map((item, i) => (
                             <div key={i} className="text-center p-4 bg-dark/5 rounded-2xl border border-border">
                                <p className="text-[8px] sm:text-[9px] text-muted uppercase font-black mb-1">{t(item.labelKey)}</p>
                                <p className="text-sm sm:text-lg font-black text-dark">{item.val}</p>
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>

                  {/* Quick Shortcuts / Info */}
                  <div className="space-y-6">
                    <div className="glass-card p-6 sm:p-10 bg-dark/5 border-border group hover:border-primary/40 transition-all flex flex-col justify-between h-full">
                       <FaRoute className="text-3xl sm:text-5xl text-primary mb-6 group-hover:scale-110 transition-transform" />
                       <div>
                         <h3 className="text-xl sm:text-3xl font-black italic uppercase tracking-tighter text-dark leading-tight">{t('driver.next_job')}<br/>{t('driver.nearby')}</h3>
                         <p className="text-[10px] font-bold uppercase mt-4 tracking-widest text-muted">{t('driver.requests_pending', { count: 2 })}</p>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── MY JOBS VIEW ── */}
            {activeTab === 'My Jobs' && (
              <div className="space-y-8">
                {/* Active Trip Header */}
                <h3 className="text-xl sm:text-3xl font-black italic uppercase tracking-tighter text-dark">{t('driver.pending_assignments')}</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10 lg:gap-12">
                  <div className="space-y-6">
                    {driverJobs.length > 0 ? (
                      driverJobs.map((ride) => (
                        <motion.div key={ride.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-6 sm:p-10 border-primary/20 relative overflow-hidden group">
                          <div className="flex justify-between items-start mb-8 relative z-10">
                            <div>
                              <h4 className="text-xl sm:text-3xl font-black text-dark">{ride.customer}</h4>
                              <p className="text-[10px] text-primary uppercase font-black tracking-widest mt-1">{t('driver.assigned_by_admin', { car: ride.car })}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-black text-dark">₹{ride.fare}</p>
                              <p className="text-[10px] text-muted uppercase font-black tracking-widest">{ride.distance}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-8 p-4 bg-dark/5 rounded-2xl border border-border relative z-10">
                             <div className="flex items-center gap-3 text-xs text-muted font-bold uppercase"><FaCalendarAlt className="text-primary" /> {ride.date}</div>
                             <div className="flex items-center gap-3 text-xs text-muted font-bold uppercase"><FaClock className="text-primary" /> {ride.time}</div>
                          </div>

                          <div className="space-y-4 mb-8 relative z-10">
                            <div className="flex items-start gap-4">
                              <div className="w-2.5 h-2.5 bg-green-500 rounded-full mt-1.5 shrink-0 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                              <div><p className="text-[10px] text-muted uppercase font-black tracking-widest mb-1">{t('driver.pickup')}</p><p className="text-sm sm:text-lg font-bold text-dark">{ride.pickup}</p></div>
                            </div>
                            <div className="flex items-start gap-4">
                              <div className="w-2.5 h-2.5 bg-red-500 rounded-full mt-1.5 shrink-0 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                              <div><p className="text-[10px] text-muted uppercase font-black tracking-widest mb-1">{t('driver.drop')}</p><p className="text-sm sm:text-lg font-bold text-dark">{ride.drop}</p></div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 relative z-10">
                            <button onClick={() => handleAccept(ride)} className="btn-primary py-4 text-xs font-black uppercase flex items-center justify-center gap-3 shadow-xl shadow-primary/20"><FaCheckCircle /> {t('driver.accept_trip')}</button>
                            <button onClick={() => startNavigation(ride)} className="bg-dark/5 hover:bg-dark/10 text-dark py-4 rounded-2xl text-xs font-black uppercase flex items-center justify-center gap-3 transition-all border border-border"><FaMapMarkerAlt /> {t('driver.view_map')}</button>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="glass-card p-12 text-center border-dashed border-border"><p className="text-muted uppercase font-black tracking-widest text-sm">{t('driver.no_assignments')}</p></div>
                    )}
                  </div>

                  {/* Accepted Trips List */}
                  <div className="space-y-6">
                    <h3 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter text-green-500">{t('driver.my_active_list')}</h3>
                    <div className="space-y-4">
                       {driverAcceptedJobs.map((ride) => (
                          <div key={ride.id} className="glass-card p-6 border-green-500/20 hover:border-green-500/40 transition-all flex items-center justify-between group">
                             <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-600 text-2xl group-hover:scale-110 transition-transform"><FaRoute /></div>
                                <div>
                                   <p className="text-lg font-black text-dark">{ride.customer}</p>
                                   <p className="text-[10px] text-muted font-bold uppercase tracking-widest">{(ride.pickup || '').split(',')[0]} → {(ride.drop || '').split(',')[0]}</p>
                                </div>
                             </div>
                             <button onClick={() => startNavigation(ride)} className="p-4 bg-green-500 text-dark rounded-2xl hover:bg-background transition-all shadow-lg shadow-green-500/20"><FaMapMarkerAlt size={20} /></button>
                          </div>
                        ))}
                       {driverAcceptedJobs.length === 0 && <p className="text-muted italic text-sm">{t('driver.no_active_trips')}</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}


            {/* Earnings Tab */}
            {activeTab === 'Earnings' && (
              <div className="glass-card p-6 sm:p-12 text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-5 sm:mb-6 text-green-500 text-2xl sm:text-3xl">
                  <FaWallet />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black mb-4 tracking-tighter italic">{t('driver.earnings_summary')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 mt-8 sm:mt-12">
                  {[
                    { label: t('driver.week_total'), val: driverStats ? `₹${driverStats.weekEarnings.toLocaleString()}` : '₹18,400', color: 'text-dark' },
                    { label: t('driver.month_total'), val: driverStats ? `₹${driverStats.monthEarnings.toLocaleString()}` : '₹72,850', color: 'text-dark' },
                    { label: t('driver.bonuses'), val: driverStats ? `₹${driverStats.bonuses.toLocaleString()}` : '₹4,200', color: 'text-green-600' },
                  ].map((item, i) => (
                    <div key={i} className="p-6 sm:p-8 bg-dark/5 rounded-2xl sm:rounded-3xl border border-border">
                      <p className="text-xs text-muted font-bold uppercase mb-2">{item.label}</p>
                      <p className={`text-3xl sm:text-4xl font-black ${item.color}`}>{item.val}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'History' && (
              <div className="glass-card p-4 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-black tracking-tighter mb-5 sm:mb-8 italic uppercase">{t('driver.trip_history')}</h3>
                <div className="space-y-3 sm:space-y-4">
                  {allBookings.filter(b => b.status === 'Completed').length > 0 ? (
                    allBookings.filter(b => b.status === 'Completed').map((b) => (
                      <div key={b.id} className="flex items-center justify-between p-4 sm:p-6 bg-dark/5 rounded-xl sm:rounded-2xl border border-border hover:border-primary/20 transition-all">
                        <div className="flex items-center gap-3 sm:gap-6">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-base sm:text-xl">
                            <FaRoute />
                          </div>
                          <div>
                            <p className="font-bold text-sm sm:text-lg text-dark">{t('driver.trip_number', { id: b.id.length > 10 ? `#${b.id.slice(-5)}` : b.id })}</p>
                            <p className="text-[10px] sm:text-xs text-muted">Completed {b.date || 'Today'} • {b.distance}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-base sm:text-xl font-black text-dark">₹{b.fare}</p>
                          <p className="text-[9px] sm:text-[10px] text-green-600 uppercase font-black">{t('driver.paid')}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    [1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center justify-between p-4 sm:p-6 bg-dark/5 rounded-xl sm:rounded-2xl border border-border hover:border-primary/20 transition-all">
                        <div className="flex items-center gap-3 sm:gap-6">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-base sm:text-xl">
                            <FaRoute />
                          </div>
                          <div>
                            <p className="font-bold text-sm sm:text-lg text-dark">{t('driver.trip_number', { id: 10234 + i })}</p>
                            <p className="text-[10px] sm:text-xs text-muted">{t('driver.trip_completed', { day: `1${i}`, km: '12.5' })}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-base sm:text-xl font-black text-dark">₹{450 + (i * 20)}</p>
                          <p className="text-[9px] sm:text-[10px] text-green-600 uppercase font-black">{t('driver.paid')}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          /* ── MAP VIEW ─────────────────────────────────── */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col lg:flex-row gap-4 sm:gap-6 relative"
            style={{ minHeight: 'calc(100vh - 88px)' }}
          >
            <button
              type="button"
              onClick={exitMapToMyJobs}
              aria-label={t('driver.back_to_my_jobs')}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 z-[1100] w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-background/95 border border-border text-muted hover:text-dark hover:border-primary/40 hover:bg-surface flex items-center justify-center shadow-lg transition-all"
            >
              <FaTimes className="text-lg sm:text-xl" />
            </button>

            {/* Map */}
            <div className="flex-1 glass-card overflow-hidden relative border-primary/20 p-2 sm:p-4 min-h-[280px] sm:min-h-[450px]">
              <RouteMap
                pickup={isArrived ? currentRide?.pickup : t('driver.current_location')}
                drop={isArrived ? currentRide?.drop : currentRide?.pickup}
                routeCoords={currentRide?.routeCoords || null}
                distanceKm={
                  currentRide?.distance
                    ? parseFloat(String(currentRide.distance).replace(/[^0-9.]/g, '')) || null
                    : null
                }
              />

              {/* Navigation HUD */}
              <div className="absolute top-4 sm:top-12 left-3 right-3 sm:left-12 sm:right-12 z-[1000] pointer-events-none">
                <div className="bg-background/90 backdrop-blur-xl p-3 sm:p-6 rounded-2xl sm:rounded-3xl border border-primary/30 flex items-center gap-3 sm:gap-6 shadow-2xl">
                  <div className="w-10 h-10 sm:w-16 sm:h-16 bg-primary rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-3xl text-dark shrink-0">
                    <FaLocationArrow className="animate-bounce rotate-45" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-3xl font-black text-dark uppercase italic tracking-tighter">
                      {isArrived ? "450" : "1.2"} <span className="text-xs sm:text-sm font-normal text-muted tracking-widest">{isArrived ? t('driver.unit_meters') : t('driver.unit_km')}</span>
                    </p>
                    <p className="text-[10px] sm:text-xs text-primary font-black uppercase tracking-widest mt-1 italic">
                      {isArrived ? t('driver.turn_left') : t('driver.navigate_pickup')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ride Info Panel */}
            <div className="w-full lg:w-96 space-y-3 sm:space-y-6">
              <div className="glass-card p-4 sm:p-8 bg-surface/95 border-primary/20">
                <div className="flex items-center gap-4 sm:gap-6 mb-5 sm:mb-8 pb-5 sm:pb-8 border-b border-border">
                  <img
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-dark/5 p-1 border-2 border-primary"
                    alt="Customer"
                  />
                  <div>
                    <h4 className="text-base sm:text-xl font-black text-dark">{currentRide?.customer}</h4>
                    <p className="text-[10px] text-muted uppercase tracking-widest">{t('driver.customer_profile')}</p>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-6 mb-5 sm:mb-8">
                  <div className="flex justify-between items-center">
                    <span className="text-muted text-sm">{t('driver.estimated_eta')}</span>
                    <span className="text-primary font-black">{t('driver.eta_mins', { mins: 4 })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted text-sm">{t('driver.trip_fare')}</span>
                    <span className="text-dark font-black">₹{currentRide?.fare}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted text-sm">{t('driver.distance_label')}</span>
                    <span className="text-dark font-black">{currentRide?.distance}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {!isArrived ? (
                    <button onClick={handleArrived} className="w-full btn-primary py-4 flex items-center justify-center gap-3 font-black uppercase text-sm shadow-xl shadow-primary/20">
                      {t('driver.arrived_pickup')}
                    </button>
                  ) : (
                    <button onClick={() => { setActiveView('dashboard'); toast.success(t('driver.toast_trip_started')); }} className="w-full bg-green-500 text-dark py-4 rounded-2xl flex items-center justify-center gap-3 font-black uppercase text-sm shadow-xl shadow-green-500/20">
                      {t('driver.start_trip')}
                    </button>
                  )}
                  <a href="tel:+916261828036" className="w-full bg-dark/5 py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-dark hover:bg-primary hover:text-dark transition-all text-sm uppercase tracking-widest border border-border">
                    <FaPhoneAlt /> {t('driver.call_admin_helpdesk')}
                  </a>
                  <button
                    onClick={() => setActiveView('dashboard')}
                    className="w-full text-xs text-muted uppercase font-black hover:text-red-500 transition-all mt-2"
                  >
                    {t('driver.emergency_cancel')}
                  </button>
                </div>
              </div>

              <div className="glass-card p-4 sm:p-6 bg-primary/10 border-primary/20">
                <p className="text-xs font-black uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                  <FaClock /> {t('driver.pro_tip')}
                </p>
                <p className="text-sm text-muted italic">
                  "{t('driver.safety_tip')}"
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;
