import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import {
    configureGoogleSignIn,
    linkGmailAccount,
    unlinkGmailAccount,
    getLinkedAccounts,
} from '../../services/gmailService';

const LinkedGmailAccountsScreen = ({ navigation }) => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [linking, setLinking] = useState(false);

    useEffect(() => {
        // Configure Google Sign-In
        configureGoogleSignIn();
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        setLoading(true);
        const result = await getLinkedAccounts();
        if (result.success) {
            setAccounts(result.accounts);
        }
        setLoading(false);
    };

    const handleAddAccount = async () => {
        if (accounts.length >= 3) {
            Toast.show({
                type: 'error',
                text1: 'Limit Reached',
                text2: 'Maximum 3 Gmail accounts can be linked',
            });
            return;
        }

        setLinking(true);
        const result = await linkGmailAccount();

        if (result.success) {
            Toast.show({
                type: 'success',
                text1: 'Account Linked',
                text2: `${result.account.email} has been linked successfully`,
            });
            loadAccounts();
        } else {
            if (result.error !== 'Sign in cancelled') {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: result.error,
                });
            }
        }
        setLinking(false);
    };

    const handleRemoveAccount = (account) => {
        Alert.alert(
            'Remove Account',
            `Are you sure you want to unlink ${account.email}?\n\nCached emails from this account will no longer sync.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        const result = await unlinkGmailAccount(account.email);
                        if (result.success) {
                            Toast.show({
                                type: 'success',
                                text1: 'Account Removed',
                                text2: `${account.email} has been unlinked`,
                            });
                            loadAccounts();
                        } else {
                            Toast.show({
                                type: 'error',
                                text1: 'Error',
                                text2: result.error,
                            });
                        }
                    },
                },
            ]
        );
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return date.toLocaleDateString();
        } catch {
            return '';
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Email Accounts</Text>
                <View style={{ width: 50 }} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Info Section */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoIcon}>📧</Text>
                    <Text style={styles.infoText}>
                        Link your Gmail accounts to view case-related emails directly in the app.
                        Emails matching case subject keywords will be synced automatically.
                    </Text>
                </View>

                {/* Accounts Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        LINKED ACCOUNTS ({accounts.length}/3)
                    </Text>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#CD7F32" />
                        </View>
                    ) : accounts.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>📭</Text>
                            <Text style={styles.emptyText}>No Gmail accounts linked</Text>
                            <Text style={styles.emptySubtext}>
                                Add an account to start syncing emails
                            </Text>
                        </View>
                    ) : (
                        accounts.map((account, index) => (
                            <View key={account.email || index} style={styles.accountCard}>
                                <View style={styles.accountAvatar}>
                                    <Text style={styles.accountAvatarText}>
                                        {account.email?.charAt(0).toUpperCase() || 'G'}
                                    </Text>
                                </View>
                                <View style={styles.accountInfo}>
                                    <Text style={styles.accountName}>
                                        {account.name || account.email?.split('@')[0]}
                                    </Text>
                                    <Text style={styles.accountEmail}>{account.email}</Text>
                                    {account.linkedAt && (
                                        <Text style={styles.accountDate}>
                                            Linked: {formatDate(account.linkedAt)}
                                        </Text>
                                    )}
                                </View>
                                <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={() => handleRemoveAccount(account)}
                                >
                                    <Text style={styles.removeButtonText}>✕</Text>
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                </View>

                {/* Add Account Button */}
                <TouchableOpacity
                    style={[
                        styles.addButton,
                        (linking || accounts.length >= 3) && styles.addButtonDisabled,
                    ]}
                    onPress={handleAddAccount}
                    disabled={linking || accounts.length >= 3}
                >
                    {linking ? (
                        <ActivityIndicator size="small" color="#CD7F32" />
                    ) : (
                        <>
                            <Text style={styles.addButtonIcon}>+</Text>
                            <Text style={styles.addButtonText}>Link Gmail Account</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Note */}
                <View style={styles.noteContainer}>
                    <Text style={styles.noteText}>
                        Note: Your email data is stored securely and only used within this app.
                        We only access emails matching your case subject keywords.
                    </Text>
                </View>

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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 10,
    },
    backButton: {
        color: '#CD7F32',
        fontSize: 16,
        fontWeight: '500',
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    scrollView: {
        flex: 1,
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#1E1E1E',
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    infoIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    infoText: {
        flex: 1,
        color: '#999',
        fontSize: 14,
        lineHeight: 20,
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionTitle: {
        color: '#CD7F32',
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 1.2,
        marginBottom: 12,
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyContainer: {
        backgroundColor: '#1E1E1E',
        padding: 32,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    emptySubtext: {
        color: '#666',
        fontSize: 14,
    },
    accountCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#333',
    },
    accountAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#CD7F32',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    accountAvatarText: {
        color: '#121212',
        fontSize: 18,
        fontWeight: 'bold',
    },
    accountInfo: {
        flex: 1,
    },
    accountName: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    accountEmail: {
        color: '#999',
        fontSize: 14,
    },
    accountDate: {
        color: '#666',
        fontSize: 12,
        marginTop: 2,
    },
    removeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#2A2A2A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeButtonText: {
        color: '#FF5252',
        fontSize: 16,
        fontWeight: 'bold',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#CD7F32',
    },
    addButtonDisabled: {
        borderColor: '#666',
        opacity: 0.5,
    },
    addButtonIcon: {
        color: '#CD7F32',
        fontSize: 24,
        fontWeight: 'bold',
        marginRight: 8,
    },
    addButtonText: {
        color: '#CD7F32',
        fontSize: 16,
        fontWeight: '600',
    },
    noteContainer: {
        marginHorizontal: 20,
        marginTop: 24,
        padding: 16,
        backgroundColor: '#1A1A2E',
        borderRadius: 12,
    },
    noteText: {
        color: '#666',
        fontSize: 12,
        lineHeight: 18,
        textAlign: 'center',
    },
});

export default LinkedGmailAccountsScreen;
