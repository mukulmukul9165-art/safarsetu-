import React from 'react';
import { FaCarSide, FaFacebook, FaTwitter, FaInstagram, FaYoutube } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-background pt-20 pb-10 border-t border-border px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-20">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <FaCarSide className="text-dark text-sm" />
              </div>
              <span className="text-lg font-bold tracking-tighter uppercase text-dark">
                Safar<span className="text-primary">Setu</span>
              </span>
            </div>
            <p className="text-muted text-sm leading-relaxed max-w-xs">
              {t('footer.desc')}
            </p>
            <div className="flex gap-4">
              {[FaFacebook, FaTwitter, FaInstagram, FaYoutube].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-xl bg-dark/5 border border-border flex items-center justify-center text-muted hover:text-primary hover:border-primary transition-all">
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-6 uppercase tracking-widest text-xs text-primary">{t('footer.quick_links')}</h4>
            <ul className="space-y-4 text-sm text-muted">
              <li><a href="#" className="hover:text-dark transition-colors">{t('nav.home')}</a></li>
              <li><a href="#" className="hover:text-dark transition-colors">{t('nav.about')}</a></li>
              <li><a href="#" className="hover:text-dark transition-colors">{t('nav.contact')}</a></li>
              <li><a href="#" className="hover:text-dark transition-colors">{t('nav.login')}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 uppercase tracking-widest text-xs text-primary">{t('footer.company')}</h4>
            <ul className="space-y-4 text-sm text-muted">
              <li><a href="#" className="hover:text-dark transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-dark transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-dark transition-colors">Driver Agreement</a></li>
              <li><a href="#" className="hover:text-dark transition-colors">Refund Policy</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 uppercase tracking-widest text-xs text-primary">{t('footer.newsletter')}</h4>
            <p className="text-muted text-sm mb-6">{t('footer.newsletter_desc')}</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder={t('footer.email_placeholder')}
                className="bg-dark/5 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary w-full text-dark placeholder:text-muted/50"
              />
              <button className="bg-primary text-dark font-bold px-6 py-3 rounded-xl hover:scale-105 transition-all text-sm uppercase tracking-widest">
                {t('footer.join_btn')}
              </button>
            </div>
          </div>
        </div>

        <div className="pt-10 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <p className="text-muted text-xs font-bold uppercase tracking-widest">
            {t('footer.copyright')}
          </p>
          <p className="text-muted text-xs font-bold uppercase tracking-widest">
            {t('footer.made_with')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
