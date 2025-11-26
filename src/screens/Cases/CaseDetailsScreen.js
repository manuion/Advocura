import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ActionSheetIOS, Platform, PermissionsAndroid } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCaseById, deleteCase } from '../../services/casesService';
import { getCurrentUser } from '../../services/authService';
import { subscribeToCaseHearings, deleteHearing } from '../../services/hearingsService';
import { uploadDocument, subscribeToCaseDocuments, deleteDocument } from '../../services/documentsService';
import DocumentPicker from 'react-native-document-picker';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import RNFS from 'react-native-fs';

const CaseDetailsScreen = ({ navigation, route }) => {
    const { caseId } = route.params;
    const [caseData, setCaseData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    // Hearings state
    const [activeTab, setActiveTab] = useState('details');
    const [hearings, setHearings] = useState([]);
    const [hearingsLoading, setHearingsLoading] = useState(true);

    // Documents state
    const [documents, setDocuments] = useState([]);
    const [documentsLoading, setDocumentsLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadCase();

        const user = getCurrentUser();
        if (user) {
            // Subscribe to hearings
            const unsubscribeHearings = subscribeToCaseHearings(user.uid, caseId, (result) => {
                if (result.success) {
                    const hearingsWithDates = result.hearings.map(h => ({
                        ...h,
                        date: h.date?.toDate ? h.date.toDate() : h.date,
                    }));
                    setHearings(hearingsWithDates);
                }
                setHearingsLoading(false);
            });

            // Subscribe to documents
            const unsubscribeDocuments = subscribeToCaseDocuments(user.uid, caseId, (result) => {
                if (result.success) {
                    setDocuments(result.documents);
                }
                setDocumentsLoading(false);
            });

            return () => {
                unsubscribeHearings();
                unsubscribeDocuments();
            };
        }
    }, [caseId]);

    const loadCase = async () => {
        try {
            const user = getCurrentUser();
            if (!user) {
                Alert.alert('Error', 'You must be logged in');
                navigation.goBack();
                return;
            }

            const result = await getCaseById(user.uid, caseId);

            if (result.success) {
                // Convert Firestore timestamps to Date objects
                const caseWithDates = {
                    ...result.case,
                    filingDate: result.case.filingDate?.toDate ? result.case.filingDate.toDate() : result.case.filingDate,
                    nextHearingDate: result.case.nextHearingDate?.toDate ? result.case.nextHearingDate.toDate() : result.case.nextHearingDate,
                    createdAt: result.case.createdAt?.toDate ? result.case.createdAt.toDate() : result.case.createdAt,
                };
                setCaseData(caseWithDates);
            } else {
                Alert.alert('Error', result.error || 'Failed to load case');
                navigation.goBack();
            }
        } catch (error) {
            Alert.alert('Error', 'An unexpected error occurred');
            console.error('Load error:', error);
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Active': return '#CD7F32';
            case 'Won': return '#4CAF50';
            case 'Lost': return '#FF5252';
            case 'Pending': return '#FFC107';
            case 'Closed': return '#999';
            default: return '#CD7F32';
        }
    };

    const formatDate = (date) => {
        if (!date) return 'Not set';
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    const formatTime = (date) => {
        if (!date) return '';
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const handleEdit = () => {
        navigation.navigate('AddCase', { caseData });
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Case',
            'Are you sure you want to delete this case? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setDeleting(true);
                        try {
                            const user = getCurrentUser();
                            const result = await deleteCase(user.uid, caseId);

                            if (result.success) {
                                Alert.alert('Success', 'Case deleted successfully', [
                                    { text: 'OK', onPress: () => navigation.goBack() }
                                ]);
                            } else {
                                setDeleting(false);
                                Alert.alert('Error', result.error || 'Failed to delete case');
                            }
                        } catch (error) {
                            setDeleting(false);
                            Alert.alert('Error', 'An unexpected error occurred');
                            console.error('Delete error:', error);
                        }
                    },
                },
            ]
        );
    };

    const handleDeleteHearing = (hearingId) => {
        Alert.alert(
            'Delete Hearing',
            'Are you sure you want to delete this hearing?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const user = getCurrentUser();
                        await deleteHearing(user.uid, hearingId);
                    }
                }
            ]
        );
    };

    const requestCameraPermission = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                    {
                        title: 'Camera Permission',
                        message: 'This app needs camera access to take photos of documents',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn(err);
                return false;
            }
        }
        return true; // iOS handles permissions automatically
    };

    const requestStoragePermission = async () => {
        if (Platform.OS === 'android') {
            try {
                // Android 13+ uses different permissions
                const androidVersion = Platform.Version;
                const permission = androidVersion >= 33
                    ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
                    : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

                const granted = await PermissionsAndroid.request(
                    permission,
                    {
                        title: 'Storage Permission',
                        message: 'This app needs storage access to read documents and photos',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn(err);
                return false;
            }
        }
        return true; // iOS handles permissions automatically
    };

    const showUploadOptions = () => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['Choose Document', 'Choose from Gallery', 'Take Photo', 'Cancel'],
                    cancelButtonIndex: 3,
                },
                (buttonIndex) => {
                    if (buttonIndex === 0) {
                        handleDocumentPicker();
                    } else if (buttonIndex === 1) {
                        handleImagePicker();
                    } else if (buttonIndex === 2) {
                        handleCameraCapture();
                    }
                }
            );
        } else {
            // Android: Show alert with options
            Alert.alert(
                'Upload Document',
                'Choose an option',
                [
                    { text: 'Choose Document', onPress: handleDocumentPicker },
                    { text: 'Choose from Gallery', onPress: handleImagePicker },
                    { text: 'Take Photo', onPress: handleCameraCapture },
                    { text: 'Cancel', style: 'cancel' },
                ],
                { cancelable: true }
            );
        }
    };

    const handleCameraCapture = async () => {
        // Request camera permission first
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) {
            Alert.alert('Permission Denied', 'Camera permission is required to take photos');
            return;
        }

        const result = await launchCamera({
            mediaType: 'photo',
            quality: 0.8,
            saveToPhotos: true,
        });

        if (result.didCancel) {
            return;
        }

        if (result.errorCode) {
            Alert.alert('Error', result.errorMessage || 'Failed to capture photo');
            return;
        }

        const photo = result.assets[0];
        await uploadFile({
            uri: photo.uri,
            type: photo.type,
            name: photo.fileName || `photo_${Date.now()}.jpg`,
            size: photo.fileSize,
        });
    };

    const handleImagePicker = async () => {
        // Request storage permission first
        const hasPermission = await requestStoragePermission();
        if (!hasPermission) {
            Alert.alert('Permission Denied', 'Storage permission is required to access photos');
            return;
        }

        const result = await launchImageLibrary({
            mediaType: 'photo',
            quality: 0.8,
        });

        if (result.didCancel) {
            return;
        }

        if (result.errorCode) {
            Alert.alert('Error', result.errorMessage || 'Failed to pick image');
            return;
        }

        const photo = result.assets[0];
        await uploadFile({
            uri: photo.uri,
            type: photo.type,
            name: photo.fileName || `image_${Date.now()}.jpg`,
            size: photo.fileSize,
        });
    };

    const handleDocumentPicker = async () => {
        try {
            const res = await DocumentPicker.pick({
                type: [
                    DocumentPicker.types.pdf,
                    DocumentPicker.types.images,
                    DocumentPicker.types.doc,
                    DocumentPicker.types.docx,
                    DocumentPicker.types.xls,
                    DocumentPicker.types.xlsx,
                    DocumentPicker.types.ppt,
                    DocumentPicker.types.pptx,
                ],
                copyTo: 'cachesDirectory', // Important for Android permission persistence
            });

            const file = res[0];
            await uploadFile(file);
        } catch (err) {
            if (DocumentPicker.isCancel(err)) {
                // User cancelled the picker, ignore
            } else {
                console.error('Document picker error:', err);
                Alert.alert('Error', err.message || 'Failed to pick document');
            }
        }
    };

    const uploadFile = async (file) => {
        try {
            // Check size (limit to 10MB)
            if (file.size > 10 * 1024 * 1024) {
                Alert.alert('Error', 'File size exceeds 10MB limit');
                return;
            }

            setUploading(true);

            // Handle file URI for Android
            let fileToUpload = { ...file };

            // For DocumentPicker on Android, use fileCopyUri if available
            if (Platform.OS === 'android' && file.fileCopyUri) {
                fileToUpload.uri = decodeURIComponent(file.fileCopyUri);
            }
            // For ImagePicker or other content URIs on Android, copy to cache if needed
            else if (Platform.OS === 'android' && file.uri.startsWith('content://')) {
                try {
                    const fileName = file.name || `temp_${Date.now()}`;
                    const destPath = `${RNFS.CachesDirectoryPath}/${fileName}`;
                    await RNFS.copyFile(file.uri, destPath);
                    fileToUpload.uri = `file://${destPath}`;
                } catch (copyError) {
                    console.error('Failed to copy file to cache:', copyError);
                    setUploading(false);
                    Alert.alert('Error', 'Failed to process file. Please try again or use a different file.');
                    return;
                }
            }

            const user = getCurrentUser();
            const result = await uploadDocument(user.uid, caseId, fileToUpload);
            setUploading(false);

            if (result.success) {
                Alert.alert('Success', 'Document uploaded successfully');
            } else {
                Alert.alert('Error', result.error || 'Failed to upload document');
            }
        } catch (error) {
            setUploading(false);
            console.error('Upload error:', error);
            Alert.alert('Error', 'Failed to upload file');
        }
    };

    const handleUploadDocument = showUploadOptions;

    const handleDeleteDocument = (documentId, storagePath) => {
        Alert.alert(
            'Delete Document',
            'Are you sure you want to delete this document?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const user = getCurrentUser();
                        await deleteDocument(user.uid, documentId, storagePath);
                    }
                }
            ]
        );
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#CD7F32" />
                    <Text style={styles.loadingText}>Loading case...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!caseData) {
        return null;
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                        <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                        <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Case Title Section (Always Visible) */}
            <View style={styles.titleSection}>
                <View style={styles.topRow}>
                    <Text style={styles.caseNumber}>{caseData.caseNumber}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(caseData.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(caseData.status) }]}>
                            {caseData.status}
                        </Text>
                    </View>
                </View>
                <Text style={styles.title}>{caseData.title}</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'details' && styles.activeTab]}
                    onPress={() => setActiveTab('details')}
                >
                    <Text style={[styles.tabText, activeTab === 'details' && styles.activeTabText]}>DETAILS</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'hearings' && styles.activeTab]}
                    onPress={() => setActiveTab('hearings')}
                >
                    <Text style={[styles.tabText, activeTab === 'hearings' && styles.activeTabText]}>HEARINGS</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'documents' && styles.activeTab]}
                    onPress={() => setActiveTab('documents')}
                >
                    <Text style={[styles.tabText, activeTab === 'documents' && styles.activeTabText]}>DOCUMENTS</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {activeTab === 'details' && (
                    <>
                        {/* Description */}
                        {caseData.description && (
                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>DESCRIPTION</Text>
                                <Text style={styles.description}>{caseData.description}</Text>
                            </View>
                        )}

                        {/* Case Details Card */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>CASE DETAILS</Text>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Case Type</Text>
                                <Text style={styles.detailValue}>{caseData.caseType}</Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Client</Text>
                                <Text style={styles.detailValue}>{caseData.clientName}</Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Court</Text>
                                <Text style={styles.detailValue}>{caseData.courtName}</Text>
                            </View>

                            {caseData.judgeName && (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Judge</Text>
                                    <Text style={styles.detailValue}>{caseData.judgeName}</Text>
                                </View>
                            )}
                        </View>

                        {/* Important Dates Card */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>IMPORTANT DATES</Text>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Filing Date</Text>
                                <Text style={styles.detailValue}>{formatDate(caseData.filingDate)}</Text>
                            </View>

                            {caseData.nextHearingDate && (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Next Hearing</Text>
                                    <Text style={[styles.detailValue, { color: '#CD7F32', fontWeight: '600' }]}>
                                        {formatDate(caseData.nextHearingDate)}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </>
                )}

                {activeTab === 'hearings' && (
                    <>
                        {/* Add Hearing Button */}
                        <TouchableOpacity
                            style={styles.addHearingButton}
                            onPress={() => navigation.navigate('AddHearing', { caseId })}
                        >
                            <Text style={styles.addHearingText}>+ ADD HEARING</Text>
                        </TouchableOpacity>

                        {/* Hearings List */}
                        {hearings.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>No hearings scheduled</Text>
                            </View>
                        ) : (
                            hearings.map((hearing) => (
                                <TouchableOpacity
                                    key={hearing.id}
                                    style={styles.hearingCard}
                                    onPress={() => navigation.navigate('AddHearing', { caseId, hearingData: hearing })}
                                >
                                    <View style={styles.hearingHeader}>
                                        <View style={styles.dateBox}>
                                            <Text style={styles.dateDay}>{hearing.date?.getDate()}</Text>
                                            <Text style={styles.dateMonth}>
                                                {hearing.date?.toLocaleString('default', { month: 'short' })}
                                            </Text>
                                        </View>
                                        <View style={styles.hearingInfo}>
                                            <Text style={styles.hearingType}>{hearing.type}</Text>
                                            <Text style={styles.hearingTime}>{formatTime(hearing.date)}</Text>
                                            <Text style={styles.hearingCourt}>{hearing.courtName}</Text>
                                        </View>
                                        <View style={styles.hearingStatus}>
                                            <Text style={[styles.statusText, { color: getStatusColor(hearing.status) }]}>
                                                {hearing.status}
                                            </Text>
                                        </View>
                                    </View>
                                    {hearing.notes && (
                                        <Text style={styles.hearingNotes} numberOfLines={2}>
                                            {hearing.notes}
                                        </Text>
                                    )}
                                    <TouchableOpacity
                                        style={styles.deleteHearingButton}
                                        onPress={() => handleDeleteHearing(hearing.id)}
                                    >
                                        <Text style={styles.deleteHearingText}>Delete</Text>
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            ))
                        )}
                    </>
                )}
                {activeTab === 'documents' && (
                    <>
                        {/* Upload Document Button */}
                        <TouchableOpacity
                            style={styles.addHearingButton}
                            onPress={handleUploadDocument}
                            disabled={uploading}
                        >
                            {uploading ? (
                                <ActivityIndicator color="#CD7F32" />
                            ) : (
                                <Text style={styles.addHearingText}>+ UPLOAD DOCUMENT</Text>
                            )}
                        </TouchableOpacity>

                        {/* Documents List */}
                        {documents.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>No documents uploaded</Text>
                            </View>
                        ) : (
                            documents.map((doc) => (
                                <View key={doc.id} style={styles.documentCard}>
                                    <View style={styles.documentIcon}>
                                        <Text style={styles.documentIconText}>📄</Text>
                                    </View>
                                    <View style={styles.documentInfo}>
                                        <Text style={styles.documentName} numberOfLines={1}>{doc.name}</Text>
                                        <Text style={styles.documentMeta}>
                                            {formatFileSize(doc.size)} • {doc.createdAt?.toDate ? doc.createdAt.toDate().toLocaleDateString() : 'Just now'}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.deleteDocButton}
                                        onPress={() => handleDeleteDocument(doc.id, doc.storagePath)}
                                    >
                                        <Text style={styles.deleteDocText}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                    </>
                )}

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
        fontWeight: '600',
    },
    headerActions: {
        flexDirection: 'row',
        gap: 12,
    },
    editButton: {
        backgroundColor: '#CD7F32',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    editButtonText: {
        color: '#121212',
        fontWeight: 'bold',
        fontSize: 13,
    },
    deleteButton: {
        backgroundColor: '#FF5252',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    deleteButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 13,
    },
    titleSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    caseNumber: {
        color: '#CD7F32',
        fontSize: 14,
        fontWeight: 'bold',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
        lineHeight: 32,
    },
    tabs: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    tab: {
        marginRight: 24,
        paddingBottom: 12,
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#CD7F32',
    },
    tabText: {
        color: '#666',
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    activeTabText: {
        color: '#CD7F32',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionLabel: {
        color: '#CD7F32',
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 1.2,
        marginBottom: 8,
    },
    description: {
        color: '#999',
        fontSize: 15,
        lineHeight: 24,
    },
    card: {
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    cardTitle: {
        color: '#CD7F32',
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 1.2,
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#2A2A2A',
    },
    detailLabel: {
        color: '#666',
        fontSize: 14,
    },
    detailValue: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
        textAlign: 'right',
    },
    addHearingButton: {
        backgroundColor: '#1E1E1E',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#CD7F32',
        borderStyle: 'dashed',
    },
    addHearingText: {
        color: '#CD7F32',
        fontWeight: 'bold',
        fontSize: 14,
        letterSpacing: 1,
    },
    hearingCard: {
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    hearingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateBox: {
        backgroundColor: '#2A2A2A',
        padding: 8,
        borderRadius: 8,
        alignItems: 'center',
        minWidth: 50,
        marginRight: 12,
    },
    dateDay: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    dateMonth: {
        color: '#CD7F32',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    hearingInfo: {
        flex: 1,
    },
    hearingType: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    hearingTime: {
        color: '#999',
        fontSize: 12,
        marginBottom: 2,
    },
    hearingCourt: {
        color: '#666',
        fontSize: 12,
    },
    hearingStatus: {
        marginLeft: 8,
    },
    hearingNotes: {
        color: '#999',
        fontSize: 13,
        marginTop: 12,
        lineHeight: 18,
    },
    deleteHearingButton: {
        marginTop: 12,
        alignSelf: 'flex-end',
    },
    deleteHearingText: {
        color: '#FF5252',
        fontSize: 12,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        color: '#666',
        fontSize: 16,
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
    documentCard: {
        flexDirection: 'row',
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#333',
        alignItems: 'center',
    },
    documentIcon: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#2A2A2A',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    documentIconText: {
        fontSize: 20,
    },
    documentInfo: {
        flex: 1,
    },
    documentName: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '500',
        marginBottom: 4,
    },
    documentMeta: {
        color: '#666',
        fontSize: 12,
    },
    deleteDocButton: {
        padding: 8,
    },
    deleteDocText: {
        color: '#FF5252',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default CaseDetailsScreen;
