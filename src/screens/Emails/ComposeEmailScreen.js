import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { sendReply, forwardEmail } from '../../services/gmailService';

const ComposeEmailScreen = ({ navigation, route }) => {
    const { mode, originalEmail, caseData } = route.params;
    const [to, setTo] = useState('');
    const [cc, setCc] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (mode === 'reply' && originalEmail) {
            // Extract email from "Name <email>" format
            const fromEmail = extractEmailAddress(originalEmail.from);
            setTo(fromEmail);
            setSubject(originalEmail.subject?.startsWith('Re:')
                ? originalEmail.subject
                : `Re: ${originalEmail.subject || ''}`);
            setBody(`\n\n\n--- Original Message ---\nFrom: ${originalEmail.from}\nDate: ${originalEmail.date}\nSubject: ${originalEmail.subject}\n\n${originalEmail.body || originalEmail.snippet || ''}`);
        } else if (mode === 'forward' && originalEmail) {
            setSubject(originalEmail.subject?.startsWith('Fwd:')
                ? originalEmail.subject
                : `Fwd: ${originalEmail.subject || ''}`);
            setBody(`\n\n\n---------- Forwarded message ----------\nFrom: ${originalEmail.from}\nDate: ${originalEmail.date}\nSubject: ${originalEmail.subject}\nTo: ${originalEmail.to}\n\n${originalEmail.body || originalEmail.snippet || ''}`);
        }
    }, [mode, originalEmail]);

    const extractEmailAddress = (str) => {
        if (!str) return '';
        const match = str.match(/<(.+?)>/);
        return match ? match[1] : str;
    };

    const handleSend = async () => {
        if (!to.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Please enter recipient email',
            });
            return;
        }

        if (!body.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Please enter message body',
            });
            return;
        }

        setSending(true);

        try {
            let result;

            if (mode === 'reply') {
                result = await sendReply(
                    originalEmail.accountEmail,
                    originalEmail,
                    body,
                    to,
                    cc
                );
            } else if (mode === 'forward') {
                result = await forwardEmail(
                    originalEmail.accountEmail,
                    originalEmail,
                    to,
                    body,
                    cc
                );
            }

            if (result?.success) {
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: mode === 'reply' ? 'Reply sent' : 'Email forwarded',
                });
                navigation.goBack();
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Failed to send',
                    text2: result?.error || 'Unknown error',
                });
            }
        } catch (error) {
            console.error('Send email error:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Failed to send email',
            });
        } finally {
            setSending(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.cancelButton}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {mode === 'reply' ? 'Reply' : 'Forward'}
                </Text>
                <TouchableOpacity
                    onPress={handleSend}
                    disabled={sending}
                    style={[styles.sendButton, sending && styles.sendButtonDisabled]}
                >
                    {sending ? (
                        <ActivityIndicator size="small" color="#121212" />
                    ) : (
                        <Text style={styles.sendButtonText}>Send</Text>
                    )}
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                style={styles.content}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={100}
            >
                <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
                    {/* From */}
                    <View style={styles.fieldRow}>
                        <Text style={styles.fieldLabel}>From:</Text>
                        <Text style={styles.fromEmail}>{originalEmail?.accountEmail}</Text>
                    </View>

                    {/* To */}
                    <View style={styles.fieldRow}>
                        <Text style={styles.fieldLabel}>To:</Text>
                        <TextInput
                            style={styles.fieldInput}
                            value={to}
                            onChangeText={setTo}
                            placeholder="recipient@example.com"
                            placeholderTextColor="#666"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    {/* CC */}
                    <View style={styles.fieldRow}>
                        <Text style={styles.fieldLabel}>Cc:</Text>
                        <TextInput
                            style={styles.fieldInput}
                            value={cc}
                            onChangeText={setCc}
                            placeholder="cc@example.com"
                            placeholderTextColor="#666"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    {/* Subject */}
                    <View style={styles.fieldRow}>
                        <Text style={styles.fieldLabel}>Subject:</Text>
                        <TextInput
                            style={styles.fieldInput}
                            value={subject}
                            onChangeText={setSubject}
                            placeholder="Subject"
                            placeholderTextColor="#666"
                        />
                    </View>

                    {/* Body */}
                    <View style={styles.bodyContainer}>
                        <TextInput
                            style={styles.bodyInput}
                            value={body}
                            onChangeText={setBody}
                            placeholder="Compose your message..."
                            placeholderTextColor="#666"
                            multiline
                            textAlignVertical="top"
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
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
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    cancelButton: {
        color: '#CD7F32',
        fontSize: 16,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    sendButton: {
        backgroundColor: '#CD7F32',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
        minWidth: 60,
        alignItems: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.6,
    },
    sendButtonText: {
        color: '#121212',
        fontSize: 14,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    fieldRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#2A2A2A',
    },
    fieldLabel: {
        color: '#666',
        fontSize: 14,
        width: 60,
    },
    fieldInput: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 14,
    },
    fromEmail: {
        flex: 1,
        color: '#999',
        fontSize: 14,
    },
    bodyContainer: {
        flex: 1,
        padding: 16,
        minHeight: 300,
    },
    bodyInput: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 15,
        lineHeight: 22,
        minHeight: 300,
    },
});

export default ComposeEmailScreen;
