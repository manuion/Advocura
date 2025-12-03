import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ActionSheetIOS, Platform, PermissionsAndroid, Linking, NativeModules, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { getCaseById, deleteCase } from '../../services/casesService';
import { getCurrentUser } from '../../services/authService';
import { subscribeToCaseHearings, deleteHearing } from '../../services/hearingsService';
import { uploadDocument, subscribeToCaseDocuments, deleteDocument } from '../../services/documentsService';
import DocumentPicker from 'react-native-document-picker';
import { launchImageLibrary } from 'react-native-image-picker';
import DocumentScanner from 'react-native-document-scanner-plugin';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { jsPDF } from 'jspdf';
import { searchEmails, getLinkedAccounts } from '../../services/gmailService';
import { cacheEmails, getCachedEmailsForCase } from '../../services/emailCacheService';

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
    const [multiSelectMode, setMultiSelectMode] = useState(false);
    const [selectedDocuments, setSelectedDocuments] = useState([]);

    // Rename modal state (for Android)
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [renameFileName, setRenameFileName] = useState('');
    const [renameCallback, setRenameCallback] = useState(null);

    // Emails state
    const [emails, setEmails] = useState([]);
    const [emailThreads, setEmailThreads] = useState([]); // Grouped by thread
    const [emailsLoading, setEmailsLoading] = useState(false);
    const [hasLinkedAccounts, setHasLinkedAccounts] = useState(false);
    const [emailsRefreshing, setEmailsRefreshing] = useState(false);

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
                Toast.show({ type: 'error', text1: 'Error', text2: 'You must be logged in' });
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
                Toast.show({ type: 'error', text1: 'Error', text2: result.error || 'Failed to load case' });
                navigation.goBack();
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'An unexpected error occurred' });
            console.error('Load error:', error);
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    // Group emails by threadId
    const groupEmailsByThread = (emailList) => {
        const threadMap = {};

        for (const email of emailList) {
            const threadId = email.threadId;
            if (!threadMap[threadId]) {
                threadMap[threadId] = {
                    threadId,
                    emails: [],
                    latestEmail: email,
                    subject: email.subject,
                    accountEmail: email.accountEmail,
                    hasUnread: false,
                };
            }
            threadMap[threadId].emails.push(email);

            // Track if thread has unread emails
            if (email.isUnread) {
                threadMap[threadId].hasUnread = true;
            }

            // Update latest email (most recent by date)
            if (new Date(email.date) > new Date(threadMap[threadId].latestEmail.date)) {
                threadMap[threadId].latestEmail = email;
            }
        }

        // Convert to array and sort by latest email date (newest first)
        const threads = Object.values(threadMap);
        threads.sort((a, b) => new Date(b.latestEmail.date) - new Date(a.latestEmail.date));

        return threads;
    };

    const loadEmails = async (keyword) => {
        if (!keyword) {
            setEmails([]);
            setEmailThreads([]);
            return;
        }

        setEmailsLoading(true);

        try {
            // First check linked accounts
            const accountsResult = await getLinkedAccounts();
            setHasLinkedAccounts(accountsResult.accounts?.length > 0);

            if (!accountsResult.accounts?.length) {
                setEmails([]);
                setEmailThreads([]);
                setEmailsLoading(false);
                return;
            }

            // Try to get cached emails first
            const cachedEmails = await getCachedEmailsForCase(keyword);
            if (cachedEmails.length > 0) {
                setEmails(cachedEmails);
                setEmailThreads(groupEmailsByThread(cachedEmails));
            }

            // Fetch fresh emails from Gmail
            const result = await searchEmails(keyword, 50);
            if (result.success && result.emails.length > 0) {
                setEmails(result.emails);
                setEmailThreads(groupEmailsByThread(result.emails));
                // Cache the emails for offline access
                await cacheEmails(result.emails, keyword);
            } else if (cachedEmails.length === 0) {
                setEmails([]);
                setEmailThreads([]);
            }
        } catch (error) {
            console.error('Error loading emails:', error);
            // Try to show cached emails on error
            const cachedEmails = await getCachedEmailsForCase(keyword);
            if (cachedEmails.length > 0) {
                setEmails(cachedEmails);
                setEmailThreads(groupEmailsByThread(cachedEmails));
            }
        } finally {
            setEmailsLoading(false);
            setEmailsRefreshing(false);
        }
    };

    const handleRefreshEmails = async () => {
        if (!caseData?.emailKeyword) return;
        setEmailsRefreshing(true);
        await loadEmails(caseData.emailKeyword);
    };

    const formatEmailDate = (dateStr) => {
        try {
            const date = new Date(dateStr);
            const now = new Date();
            const isToday = date.toDateString() === now.toDateString();

            if (isToday) {
                return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            }
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    const extractSenderName = (fromStr) => {
        if (!fromStr) return 'Unknown';
        // Extract name from "Name <email>" format
        const match = fromStr.match(/^([^<]+)</);
        if (match) {
            return match[1].trim().replace(/"/g, '');
        }
        // Just return email without domain if no name
        const emailMatch = fromStr.match(/([^@]+)@/);
        return emailMatch ? emailMatch[1] : fromStr;
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
                                Toast.show({ type: 'success', text1: 'Success', text2: 'Case deleted successfully' });
                                navigation.goBack();
                            } else {
                                setDeleting(false);
                                Toast.show({ type: 'error', text1: 'Error', text2: result.error || 'Failed to delete case' });
                            }
                        } catch (error) {
                            setDeleting(false);
                            Toast.show({ type: 'error', text1: 'Error', text2: 'An unexpected error occurred' });
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
                    options: ['Choose Document', 'Choose from Gallery', 'Scan Document', 'Cancel'],
                    cancelButtonIndex: 3,
                },
                (buttonIndex) => {
                    if (buttonIndex === 0) {
                        handleDocumentPicker();
                    } else if (buttonIndex === 1) {
                        handleImagePicker();
                    } else if (buttonIndex === 2) {
                        handleDocumentScan();
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
                    { text: 'Scan Document', onPress: handleDocumentScan },
                    { text: 'Cancel', style: 'cancel' },
                ],
                { cancelable: true }
            );
        }
    };

    const handleDocumentScan = async () => {
        try {
            // Request camera permission first
            const hasPermission = await requestCameraPermission();
            if (!hasPermission) {
                Toast.show({ type: 'error', text1: 'Permission Denied', text2: 'Camera permission is required to scan documents' });
                return;
            }

            // Launch document scanner
            const { scannedImages } = await DocumentScanner.scanDocument({
                maxNumDocuments: 10, // Allow up to 10 pages
                letUserAdjustCrop: true, // Let user adjust the detected edges
                croppedImageQuality: 100, // High quality output
            });

            if (!scannedImages || scannedImages.length === 0) {
                // User cancelled or no images scanned
                return;
            }

            console.log(`Scanned ${scannedImages.length} page(s)`);

            // Generate a unique document ID for this scan session
            const scanId = Date.now();
            const defaultPdfName = `scan_${scanId}.pdf`;

            // Prompt for PDF name before creating
            promptForFileName(defaultPdfName, async (pdfFileName) => {
                setUploading(true);

                try {
                    // Create PDF from scanned images
                    const pdfPath = `${RNFS.DocumentDirectoryPath}/${pdfFileName}`;

                    console.log('Creating PDF from scanned pages...');

                    // Create a new PDF document (A4 size: 210mm x 297mm)
                    const doc = new jsPDF({
                        orientation: 'portrait',
                        unit: 'mm',
                        format: 'a4'
                    });

                    // Add each scanned image as a page in the PDF
                    for (let i = 0; i < scannedImages.length; i++) {
                        let imageUri = scannedImages[i];
                        if (imageUri.startsWith('file://')) {
                            imageUri = imageUri.replace('file://', '');
                        }

                        console.log(`Adding page ${i + 1}/${scannedImages.length} to PDF`);

                        // Read image as base64
                        const imageBase64 = await RNFS.readFile(imageUri, 'base64');

                        // Add new page if not the first image
                        if (i > 0) {
                            doc.addPage();
                        }

                        // Add image to PDF (fit to A4 page)
                        const imageData = `data:image/jpeg;base64,${imageBase64}`;
                        doc.addImage(imageData, 'JPEG', 0, 0, 210, 297);
                    }

                    // Get PDF as base64 string
                    const pdfBase64 = doc.output('datauristring').split(',')[1];

                    // Write PDF to file system
                    await RNFS.writeFile(pdfPath, pdfBase64, 'base64');
                    console.log('PDF created successfully');

                    // Get PDF file stats
                    const pdfStats = await RNFS.stat(pdfPath);

                    // Upload the PDF
                    console.log(`Uploading PDF: ${pdfFileName} (${pdfStats.size} bytes)`);

                    await uploadFile({
                        uri: `file://${pdfPath}`,
                        type: 'application/pdf',
                        name: pdfFileName,
                        size: pdfStats.size,
                    });

                    console.log('PDF uploaded successfully');

                    // Clean up the temporary PDF file
                    await RNFS.unlink(pdfPath);

                    Toast.show({
                        type: 'success',
                        text1: 'Success',
                        text2: `${scannedImages.length} page(s) scanned and combined into PDF`
                    });
                } catch (error) {
                    console.error('PDF creation/upload error:', error);
                    Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to create or upload PDF: ' + error.message });
                } finally {
                    setUploading(false);
                }
            });
        } catch (error) {
            console.error('Document scan error:', error);
            setUploading(false);
            if (error.message !== 'User canceled') {
                Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to scan document: ' + error.message });
            }
        }
    };

    const promptForFileName = (originalName, callback) => {
        // Extract extension
        const lastDot = originalName.lastIndexOf('.');
        const nameWithoutExt = lastDot > 0 ? originalName.substring(0, lastDot) : originalName;
        const extension = lastDot > 0 ? originalName.substring(lastDot) : '';

        if (Platform.OS === 'ios') {
            Alert.prompt(
                'Name this file',
                'Enter a name for this file (leave empty to keep original)',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                        onPress: () => callback(originalName)
                    },
                    {
                        text: 'Save',
                        onPress: (newName) => {
                            if (newName && newName.trim()) {
                                callback(newName.trim() + extension);
                            } else {
                                callback(originalName);
                            }
                        }
                    }
                ],
                'plain-text',
                nameWithoutExt
            );
        } else {
            // Android - use custom modal
            setRenameFileName(nameWithoutExt);
            setRenameCallback(() => (newName) => {
                if (newName && newName.trim()) {
                    callback(newName.trim() + extension);
                } else {
                    callback(originalName);
                }
            });
            setShowRenameModal(true);
        }
    };

    const handleRenameSave = () => {
        setShowRenameModal(false);
        if (renameCallback) {
            renameCallback(renameFileName);
        }
    };

    const handleRenameCancel = () => {
        setShowRenameModal(false);
        if (renameCallback) {
            renameCallback(''); // Empty will use original name
        }
    };

    const handleImagePicker = async () => {
        // Request storage permission first
        const hasPermission = await requestStoragePermission();
        if (!hasPermission) {
            Toast.show({ type: 'error', text1: 'Permission Denied', text2: 'Storage permission is required to access photos' });
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
            Toast.show({ type: 'error', text1: 'Error', text2: result.errorMessage || 'Failed to pick image' });
            return;
        }

        const photo = result.assets[0];
        const originalName = photo.fileName || `image_${Date.now()}.jpg`;

        // Prompt for file name
        promptForFileName(originalName, (finalName) => {
            uploadFile({
                uri: photo.uri,
                type: photo.type,
                name: finalName,
                size: photo.fileSize,
            });
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
            const originalName = file.name;

            // Prompt for file name
            promptForFileName(originalName, (finalName) => {
                uploadFile({ ...file, name: finalName });
            });
        } catch (err) {
            if (DocumentPicker.isCancel(err)) {
                // User cancelled the picker, ignore
            } else {
                console.error('Document picker error:', err);
                Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Failed to pick document' });
            }
        }
    };

    const uploadFile = async (file) => {
        try {
            // Check size (limit to 10MB)
            if (file.size > 10 * 1024 * 1024) {
                Toast.show({ type: 'error', text1: 'Error', text2: 'File size exceeds 10MB limit' });
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
                    Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to process file. Please try again or use a different file.' });
                    return;
                }
            }

            const user = getCurrentUser();
            const result = await uploadDocument(user.uid, caseId, fileToUpload);
            setUploading(false);

            if (result.success) {
                Toast.show({ type: 'success', text1: 'Success', text2: 'Document uploaded successfully' });
            } else {
                Toast.show({ type: 'error', text1: 'Error', text2: result.error || 'Failed to upload document' });
            }
        } catch (error) {
            setUploading(false);
            console.error('Upload error:', error);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to upload file' });
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

    const handleViewDocument = async (doc) => {
        if (!doc.downloadUrl) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Document URL not available' });
            return;
        }

        // Navigate to DocumentViewer for both PDFs and images
        navigation.navigate('DocumentViewer', { document: doc });
    };

    const handleShareDocument = async (doc) => {
        try {
            if (!doc.downloadUrl) {
                Toast.show({ type: 'error', text1: 'Error', text2: 'Document URL not available' });
                return;
            }

            // First download the file to share actual file (not URL)
            const tempPath = `${RNFS.CachesDirectoryPath}/${doc.name}`;

            // Download file
            const downloadResult = await RNFS.downloadFile({
                fromUrl: doc.downloadUrl,
                toFile: tempPath,
            }).promise;

            if (downloadResult.statusCode === 200) {
                // Share the local file
                await Share.open({
                    url: Platform.OS === 'android' ? `file://${tempPath}` : tempPath,
                    title: doc.name,
                    subject: doc.name,
                    filename: doc.name,
                });

                // Clean up temp file after sharing
                setTimeout(() => {
                    RNFS.unlink(tempPath).catch(() => { });
                }, 5000);
            } else {
                Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to prepare document for sharing' });
            }
        } catch (error) {
            if (error.message !== 'User did not share') {
                console.error('Share error:', error);
                Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to share document' });
            }
        }
    };

    // Multi-select handlers
    const toggleMultiSelectMode = () => {
        setMultiSelectMode(!multiSelectMode);
        setSelectedDocuments([]); // Clear selection when toggling mode
    };

    const toggleDocumentSelection = (docId) => {
        setSelectedDocuments(prev => {
            if (prev.includes(docId)) {
                return prev.filter(id => id !== docId);
            } else {
                return [...prev, docId];
            }
        });
    };

    const handleBulkDelete = async () => {
        if (selectedDocuments.length === 0) return;

        Alert.alert(
            'Delete Documents',
            `Are you sure you want to delete ${selectedDocuments.length} document(s)?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const user = getCurrentUser();
                            if (!user) return;

                            // Delete each selected document
                            for (const docId of selectedDocuments) {
                                const doc = documents.find(d => d.id === docId);
                                if (doc) {
                                    await deleteDocument(user.uid, docId, doc.storagePath);
                                }
                            }

                            setSelectedDocuments([]);
                            setMultiSelectMode(false);
                            Toast.show({ type: 'success', text1: 'Success', text2: `${selectedDocuments.length} document(s) deleted` });
                        } catch (error) {
                            console.error('Bulk delete error:', error);
                            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to delete some documents' });
                        }
                    }
                }
            ]
        );
    };

    const handleBulkShare = async () => {
        if (selectedDocuments.length === 0) return;

        try {
            const docsToShare = documents.filter(d => selectedDocuments.includes(d.id));
            const filePaths = [];

            // Download all selected documents
            for (const doc of docsToShare) {
                if (!doc.downloadUrl) continue;

                const tempPath = `${RNFS.CachesDirectoryPath}/${doc.name}`;
                const downloadResult = await RNFS.downloadFile({
                    fromUrl: doc.downloadUrl,
                    toFile: tempPath,
                }).promise;

                if (downloadResult.statusCode === 200) {
                    filePaths.push(Platform.OS === 'android' ? `file://${tempPath}` : tempPath);
                }
            }

            if (filePaths.length > 0) {
                // Share all files
                await Share.open({
                    urls: filePaths,
                    title: `${filePaths.length} documents`,
                });

                // Clean up temp files after sharing
                setTimeout(() => {
                    filePaths.forEach(path => {
                        const cleanPath = path.replace('file://', '');
                        RNFS.unlink(cleanPath).catch(() => { });
                    });
                }, 5000);
            } else {
                Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to prepare documents for sharing' });
            }
        } catch (error) {
            if (error.message !== 'User did not share') {
                console.error('Bulk share error:', error);
                Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to share documents' });
            }
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getDocumentIcon = (doc) => {
        const fileName = doc.name?.toLowerCase() || '';
        const fileType = doc.type?.toLowerCase() || '';

        // PDF
        if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
            return '📕';
        }

        // Images
        if (fileType.startsWith('image/') || fileName.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i)) {
            return '🖼️';
        }

        // Word documents
        if (fileType.includes('word') || fileName.match(/\.(doc|docx)$/i)) {
            return '📘';
        }

        // Excel spreadsheets
        if (fileType.includes('sheet') || fileType.includes('excel') || fileName.match(/\.(xls|xlsx|csv)$/i)) {
            return '📊';
        }

        // PowerPoint presentations
        if (fileType.includes('presentation') || fileType.includes('powerpoint') || fileName.match(/\.(ppt|pptx)$/i)) {
            return '📙';
        }

        // Text files
        if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
            return '📝';
        }

        // Compressed files
        if (fileName.match(/\.(zip|rar|7z|tar|gz)$/i)) {
            return '📦';
        }

        // Default for unknown types
        return '📄';
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
                    <Text style={[styles.tabText, activeTab === 'documents' && styles.activeTabText]}>DOCS</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'emails' && styles.activeTab]}
                    onPress={() => {
                        setActiveTab('emails');
                        if (emails.length === 0 && caseData?.emailKeyword) {
                            loadEmails(caseData.emailKeyword);
                        }
                    }}
                >
                    <Text style={[styles.tabText, activeTab === 'emails' && styles.activeTabText]}>EMAILS</Text>
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
                        {/* Upload Document Button and Multi-Select Toggle */}
                        <View style={styles.documentsHeader}>
                            <TouchableOpacity
                                style={[styles.addHearingButton, { flex: 1 }]}
                                onPress={handleUploadDocument}
                                disabled={uploading}
                            >
                                {uploading ? (
                                    <ActivityIndicator color="#CD7F32" />
                                ) : (
                                    <Text style={styles.addHearingText}>+ UPLOAD DOCUMENT</Text>
                                )}
                            </TouchableOpacity>
                            {documents.length > 0 && (
                                <TouchableOpacity
                                    style={[styles.multiSelectButton, multiSelectMode && styles.multiSelectButtonActive]}
                                    onPress={toggleMultiSelectMode}
                                >
                                    <Text style={[styles.multiSelectButtonText, multiSelectMode && { color: '#FFFFFF' }]}>
                                        {multiSelectMode ? '✓ Select' : '☐ Select'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Bulk Actions Bar */}
                        {multiSelectMode && selectedDocuments.length > 0 && (
                            <View style={styles.bulkActionsBar}>
                                <Text style={styles.bulkActionsText}>
                                    {selectedDocuments.length} selected
                                </Text>
                                <View style={styles.bulkActionsButtons}>
                                    <TouchableOpacity
                                        style={styles.bulkActionButton}
                                        onPress={handleBulkShare}
                                    >
                                        <Text style={styles.bulkActionButtonText}>📤 Share</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.bulkActionButton, styles.bulkDeleteButton]}
                                        onPress={handleBulkDelete}
                                    >
                                        <Text style={styles.bulkActionButtonText}>🗑️ Delete</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* Documents List */}
                        {documents.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>No documents uploaded</Text>
                            </View>
                        ) : (
                            documents.map((doc) => {
                                const isSelected = selectedDocuments.includes(doc.id);
                                return (
                                    <TouchableOpacity
                                        key={doc.id}
                                        style={[styles.documentCard, isSelected && styles.documentCardSelected]}
                                        onPress={() => multiSelectMode ? toggleDocumentSelection(doc.id) : handleViewDocument(doc)}
                                        activeOpacity={0.7}
                                    >
                                        {multiSelectMode && (
                                            <View style={styles.checkbox}>
                                                <Text style={styles.checkboxText}>
                                                    {isSelected ? '✓' : ''}
                                                </Text>
                                            </View>
                                        )}
                                        <View style={styles.documentIcon}>
                                            <Text style={styles.documentIconText}>{getDocumentIcon(doc)}</Text>
                                        </View>
                                        <View style={styles.documentInfo}>
                                            <Text style={styles.documentName} numberOfLines={1}>{doc.name}</Text>
                                            <Text style={styles.documentMeta}>
                                                {formatFileSize(doc.size)} • {doc.createdAt?.toDate ? doc.createdAt.toDate().toLocaleDateString() : 'Just now'}
                                            </Text>
                                        </View>

                                        {/* Action Buttons - Only show when NOT in multi-select mode */}
                                        {!multiSelectMode && (
                                            <>
                                                <TouchableOpacity
                                                    style={styles.docActionButton}
                                                    onPress={() => handleViewDocument(doc)}
                                                >
                                                    <Text style={styles.docActionText}>👁️</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={styles.docActionButton}
                                                    onPress={() => handleShareDocument(doc)}
                                                >
                                                    <Text style={styles.docActionText}>📤</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={styles.docActionButton}
                                                    onPress={() => handleDeleteDocument(doc.id, doc.storagePath)}
                                                >
                                                    <Text style={styles.docActionText}>🗑️</Text>
                                                </TouchableOpacity>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                );
                            })
                        )}
                    </>
                )}

                {activeTab === 'emails' && (
                    <>
                        {/* Email Keyword Info */}
                        {caseData?.emailKeyword ? (
                            <View style={styles.emailKeywordInfo}>
                                <Text style={styles.emailKeywordLabel}>Searching for:</Text>
                                <Text style={styles.emailKeywordValue}>"{caseData.emailKeyword}"</Text>
                                <TouchableOpacity
                                    style={styles.refreshEmailsButton}
                                    onPress={handleRefreshEmails}
                                    disabled={emailsRefreshing}
                                >
                                    <Text style={styles.refreshEmailsText}>
                                        {emailsRefreshing ? '⏳' : '🔄'} Refresh
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.noKeywordContainer}>
                                <Text style={styles.noKeywordIcon}>📧</Text>
                                <Text style={styles.noKeywordText}>No Email Keyword Set</Text>
                                <Text style={styles.noKeywordSubtext}>
                                    Edit this case and add an email subject keyword to link emails
                                </Text>
                                <TouchableOpacity
                                    style={styles.setKeywordButton}
                                    onPress={handleEdit}
                                >
                                    <Text style={styles.setKeywordButtonText}>Edit Case</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* No Linked Accounts */}
                        {caseData?.emailKeyword && !hasLinkedAccounts && !emailsLoading && (
                            <View style={styles.noAccountsContainer}>
                                <Text style={styles.noAccountsIcon}>🔗</Text>
                                <Text style={styles.noAccountsText}>No Gmail Accounts Linked</Text>
                                <Text style={styles.noAccountsSubtext}>
                                    Link your Gmail account in Settings to view case-related emails
                                </Text>
                                <TouchableOpacity
                                    style={styles.linkAccountButton}
                                    onPress={() => navigation.getParent().navigate('More', { screen: 'LinkedGmailAccounts' })}
                                >
                                    <Text style={styles.linkAccountButtonText}>Link Gmail Account</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Loading State */}
                        {emailsLoading && (
                            <View style={styles.emailsLoadingContainer}>
                                <ActivityIndicator size="large" color="#CD7F32" />
                                <Text style={styles.emailsLoadingText}>Loading emails...</Text>
                            </View>
                        )}

                        {/* Email Threads List */}
                        {!emailsLoading && hasLinkedAccounts && caseData?.emailKeyword && (
                            <>
                                {emailThreads.length === 0 ? (
                                    <View style={styles.emptyState}>
                                        <Text style={styles.emptyEmailIcon}>📭</Text>
                                        <Text style={styles.emptyText}>No emails found</Text>
                                        <Text style={styles.emptySubtext}>
                                            No emails with "{caseData.emailKeyword}" in the subject
                                        </Text>
                                    </View>
                                ) : (
                                    emailThreads.map((thread) => {
                                        const latestEmail = thread.latestEmail;
                                        const messageCount = thread.emails.length;
                                        const hasMultiple = messageCount > 1;

                                        return (
                                            <TouchableOpacity
                                                key={thread.threadId}
                                                style={[styles.emailCard, thread.hasUnread && styles.emailCardUnread]}
                                                onPress={() => {
                                                    if (hasMultiple) {
                                                        navigation.navigate('EmailThread', { thread, caseData });
                                                    } else {
                                                        navigation.navigate('EmailViewer', { email: latestEmail, caseData });
                                                    }
                                                }}
                                            >
                                                <View style={styles.emailHeader}>
                                                    <View style={styles.emailSenderAvatar}>
                                                        <Text style={styles.emailSenderInitial}>
                                                            {extractSenderName(latestEmail.from).charAt(0).toUpperCase()}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.emailHeaderInfo}>
                                                        <View style={styles.emailTopRow}>
                                                            <Text style={[styles.emailSender, thread.hasUnread && styles.emailTextUnread]} numberOfLines={1}>
                                                                {extractSenderName(latestEmail.from)}
                                                            </Text>
                                                            <View style={styles.emailDateRow}>
                                                                {hasMultiple && (
                                                                    <View style={styles.threadCountBadge}>
                                                                        <Text style={styles.threadCountText}>{messageCount}</Text>
                                                                    </View>
                                                                )}
                                                                <Text style={styles.emailDate}>{formatEmailDate(latestEmail.date)}</Text>
                                                            </View>
                                                        </View>
                                                        <Text style={[styles.emailSubject, thread.hasUnread && styles.emailTextUnread]} numberOfLines={1}>
                                                            {thread.subject}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <Text style={styles.emailSnippet} numberOfLines={2}>
                                                    {latestEmail.snippet}
                                                </Text>
                                                <View style={styles.emailFooter}>
                                                    <View style={styles.emailAccountBadge}>
                                                        <Text style={styles.emailAccountText}>{latestEmail.accountEmail}</Text>
                                                    </View>
                                                    {hasMultiple && (
                                                        <Text style={styles.threadHint}>Tap to view thread →</Text>
                                                    )}
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })
                                )}
                            </>
                        )}
                    </>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Rename Modal for Android */}
            <Modal
                visible={showRenameModal}
                transparent={true}
                animationType="fade"
                onRequestClose={handleRenameCancel}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Name this file</Text>
                        <Text style={styles.modalSubtitle}>Enter a name (leave empty to keep original)</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={renameFileName}
                            onChangeText={setRenameFileName}
                            placeholder="File name"
                            placeholderTextColor="#666"
                            autoFocus={true}
                            selectTextOnFocus={true}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalCancelButton]}
                                onPress={handleRenameCancel}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalSaveButton]}
                                onPress={handleRenameSave}
                            >
                                <Text style={styles.modalSaveText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        height: 56,
        justifyContent: 'center',
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
        borderRadius: 10,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#333',
        alignItems: 'center',
    },
    documentIcon: {
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
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
    docActionButton: {
        padding: 6,
        marginLeft: 0,
    },
    docActionText: {
        fontSize: 18,
    },
    deleteDocButton: {
        padding: 8,
    },
    deleteDocText: {
        color: '#FF5252',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Multi-select styles
    documentsHeader: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    multiSelectButton: {
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#CD7F32',
        justifyContent: 'center',
        alignItems: 'center',
        height: 56,
    },
    multiSelectButtonActive: {
        backgroundColor: '#CD7F32',
    },
    multiSelectButtonText: {
        color: '#CD7F32',
        fontSize: 14,
        fontWeight: 'bold',
    },
    bulkActionsBar: {
        backgroundColor: '#CD7F32',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bulkActionsText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    bulkActionsButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    bulkActionButton: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    bulkDeleteButton: {
        backgroundColor: '#FF5252',
    },
    bulkActionButtonText: {
        color: '#121212',
        fontSize: 14,
        fontWeight: '600',
    },
    documentCardSelected: {
        borderColor: '#CD7F32',
        borderWidth: 2,
        backgroundColor: '#2A2520',
    },
    checkbox: {
        width: 28,
        height: 28,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#CD7F32',
        backgroundColor: '#1E1E1E',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    checkboxText: {
        color: '#CD7F32',
        fontSize: 18,
        fontWeight: 'bold',
    },
    // Rename modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#1E1E1E',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: '#333',
    },
    modalTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    modalSubtitle: {
        color: '#999',
        fontSize: 14,
        marginBottom: 20,
    },
    modalInput: {
        backgroundColor: '#2A2A2A',
        borderRadius: 8,
        padding: 12,
        color: '#FFFFFF',
        fontSize: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#CD7F32',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    modalCancelButton: {
        backgroundColor: '#333',
    },
    modalSaveButton: {
        backgroundColor: '#CD7F32',
    },
    modalCancelText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    modalSaveText: {
        color: '#121212',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Email styles
    emailKeywordInfo: {
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    emailKeywordLabel: {
        color: '#999',
        fontSize: 14,
        marginRight: 8,
    },
    emailKeywordValue: {
        color: '#CD7F32',
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    refreshEmailsButton: {
        backgroundColor: '#2A2A2A',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    refreshEmailsText: {
        color: '#CD7F32',
        fontSize: 13,
        fontWeight: '600',
    },
    noKeywordContainer: {
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    noKeywordIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    noKeywordText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    noKeywordSubtext: {
        color: '#999',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
    },
    setKeywordButton: {
        backgroundColor: '#CD7F32',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    setKeywordButtonText: {
        color: '#121212',
        fontSize: 14,
        fontWeight: 'bold',
    },
    noAccountsContainer: {
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
        marginTop: 16,
    },
    noAccountsIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    noAccountsText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    noAccountsSubtext: {
        color: '#999',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
    },
    linkAccountButton: {
        backgroundColor: '#CD7F32',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    linkAccountButtonText: {
        color: '#121212',
        fontSize: 14,
        fontWeight: 'bold',
    },
    emailsLoadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emailsLoadingText: {
        color: '#999',
        fontSize: 14,
        marginTop: 12,
    },
    emailCard: {
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#333',
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
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#CD7F32',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    emailSenderInitial: {
        color: '#121212',
        fontSize: 16,
        fontWeight: 'bold',
    },
    emailHeaderInfo: {
        flex: 1,
    },
    emailTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    emailSender: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '500',
        flex: 1,
    },
    emailTextUnread: {
        fontWeight: 'bold',
    },
    emailDate: {
        color: '#666',
        fontSize: 12,
        marginLeft: 8,
    },
    emailSubject: {
        color: '#FFFFFF',
        fontSize: 14,
    },
    emailSnippet: {
        color: '#999',
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 8,
    },
    emailAccountBadge: {
        backgroundColor: '#2A2A2A',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    emailAccountText: {
        color: '#666',
        fontSize: 11,
    },
    emptyEmailIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptySubtext: {
        color: '#666',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
    // Thread styles
    emailDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    threadCountBadge: {
        backgroundColor: '#CD7F32',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 6,
        paddingHorizontal: 6,
    },
    threadCountText: {
        color: '#121212',
        fontSize: 11,
        fontWeight: 'bold',
    },
    emailFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    threadHint: {
        color: '#CD7F32',
        fontSize: 11,
        fontWeight: '500',
    },
});

export default CaseDetailsScreen;
