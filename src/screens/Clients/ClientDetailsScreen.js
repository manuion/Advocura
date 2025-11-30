import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { getClientById, deleteClient } from '../../services/clientsService';
import { getCurrentUser } from '../../services/authService';

const ClientDetailsScreen = ({ navigation, route }) => {
    const { clientId } = route.params;
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadClient();
    }, [clientId]);

    const loadClient = async () => {
        const user = getCurrentUser();
        const result = await getClientById(user.uid, clientId);
        if (result.success) {
            setClient(result.client);
        } else {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load client' });
        }
        setLoading(false);
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Client',
            `Are you sure you want to delete ${client.name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const user = getCurrentUser();
                        const result = await deleteClient(user.uid, clientId);
                        if (result.success) {
                            navigation.goBack();
                        } else {
                            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to delete client' });
                        }
                    }
                }
            ]
        );
    };

    const handleCall = () => {
        if (client.phone) {
            Linking.openURL(`tel:${client.phone}`);
        }
    };

    const handleEmail = () => {
        if (client.email) {
            Linking.openURL(`mailto:${client.email}`);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#CD7F32" />
            </View>
        );
    }

    if (!client) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.errorText}>Client not found</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Client Details</Text>
                <TouchableOpacity onPress={() => navigation.navigate('AddClient', { clientId })}>
                    <Text style={styles.editButton}>Edit</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Client Avatar & Name */}
                <View style={styles.profileSection}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {client.name?.charAt(0).toUpperCase() || 'C'}
                        </Text>
                    </View>
                    <Text style={styles.clientName}>{client.name}</Text>
                </View>

                {/* Contact Actions */}
                <View style={styles.actionsRow}>
                    {client.phone && (
                        <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
                            <Text style={styles.actionIcon}>📞</Text>
                            <Text style={styles.actionText}>Call</Text>
                        </TouchableOpacity>
                    )}
                    {client.email && (
                        <TouchableOpacity style={styles.actionButton} onPress={handleEmail}>
                            <Text style={styles.actionIcon}>📧</Text>
                            <Text style={styles.actionText}>Email</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Details Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Contact Information</Text>

                    {client.email && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Email</Text>
                            <Text style={styles.detailValue}>{client.email}</Text>
                        </View>
                    )}

                    {client.phone && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Phone</Text>
                            <Text style={styles.detailValue}>{client.phone}</Text>
                        </View>
                    )}

                    {client.company && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Company</Text>
                            <Text style={styles.detailValue}>{client.company}</Text>
                        </View>
                    )}

                    {client.address && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Address</Text>
                            <Text style={styles.detailValue}>{client.address}</Text>
                        </View>
                    )}
                </View>

                {/* Notes Card */}
                {client.notes && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Notes</Text>
                        <Text style={styles.notesText}>{client.notes}</Text>
                    </View>
                )}

                {/* Delete Button */}
                <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                    <Text style={styles.deleteButtonText}>Delete Client</Text>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#121212',
    },
    errorText: {
        color: '#FF5252',
        fontSize: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 10,
    },
    backButton: {
        color: '#CD7F32',
        fontSize: 16,
        fontWeight: '600',
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    editButton: {
        color: '#CD7F32',
        fontSize: 16,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    profileSection: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#CD7F32',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarText: {
        color: '#121212',
        fontSize: 40,
        fontWeight: 'bold',
    },
    clientName: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    actionButton: {
        backgroundColor: '#1E1E1E',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333',
        alignItems: 'center',
        minWidth: 100,
    },
    actionIcon: {
        fontSize: 24,
        marginBottom: 4,
    },
    actionText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    card: {
        backgroundColor: '#1E1E1E',
        marginHorizontal: 20,
        marginBottom: 16,
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    cardTitle: {
        color: '#CD7F32',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    detailRow: {
        marginBottom: 12,
    },
    detailLabel: {
        color: '#666',
        fontSize: 12,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    detailValue: {
        color: '#FFFFFF',
        fontSize: 16,
    },
    notesText: {
        color: '#FFFFFF',
        fontSize: 15,
        lineHeight: 22,
    },
    deleteButton: {
        backgroundColor: '#FF5252',
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    deleteButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 1,
    },
});

export default ClientDetailsScreen;
