import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaHome, FaInfoCircle, FaPhoneAlt, FaSignInAlt, FaUserPlus, 
  FaThLarge, FaClipboardList, FaUsers, FaUserCircle, FaCar, 
  FaWallet, FaChartBar, FaCarSide, FaHistory, FaHeadset, FaSignOutAlt 
} from 'react-icons/fa';

const BottomNav = ({ 
  user, 
  logout, 
  adminTab, 
  driverTab, 
  customerTab, 
  setAdminTab, 
  setDriverTab, 
  setCustomerTab, 
  setIsAuthOpen 
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = {
    guest: [
      { label: 'Home', path: '/', icon: <FaHome /> },
      { label: 'About', path: '/about', icon: <FaInfoCircle /> },
      { label: 'Contact', path: '/contact', icon: <FaPhoneAlt /> },
      { label: 'Login', type: 'auth', icon: <FaSignInAlt /> },
    ],
    superadmin: [
      { id: 'Manage Admins', label: 'Manage Admins', path: '/superadmin', icon: <FaThLarge /> },
      { id: 'Logout', label: 'Logout', type: 'logout', icon: <FaSignOutAlt /> },
    ],
    admin: [
      { id: 'Dashboard', label: 'Dashboard', path: '/admin', icon: <FaThLarge /> },
      { id: 'Bookings', label: 'Bookings', path: '/admin', icon: <FaClipboardList /> },
      { id: 'Customers', label: 'Customers', path: '/admin', icon: <FaUsers /> },
      { id: 'Drivers', label: 'Drivers', path: '/admin', icon: <FaUserCircle /> },
      { id: 'Cars', label: 'Cars', path: '/admin', icon: <FaCar /> },
      { id: 'Payments', label: 'Payments', path: '/admin', icon: <FaWallet /> },
      { id: 'Reports', label: 'Reports', path: '/admin', icon: <FaChartBar /> },
      { id: 'Logout', label: 'Logout', type: 'logout', icon: <FaSignOutAlt /> },
    ],
    customer: [
      { id: 'Dashboard', label: 'Dashboard', path: '/book', icon: <FaThLarge /> },
      { id: 'Book Ride', label: 'Book Ride', path: '/book', icon: <FaCarSide /> },
      { id: 'My Rides', label: 'My Rides', path: '/book', icon: <FaHistory /> },
      { id: 'Support', label: 'Support', path: '/book', icon: <FaHeadset /> },
      { id: 'Logout', label: 'Logout', type: 'logout', icon: <FaSignOutAlt /> },
    ],
    driver: [
      { id: 'Dashboard', label: 'Dashboard', path: '/driver', icon: <FaThLarge /> },
      { id: 'My Jobs', label: 'My Jobs', path: '/driver', icon: <FaClipboardList /> },
      { id: 'Earnings', label: 'Earnings', path: '/driver', icon: <FaWallet /> },
      { id: 'History', label: 'History', path: '/driver', icon: <FaHistory /> },
      { id: 'Logout', label: 'Logout', type: 'logout', icon: <FaSignOutAlt /> },
    ]
  };

  const activeRole = user ? user.role : 'guest';
  const currentMenu = menuItems[activeRole];

  const handleNavClick = (item) => {
    if (item.type === 'logout') {
      logout();
      return;
    }
    if (item.type === 'auth') {
      setIsAuthOpen(true);
      return;
    }

    if (user?.role === 'admin') setAdminTab(item.id);
    if (user?.role === 'driver') setDriverTab(item.id);
    if (user?.role === 'customer') setCustomerTab(item.id);
    
    navigate(item.path);
  };

  const checkIsActive = (item) => {
    if (item.type === 'logout' || item.type === 'auth') return false;
    
    // For non-dashboard routes (About, Contact, Home)
    if (location.pathname !== '/admin' && location.pathname !== '/driver' && location.pathname !== '/book') {
      return location.pathname === item.path;
    }

    // For dashboard routes, check the active tab
    if (user?.role === 'admin') return adminTab === item.id;
    if (user?.role === 'driver') return driverTab === item.id;
    if (user?.role === 'customer') return customerTab === item.id;

    return location.pathname === item.path;
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
      <div className="bg-background/95 backdrop-blur-xl border border-border rounded-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="flex items-center justify-between overflow-x-auto no-scrollbar py-2 px-2 scroll-smooth">
          {currentMenu.map((item, index) => {
            const isActive = checkIsActive(item);

            return (
              <motion.button
                key={index}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleNavClick(item)}
                className={`relative flex flex-col items-center gap-1 min-w-[75px] py-2 px-1 rounded-2xl transition-all duration-300 ${
                  isActive ? 'text-primary' : 'text-muted hover:text-dark'
                }`}
              >
                <div className={`text-lg sm:text-xl transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}>
                  {item.icon}
                </div>
                <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                  {item.label}
                </span>
                {isActive && (
                  <motion.div 
                    layoutId="activeTabGlow"
                    className="absolute -bottom-1 w-8 h-4 bg-primary/30 blur-lg rounded-full"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BottomNav;
