import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThreadEmails } from '../../services/gmailService';

const EmailThreadScreen = ({ navigation, route }) => {
    const { thread, caseData } = route.params;
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadThreadEmails();
    }, []);

    const loadThreadEmails = async () => {
        setLoading(true);
        try {
            const result = await getThreadEmails(thread.accountEmail, thread.threadId);
            if (result.success) {
                setEmails(result.emails);
            }
        } catch (error) {
            console.error('Error loading thread:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatEmailDate = (dateStr) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateStr;
        }
    };

    const extractSenderName = (fromStr) => {
        if (!fromStr) return 'Unknown';
        const match = fromStr.match(/^([^<]+)</);
        if (match) {
            return match[1].trim().replace(/"/g, '');
        }
        const emailMatch = fromStr.match(/([^@]+)@/);
        return emailMatch ? emailMatch[1] : fromStr;
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {thread.subject}
                    </Text>
                    <Text style={styles.headerSubtitle}>
                        {emails.length} messages in thread
                    </Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#CD7F32" />
                    <Text style={styles.loadingText}>Loading thread...</Text>
                </View>
            ) : (
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {emails.map((email, index) => (
                        <TouchableOpacity
                            key={email.id}
                            style={[
                                styles.emailCard,
                                email.isUnread && styles.emailCardUnread,
                            ]}
                            onPress={() => navigation.navigate('EmailViewer', { email, caseData })}
                        >
                            <View style={styles.emailHeader}>
                                <View style={styles.emailSenderAvatar}>
                                    <Text style={styles.emailSenderInitial}>
                                        {extractSenderName(email.from).charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <View style={styles.emailHeaderInfo}>
                                    <View style={styles.emailTopRow}>
                                        <Text
                                            style={[
                                                styles.emailSender,
                                                email.isUnread && styles.emailTextUnread,
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {extractSenderName(email.from)}
                                        </Text>
                                        <Text style={styles.emailDate}>
                                            {formatEmailDate(email.date)}
                                        </Text>
                                    </View>
                                    {index === 0 && (
                                        <Text
                                            style={[
                                                styles.emailSubject,
                                                email.isUnread && styles.emailTextUnread,
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {email.subject}
                                        </Text>
                                    )}
                                </View>
                            </View>
                            <Text style={styles.emailSnippet} numberOfLines={2}>
                                {email.snippet}
                            </Text>
                            {/* Thread position indicator */}
                            {index < emails.length - 1 && (
                                <View style={styles.threadLine} />
                            )}
                        </TouchableOpacity>
                    ))}
                    <View style={{ height: 40 }} />
                </ScrollView>
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
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    backButton: {
        color: '#CD7F32',
        fontSize: 16,
        fontWeight: '600',
        marginRight: 16,
    },
    headerInfo: {
        flex: 1,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        color: '#999',
        fontSize: 12,
        marginTop: 2,
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
    content: {
        flex: 1,
        padding: 16,
    },
    emailCard: {
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#333',
        position: 'relative',
    },
    emailCardUnread: {
        borderColor: '#CD7F32',
        borderLeftWidth: 3,
    },
    emailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    emailSenderAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#CD7F32',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    emailSenderInitial: {
        color: '#121212',
        fontSize: 14,
        fontWeight: 'bold',
    },
    emailHeaderInfo: {
        flex: 1,
    },
    emailTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    emailSender: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
    },
    emailTextUnread: {
        fontWeight: 'bold',
    },
    emailDate: {
        color: '#666',
        fontSize: 11,
        marginLeft: 8,
    },
    emailSubject: {
        color: '#CD7F32',
        fontSize: 13,
        marginTop: 2,
    },
    emailSnippet: {
        color: '#999',
        fontSize: 13,
        lineHeight: 18,
    },
    threadLine: {
        position: 'absolute',
        left: 33,
        bottom: -8,
        width: 2,
        height: 16,
        backgroundColor: '#CD7F32',
    },
});

export default EmailThreadScreen;
