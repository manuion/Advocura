import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { subscribeToClients, deleteClient } from '../../services/clientsService';
import { getCurrentUser } from '../../services/authService';

const ClientsListScreen = ({ navigation }) => {
    const [clients, setClients] = useState([]);
    const [filteredClients, setFilteredClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const user = getCurrentUser();
        if (!user) {
            console.error('No user logged in');
            return;
        }

        const unsubscribe = subscribeToClients(user.uid, (result) => {
            if (result.success) {
                setClients(result.clients);
                setFilteredClients(result.clients);
                setLoading(false);
            } else {
                console.error('Error fetching clients:', result.error);
                setLoading(false);
            }
        });

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredClients(clients);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = clients.filter(client =>
                client.name?.toLowerCase().includes(query) ||
                client.email?.toLowerCase().includes(query) ||
                client.phone?.includes(query) ||
                client.company?.toLowerCase().includes(query)
            );
            setFilteredClients(filtered);
        }
    }, [searchQuery, clients]);

    const handleDeleteClient = (clientId, clientName) => {
        Alert.alert(
            'Delete Client',
            `Are you sure you want to delete ${clientName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const user = getCurrentUser();
                        const result = await deleteClient(user.uid, clientId);
                        if (!result.success) {
                            Alert.alert('Error', 'Failed to delete client');
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#CD7F32" />
                <Text style={styles.loadingText}>Loading clients...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Clients</Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search clients..."
                    placeholderTextColor="#666"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Clients List */}
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {filteredClients.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>👥</Text>
                        <Text style={styles.emptyText}>
                            {searchQuery ? 'No clients found' : 'No clients yet'}
                        </Text>
                        <Text style={styles.emptySubtext}>
                            {searchQuery ? 'Try a different search' : 'Tap + to add your first client'}
                        </Text>
                    </View>
                ) : (
                    filteredClients.map((client) => (
                        <TouchableOpacity
                            key={client.id}
                            style={styles.clientCard}
                            onPress={() => navigation.navigate('ClientDetails', { clientId: client.id })}
                        >
                            <View style={styles.clientAvatar}>
                                <Text style={styles.clientInitial}>
                                    {client.name?.charAt(0).toUpperCase() || 'C'}
                                </Text>
                            </View>
                            <View style={styles.clientInfo}>
                                <Text style={styles.clientName}>{client.name}</Text>
                                {client.email && (
                                    <Text style={styles.clientDetail}>📧 {client.email}</Text>
                                )}
                                {client.phone && (
                                    <Text style={styles.clientDetail}>📱 {client.phone}</Text>
                                )}
                                {client.company && (
                                    <Text style={styles.clientCompany}>🏢 {client.company}</Text>
                                )}
                            </View>
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => handleDeleteClient(client.id, client.name)}
                            >
                                <Text style={styles.deleteButtonText}>×</Text>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    ))
                )}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('AddClient')}
            >
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
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
    header: {
        padding: 20,
        paddingBottom: 10,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: 'bold',
    },
    searchContainer: {
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    searchInput: {
        backgroundColor: '#1E1E1E',
        color: '#FFFFFF',
        padding: 14,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333',
        fontSize: 15,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 20,
    },
    clientCard: {
        flexDirection: 'row',
        backgroundColor: '#1E1E1E',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#333',
        alignItems: 'center',
    },
    clientAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#CD7F32',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    clientInitial: {
        color: '#121212',
        fontSize: 20,
        fontWeight: 'bold',
    },
    clientInfo: {
        flex: 1,
    },
    clientName: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    clientDetail: {
        color: '#999',
        fontSize: 13,
        marginBottom: 2,
    },
    clientCompany: {
        color: '#CD7F32',
        fontSize: 13,
        marginTop: 4,
    },
    deleteButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FF5252',
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteButtonText: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
        lineHeight: 24,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    emptySubtext: {
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
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#CD7F32',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    fabText: {
        color: '#121212',
        fontSize: 32,
        fontWeight: 'bold',
        lineHeight: 32,
    },
});

export default ClientsListScreen;
