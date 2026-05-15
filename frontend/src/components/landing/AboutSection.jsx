import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const AboutSection = () => {
  const { t } = useTranslation();

  return (
    <section className="py-20 bg-background relative px-4 sm:px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-primary font-bold uppercase tracking-[0.3em] text-xs">{t('nav.about')}</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mt-3 tracking-tighter uppercase italic text-dark">
            {t('hero.title').split(' ').map((word, i) => (
              <span key={i} className={word.toLowerCase() === 'bharat' || word.toLowerCase() === 'india' ? 'text-primary' : ''}>
                {word}{' '}
              </span>
            ))}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card p-8 md:p-12"
          >
            <h3 className="text-2xl font-black mb-6 text-primary uppercase italic tracking-tight">{t('about_section.mission_title')}</h3>
            <p className="text-muted leading-relaxed text-base">
              {t('about_section.mission_desc')}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card p-8 md:p-12"
          >
            <h3 className="text-2xl font-black mb-6 text-primary uppercase italic tracking-tight">{t('about_section.vision_title')}</h3>
            <p className="text-muted leading-relaxed text-base">
              {t('about_section.vision_desc')}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
