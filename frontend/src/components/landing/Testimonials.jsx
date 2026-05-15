import React from 'react';
import { motion } from 'framer-motion';
import { FaQuoteLeft, FaStar } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const Testimonials = () => {
  const { t } = useTranslation();

  const testimonials = [
    {
      name: "Rajesh Kumar",
      role: t('testimonials.sarpanch'),
      text: "SafarSetu has changed the way our village connects with the city. Reliable and safe for everyone.",
      rating: 5
    },
    {
      name: "Suman Devi",
      role: t('testimonials.traveler'),
      text: "I always use SafarSetu for my hospital visits to the city. The drivers are very polite and helpful.",
      rating: 5
    },
    {
      name: "Amit Singh",
      role: t('testimonials.business'),
      text: "The best service for business travelers in the area. Transparent pricing and always on time.",
      rating: 5
    }
  ];

  return (
    <section className="py-20 md:py-32 relative px-4 sm:px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 md:mb-24">
          <span className="text-primary font-bold uppercase tracking-[0.3em] text-xs">{t('testimonials.title')}</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mt-3 tracking-tighter uppercase italic text-dark">
            {t('testimonials.subtitle')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="glass-card p-8 relative"
            >
              <FaQuoteLeft className="text-primary/20 text-4xl absolute top-6 right-8" />
              <div className="flex gap-1 mb-6">
                {[...Array(item.rating)].map((_, i) => (
                  <FaStar key={i} className="text-primary text-sm" />
                ))}
              </div>
              <p className="text-muted italic mb-8 leading-relaxed">"{item.text}"</p>
              <div>
                <h4 className="font-bold text-dark">{item.name}</h4>
                <p className="text-xs text-muted uppercase tracking-widest font-bold mt-1">{item.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
