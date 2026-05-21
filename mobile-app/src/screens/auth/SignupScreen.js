import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { COLORS } from '../../theme/colors';

export default function SignupScreen({ navigation }) {
  const [role, setRole] = useState('CUSTOMER'); // CUSTOMER or DRIVER
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Driver fields
  const [carType, setCarType] = useState('Mini');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehiclePhotoUrl, setVehiclePhotoUrl] = useState('');
  const [licensePhotoUrl, setLicensePhotoUrl] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useContext(AuthContext);

  const handleSignup = async () => {
    setError('');
    if (!name || !phone || !password) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    if (role === 'DRIVER' && !vehicleNumber) {
      setError('Please enter your vehicle plate number.');
      return;
    }

    setLoading(true);
    const signUpData = {
      name,
      phone,
      password,
      role,
      ...(role === 'DRIVER' && {
        carType,
        vehicleNumber,
        vehiclePhotoUrl: vehiclePhotoUrl || null,
        licensePhotoUrl: licensePhotoUrl || null,
      }),
    };

    const result = await register(signUpData);
    setLoading(false);

    if (result.success) {
      if (role === 'DRIVER') {
        Alert.alert(
          'Registration Pending',
          'Your profile has been created successfully. SafarSetu admin will review and approve your documents soon!',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      }
    } else {
      setError(result.error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logoIcon}>🚖</Text>
          <Text style={styles.title}>SAFARSETU</Text>
          <Text style={styles.subtitle}>Register Premium Account</Text>
        </View>

        <View style={styles.formCard}>
          {/* Role selection tab */}
          <View style={styles.roleTabsContainer}>
            <TouchableOpacity
              style={[styles.roleTab, role === 'CUSTOMER' && styles.activeRoleTab]}
              onPress={() => setRole('CUSTOMER')}
            >
              <Text style={[styles.roleTabText, role === 'CUSTOMER' && styles.activeRoleTabText]}>
                CUSTOMER
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleTab, role === 'DRIVER' && styles.activeRoleTab]}
              onPress={() => setRole('DRIVER')}
            >
              <Text style={[styles.roleTabText, role === 'DRIVER' && styles.activeRoleTabText]}>
                DRIVER
              </Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Mukul Patidar"
              placeholderTextColor={COLORS.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. +919876543210"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="phone-pad"
              autoCapitalize="none"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Choose a strong password"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {/* DRIVER SPECIAL FIELDS */}
          {role === 'DRIVER' && (
            <View style={styles.driverSection}>
              <Text style={styles.sectionTitle}>Driver Documents & Vehicle Info</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Car Category</Text>
                <View style={styles.carTypeTabs}>
                  {['Mini', 'Sedan', 'SUV'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.carTypeTab, carType === type && styles.activeCarTypeTab]}
                      onPress={() => setCarType(type)}
                    >
                      <Text
                        style={[
                          styles.carTypeTabText,
                          carType === type && styles.activeCarTypeTabText,
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Vehicle Number (Plate)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. MP-10-CA-1234"
                  placeholderTextColor={COLORS.textMuted}
                  autoCapitalize="characters"
                  value={vehicleNumber}
                  onChangeText={setVehicleNumber}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Vehicle Photo URL</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Link to vehicle photo"
                  placeholderTextColor={COLORS.textMuted}
                  value={vehiclePhotoUrl}
                  onChangeText={setVehiclePhotoUrl}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Driver License Photo URL</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Link to license photo"
                  placeholderTextColor={COLORS.textMuted}
                  value={licensePhotoUrl}
                  onChangeText={setLicensePhotoUrl}
                />
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.signupButton} onPress={handleSignup} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.signupButtonText}>
                {role === 'DRIVER' ? 'APPLY AS DRIVER' : 'CREATE CUSTOMER ACCOUNT'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginText}>Login Here</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: StatusBar.currentHeight + 20 || 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoIcon: {
    fontSize: 48,
    marginBottom: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: '950',
    color: COLORS.text,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 24,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },
  roleTabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeRoleTab: {
    backgroundColor: COLORS.primary,
  },
  roleTabText: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.textMuted,
  },
  activeRoleTabText: {
    color: COLORS.white,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  driverSection: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 18,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.primaryDark,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  carTypeTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  carTypeTab: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeCarTypeTab: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(232, 179, 75, 0.08)',
  },
  carTypeTabText: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.textMuted,
  },
  activeCarTypeTabText: {
    color: COLORS.primaryDark,
  },
  signupButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  signupButtonText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  loginText: {
    fontSize: 13,
    color: COLORS.primaryDark,
    fontWeight: '900',
  },
});
