import React from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaRoute } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Hero = ({ user, setIsAuthOpen, onExploreCars }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const handleBookClick = () => {
    if (user) {
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'driver') navigate('/driver');
      else navigate('/book');
    } else {
      setIsAuthOpen(true);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] md:w-[600px] md:h-[600px] bg-primary/20 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-primary/10 rounded-full blur-[100px] -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center py-8 lg:py-0">
        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center lg:text-left"
        >
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-4 md:mb-6"
          >
            {t('hero.badge')}
          </motion.span>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black leading-tight mb-4 md:mb-6 tracking-tighter">
            {i18n.language === 'hi' ? (
              <>गांवों से शहरों <br /> तक <span className="text-primary italic">सुरक्षित सफर</span></>
            ) : i18n.language === 'nimadi' ? (
              <>गांव से लगाई ना शहर <br /> तक <span className="text-primary italic">सुरक्षित सफर</span></>
            ) : (
              <>Safe Rides <br /> from <span className="text-primary italic">Villages to Cities</span></>
            )}
          </h1>

          <p className="text-muted text-sm md:text-base lg:text-lg mb-8 md:mb-10 max-w-lg leading-relaxed mx-auto lg:mx-0">
            {t('hero.desc')}
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-5 justify-center lg:justify-start">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBookClick}
              className="btn-primary w-full sm:w-auto px-10 py-5 text-sm uppercase tracking-widest font-black"
            >
              {t('hero.book_btn')}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onExploreCars}
              className="btn-outline w-full sm:w-auto px-10 py-5 text-sm uppercase tracking-widest font-black"
            >
              {t('hero.explore_btn')}
            </motion.button>
          </div>

          <div className="mt-10 md:mt-16 flex gap-8 md:gap-10 justify-center lg:justify-start">
            {[
              { label: t('hero.stat_drivers'), value: '500+' },
              { label: t('hero.stat_users'), value: '10K+' },
              { label: t('hero.stat_cities'), value: '50+' }
            ].map((stat, i) => (
              <div key={i}>
                <h4 className="text-2xl md:text-3xl font-black text-dark">{stat.value}</h4>
                <p className="text-[10px] text-muted uppercase font-bold tracking-widest mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="relative mt-6 lg:mt-0"
        >
          <div className="relative z-10 group px-4 sm:px-8 lg:px-0">
            <img
              src="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=1000"
              alt="SUV"
              className="rounded-[2rem] md:rounded-[3rem] shadow-2xl border border-border group-hover:border-primary/30 transition-all duration-500 w-full object-cover aspect-[4/3] lg:aspect-auto lg:h-[500px]"
            />

            {/* Floating Cards */}
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -top-6 md:-top-10 -right-2 md:-right-5 glass-card p-3 md:p-5 hidden sm:block"
            >
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-9 h-9 md:w-12 md:h-12 bg-green-500/10 rounded-xl md:rounded-2xl flex items-center justify-center text-green-600 text-base md:text-xl">
                  <FaCheckCircle />
                </div>
                <div>
                  <p className="text-[9px] md:text-[10px] text-muted uppercase font-bold">Status</p>
                  <p className="text-xs md:text-sm font-bold text-dark">{t('hero.status_arriving')}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 15, 0] }}
              transition={{ duration: 5, repeat: Infinity, delay: 1 }}
              className="absolute -bottom-6 md:-bottom-10 -left-2 md:-left-5 glass-card p-3 md:p-6 hidden sm:block"
            >
              <div className="flex items-center gap-3 md:gap-5">
                <div className="p-3 md:p-4 bg-primary/10 rounded-xl md:rounded-2xl text-primary text-lg md:text-2xl">
                  <FaRoute />
                </div>
                <div>
                  <p className="text-[9px] md:text-[10px] text-muted uppercase font-bold">{t('hero.status_best_price')}</p>
                  <p className="text-xl md:text-2xl font-black text-dark">₹12<span className="text-xs md:text-sm text-muted">{t('cars.per_km')}</span></p>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] border border-primary/5 rounded-full -z-10 animate-spin-slow" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] h-[130%] border border-primary/5 rounded-full -z-10 animate-reverse-spin-slow" />
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
