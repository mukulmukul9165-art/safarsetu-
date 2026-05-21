import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { COLORS } from '../theme/colors';

// Auth Screens
import LandingScreen from '../screens/auth/LandingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';

// Customer Screens
import CustomerDashboard from '../screens/customer/CustomerDashboard';
import BookRideScreen from '../screens/customer/BookRideScreen';
import LiveTrackingScreen from '../screens/customer/LiveTrackingScreen';
import AdminMapScreen from '../screens/admin/AdminMapScreen';

// Driver Screens
import DriverDashboard from '../screens/driver/DriverDashboard';

// Admin Screens
import AdminDashboard from '../screens/admin/AdminDashboard';

// Shared Screens
import ProfileScreen from '../screens/shared/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Premium Tab Bar Custom Style Helper
const TabBarIcon = ({ text, focused }) => (
  <View style={styles.tabIconContainer}>
    <Text style={[styles.tabIcon, { color: focused ? COLORS.primary : COLORS.textMuted }]}>
      {text}
    </Text>
  </View>
);

// ── CUSTOMER FLOW ──
function CustomerTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.border,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: COLORS.background,
          borderBottomColor: COLORS.border,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: COLORS.text,
        headerTitleStyle: {
          fontWeight: '900',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={CustomerDashboard}
        options={{
          title: 'SafarSetu',
          tabBarIcon: ({ focused }) => <TabBarIcon text="🚖" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="BookRide"
        component={BookRideScreen}
        options={{
          title: 'Book Ride',
          tabBarIcon: ({ focused }) => <TabBarIcon text="📍" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabBarIcon text="👤" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

const CustomerNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: COLORS.card, borderBottomColor: COLORS.border },
      headerTintColor: COLORS.text,
      headerTitleStyle: { fontWeight: '900' },
    }}
  >
    <Stack.Screen
      name="CustomerHome"
      component={CustomerTabNavigator}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="LiveTracking"
      component={LiveTrackingScreen}
      options={{ title: 'Live Route View' }}
    />
  </Stack.Navigator>
);

// ── DRIVER FLOW ──
function DriverTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.border,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: COLORS.background,
          borderBottomColor: COLORS.border,
        },
        headerTintColor: COLORS.text,
        headerTitleStyle: { fontWeight: '900' },
      }}
    >
      <Tab.Screen
        name="DriverHome"
        component={DriverDashboard}
        options={{
          title: 'Active Jobs',
          tabBarIcon: ({ focused }) => <TabBarIcon text="💼" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabBarIcon text="👤" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

const DriverNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: COLORS.card, borderBottomColor: COLORS.border },
      headerTintColor: COLORS.text,
      headerTitleStyle: { fontWeight: '900' },
    }}
  >
    <Stack.Screen
      name="DriverHomeTabs"
      component={DriverTabNavigator}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="LiveTracking"
      component={LiveTrackingScreen}
      options={{ title: 'Live Route View' }}
    />
  </Stack.Navigator>
);

// ── ADMIN FLOW ──
function AdminTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.border,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: COLORS.background,
          borderBottomColor: COLORS.border,
        },
        headerTintColor: COLORS.text,
        headerTitleStyle: { fontWeight: '900' },
      }}
    >
      <Tab.Screen
        name="AdminHome"
        component={AdminDashboard}
        options={{
          title: 'Admin Fleet',
          tabBarIcon: ({ focused }) => <TabBarIcon text="⚙️" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabBarIcon text="👤" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

const AdminNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: COLORS.card, borderBottomColor: COLORS.border },
      headerTintColor: COLORS.text,
      headerTitleStyle: { fontWeight: '900' },
    }}
  >
    <Stack.Screen
      name="AdminHomeTabs"
      component={AdminTabNavigator}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="AdminMap"
      component={AdminMapScreen}
      options={{ title: 'Booking Map' }}
    />
  </Stack.Navigator>
);

// ── MAIN SWITCHER NAVIGATOR ──
export default function AppNavigator() {
  const { user, token } = useContext(AuthContext);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!token ? (
        // Auth Stack
        <>
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </>
      ) : (
        // Role-Based Authenticated Stack
        <>
          {user?.role === 'customer' && (
            <Stack.Screen name="CustomerRoot" component={CustomerNavigator} />
          )}
          {user?.role === 'driver' && (
            <Stack.Screen name="DriverRoot" component={DriverNavigator} />
          )}
          {user?.role === 'admin' && (
            <Stack.Screen name="AdminRoot" component={AdminNavigator} />
          )}
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 22,
  },
});
