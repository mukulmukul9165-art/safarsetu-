import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaWhatsapp, FaPhoneAlt, FaMapMarkerAlt, FaShieldAlt, FaClock, FaUsers } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const PlaceholderPage = ({ title }) => {
  const { t } = useTranslation();
  const isAbout = title.toLowerCase().includes('about');
  const isContact = title.toLowerCase().includes('contact');

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  if (isAbout) {
    return (
      <div className="pt-24 pb-32 min-h-screen bg-background px-4 sm:px-6">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-12">
            <span className="text-primary font-bold uppercase tracking-[0.3em] text-xs">{t('nav.about')}</span>
            <h1 className="text-4xl sm:text-5xl font-black mt-4 italic uppercase tracking-tighter text-dark">
              {t('hero.title').split(' ').map((word, i) => (
                <span key={i} className={word.toLowerCase() === 'bharat' || word.toLowerCase() === 'india' ? 'text-primary' : ''}>
                  {word}{' '}
                </span>
              ))}
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <motion.div variants={itemVariants} className="glass-card p-8">
              <h3 className="text-xl font-bold mb-4 text-primary">{t('about_section.mission_title')}</h3>
              <p className="text-muted leading-relaxed text-sm">
                {t('about_section.mission_desc')}
              </p>
            </motion.div>
            <motion.div variants={itemVariants} className="glass-card p-8">
              <h3 className="text-xl font-bold mb-4 text-primary">{t('about_section.vision_title')}</h3>
              <p className="text-muted leading-relaxed text-sm">
                {t('about_section.vision_desc')}
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
            {[
              { icon: <FaShieldAlt />, title: t('features.safe_title'), desc: t('features.safe_desc') },
              { icon: <FaClock />, title: t('features.avail_title'), desc: t('features.avail_desc') },
              { icon: <FaUsers />, title: t('testimonials.traveler'), desc: t('features.support_desc') }
            ].map((feature, i) => (
              <motion.div key={i} variants={itemVariants} className="text-center p-6 bg-dark/5 rounded-[2rem] border border-border">
                <div className="text-3xl text-primary mb-4 flex justify-center">{feature.icon}</div>
                <h4 className="font-bold mb-2 text-dark">{feature.title}</h4>
                <p className="text-[10px] text-muted uppercase font-bold tracking-widest">{feature.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <Link to="/" className="inline-flex items-center gap-2 btn-primary px-8 py-4 font-black uppercase tracking-widest text-sm">
              <FaArrowLeft /> {t('hero.book_btn')}
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isContact) {
    return (
      <div className="pt-24 pb-32 min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-lg w-full text-center"
        >
          <div className="glass-card p-8 sm:p-12 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-[80px]" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/5 rounded-full blur-[80px]" />

            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8 text-primary text-4xl shadow-xl shadow-primary/5">
              <FaPhoneAlt />
            </div>

            <h1 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter mb-4 text-dark">
              {t('contact.title').split(' ').map((word, i) => (
                <span key={i} className={i === t('contact.title').split(' ').length - 1 ? 'text-primary' : ''}>
                  {word}{' '}
                </span>
              ))}
            </h1>
            <p className="text-muted text-sm mb-10">
              {t('contact.desc')}
            </p>

            <div className="space-y-4">
              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href="tel:+916261828036"
                className="flex items-center justify-center gap-4 bg-primary text-dark py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-primary/20"
              >
                <FaPhoneAlt className="text-xl" />
                {t('contact.call_btn')}
              </motion.a>

              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href="https://wa.me/916261828036?text=Hello%20SafarSetu,%20I%20have%20a%20query%20regarding%20a%20booking."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-4 bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-[#25D366] hover:text-white transition-all"
              >
                <FaWhatsapp className="text-2xl" />
                {t('contact.whatsapp_btn')}
              </motion.a>
            </div>

            <div className="mt-10 pt-10 border-t border-border flex items-center justify-center gap-3 text-muted">
              <FaMapMarkerAlt className="text-primary" />
              <p className="text-xs font-bold uppercase tracking-widest">{t('contact.routes')}</p>
            </div>
          </div>

          <Link to="/" className="mt-8 inline-flex items-center gap-2 text-muted hover:text-primary transition-all uppercase text-[10px] font-black tracking-widest">
            <FaArrowLeft /> {t('contact.back_home')}
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-32 min-h-screen bg-background flex items-center justify-center px-4 text-center">
      <div className="glass-card p-12 max-w-md w-full">
        <h1 className="text-2xl font-black uppercase mb-4 italic tracking-tighter text-dark">{title}</h1>
        <p className="text-muted text-sm mb-8">{t('admin.page_under_dev')}</p>
        <Link to="/" className="btn-primary">{t('admin.back_home')}</Link>
      </div>
    </div>
  );
};

export default PlaceholderPage;
