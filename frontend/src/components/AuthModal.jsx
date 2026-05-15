import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaLock, FaUser, FaPhone, FaMapMarkerAlt, FaCar, FaIdCard, FaCamera, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api.js';

const AuthModal = ({ isOpen, onClose, onLogin, initialMode = 'login' }) => {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(initialMode === 'login');

  useEffect(() => {
    if (isOpen) {
      setIsLogin(initialMode === 'login');
    }
  }, [isOpen, initialMode]);
  const [showPassword, setShowPassword] = useState(false);

  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const [role, setRole] = useState('admin');
  const [signupTab, setSignupTab] = useState('customer');
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    name: '',
    location: '',
    vehicleName: '',
    vehicleNumber: '',
    whatsapp: '',
    vehiclePhoto: null,
    licensePhoto: null,
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (isLogin) {
      if (role === 'superadmin') setFormData((f) => ({ ...f, phone: '0000000000', password: 'superadmin' }));
      else if (role === 'admin') setFormData((f) => ({ ...f, phone: '9999999999', password: 'admin' }));
      else if (role === 'driver') setFormData((f) => ({ ...f, phone: '8888888888', password: 'driver' }));
      else setFormData((f) => ({ ...f, phone: '7777777777', password: 'user' }));
    }
  }, [role, isLogin]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLogin) {
      try {
        const data = await api('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            phone: formData.phone,
            password: formData.password,
          }),
        });
        onLogin({ ...data.user, token: data.token });
        toast.success(`Login Successful!`);
        onClose();
        
        const loggedInRole = data.user.role;
        if (loggedInRole === 'superadmin') navigate('/superadmin');
        else if (loggedInRole === 'admin') navigate('/admin');
        else if (loggedInRole === 'driver') navigate('/driver');
        else navigate('/book');
      } catch (err) {
        toast.error(err.message || 'Login failed');
      }
    } else {
      try {
        const res = await api('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            phone: formData.phone,
            password: formData.password,
            name: formData.name,
            location: formData.location,
            role: signupTab,
            carType: formData.vehicleName,
            vehicleNumber: formData.vehicleNumber,
            vehiclePhotoUrl: formData.vehiclePhoto,
            licensePhotoUrl: formData.licensePhoto,
          }),
        });
        if (signupTab === 'customer' && res.token) {
          onLogin({ ...res.user, token: res.token });
          toast.success(`${t('auth.register_btn')} ${t(`nav.${signupTab}`)}!`);
          onClose();
          navigate('/book');
        } else {
          toast.success(`${t('auth.register_btn')} ${t(`nav.${signupTab}`)}! Admin will verify soon.`);
          setIsLogin(true);
        }
      } catch (err) {
        toast.error(err.message || 'Registration failed');
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/95 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.97 }}
          className="glass-card w-full sm:max-w-lg p-5 sm:p-8 relative z-10 border-primary/20 shadow-xl rounded-t-[2rem] sm:rounded-[2rem] max-h-[95vh] overflow-y-auto custom-scrollbar"
        >
          <div className="w-10 h-1 bg-dark/20 rounded-full mx-auto mb-4 sm:hidden" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 text-muted hover:text-dark transition-colors p-2 bg-dark/5 rounded-xl border border-border"
          >
            <FaTimes />
          </button>

          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tighter mb-2 uppercase italic text-dark">
              {isLogin ? t('auth.login_title') : t('auth.signup_title')}
            </h2>
            <p className="text-muted text-sm">{isLogin ? t('auth.login_desc') : t('auth.signup_desc')}</p>
          </div>

          <div className="flex gap-2 mb-6 sm:mb-8 bg-dark/5 p-1.5 rounded-2xl border border-border overflow-x-auto custom-scrollbar">
            {(isLogin ? ['superadmin', 'admin', 'customer', 'driver'] : ['customer', 'driver']).map((r) => (
              <button
                key={r}
                onClick={() => (isLogin ? setRole(r) : setSignupTab(r))}
                className={`flex-1 min-w-[80px] py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all ${
                  (isLogin ? role === r : signupTab === r)
                    ? 'bg-primary text-dark shadow-lg shadow-primary/20'
                    : 'text-muted hover:text-dark'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm" />
                <input
                  type="text"
                  placeholder={t('auth.full_name')}
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field pl-12 text-sm"
                  required
                />
              </div>
            )}

            <div className="relative">
              <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm" />
              <input
                type="tel"
                placeholder={t('auth.phone')}
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-field pl-12 text-sm"
                required
              />
            </div>

            {!isLogin && (
              <div className="relative">
                <FaMapMarkerAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm" />
                <input
                  type="text"
                  placeholder={t('auth.location')}
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="input-field pl-12 text-sm"
                  required
                />
              </div>
            )}

            {!isLogin && signupTab === 'driver' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <FaCar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm" />
                    <input
                      type="text"
                      placeholder={t('auth.vehicle_name')}
                      value={formData.vehicleName || ''}
                      onChange={(e) => setFormData({ ...formData, vehicleName: e.target.value })}
                      className="input-field pl-10 text-sm"
                      required
                    />
                  </div>
                  <div className="relative">
                    <FaCar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm" />
                    <input
                      type="text"
                      placeholder={t('auth.vehicle_no')}
                      value={formData.vehicleNumber || ''}
                      onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                      className="input-field pl-10 text-sm"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="cursor-pointer group">
                    <div className="bg-dark/5 border border-dashed border-border rounded-2xl p-3 flex flex-col items-center justify-center gap-2 group-hover:border-primary/50 transition-all overflow-hidden relative h-20">
                      {formData.vehiclePhoto ? (
                        <img src={formData.vehiclePhoto} alt="Vehicle" className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <>
                          <FaCamera className="text-muted group-hover:text-primary text-sm" />
                          <span className="text-[9px] text-muted font-bold uppercase text-center">{t('auth.vehicle_photo')}</span>
                        </>
                      )}
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'vehiclePhoto')} />
                  </label>
                  <label className="cursor-pointer group">
                    <div className="bg-dark/5 border border-dashed border-border rounded-2xl p-3 flex flex-col items-center justify-center gap-2 group-hover:border-primary/50 transition-all overflow-hidden relative h-20">
                      {formData.licensePhoto ? (
                        <img src={formData.licensePhoto} alt="License" className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <>
                          <FaIdCard className="text-muted group-hover:text-primary text-sm" />
                          <span className="text-[9px] text-muted font-bold uppercase text-center">{t('auth.license_photo')}</span>
                        </>
                      )}
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'licensePhoto')} />
                  </label>
                </div>
              </>
            )}

            <div className="relative">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder={t('auth.password')}
                value={formData.password || ''}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input-field pl-12 pr-12 text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-dark focus:outline-none"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <button
              type="submit"
              className="w-full btn-primary py-4 mt-2 uppercase font-black tracking-[0.15em] text-sm shadow-lg shadow-primary/20"
            >
              {isLogin ? "LOGIN" : `${t('auth.register_btn')} ${signupTab}`}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-border pt-5">
            <p className="text-muted text-sm font-medium">
              {isLogin ? t('auth.no_account') : t('auth.have_account')}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary font-black hover:underline ml-1 uppercase text-xs tracking-widest"
              >
                {isLogin ? t('auth.signup_now') : t('auth.back_to_login')}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AuthModal;
