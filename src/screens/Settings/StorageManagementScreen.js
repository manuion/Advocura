import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    getCacheStats,
    getCachedDocumentsList,
    removeCachedDocument,
    clearCache,
} from '../../services/documentCacheService';
import { formatFileSize, formatRelativeTime } from '../../utils/fileUtils';
import { getCurrentUser } from '../../services/authService';

const StorageManagementScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [deleting, setDeleting] = useState({});

    useEffect(() => {
        loadStorageData();
    }, []);

    const loadStorageData = async () => {
        try {
            // Get cache statistics
            const cacheStats = await getCacheStats();
            setStats(cacheStats);

            // Get list of cached documents
            const cachedDocs = await getCachedDocumentsList();
            setDocuments(cachedDocs);
        } catch (error) {
            console.error('[StorageManagement] Error loading data:', error);
            Alert.alert('Error', 'Failed to load storage information');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadStorageData();
    };

    const handleDeleteDocument = async (documentId, documentName) => {
        Alert.alert(
            'Delete Cached Document',
            `Are you sure you want to remove "${documentName}" from cache? You can download it again later.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setDeleting(prev => ({ ...prev, [documentId]: true }));
                        try {
                            await removeCachedDocument(documentId);
                            await loadStorageData(); // Refresh data
                            Alert.alert('Success', 'Document removed from cache');
                        } catch (error) {
                            console.error('[StorageManagement] Delete error:', error);
                            Alert.alert('Error', 'Failed to delete document');
                        } finally {
                            setDeleting(prev => ({ ...prev, [documentId]: false }));
                        }
                    },
                },
            ]
        );
    };

    const handleClearAll = () => {
        Alert.alert(
            'Clear All Cache',
            `This will remove all ${documents.length} cached documents (${formatFileSize(stats?.totalSize || 0)}). You can download them again later.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const user = getCurrentUser();
                            await clearCache(user?.uid);
                            await loadStorageData(); // Refresh data
                            Alert.alert('Success', 'All cached documents cleared');
                        } catch (error) {
                            console.error('[StorageManagement] Clear all error:', error);
                            Alert.alert('Error', 'Failed to clear cache');
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const getStorageColor = (percentUsed) => {
        if (percentUsed >= 90) return '#FF5252'; // Red
        if (percentUsed >= 75) return '#FFA726'; // Orange
        return '#CD7F32'; // Bronze
    };

    const renderStorageGauge = () => {
        if (!stats) return null;

        const percentUsed = stats.percentUsed || 0;
        const color = getStorageColor(percentUsed);

        return (
            <View style={styles.gaugeContainer}>
                <Text style={styles.gaugeTitle}>Storage Usage</Text>

                {/* Progress Bar */}
                <View style={styles.progressBarContainer}>
                    <View
                        style={[
                            styles.progressBarFill,
                            { width: `${Math.min(percentUsed, 100)}%`, backgroundColor: color },
                        ]}
                    />
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <Text style={styles.statsText}>
                        {formatFileSize(stats.totalSize)} / {stats.maxSizeMB} MB
                    </Text>
                    <Text style={[styles.statsPercentage, { color }]}>
                        {percentUsed.toFixed(1)}%
                    </Text>
                </View>

                <View style={styles.statsRow}>
                    <Text style={styles.statsSubtext}>
                        {stats.documentCount} {stats.documentCount === 1 ? 'document' : 'documents'} cached
                    </Text>
                    <Text style={styles.statsSubtext}>
                        {formatFileSize((stats.maxSizeMB * 1024 * 1024) - stats.totalSize)} available
                    </Text>
                </View>
            </View>
        );
    };

    const renderDocumentItem = ({ item }) => {
        const isDeleting = deleting[item.documentId];

        return (
            <View style={styles.documentItem}>
                <View style={styles.documentInfo}>
                    <Text style={styles.documentName} numberOfLines={1}>
                        {item.name}
                    </Text>
                    <View style={styles.documentMeta}>
                        <Text style={styles.documentSize}>
                            {formatFileSize(item.size)}
                        </Text>
                        <Text style={styles.documentSeparator}>•</Text>
                        <Text style={styles.documentTime}>
                            Cached {formatRelativeTime(item.cachedAt)}
                        </Text>
                    </View>
                    <Text style={styles.documentAccess}>
                        Accessed {item.accessCount || 0} {item.accessCount === 1 ? 'time' : 'times'}
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteDocument(item.documentId, item.name)}
                    disabled={isDeleting}
                >
                    {isDeleting ? (
                        <ActivityIndicator size="small" color="#FF5252" />
                    ) : (
                        <Text style={styles.deleteButtonText}>Delete</Text>
                    )}
                </TouchableOpacity>
            </View>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No cached documents</Text>
            <Text style={styles.emptySubtext}>
                Documents will be cached automatically when you view them
            </Text>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.backButton}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Storage Management</Text>
                    <View style={{ width: 50 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#CD7F32" />
                    <Text style={styles.loadingText}>Loading storage data...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Storage Management</Text>
                <View style={{ width: 50 }} />
            </View>

            {/* Storage Gauge */}
            {renderStorageGauge()}

            {/* Clear All Button */}
            {documents.length > 0 && (
                <TouchableOpacity
                    style={styles.clearAllButton}
                    onPress={handleClearAll}
                >
                    <Text style={styles.clearAllButtonText}>Clear All Cache</Text>
                </TouchableOpacity>
            )}

            {/* Documents List */}
            <View style={styles.listHeader}>
                <Text style={styles.listHeaderText}>Cached Documents</Text>
            </View>

            <FlatList
                data={documents}
                renderItem={renderDocumentItem}
                keyExtractor={(item) => item.documentId}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={renderEmptyState}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor="#CD7F32"
                        colors={['#CD7F32']}
                    />
                }
            />
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
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    backButton: {
        color: '#CD7F32',
        fontSize: 16,
        fontWeight: '600',
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#999',
        fontSize: 14,
        marginTop: 12,
    },
    gaugeContainer: {
        backgroundColor: '#1E1E1E',
        margin: 16,
        padding: 20,
        borderRadius: 12,
    },
    gaugeTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 16,
    },
    progressBarContainer: {
        height: 12,
        backgroundColor: '#333',
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 12,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 6,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    statsText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    statsPercentage: {
        fontSize: 14,
        fontWeight: '700',
    },
    statsSubtext: {
        color: '#999',
        fontSize: 12,
    },
    clearAllButton: {
        backgroundColor: '#FF5252',
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    clearAllButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    listHeader: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#1E1E1E',
    },
    listHeaderText: {
        color: '#999',
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    listContent: {
        paddingBottom: 20,
    },
    documentItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        marginHorizontal: 16,
        marginTop: 12,
        padding: 16,
        borderRadius: 8,
    },
    documentInfo: {
        flex: 1,
        marginRight: 12,
    },
    documentName: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 6,
    },
    documentMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    documentSize: {
        color: '#999',
        fontSize: 12,
    },
    documentSeparator: {
        color: '#666',
        fontSize: 12,
        marginHorizontal: 6,
    },
    documentTime: {
        color: '#999',
        fontSize: 12,
    },
    documentAccess: {
        color: '#666',
        fontSize: 11,
    },
    deleteButton: {
        backgroundColor: '#FF5252',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
        minWidth: 70,
        alignItems: 'center',
    },
    deleteButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyText: {
        color: '#999',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtext: {
        color: '#666',
        fontSize: 14,
        textAlign: 'center',
    },
});

export default StorageManagementScreen;
