import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity, Image, Alert, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';
import { WebView } from 'react-native-webview';
import { getCachedDocument, initializeCache, isDocumentCached } from '../../services/documentCacheService';
import { getCurrentUser } from '../../services/authService';

const DocumentViewerScreen = ({ navigation, route }) => {
    const { document } = route.params;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sharing, setSharing] = useState(false);
    const [localPath, setLocalPath] = useState(null);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);

    // Check if document is an image
    const isImage = document.type?.startsWith('image/') ||
        document.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

    const isPDF = document.type === 'application/pdf' ||
        document.name?.match(/\.pdf$/i);

    // Check if it's a document that can be viewed with Google Docs Viewer
    const isOtherDocument = document.name?.match(/\.(doc|docx|xls|xlsx|ppt|pptx)$/i);

    // Check if document can be viewed (PDF or other document types)
    const canViewInWebView = isPDF || isOtherDocument;

    // Load document from cache on mount
    useEffect(() => {
        loadDocument();
    }, [document.id]);

    const loadDocument = async () => {
        setLoading(true);
        setError(null);

        try {
            // Get current user
            const user = getCurrentUser();
            if (!user) {
                setError('User not authenticated');
                setLoading(false);
                return;
            }

            console.log('═══════════════════════════════════════');
            console.log('🔍 [CACHE TEST] Starting document load');
            console.log('📄 Document ID:', document.id);
            console.log('📝 Document Name:', document.name);
            console.log('═══════════════════════════════════════');

            // Initialize cache for user
            await initializeCache(user.uid);

            // Check if already cached
            const isCached = await isDocumentCached(document.id);
            console.log('💾 [CACHE TEST] Is document already cached?', isCached ? '✅ YES' : '❌ NO');

            // Get cached document or download
            const cachedPath = await getCachedDocument(
                document.id,
                {
                    ...document,
                    userId: user.uid,
                },
                false // Don't force download
            );

            console.log('═══════════════════════════════════════');
            console.log('✅ [CACHE TEST] Document loaded successfully!');
            console.log('📂 Local file path:', cachedPath);
            console.log('🎯 Source:', isCached ? 'LOADED FROM CACHE (No Firebase hit!)' : 'DOWNLOADED FROM FIREBASE (First time)');
            console.log('═══════════════════════════════════════');

            setLocalPath(cachedPath);
            setLoading(false);
        } catch (err) {
            console.error('═══════════════════════════════════════');
            console.error('❌ [CACHE TEST] Error loading document');
            console.error('Error message:', err.message);
            console.error('Error details:', err);
            console.error('═══════════════════════════════════════');

            setError(err.message || 'Failed to load document');
            setLoading(false);

            // Show user-friendly error
            if (err.message?.includes('Network')) {
                setError('No internet connection. Please check your network and try again.');
            } else if (err.message?.includes('storage')) {
                setError('Device storage full. Please free up space and try again.');
            }
        }
    };

    const handleShare = async () => {
        setSharing(true);
        try {
            // Use cached file if available, otherwise download
            let fileToShare = localPath;

            if (!fileToShare) {
                // Fallback: download to temp location
                const tempPath = `${RNFS.CachesDirectoryPath}/${document.name}`;

                const downloadResult = await RNFS.downloadFile({
                    fromUrl: document.downloadUrl,
                    toFile: tempPath,
                }).promise;

                if (downloadResult.statusCode !== 200) {
                    Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to download file for sharing' });
                    setSharing(false);
                    return;
                }

                fileToShare = tempPath;
            }

            // Share the file
            await Share.open({
                url: Platform.OS === 'android' ? `file://${fileToShare}` : fileToShare,
                title: document.name,
                filename: document.name,
            });
        } catch (err) {
            if (err.message !== 'User did not share') {
                console.error('Share error:', err);
                Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to share document' });
            }
        } finally {
            setSharing(false);
        }
    };

    const renderDocumentContent = () => {
        // Wait for document to load
        if (!localPath) {
            return null;
        }

        if (isImage) {
            // Image Viewer - use local file path
            const imageUri = Platform.OS === 'android' ? `file://${localPath}` : localPath;

            return (
                <Image
                    source={{ uri: imageUri }}
                    style={styles.image}
                    resizeMode="contain"
                    onLoadStart={() => setLoading(true)}
                    onLoadEnd={() => setLoading(false)}
                    onError={() => {
                        setLoading(false);
                        setError('Failed to load image');
                    }}
                />
            );
        } else if (isPDF || isOtherDocument) {
            // PDF and Office documents - use Google Docs Viewer (requires online)
            // Note: The document is cached locally, but viewing still requires internet
            const encodedUrl = encodeURIComponent(document.downloadUrl);
            const viewerUrl = `https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`;

            return (
                <WebView
                    source={{ uri: viewerUrl }}
                    style={styles.webview}
                    onLoadStart={() => setLoading(true)}
                    onLoadEnd={() => setLoading(false)}
                    onError={(syntheticEvent) => {
                        const { nativeEvent } = syntheticEvent;
                        console.error('WebView error:', nativeEvent);
                        setError('Failed to load document. Make sure you are online.');
                        setLoading(false);
                    }}
                    startInLoadingState={true}
                    renderLoading={() => (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#CD7F32" />
                            <Text style={styles.loadingText}>Loading document...</Text>
                        </View>
                    )}
                />
            );
        } else {
            // Unsupported document type
            return (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>
                        Document type not supported for preview
                    </Text>
                    <Text style={styles.errorSubtext}>
                        You can still share or download this file
                    </Text>
                </View>
            );
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title} numberOfLines={1}>
                    {document.name}
                </Text>
                <TouchableOpacity onPress={handleShare} disabled={sharing}>
                    <Text style={[styles.shareButton, sharing && styles.shareButtonDisabled]}>
                        {sharing ? '⏳' : '📤'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Document Content */}
            <View style={styles.content}>
                {renderDocumentContent()}

                {/* Loading Indicator */}
                {loading && !error && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#CD7F32" />
                        <Text style={styles.loadingText}>Loading document...</Text>
                    </View>
                )}

                {/* Error Message */}
                {error && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={() => {
                                setError(null);
                                setLoading(true);
                                navigation.goBack();
                            }}
                        >
                            <Text style={styles.retryButtonText}>Go Back</Text>
                        </TouchableOpacity>
                    </View>
                )}
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
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    backButton: {
        color: '#CD7F32',
        fontSize: 16,
        fontWeight: '600',
    },
    title: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
        marginHorizontal: 16,
        textAlign: 'center',
    },
    shareButton: {
        fontSize: 20,
    },
    shareButtonDisabled: {
        opacity: 0.5,
    },
    content: {
        flex: 1,
        position: 'relative',
    },
    image: {
        flex: 1,
        width: '100%',
        height: '100%',
        backgroundColor: '#1E1E1E',
    },
    pdf: {
        flex: 1,
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
        backgroundColor: '#1E1E1E',
    },
    webview: {
        flex: 1,
        backgroundColor: '#1E1E1E',
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#121212',
    },
    loadingText: {
        color: '#999',
        fontSize: 14,
        marginTop: 12,
    },
    errorContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#121212',
        padding: 20,
    },
    errorText: {
        color: '#FF5252',
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
    },
    errorSubtext: {
        color: '#999',
        fontSize: 14,
        marginBottom: 20,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#CD7F32',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default DocumentViewerScreen;
