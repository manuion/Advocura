import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { subscribeToCases } from '../../services/casesService';
import { getCurrentUser } from '../../services/authService';

const ReportsScreen = ({ navigation }) => {
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const user = getCurrentUser();
        if (user) {
            const unsubscribe = subscribeToCases(user.uid, (result) => {
                if (result.success) {
                    setCases(result.cases);
                }
                setLoading(false);
            });
            return () => unsubscribe();
        }
    }, []);

    const calculateStats = () => {
        const total = cases.length;
        const active = cases.filter(c => c.status === 'Active').length;
        const pending = cases.filter(c => c.status === 'Pending').length;
        const won = cases.filter(c => c.status === 'Won').length;
        const lost = cases.filter(c => c.status === 'Lost').length;
        const closed = cases.filter(c => c.status === 'Closed').length;

        // By Type
        const byType = cases.reduce((acc, curr) => {
            acc[curr.caseType] = (acc[curr.caseType] || 0) + 1;
            return acc;
        }, {});

        return { total, active, pending, won, lost, closed, byType };
    };

    const stats = calculateStats();

    const renderProgressBar = (label, value, total, color) => {
        const percentage = total > 0 ? (value / total) * 100 : 0;
        return (
            <View style={styles.progressRow}>
                <View style={styles.progressLabelContainer}>
                    <Text style={styles.progressLabel}>{label}</Text>
                    <Text style={styles.progressValue}>{value}</Text>
                </View>
                <View style={styles.progressBarBackground}>
                    <View
                        style={[
                            styles.progressBarFill,
                            { width: `${percentage}%`, backgroundColor: color }
                        ]}
                    />
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#CD7F32" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Reports & Analytics</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Summary Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>CASE SUMMARY</Text>
                    <View style={styles.summaryGrid}>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryNumber}>{stats.total}</Text>
                            <Text style={styles.summaryLabel}>Total</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryNumber, { color: '#4CAF50' }]}>{stats.won}</Text>
                            <Text style={styles.summaryLabel}>Won</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryNumber, { color: '#CD7F32' }]}>{stats.active}</Text>
                            <Text style={styles.summaryLabel}>Active</Text>
                        </View>
                    </View>
                </View>

                {/* Status Breakdown */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>STATUS BREAKDOWN</Text>
                    {renderProgressBar('Active', stats.active, stats.total, '#CD7F32')}
                    {renderProgressBar('Pending', stats.pending, stats.total, '#FFC107')}
                    {renderProgressBar('Won', stats.won, stats.total, '#4CAF50')}
                    {renderProgressBar('Lost', stats.lost, stats.total, '#FF5252')}
                    {renderProgressBar('Closed', stats.closed, stats.total, '#999999')}
                </View>

                {/* Case Types */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>CASE TYPES</Text>
                    {Object.entries(stats.byType).map(([type, count]) => (
                        renderProgressBar(type, count, stats.total, '#2196F3')
                    ))}
                    {Object.keys(stats.byType).length === 0 && (
                        <Text style={styles.emptyText}>No case types data available</Text>
                    )}
                </View>
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
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    content: {
        padding: 20,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#333',
    },
    cardTitle: {
        color: '#CD7F32',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1.2,
        marginBottom: 20,
    },
    summaryGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    summaryItem: {
        alignItems: 'center',
    },
    summaryNumber: {
        color: '#FFFFFF',
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    summaryLabel: {
        color: '#999',
        fontSize: 14,
    },
    progressRow: {
        marginBottom: 16,
    },
    progressLabelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    progressLabel: {
        color: '#FFFFFF',
        fontSize: 14,
    },
    progressValue: {
        color: '#999',
        fontSize: 14,
    },
    progressBarBackground: {
        height: 8,
        backgroundColor: '#333',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    emptyText: {
        color: '#666',
        fontStyle: 'italic',
    },
});

export default ReportsScreen;
