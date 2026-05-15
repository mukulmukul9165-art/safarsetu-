import React from 'react';
import Hero from '../../components/landing/Hero';
import Cars from '../../components/landing/Cars';
import Features from '../../components/landing/Features';
import AboutSection from '../../components/landing/AboutSection';
import Testimonials from '../../components/landing/Testimonials';
import ContactSection from '../../components/landing/ContactSection';
import Footer from '../../components/landing/Footer';

const LandingPage = ({ user, setIsAuthOpen }) => {
  const scrollToCars = () => {
    const carsSection = document.getElementById('cars-section');
    if (carsSection) {
      carsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-secondary min-h-screen">
      <Hero user={user} setIsAuthOpen={setIsAuthOpen} onExploreCars={scrollToCars} />
      <div id="cars-section">
        <Cars user={user} setIsAuthOpen={setIsAuthOpen} />
      </div>
      <Features />
      <AboutSection />
      <Testimonials />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default LandingPage;
