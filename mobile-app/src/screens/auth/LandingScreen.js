import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, Dimensions } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { COLORS } from '../../theme/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons'; // Assuming Expo vector icons

const { width } = Dimensions.get('window');

const CARS = [
  { id: '1', name: 'Van', price: 10, seats: 7, img: '🚐' },
  { id: '2', name: 'Echo', price: 12, seats: 5, img: '🚙' },
  { id: '3', name: 'Mini', price: 14, seats: 4, img: '🚕' },
  { id: '4', name: 'Sedan', price: 16, seats: 4, img: '🚗' },
  { id: '5', name: 'SUV', price: 18, seats: 6, img: '🚘' },
  { id: '6', name: 'Luxury', price: 25, seats: 4, img: '🏎️' },
];

export default function LandingScreen({ navigation }) {
  const { t, locale, changeLanguage } = useLanguage();
  const [showLangMenu, setShowLangMenu] = useState(false);

  const toggleLanguage = () => {
    const nextLang = locale === 'en' ? 'hi' : locale === 'hi' ? 'nimadi' : 'en';
    changeLanguage(nextLang);
  };

  const renderCarCard = ({ item }) => (
    <View style={styles.carCard}>
      <Text style={styles.carImg}>{item.img}</Text>
      <Text style={styles.carTitle}>{item.name}</Text>
      <Text style={styles.carPrice}>₹{item.price}<Text style={styles.perKm}>{t('cars.per_km')}</Text></Text>
      
      <View style={styles.carSpecs}>
        <View style={styles.specBox}>
          <Text style={styles.specLabel}>{t('cars.seats')}</Text>
          <Text style={styles.specVal}>{item.seats} {t('cars.person')}</Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.bookNowBtn}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.bookNowText}>{t('cars.book_now')}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.logoText}>SAFAR<Text style={styles.logoBold}>SETU</Text></Text>
          
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.langBtn} onPress={toggleLanguage}>
              <Ionicons name="globe-outline" size={18} color={COLORS.text} />
              <Text style={styles.langText}>
                {locale === 'en' ? 'EN' : locale === 'hi' ? 'हिं' : 'निम'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.loginBtn}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginText}>{t('nav.login')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.signupBtn}
              onPress={() => navigation.navigate('Signup')}
            >
              <Text style={styles.signupText}>{t('nav.signup')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* HERO SECTION */}
        <View style={styles.heroSection}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{t('hero.badge')}</Text>
          </View>
          
          <Text style={styles.heroTitle}>{t('hero.title')}</Text>
          <Text style={styles.heroDesc}>{t('hero.desc')}</Text>
          
          <View style={styles.heroButtons}>
            <TouchableOpacity 
              style={styles.primaryBtn}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.primaryBtnText}>{t('hero.book_btn')}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>500+</Text>
              <Text style={styles.statLabel}>{t('hero.stat_drivers')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>10K+</Text>
              <Text style={styles.statLabel}>{t('hero.stat_users')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>50+</Text>
              <Text style={styles.statLabel}>{t('hero.stat_cities')}</Text>
            </View>
          </View>
          
          {/* Hero Car Image */}
          <View style={styles.heroImageWrapper}>
            <Image
              source={require('../../../assets/hero-car.jpg')}
              style={styles.heroImage}
              resizeMode="cover"
            />
            {/* Subtle bottom fade overlay */}
            <View style={styles.heroImageOverlay} />
          </View>
        </View>

        {/* VEHICLES SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionSubtitle}>{t('cars.fleet_subtitle')}</Text>
          <Text style={styles.sectionTitle}>{t('cars.fleet_title')}</Text>
          <Text style={styles.sectionDesc}>{t('cars.desc')}</Text>
          
          <FlatList
            data={CARS}
            keyExtractor={(item) => item.id}
            renderItem={renderCarCard}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carList}
          />
        </View>

        {/* SPECIALTIES SECTION */}
        <View style={[styles.section, { backgroundColor: '#F0EBE1', marginHorizontal: -20, paddingHorizontal: 20 }]}>
          <Text style={[styles.sectionSubtitle, { textAlign: 'center' }]}>{t('features.subtitle')}</Text>
          <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>{t('features.title')}</Text>
          
          <View style={styles.grid}>
            <View style={styles.featureCard}>
              <Ionicons name="shield-checkmark" size={24} color={COLORS.primary} />
              <Text style={styles.featureTitle}>{t('features.safe_title')}</Text>
              <Text style={styles.featureDesc}>{t('features.safe_desc')}</Text>
            </View>
            <View style={styles.featureCard}>
              <Ionicons name="time" size={24} color={COLORS.primary} />
              <Text style={styles.featureTitle}>{t('features.avail_title')}</Text>
              <Text style={styles.featureDesc}>{t('features.avail_desc')}</Text>
            </View>
            <View style={styles.featureCard}>
              <Ionicons name="location" size={24} color={COLORS.primary} />
              <Text style={styles.featureTitle}>{t('features.track_title')}</Text>
              <Text style={styles.featureDesc}>{t('features.track_desc')}</Text>
            </View>
            <View style={styles.featureCard}>
              <Ionicons name="headset" size={24} color={COLORS.primary} />
              <Text style={styles.featureTitle}>{t('features.support_title')}</Text>
              <Text style={styles.featureDesc}>{t('features.support_desc')}</Text>
            </View>
          </View>
        </View>

        {/* MISSION & VISION */}
        <View style={styles.section}>
          <Text style={[styles.sectionSubtitle, { textAlign: 'center' }]}>ABOUT</Text>
          <Text style={[styles.sectionTitle, { textAlign: 'center', marginBottom: 20 }]}>SAFE RIDES FROM VILLAGES TO CITIES</Text>
          
          <View style={styles.missionCard}>
            <Text style={styles.missionTitle}>{t('about_section.mission_title')}</Text>
            <Text style={styles.missionDesc}>{t('about_section.mission_desc')}</Text>
          </View>
          
          <View style={styles.missionCard}>
            <Text style={styles.missionTitle}>{t('about_section.vision_title')}</Text>
            <Text style={styles.missionDesc}>{t('about_section.vision_desc')}</Text>
          </View>
        </View>

        {/* REVIEWS */}
        <View style={styles.section}>
          <Text style={[styles.sectionSubtitle, { textAlign: 'center' }]}>{t('testimonials.subtitle')}</Text>
          <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>{t('testimonials.title')}</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewsScroll}>
            <View style={styles.reviewCard}>
              <Text style={styles.stars}>⭐⭐⭐⭐⭐</Text>
              <Text style={styles.reviewText}>"SafarSetu has changed how we travel. Safe, affordable and always on time."</Text>
              <Text style={styles.reviewerName}>Ramesh Kumar</Text>
              <Text style={styles.reviewerRole}>{t('testimonials.sarpanch')}</Text>
            </View>
            <View style={styles.reviewCard}>
              <Text style={styles.stars}>⭐⭐⭐⭐⭐</Text>
              <Text style={styles.reviewText}>"Best cab service in our area. The drivers are very polite."</Text>
              <Text style={styles.reviewerName}>Suman Devi</Text>
              <Text style={styles.reviewerRole}>{t('testimonials.traveler')}</Text>
            </View>
          </ScrollView>
        </View>

        {/* CONTACT & FOOTER */}
        <View style={styles.footer}>
          <View style={styles.contactCard}>
            <View style={styles.contactIconWrapper}>
              <Ionicons name="call" size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.contactTitle}>{t('contact.title')}</Text>
            <Text style={styles.contactDesc}>{t('contact.desc')}</Text>
            
            <View style={styles.contactBtns}>
              <TouchableOpacity style={styles.callBtn}>
                <Ionicons name="call" size={18} color={COLORS.text} style={{marginRight: 8}}/>
                <Text style={styles.callBtnText}>{t('contact.call_btn')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.waBtn}>
                <Ionicons name="logo-whatsapp" size={18} color="#059669" style={{marginRight: 8}}/>
                <Text style={styles.waBtnText}>{t('contact.whatsapp_btn')}</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <Text style={styles.copyright}>{t('footer.copyright')}</Text>
          <Text style={styles.madeWith}>{t('footer.made_with')}</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '400',
    color: COLORS.text,
  },
  logoBold: {
    fontWeight: '900',
    color: COLORS.primary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 10,
    backgroundColor: COLORS.card,
  },
  langText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
    color: COLORS.text,
  },
  loginBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  loginText: {
    fontWeight: '700',
    color: COLORS.text,
  },
  signupBtn: {
    backgroundColor: COLORS.text,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  signupText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  heroSection: {
    marginBottom: 40,
  },
  badge: {
    backgroundColor: '#FDE68A',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  badgeText: {
    color: '#92400E',
    fontWeight: 'bold',
    fontSize: 12,
  },
  heroTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: COLORS.text,
    lineHeight: 48,
    marginBottom: 16,
  },
  heroDesc: {
    fontSize: 16,
    color: COLORS.textMuted,
    lineHeight: 24,
    marginBottom: 24,
  },
  heroButtons: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
  },
  primaryBtnText: {
    fontWeight: 'bold',
    color: COLORS.text,
    fontSize: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statItem: {
    alignItems: 'flex-start',
  },
  statNum: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  heroImagePlaceholder: {
    height: 200,
    backgroundColor: '#E5E0D5',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImageText: {
    fontSize: 20,
    color: COLORS.textMuted,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 40,
    paddingVertical: 10,
  },
  sectionSubtitle: {
    color: COLORS.primaryDark,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 12,
  },
  sectionDesc: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
    marginBottom: 20,
  },
  carList: {
    paddingRight: 20,
  },
  carCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    width: width * 0.45,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  carImg: {
    fontSize: 48,
    textAlign: 'center',
    marginVertical: 10,
  },
  carTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  carPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primaryDark,
    marginBottom: 12,
  },
  perKm: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: 'normal',
  },
  carSpecs: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    marginBottom: 16,
  },
  specBox: {
    alignItems: 'flex-start',
  },
  specLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  specVal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  bookNowBtn: {
    backgroundColor: '#F5F1EA',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookNowText: {
    fontWeight: 'bold',
    fontSize: 12,
    color: COLORS.text,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  featureCard: {
    width: '48%',
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 8,
  },
  featureDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  missionCard: {
    backgroundColor: COLORS.card,
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  missionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primaryDark,
    marginBottom: 12,
  },
  missionDesc: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 22,
  },
  reviewsScroll: {
    marginTop: 10,
  },
  reviewCard: {
    width: width * 0.7,
    backgroundColor: COLORS.card,
    padding: 20,
    borderRadius: 16,
    marginRight: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stars: {
    marginBottom: 12,
  },
  reviewText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: 16,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  reviewerRole: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  footer: {
    backgroundColor: '#EBE5D8',
    marginHorizontal: -20,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 30,
    alignItems: 'center',
  },
  contactCard: {
    backgroundColor: COLORS.card,
    width: '100%',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  contactIconWrapper: {
    backgroundColor: '#FDE68A',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  contactTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 10,
  },
  contactDesc: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  contactBtns: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  callBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 12,
    alignItems: 'center',
  },
  callBtnText: {
    fontWeight: 'bold',
    color: COLORS.text,
  },
  waBtn: {
    flexDirection: 'row',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  waBtnText: {
    fontWeight: 'bold',
    color: '#065F46',
  },
  copyright: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  madeWith: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: 'bold',
  },

  // Hero Car Image
  heroImageWrapper: {
    marginTop: 28,
    marginHorizontal: -24,
    borderRadius: 28,
    overflow: 'hidden',
    height: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'rgba(245, 241, 234, 0.45)',
  },
});
