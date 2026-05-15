import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LandingPage from './pages/customer/LandingPage';
import BookingPage from './pages/customer/BookingPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import SuperadminDashboard from './pages/admin/SuperadminDashboard';
import DriverDashboard from './pages/driver/DriverDashboard';
import PlaceholderPage from './pages/customer/PlaceholderPage';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';

function App() {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('authUser');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [adminTab, setAdminTab] = useState('Dashboard');
  const [driverTab, setDriverTab] = useState('My Jobs');
  const [customerTab, setCustomerTab] = useState('Book Ride');
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('authUser', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authUser');
    window.location.href = '/';
  };

  return (
    <Router>
      <div className="min-h-screen bg-background text-dark selection:bg-primary selection:text-dark">
        <Navbar 
          user={user} 
          logout={logout} 
          login={login} 
          setAdminTab={setAdminTab} 
          setDriverTab={setDriverTab} 
          setCustomerTab={setCustomerTab} 
          isAuthOpen={isAuthOpen}
          setIsAuthOpen={setIsAuthOpen}
        />
        <main className="pb-24 md:pb-0">
          <Routes>
            <Route path="/" element={<LandingPage user={user} setIsAuthOpen={setIsAuthOpen} />} />
            <Route path="/book" element={user?.role === 'customer' ? <BookingPage activeTab={customerTab} user={user} /> : <div className="pt-32 text-center text-dark min-h-screen flex flex-col items-center justify-center"><h2 className="text-3xl font-black mb-4 uppercase italic">Customer Login Required</h2><p className="text-muted mb-6">Please login to book a ride.</p><button onClick={() => setIsAuthOpen(true)} className="btn-primary px-8 py-3 rounded-xl font-black uppercase tracking-widest text-sm">Login Now</button></div>} />
            <Route path="/superadmin" element={user?.role === 'superadmin' ? <SuperadminDashboard /> : <div className="pt-32 text-center text-dark min-h-screen flex flex-col items-center justify-center"><h2 className="text-3xl font-black mb-4 uppercase italic">Superadmin Access Required</h2><p className="text-muted mb-6">Please login as Superadmin to view this dashboard.</p><button onClick={() => setIsAuthOpen(true)} className="btn-primary px-8 py-3 rounded-xl font-black uppercase tracking-widest text-sm">Login Now</button></div>} />
            <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard activeTab={adminTab} /> : <div className="pt-32 text-center text-dark min-h-screen flex flex-col items-center justify-center"><h2 className="text-3xl font-black mb-4 uppercase italic">Admin Access Required</h2><p className="text-muted mb-6">Please login as Admin to view the dashboard.</p><button onClick={() => setIsAuthOpen(true)} className="btn-primary px-8 py-3 rounded-xl font-black uppercase tracking-widest text-sm">Login Now</button></div>} />
            <Route path="/driver" element={user?.role === 'driver' ? <DriverDashboard activeTab={driverTab} user={user} setDriverTab={setDriverTab} /> : <div className="pt-32 text-center text-dark min-h-screen flex flex-col items-center justify-center"><h2 className="text-3xl font-black mb-4 uppercase italic">Driver Access Required</h2><p className="text-muted mb-6">Please login as Driver to view the dashboard.</p><button onClick={() => setIsAuthOpen(true)} className="btn-primary px-8 py-3 rounded-xl font-black uppercase tracking-widest text-sm">Login Now</button></div>} />
            <Route path="/about" element={<PlaceholderPage title="About Us" />} />
            <Route path="/contact" element={<PlaceholderPage title="Contact Us" />} />
          </Routes>
        </main>
        <BottomNav 
          user={user} 
          logout={logout} 
          adminTab={adminTab}
          driverTab={driverTab}
          customerTab={customerTab}
          setAdminTab={setAdminTab} 
          setDriverTab={setDriverTab} 
          setCustomerTab={setCustomerTab} 
          setIsAuthOpen={setIsAuthOpen}
        />
        <Toaster 
          toastOptions={{
            style: {
              background: '#F5F1EA',
              color: '#111111',
              border: '1px solid #E5DED3',
              borderRadius: '1rem',
              backdropFilter: 'blur(10px)',
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;
