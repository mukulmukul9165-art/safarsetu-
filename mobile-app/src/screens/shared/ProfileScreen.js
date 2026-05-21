import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, StatusBar } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { COLORS } from '../../theme/colors';

export default function ProfileScreen() {
  const { user, logout } = useContext(AuthContext);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* ── CARD HEADER ── */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>{user?.role?.toUpperCase()}</Text>
        </View>
      </View>

      {/* ── USER METRICS / INFORMATION LIST ── */}
      <View style={styles.detailsCard}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Registered Phone</Text>
          <Text style={styles.detailValue}>{user?.phone}</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Account Role</Text>
          <Text style={styles.detailValue}>{user?.role}</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Induction Status</Text>
          <Text style={[styles.detailValue, { color: COLORS.success }]}>Active Verified</Text>
        </View>
      </View>

      {/* ── LOGOUT TRIGGER ── */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutButtonText}>LOGOUT FROM ACCOUNT</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 24,
    justifyContent: 'center',
  },
  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarText: {
    fontSize: 40,
  },
  name: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
    textAlign: 'center',
  },
  roleBadge: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 10,
  },
  roleBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  detailsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 30,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  detailValue: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '900',
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  logoutButton: {
    backgroundColor: COLORS.danger + '12',
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: COLORS.danger,
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
