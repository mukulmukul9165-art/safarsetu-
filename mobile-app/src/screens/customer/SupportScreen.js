import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  StatusBar,
} from 'react-native';
import { COLORS } from '../../theme/colors';

export default function SupportScreen() {
  const handleCallHelpdesk = () => {
    const phoneNumber = 'tel:+916261828036';
    Linking.canOpenURL(phoneNumber)
      .then((supported) => {
        if (!supported) {
          Alert.alert('Not Supported', 'Phone calling is not supported on this device.');
        } else {
          return Linking.openURL(phoneNumber);
        }
      })
      .catch((err) => console.error('An error occurred opening phone dialer', err));
  };

  const handleIssueSelect = (category) => {
    Alert.alert(
      category,
      `Your query regarding ${category.toLowerCase()} has been logged. Our elite concierge team will contact you within 5 minutes.`,
      [{ text: 'Thank You' }]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* ── HERO BANNER ── */}
      <View style={styles.heroCard}>
        <View style={styles.iconCircle}>
          <Text style={styles.heroIcon}>🎧</Text>
        </View>
        <Text style={styles.heroTitle}>SafarSetu Concierge</Text>
        <Text style={styles.heroSubtitle}>
          24/7 premium support for our elite riders. Your comfort and safety is our top priority.
        </Text>
      </View>

      {/* ── QUICK SELECTIONS ── */}
      <Text style={styles.sectionHeader}>Select Category of Concern</Text>

      <TouchableOpacity
        style={styles.issueCard}
        onPress={() => handleIssueSelect('Ride Issues')}
      >
        <View style={styles.issueHeader}>
          <Text style={styles.issueIcon}>📍</Text>
          <Text style={styles.issueTitle}>Ride & Navigation Issues</Text>
        </View>
        <Text style={styles.issueDesc}>
          Issues regarding driver behavior, route discrepancies, delay, safety concerns, or vehicle condition.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.issueCard}
        onPress={() => handleIssueSelect('Payment & Wallet Issues')}
      >
        <View style={styles.issueHeader}>
          <Text style={styles.issueIcon}>💳</Text>
          <Text style={styles.issueTitle}>Payment & Wallet Issues</Text>
        </View>
        <Text style={styles.issueDesc}>
          Incorrect fares, wallet top-up failures, double charges, coupon application problems, or refunds.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.issueCard}
        onPress={() => handleIssueSelect('Account & App Feedback')}
      >
        <View style={styles.issueHeader}>
          <Text style={styles.issueIcon}>👤</Text>
          <Text style={styles.issueTitle}>Account & App Feedback</Text>
        </View>
        <Text style={styles.issueDesc}>
          Change profile details, update verification documents, report app crashes, or suggest general improvements.
        </Text>
      </TouchableOpacity>

      {/* ── PHONE CALL BUTTON ── */}
      <TouchableOpacity
        style={styles.callButton}
        onPress={handleCallHelpdesk}
      >
        <Text style={styles.callButtonIcon}>📞</Text>
        <Text style={styles.callButtonText}>CALL ELITE HELPDESK</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.02,
    shadowRadius: 15,
    elevation: 3,
    marginBottom: 28,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(232, 179, 75, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroIcon: {
    fontSize: 32,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '600',
    paddingHorizontal: 8,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    marginLeft: 4,
  },
  issueCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  issueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  issueIcon: {
    fontSize: 20,
  },
  issueTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.text,
  },
  issueDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
    fontWeight: '500',
    marginLeft: 32,
  },
  callButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  callButtonIcon: {
    fontSize: 18,
    color: COLORS.white,
  },
  callButtonText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
