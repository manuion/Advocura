import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DatePicker from 'react-native-date-picker';
import { subscribeToCases } from '../../services/casesService';
import { getHearingsByDate } from '../../services/hearingsService';
import { getCurrentUser, getUserProfile } from '../../services/authService';

const DashboardScreen = ({ navigation }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [cases, setCases] = useState([]);
    const [todaysHearings, setTodaysHearings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hearingsLoading, setHearingsLoading] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [userProfile, setUserProfile] = useState(null);

    // Calculate statistics from cases
    const stats = {
        totalCases: cases.length,
        activeCases: cases.filter(c => c.status === 'Active').length,
        pendingCases: cases.filter(c => c.status === 'Pending').length,
        wonCases: cases.filter(c => c.status === 'Won').length,
    };


    useEffect(() => {
        fetchHearings();
    }, [selectedDate]);

    const fetchHearings = async () => {
        setHearingsLoading(true);
        const user = getCurrentUser();
        if (user) {
            const result = await getHearingsByDate(user.uid, selectedDate);
            if (result.success) {

                // Fetch case details for each hearing to get case title and client name
                const formattedHearingsPromises = result.hearings.map(async (h) => {
                    const hearingDate = h.date?.toDate ? h.date.toDate() : h.date;

                    // Fetch case details
                    let caseTitle = 'Case Details';
                    let clientName = 'Client';
                    let courtName = h.courtName || '';
                    if (h.caseId) {
                        const { getCaseById } = require('../../services/casesService');
                        const caseResult = await getCaseById(user.uid, h.caseId);
                        if (caseResult.success) {
                            caseTitle = caseResult.case.title || caseResult.case.caseNumber;
                            clientName = caseResult.case.clientName || 'Client';
                            // Use court name from case if hearing doesn't have it
                            if (!courtName) {
                                courtName = caseResult.case.courtName || 'Court';
                            }
                        }
                    }

                    return {
                        id: h.caseId, // Navigate to case details
                        hearingId: h.id,
                        title: h.type + ' Hearing',
                        caseTitle: caseTitle,
                        client: clientName,
                        court: courtName,
                        judgeName: h.judgeName ? `Judge: ${h.judgeName}` : '',
                        time: hearingDate.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                        }),
                        timestamp: hearingDate,
                    };
                });

                const formattedHearings = await Promise.all(formattedHearingsPromises);
                setTodaysHearings(formattedHearings);
            } else {
                console.error('Error fetching hearings:', result.error);
            }
        }
        setHearingsLoading(false);
    };

    useEffect(() => {
        // Get current user
        const user = getCurrentUser();
        console.log('=== DASHBOARD: Current user ===', user);

        if (!user) {
            console.error('No user logged in');
            return;
        }

        console.log('=== DASHBOARD: Loading profile for user ID:', user.uid);

        // Load user profile
        getUserProfile(user.uid).then(result => {
            console.log('=== DASHBOARD: Profile result ===', result);
            if (result.success) {
                console.log('=== DASHBOARD: Profile data ===', result.profile);
                setUserProfile(result.profile);
            } else {
                console.error('=== DASHBOARD: Failed to load profile ===', result.error);
            }
        });

        // Subscribe to real-time case updates
        const unsubscribe = subscribeToCases(user.uid, (result) => {
            if (result.success) {
                // Convert Firestore timestamps to Date objects
                const casesWithDates = result.cases.map(c => ({
                    ...c,
                    filingDate: c.filingDate?.toDate ? c.filingDate.toDate() : c.filingDate,
                    nextHearingDate: c.nextHearingDate?.toDate ? c.nextHearingDate.toDate() : c.nextHearingDate,
                    createdAt: c.createdAt?.toDate ? c.createdAt.toDate() : c.createdAt,
                }));
                setCases(casesWithDates);
                setLoading(false);
            } else {
                console.error("Error fetching cases:", result.error);
                setLoading(false);
            }
        });

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);

    const formatDate = (date) => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Tomorrow';
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    const navigateDate = (direction) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + direction);
        setSelectedDate(newDate);
    };

    const goToToday = () => {
        setSelectedDate(new Date());
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#121212" />

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.greetingContainer}>
                        <Text style={styles.greeting}>Namaste</Text>
                        <Text style={styles.userName}>
                            {userProfile?.name || 'Advocate'}
                        </Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={styles.searchButton}
                            onPress={() => navigation.navigate('Search')}
                        >
                            <Text style={styles.searchIcon}>🔍</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.profileButton}
                            onPress={async () => {
                                const { signOut } = require('../../services/authService');
                                await signOut();
                            }}
                        >
                            <Text style={styles.profileInitial}>
                                {userProfile?.name?.charAt(0).toUpperCase() || 'A'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{stats.totalCases}</Text>
                        <Text style={styles.statLabel}>Total Cases</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{stats.activeCases}</Text>
                        <Text style={styles.statLabel}>Active</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{stats.pendingCases}</Text>
                        <Text style={styles.statLabel}>Pending</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{stats.wonCases}</Text>
                        <Text style={styles.statLabel}>Won</Text>
                    </View>
                </View>

                {/* Date Navigation */}
                <View style={styles.dateNavigation}>
                    <TouchableOpacity style={styles.navButton} onPress={() => navigateDate(-1)}>
                        <Text style={styles.navButtonText}>←</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.dateDisplay}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
                        <Text style={styles.todayHint}>Tap to select date</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.navButton} onPress={() => navigateDate(1)}>
                        <Text style={styles.navButtonText}>→</Text>
                    </TouchableOpacity>
                </View>

                {/* Hearings Section */}
                <View style={styles.hearingsSection}>
                    <Text style={styles.sectionTitle}>HEARINGS FOR {formatDate(selectedDate).toUpperCase()}</Text>

                    {hearingsLoading ? (
                        <View style={styles.emptyState}>
                            <ActivityIndicator size="large" color="#CD7F32" />
                            <Text style={styles.emptyText}>Loading hearings...</Text>
                        </View>
                    ) : todaysHearings.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>📅</Text>
                            <Text style={styles.emptyText}>No hearings scheduled</Text>
                            <Text style={styles.emptySubtext}>
                                {selectedDate.toDateString() === new Date().toDateString()
                                    ? 'You have no hearings today'
                                    : 'No hearings on this date'}
                            </Text>
                        </View>
                    ) : (
                        todaysHearings.map((hearing) => (
                            <TouchableOpacity
                                key={hearing.hearingId}
                                style={styles.hearingCard}
                                onPress={() => navigation.navigate('Cases', {
                                    screen: 'CaseDetails',
                                    params: { caseId: hearing.id }
                                })}
                            >
                                <View style={styles.hearingTime}>
                                    <Text style={styles.timeText}>{hearing.time}</Text>
                                </View>
                                <View style={styles.hearingDetails}>
                                    <Text style={styles.hearingTitle} numberOfLines={1}>
                                        {hearing.title}
                                    </Text>
                                    <Text style={styles.hearingSubtitle}>
                                        {hearing.caseTitle || 'Case Details'}
                                    </Text>
                                    <Text style={styles.hearingClient}>⚖️ {hearing.court}</Text>
                                    {hearing.judgeName && (
                                        <Text style={styles.hearingCourt}>👨‍⚖️ {hearing.judgeName}</Text>
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Floating Action Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => {
                    // Navigate to Cases tab, then to AddCase screen
                    navigation.navigate('Cases', { screen: 'AddCase' });
                }}
            >
                <Text style={styles.fabIcon}>+</Text>
            </TouchableOpacity>

            {/* Date Picker Modal */}
            <DatePicker
                modal
                open={showDatePicker}
                date={selectedDate}
                mode="date"
                onConfirm={(date) => {
                    setShowDatePicker(false);
                    setSelectedDate(date);
                }}
                onCancel={() => setShowDatePicker(false)}
                theme="dark"
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 20,
    },
    greetingContainer: {
        flex: 1,
    },
    greeting: {
        color: '#999',
        fontSize: 14,
    },
    userName: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 4,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    searchButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1E1E1E',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    searchIcon: {
        fontSize: 18,
    },
    profileButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#CD7F32',
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileInitial: {
        color: '#121212',
        fontSize: 20,
        fontWeight: 'bold',
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    statValue: {
        color: '#CD7F32',
        fontSize: 28,
        fontWeight: 'bold',
    },
    statNumber: {
        color: '#CD7F32',
        fontSize: 28,
        fontWeight: 'bold',
    },
    statLabel: {
        color: '#999',
        fontSize: 11,
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    dateNavigation: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
        gap: 12,
    },
    navButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#1E1E1E',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    navButtonText: {
        color: '#CD7F32',
        fontSize: 20,
        fontWeight: 'bold',
    },
    dateDisplay: {
        flex: 1,
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    dateText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    todayHint: {
        color: '#666',
        fontSize: 10,
        marginTop: 2,
    },
    hearingsSection: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    sectionTitle: {
        color: '#CD7F32',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1.5,
        marginBottom: 16,
    },
    hearingCard: {
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#333',
        flexDirection: 'row',
        alignItems: 'center',
    },
    hearingTime: {
        backgroundColor: '#CD7F32',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginRight: 16,
        minWidth: 80,
        alignItems: 'center',
    },
    timeText: {
        color: '#121212',
        fontSize: 14,
        fontWeight: 'bold',
    },
    hearingDetails: {
        flex: 1,
    },
    hearingTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    hearingSubtitle: {
        color: '#CD7F32',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 6,
    },
    hearingClient: {
        color: '#999',
        fontSize: 14,
        marginBottom: 2,
    },
    hearingCourt: {
        color: '#666',
        fontSize: 12,
    },
    emptyState: {
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: 40,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    emptyStateText: {
        color: '#666',
        fontSize: 14,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#CD7F32',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#CD7F32',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    fabIcon: {
        color: '#121212',
        fontSize: 28,
        fontWeight: 'bold',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyText: {
        color: '#999',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    emptySubtext: {
        color: '#666',
        fontSize: 14,
        textAlign: 'center',
    },
});

export default DashboardScreen;
