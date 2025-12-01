import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, StyleSheet, Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { onAuthStateChanged } from '../services/authService';
import LoginScreen from '../screens/Auth/LoginScreen';
import GetAccessScreen from '../screens/Auth/GetAccessScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import CasesListScreen from '../screens/Cases/CasesListScreen';
import AddCaseScreen from '../screens/Cases/AddCaseScreen';
import CaseDetailsScreen from '../screens/Cases/CaseDetailsScreen';
import AddHearingScreen from '../screens/Hearings/AddHearingScreen';
import DocumentViewerScreen from '../screens/Documents/DocumentViewerScreen';
import ClientsListScreen from '../screens/Clients/ClientsListScreen';
import AddClientScreen from '../screens/Clients/AddClientScreen';
import ClientDetailsScreen from '../screens/Clients/ClientDetailsScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import EditProfileScreen from '../screens/Settings/EditProfileScreen';
import ChangePasswordScreen from '../screens/Settings/ChangePasswordScreen';
import StorageManagementScreen from '../screens/Settings/StorageManagementScreen';
import SearchScreen from '../screens/Search/SearchScreen';
import ReportsScreen from '../screens/Reports/ReportsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const CasesStack = createNativeStackNavigator();
const ClientsStack = createNativeStackNavigator();
const SettingsStack = createNativeStackNavigator();

// Cases Stack Navigator (nested in Cases tab)
const CasesStackNavigator = () => {
    return (
        <CasesStack.Navigator screenOptions={{ headerShown: false }}>
            <CasesStack.Screen name="CasesList" component={CasesListScreen} />
            <CasesStack.Screen name="AddCase" component={AddCaseScreen} />
            <CasesStack.Screen name="CaseDetails" component={CaseDetailsScreen} />
            <CasesStack.Screen name="AddHearing" component={AddHearingScreen} />
            <CasesStack.Screen name="DocumentViewer" component={DocumentViewerScreen} />
        </CasesStack.Navigator>
    );
};

// Clients Stack Navigator (nested in Clients tab)
const ClientsStackNavigator = () => {
    return (
        <ClientsStack.Navigator screenOptions={{ headerShown: false }}>
            <ClientsStack.Screen name="ClientsList" component={ClientsListScreen} />
            <ClientsStack.Screen name="AddClient" component={AddClientScreen} />
            <ClientsStack.Screen name="ClientDetails" component={ClientDetailsScreen} />
        </ClientsStack.Navigator>
    );
};

// Settings Stack Navigator (nested in More tab)
const SettingsStackNavigator = () => {
    return (
        <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
            <SettingsStack.Screen name="Settings" component={SettingsScreen} />
            <SettingsStack.Screen name="EditProfile" component={EditProfileScreen} />
            <SettingsStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <SettingsStack.Screen name="StorageManagement" component={StorageManagementScreen} />
            <SettingsStack.Screen name="Reports" component={ReportsScreen} />
        </SettingsStack.Navigator>
    );
};

// Placeholder for upcoming screens
const PlaceholderScreen = () => (
    <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Coming Soon</Text>
    </View>
);

// Bottom Tab Navigator for main app screens
const MainTabs = () => {
    const insets = useSafeAreaInsets();
    const bottomPadding = Platform.OS === 'android' ? Math.max(insets.bottom, 10) : insets.bottom;

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#1E1E1E',
                    borderTopColor: '#333',
                    borderTopWidth: 1,
                    height: 60 + bottomPadding,
                    paddingBottom: 8 + bottomPadding,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: '#CD7F32',
                tabBarInactiveTintColor: '#666',
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                },
            }}
        >
            <Tab.Screen
                name="Home"
                component={DashboardScreen}
                options={{
                    tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🏠</Text>,
                }}
            />
            <Tab.Screen
                name="Cases"
                component={CasesStackNavigator}
                options={{
                    tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>📁</Text>,
                }}
            />
            <Tab.Screen
                name="Clients"
                component={ClientsStackNavigator}
                options={{
                    tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>👥</Text>,
                }}
            />
            <Tab.Screen
                name="More"
                component={SettingsStackNavigator}
                options={{
                    tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>⚙️</Text>,
                }}
            />
        </Tab.Navigator>
    );
};

const AppNavigator = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Listen to auth state changes
        const unsubscribe = onAuthStateChanged((authUser) => {
            setUser(authUser);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#CD7F32" />
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {user ? (
                    // User is logged in - show main app
                    <>
                        <Stack.Screen name="Main" component={MainTabs} />
                        <Stack.Screen name="Search" component={SearchScreen} />
                    </>
                ) : (
                    // User is not logged in - show auth screens
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="GetAccess" component={GetAccessScreen} />
                        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#121212',
    },
    loadingText: {
        color: '#FFFFFF',
        marginTop: 16,
        fontSize: 16,
    },
    placeholder: {
        flex: 1,
        backgroundColor: '#121212',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: '#666',
        fontSize: 18,
    },
});

export default AppNavigator;
