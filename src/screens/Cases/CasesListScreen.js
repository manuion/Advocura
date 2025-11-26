import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { subscribeToCases } from '../../services/casesService';
import { getCurrentUser } from '../../services/authService';

const CasesListScreen = ({ navigation }) => {
    const [cases, setCases] = useState([]);
    const [filteredCases, setFilteredCases] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('All');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const user = getCurrentUser();
        const userId = user?.uid || 'test-user';

        // Subscribe to real-time updates
        const unsubscribe = subscribeToCases(userId, (result) => {
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
                setError('');
            } else {
                setError(result.error || 'Failed to load cases');
                setLoading(false);
            }
        });

        // Cleanup subscription on unmount
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);

    useEffect(() => {
        filterCases();
    }, [searchQuery, selectedFilter, cases]);

    const filterCases = () => {
        let filtered = cases;

        // Filter by status
        if (selectedFilter !== 'All') {
            filtered = filtered.filter(c => c.status === selectedFilter);
        }

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(c =>
                c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.clientName.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredCases(filtered);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Active':
                return '#CD7F32';
            case 'Won':
                return '#4CAF50';
            case 'Lost':
                return '#FF5252';
            case 'Pending':
                return '#FFC107';
            case 'Closed':
                return '#999';
            default:
                return '#CD7F32';
        }
    };

    const formatDate = (date) => {
        if (!date) return 'No hearing scheduled';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const filters = ['All', 'Active', 'Pending', 'Won', 'Lost', 'Closed'];

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Cases</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => navigation.navigate('AddCase')}
                >
                    <Text style={styles.addButtonText}>+ Add</Text>
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search cases..."
                    placeholderTextColor="#666"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Filter Chips */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterContainer}
                contentContainerStyle={styles.filterContent}
            >
                {filters.map((filter) => (
                    <TouchableOpacity
                        key={filter}
                        style={[
                            styles.filterChip,
                            selectedFilter === filter && styles.filterChipActive
                        ]}
                        onPress={() => setSelectedFilter(filter)}
                    >
                        <Text style={[
                            styles.filterChipText,
                            selectedFilter === filter && styles.filterChipTextActive
                        ]}>
                            {filter}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Cases List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#CD7F32" />
                </View>
            ) : filteredCases.length > 0 ? (
                <ScrollView style={styles.casesList} showsVerticalScrollIndicator={false}>
                    {filteredCases.map((caseItem) => (
                        <TouchableOpacity
                            key={caseItem.id}
                            style={styles.caseCard}
                            onPress={() => navigation.navigate('CaseDetails', { caseId: caseItem.id })}
                        >
                            <View style={styles.caseHeader}>
                                <Text style={styles.caseNumber}>{caseItem.caseNumber}</Text>
                                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(caseItem.status) + '20' }]}>
                                    <Text style={[styles.statusText, { color: getStatusColor(caseItem.status) }]}>
                                        {caseItem.status}
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.caseTitle}>{caseItem.title}</Text>

                            <View style={styles.caseInfo}>
                                <Text style={styles.caseInfoLabel}>Client:</Text>
                                <Text style={styles.caseInfoValue}>{caseItem.clientName}</Text>
                            </View>

                            <View style={styles.caseInfo}>
                                <Text style={styles.caseInfoLabel}>Court:</Text>
                                <Text style={styles.caseInfoValue}>{caseItem.courtName}</Text>
                            </View>

                            {caseItem.nextHearingDate && (
                                <View style={styles.hearingInfo}>
                                    <Text style={styles.hearingLabel}>Next Hearing:</Text>
                                    <Text style={styles.hearingDate}>{formatDate(caseItem.nextHearingDate)}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            ) : (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>
                        {searchQuery || selectedFilter !== 'All'
                            ? 'No cases found matching your criteria'
                            : 'No cases yet. Tap + Add to create your first case.'}
                    </Text>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 10,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: 'bold',
    },
    addButton: {
        backgroundColor: '#CD7F32',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    addButtonText: {
        color: '#121212',
        fontWeight: 'bold',
        fontSize: 14,
    },
    searchContainer: {
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    searchInput: {
        backgroundColor: '#1E1E1E',
        color: '#FFFFFF',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333',
        fontSize: 15,
    },
    filterContainer: {
        maxHeight: 50,
        marginBottom: 12,
    },
    filterContent: {
        paddingHorizontal: 20,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#1E1E1E',
        borderWidth: 1,
        borderColor: '#333',
        marginRight: 8,
    },
    filterChipActive: {
        backgroundColor: '#CD7F32',
        borderColor: '#CD7F32',
    },
    filterChipText: {
        color: '#999',
        fontSize: 13,
        fontWeight: '600',
    },
    filterChipTextActive: {
        color: '#121212',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    casesList: {
        flex: 1,
        paddingHorizontal: 20,
    },
    caseCard: {
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    caseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    caseNumber: {
        color: '#CD7F32',
        fontSize: 13,
        fontWeight: 'bold',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    caseTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    caseInfo: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    caseInfoLabel: {
        color: '#666',
        fontSize: 13,
        width: 60,
    },
    caseInfoValue: {
        color: '#999',
        fontSize: 13,
        flex: 1,
    },
    hearingInfo: {
        flexDirection: 'row',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    hearingLabel: {
        color: '#666',
        fontSize: 12,
    },
    hearingDate: {
        color: '#CD7F32',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 8,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyStateText: {
        color: '#666',
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },
});

export default CasesListScreen;
