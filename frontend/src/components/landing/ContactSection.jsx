import React from 'react';
import { motion } from 'framer-motion';
import { FaWhatsapp, FaPhoneAlt, FaMapMarkerAlt } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const ContactSection = () => {
  const { t } = useTranslation();

  return (
    <section className="py-20 bg-background relative px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-primary font-bold uppercase tracking-[0.3em] text-xs">{t('contact.support_help')}</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mt-3 tracking-tighter uppercase italic text-dark">
            {t('contact.ready_to_ride')} <span className="text-primary">{t('contact.contact_us_highlight')}</span>
          </h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card p-8 sm:p-12 relative overflow-hidden text-center"
        >
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-[80px]" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/5 rounded-full blur-[80px]" />

          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8 text-primary text-4xl shadow-xl shadow-primary/5">
            <FaPhoneAlt />
          </div>

          <h3 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter mb-4 text-dark">
            {t('contact.title')}
          </h3>
          <p className="text-muted text-sm mb-10 max-w-md mx-auto">
            {t('contact.desc')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
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
        </motion.div>
      </div>
    </section>
  );
};

export default ContactSection;
