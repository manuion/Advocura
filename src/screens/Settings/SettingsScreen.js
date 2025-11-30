import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCurrentUser, getUserProfile, signOut } from '../../services/authService';

const SettingsScreen = ({ navigation }) => {
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        const user = getCurrentUser();
        if (user) {
            const result = await getUserProfile(user.uid);
            if (result.success) {
                setUserProfile({ ...result.profile, email: user.email });
            }
        }
        setLoading(false);
    };

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await signOut();
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Settings</Text>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Profile Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>PROFILE</Text>

                    <View style={styles.profileCard}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {userProfile?.name?.charAt(0).toUpperCase() || 'A'}
                            </Text>
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>{userProfile?.name || 'Advocate'}</Text>
                            <Text style={styles.profileEmail}>{userProfile?.email || ''}</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('EditProfile')}
                    >
                        <Text style={styles.menuIcon}>✏️</Text>
                        <Text style={styles.menuText}>Edit Profile</Text>
                        <Text style={styles.menuArrow}>›</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('ChangePassword')}
                    >
                        <Text style={styles.menuIcon}>🔒</Text>
                        <Text style={styles.menuText}>Change Password</Text>
                        <Text style={styles.menuArrow}>›</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('Reports')}
                    >
                        <Text style={styles.menuIcon}>📊</Text>
                        <Text style={styles.menuText}>Reports & Analytics</Text>
                        <Text style={styles.menuArrow}>›</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('StorageManagement')}
                    >
                        <Text style={styles.menuIcon}>💾</Text>
                        <Text style={styles.menuText}>Storage Management</Text>
                        <Text style={styles.menuArrow}>›</Text>
                    </TouchableOpacity>
                </View>

                {/* Account Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ACCOUNT</Text>

                    {userProfile?.phone && (
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Phone</Text>
                            <Text style={styles.infoValue}>{userProfile.phone}</Text>
                        </View>
                    )}

                    {userProfile?.barCouncilId && (
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Bar Council ID</Text>
                            <Text style={styles.infoValue}>{userProfile.barCouncilId}</Text>
                        </View>
                    )}
                </View>

                {/* App Info Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>APP INFO</Text>

                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Version</Text>
                        <Text style={styles.infoValue}>1.0.0</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={async () => {
                            const { getCurrentUser } = require('../../services/authService');
                            const { exportUserData } = require('../../services/exportService');
                            const user = getCurrentUser();
                            if (user) {
                                Alert.alert('Exporting...', 'Please wait while we prepare your data.');
                                await exportUserData(user.uid);
                            }
                        }}
                    >
                        <Text style={styles.menuIcon}>📤</Text>
                        <Text style={styles.menuText}>Export Data</Text>
                        <Text style={styles.menuArrow}>›</Text>
                    </TouchableOpacity>
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    header: {
        padding: 20,
        paddingBottom: 10,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: 'bold',
    },
    scrollView: {
        flex: 1,
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 32,
    },
    sectionTitle: {
        color: '#CD7F32',
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 1.2,
        marginBottom: 12,
    },
    profileCard: {
        flexDirection: 'row',
        backgroundColor: '#1E1E1E',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#333',
        alignItems: 'center',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#CD7F32',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: {
        color: '#121212',
        fontSize: 24,
        fontWeight: 'bold',
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    profileEmail: {
        color: '#999',
        fontSize: 14,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#333',
    },
    menuIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    menuText: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '500',
    },
    menuArrow: {
        color: '#666',
        fontSize: 24,
    },
    infoItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#1E1E1E',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#333',
    },
    infoLabel: {
        color: '#666',
        fontSize: 14,
    },
    infoValue: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
    },
    logoutButton: {
        backgroundColor: '#FF5252',
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    logoutButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});

export default SettingsScreen;
