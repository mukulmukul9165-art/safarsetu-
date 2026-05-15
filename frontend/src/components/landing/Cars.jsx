import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api.js';

const Cars = ({ user, setIsAuthOpen }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api('/api/catalog/cars');
        if (!cancelled) setCars(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setCars([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
    <section className="py-16 md:py-24 lg:py-32 relative px-4 sm:px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 md:mb-16 lg:mb-20 gap-4 md:gap-6">
          <div>
            <span className="text-primary font-bold uppercase tracking-[0.3em] text-xs">{t('cars.fleet_title')}</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mt-3 tracking-tighter">
              {t('cars.fleet_subtitle')}
            </h2>
          </div>
          <p className="text-muted max-w-sm text-sm md:text-base leading-relaxed">
            {t('cars.desc')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-8">
          {cars.map((car, index) => (
            <motion.div
              key={car.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -10 }}
              className="glass-card p-5 md:p-8 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-28 h-28 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all" />

              <div className="relative z-10">
                <div className="h-36 md:h-44 flex items-center justify-center mb-5 md:mb-8">
                  <motion.img
                    src={car.image}
                    alt={car.name}
                    className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-110"
                  />
                </div>

                <div className="mb-4 md:mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl md:text-2xl font-black text-dark">{car.name}</h3>
                    <span className="px-2 py-1 bg-dark/5 rounded-lg text-[10px] uppercase font-bold text-muted">{car.type}</span>
                  </div>
                  <p className="text-primary text-xl md:text-2xl font-black">
                    ₹{car.pricePerKm}<span className="text-xs text-muted">{t('cars.per_km')}</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 md:gap-3 mb-5 md:mb-8">
                  <div className="bg-dark/5 rounded-xl md:rounded-2xl p-2.5 md:p-3 border border-border">
                    <p className="text-[9px] md:text-[10px] text-muted uppercase font-bold">{t('cars.seats')}</p>
                    <p className="text-xs md:text-sm font-bold mt-0.5 text-dark">{car.seats} {t('cars.person')}</p>
                  </div>
                  <div className="bg-dark/5 rounded-xl md:rounded-2xl p-2.5 md:p-3 border border-border">
                    <p className="text-[9px] md:text-[10px] text-muted uppercase font-bold">{t('cars.arrival')}</p>
                    <p className="text-xs md:text-sm font-bold mt-0.5 text-dark">{car.eta}</p>
                  </div>
                </div>

                <button
                  onClick={handleBookClick}
                  className="w-full py-3 md:py-4 bg-dark/5 rounded-xl md:rounded-2xl font-bold transition-all group-hover:bg-primary group-hover:text-dark border border-border group-hover:border-transparent text-sm uppercase tracking-widest text-dark"
                >
                  {t('cars.book_now')}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Cars;
