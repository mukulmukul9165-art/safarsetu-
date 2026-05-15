import React from 'react';
import { motion } from 'framer-motion';
import { FaShieldAlt, FaClock, FaRoute, FaHeadset } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const Features = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: <FaShieldAlt />,
      title: t('features.safe_title'),
      desc: t('features.safe_desc')
    },
    {
      icon: <FaClock />,
      title: t('features.avail_title'),
      desc: t('features.avail_desc')
    },
    {
      icon: <FaRoute />,
      title: t('features.track_title'),
      desc: t('features.track_desc')
    },
    {
      icon: <FaHeadset />,
      title: t('features.support_title'),
      desc: t('features.support_desc')
    }
  ];

  return (
    <section className="py-20 bg-background relative px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-primary font-bold uppercase tracking-[0.3em] text-xs">{t('features.title')}</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mt-3 tracking-tighter uppercase italic text-dark">
            {t('features.subtitle')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="glass-card p-8 group hover:border-primary/30 transition-all duration-500"
            >
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary text-2xl mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-dark transition-all duration-500">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-dark">{feature.title}</h3>
              <p className="text-muted text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
