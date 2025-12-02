import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Linking,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { WebView } from 'react-native-webview';
import { getEmailById, markAsRead, downloadAttachment } from '../../services/gmailService';
import { cacheEmail, getCachedEmail } from '../../services/emailCacheService';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import FileViewer from 'react-native-file-viewer';

const EmailViewerScreen = ({ navigation, route }) => {
    const { email: emailSummary, caseData } = route.params;
    const [email, setEmail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloadingAttachment, setDownloadingAttachment] = useState(null);

    useEffect(() => {
        loadFullEmail();
    }, []);

    const loadFullEmail = async () => {
        try {
            // Try cached first
            const cached = await getCachedEmail(emailSummary.id);
            if (cached && cached.body) {
                setEmail(cached);
                setLoading(false);
                return;
            }

            // Fetch full email
            const result = await getEmailById(emailSummary.accountEmail, emailSummary.id);
            if (result.success) {
                setEmail(result.email);
                // Cache the full email
                await cacheEmail({ ...result.email, caseKeyword: caseData?.emailKeyword });
                // Mark as read
                if (emailSummary.isUnread) {
                    await markAsRead(emailSummary.accountEmail, emailSummary.id);
                }
            } else {
                // Fall back to summary data
                setEmail(emailSummary);
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Could not load full email content',
                });
            }
        } catch (error) {
            console.error('Error loading email:', error);
            setEmail(emailSummary);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateStr;
        }
    };

    const extractEmailAddress = (str) => {
        if (!str) return '';
        const match = str.match(/<(.+?)>/);
        return match ? match[1] : str;
    };

    const extractName = (str) => {
        if (!str) return '';
        const match = str.match(/^([^<]+)</);
        if (match) {
            return match[1].trim().replace(/"/g, '');
        }
        return str.split('@')[0];
    };

    const handleReply = () => {
        navigation.navigate('ComposeEmail', {
            mode: 'reply',
            originalEmail: email,
            caseData,
        });
    };

    const handleForward = () => {
        navigation.navigate('ComposeEmail', {
            mode: 'forward',
            originalEmail: email,
            caseData,
        });
    };

    const handleOpenAttachment = async (attachment) => {
        try {
            setDownloadingAttachment(attachment.id);

            Toast.show({
                type: 'info',
                text1: 'Opening...',
                text2: attachment.filename,
                visibilityTime: 1500,
            });

            const result = await downloadAttachment(
                email.accountEmail,
                email.id,
                attachment.id
            );

            if (!result.success) {
                Toast.show({
                    type: 'error',
                    text1: 'Download Failed',
                    text2: result.error,
                });
                return;
            }

            // Save to cache directory
            const filePath = `${RNFS.CachesDirectoryPath}/${attachment.filename}`;
            await RNFS.writeFile(filePath, result.data, 'base64');

            // Open file in native viewer
            await FileViewer.open(filePath, {
                showOpenWithDialog: true,
                showAppsSuggestions: true,
            });

        } catch (error) {
            console.error('Open attachment error:', error);

            // If no app found to open, offer to share instead
            if (error.message?.includes('No app')) {
                const filePath = `${RNFS.CachesDirectoryPath}/${attachment.filename}`;
                Share.open({
                    url: `file://${filePath}`,
                    title: attachment.filename,
                }).catch(() => {});
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Could not open file',
                    text2: error.message || 'Unknown error',
                });
            }
        } finally {
            setDownloadingAttachment(null);
        }
    };


    const formatFileSize = (bytes) => {
        if (!bytes) return '';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getHtmlContent = () => {
        const body = email?.htmlBody || email?.body || email?.snippet || '';
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                        font-size: 15px;
                        line-height: 1.6;
                        color: #E0E0E0;
                        background-color: #121212;
                        padding: 16px;
                        margin: 0;
                        word-wrap: break-word;
                    }
                    a {
                        color: #CD7F32;
                    }
                    img {
                        max-width: 100%;
                        height: auto;
                    }
                    pre, code {
                        background-color: #1E1E1E;
                        padding: 8px;
                        border-radius: 4px;
                        overflow-x: auto;
                    }
                    blockquote {
                        border-left: 3px solid #CD7F32;
                        margin-left: 0;
                        padding-left: 16px;
                        color: #999;
                    }
                </style>
            </head>
            <body>
                ${body}
            </body>
            </html>
        `;
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.backButton}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Email</Text>
                    <View style={{ width: 50 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#CD7F32" />
                    <Text style={styles.loadingText}>Loading email...</Text>
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
                <Text style={styles.headerTitle}>Email</Text>
                <View style={{ width: 50 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Subject */}
                <Text style={styles.subject}>{email?.subject || 'No Subject'}</Text>

                {/* Sender Info */}
                <View style={styles.senderSection}>
                    <View style={styles.senderAvatar}>
                        <Text style={styles.senderInitial}>
                            {extractName(email?.from).charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <View style={styles.senderInfo}>
                        <Text style={styles.senderName}>{extractName(email?.from)}</Text>
                        <Text style={styles.senderEmail}>{extractEmailAddress(email?.from)}</Text>
                    </View>
                    <Text style={styles.emailDate}>{formatDate(email?.date)}</Text>
                </View>

                {/* To/CC */}
                <View style={styles.recipientsSection}>
                    <View style={styles.recipientRow}>
                        <Text style={styles.recipientLabel}>To:</Text>
                        <Text style={styles.recipientValue} numberOfLines={2}>
                            {email?.to || ''}
                        </Text>
                    </View>
                    {email?.cc && (
                        <View style={styles.recipientRow}>
                            <Text style={styles.recipientLabel}>Cc:</Text>
                            <Text style={styles.recipientValue} numberOfLines={2}>
                                {email.cc}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Account Badge */}
                <View style={styles.accountBadge}>
                    <Text style={styles.accountBadgeText}>
                        via {email?.accountEmail}
                    </Text>
                </View>

                {/* Attachments */}
                {email?.attachments && email.attachments.length > 0 && (
                    <View style={styles.attachmentsSection}>
                        <Text style={styles.attachmentsTitle}>
                            Attachments ({email.attachments.length})
                        </Text>
                        {email.attachments.map((attachment, index) => (
                            <TouchableOpacity
                                key={attachment.id || index}
                                style={styles.attachmentItem}
                                onPress={() => handleOpenAttachment(attachment)}
                                disabled={downloadingAttachment === attachment.id}
                            >
                                <Text style={styles.attachmentIcon}>📎</Text>
                                <View style={styles.attachmentInfo}>
                                    <Text style={styles.attachmentName} numberOfLines={1}>
                                        {attachment.filename}
                                    </Text>
                                    <Text style={styles.attachmentSize}>
                                        {formatFileSize(attachment.size)}
                                    </Text>
                                </View>
                                {downloadingAttachment === attachment.id ? (
                                    <ActivityIndicator size="small" color="#CD7F32" />
                                ) : (
                                    <Text style={styles.downloadIcon}>⬇️</Text>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Email Body */}
                <View style={styles.bodyContainer}>
                    <WebView
                        originWhitelist={['*']}
                        source={{ html: getHtmlContent() }}
                        style={styles.webView}
                        scrollEnabled={false}
                        onShouldStartLoadWithRequest={(request) => {
                            // Open links in browser
                            if (request.url !== 'about:blank') {
                                Linking.openURL(request.url);
                                return false;
                            }
                            return true;
                        }}
                        injectedJavaScript={`
                            setTimeout(function() {
                                window.ReactNativeWebView.postMessage(
                                    JSON.stringify({height: document.body.scrollHeight})
                                );
                            }, 500);
                        `}
                        onMessage={(event) => {
                            // Handle height updates if needed
                        }}
                    />
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actionBar}>
                <TouchableOpacity style={styles.actionButton} onPress={handleReply}>
                    <Text style={styles.actionButtonIcon}>↩️</Text>
                    <Text style={styles.actionButtonText}>Reply</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleForward}>
                    <Text style={styles.actionButtonIcon}>↪️</Text>
                    <Text style={styles.actionButtonText}>Forward</Text>
                </TouchableOpacity>
            </View>
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
        fontWeight: '600',
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
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
        paddingHorizontal: 20,
    },
    subject: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
        lineHeight: 28,
    },
    senderSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    senderAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#CD7F32',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    senderInitial: {
        color: '#121212',
        fontSize: 20,
        fontWeight: 'bold',
    },
    senderInfo: {
        flex: 1,
    },
    senderName: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    senderEmail: {
        color: '#999',
        fontSize: 13,
    },
    emailDate: {
        color: '#666',
        fontSize: 12,
    },
    recipientsSection: {
        backgroundColor: '#1E1E1E',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
    },
    recipientRow: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    recipientLabel: {
        color: '#666',
        fontSize: 13,
        width: 30,
    },
    recipientValue: {
        color: '#999',
        fontSize: 13,
        flex: 1,
    },
    accountBadge: {
        backgroundColor: '#2A2A2A',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginBottom: 16,
    },
    accountBadgeText: {
        color: '#666',
        fontSize: 12,
    },
    attachmentsSection: {
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    attachmentsTitle: {
        color: '#CD7F32',
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 12,
        letterSpacing: 1,
    },
    attachmentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2A2A2A',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    attachmentIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    attachmentInfo: {
        flex: 1,
    },
    attachmentName: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
    },
    attachmentSize: {
        color: '#666',
        fontSize: 12,
        marginTop: 2,
    },
    downloadIcon: {
        fontSize: 18,
    },
    bodyContainer: {
        backgroundColor: '#121212',
        borderRadius: 8,
        minHeight: 300,
        overflow: 'hidden',
    },
    webView: {
        backgroundColor: 'transparent',
        minHeight: 300,
    },
    actionBar: {
        flexDirection: 'row',
        backgroundColor: '#1E1E1E',
        borderTopWidth: 1,
        borderTopColor: '#333',
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2A2A2A',
        paddingVertical: 12,
        borderRadius: 8,
        marginHorizontal: 6,
    },
    actionButtonIcon: {
        fontSize: 18,
        marginRight: 8,
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default EmailViewerScreen;
