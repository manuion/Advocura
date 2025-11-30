import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { removeCachedDocument } from './documentCacheService';

/**
 * Documents Service - Firebase Storage & Firestore operations
 */

// Upload a document
export const uploadDocument = async (userId, caseId, file) => {
    try {
        console.log('=== UPLOAD START ===');
        console.log('Uploading document:', {
            name: file.name,
            uri: file.uri,
            type: file.type,
            size: file.size,
            userId,
            caseId
        });

        // 1. Create a reference in Firebase Storage
        const fileName = `${Date.now()}_${file.name}`;
        const storagePath = `users/${userId}/cases/${caseId}/documents/${fileName}`;
        const reference = storage().ref(storagePath);

        // 2. Prepare upload URI
        let uploadUri = file.uri;

        // Normalize URI: ensure proper prefix for Firebase Storage
        // Firebase Storage putFile() expects either file:// or content:// prefix
        if (Platform.OS === 'android') {
            // Android: keep content:// as is, ensure file:// for local paths
            if (!uploadUri.startsWith('content://') && !uploadUri.startsWith('file://')) {
                uploadUri = 'file://' + uploadUri;
            }
        } else {
            // iOS: ensure file:// prefix for local files
            if (!uploadUri.startsWith('file://')) {
                uploadUri = 'file://' + uploadUri;
            }
        }

        console.log('Upload URI:', uploadUri);

        // 3. Upload file
        const task = reference.putFile(uploadUri);

        // Optional: Listen to progress changes
        task.on('state_changed', taskSnapshot => {
            const progress = (taskSnapshot.bytesTransferred / taskSnapshot.totalBytes) * 100;
            console.log(`Upload progress: ${progress.toFixed(2)}%`);
        });

        await task;
        console.log('Upload completed successfully');

        // 4. Get download URL
        const downloadUrl = await reference.getDownloadURL();
        console.log('Download URL obtained:', downloadUrl);

        // 5. Save metadata to Firestore
        const docData = {
            caseId,
            name: file.name,
            type: file.type,
            size: file.size,
            storagePath,
            downloadUrl,
            createdAt: firestore.FieldValue.serverTimestamp(),
        };

        const docRef = await firestore()
            .collection('users')
            .doc(userId)
            .collection('documents')
            .add(docData);

        console.log('Document metadata saved to Firestore');
        return { success: true, documentId: docRef.id, downloadUrl };
    } catch (error) {
        console.error('Error uploading document:', {
            message: error.message,
            code: error.code,
            stack: error.stack
        });

        // Provide user-friendly error messages
        let errorMessage = 'Failed to upload document';

        if (error.code === 'storage/unauthorized') {
            errorMessage = 'You do not have permission to upload files. Please check Firebase Storage rules.';
        } else if (error.code === 'storage/canceled') {
            errorMessage = 'Upload was canceled';
        } else if (error.code === 'storage/unknown') {
            errorMessage = 'An unknown error occurred. Please check your internet connection.';
        } else if (error.message.includes('No such file')) {
            errorMessage = 'Could not find the file. Please try selecting it again.';
        } else if (error.message) {
            errorMessage = error.message;
        }

        return { success: false, error: errorMessage };
    }
};

// Get documents for a case
export const getDocumentsByCaseId = async (userId, caseId) => {
    try {
        const snapshot = await firestore()
            .collection('users')
            .doc(userId)
            .collection('documents')
            .where('caseId', '==', caseId)
            .orderBy('createdAt', 'desc')
            .get();

        const documents = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        return { success: true, documents };
    } catch (error) {
        console.error('Error getting documents:', error);
        return { success: false, error: error.message, documents: [] };
    }
};

// Delete a document
export const deleteDocument = async (userId, documentId, storagePath) => {
    try {
        // 1. Delete from Storage (handle if file doesn't exist)
        if (storagePath) {
            try {
                const reference = storage().ref(storagePath);
                await reference.delete();
                console.log('Document deleted from storage:', storagePath);
            } catch (storageError) {
                // If file doesn't exist in storage, log but continue with Firestore deletion
                if (storageError.code === 'storage/object-not-found') {
                    console.log('File not found in storage (may have been already deleted):', storagePath);
                } else {
                    console.error('Storage deletion error:', storageError);
                    // For other storage errors, still try to delete from Firestore
                }
            }
        }

        // 2. Delete from Firestore
        await firestore()
            .collection('users')
            .doc(userId)
            .collection('documents')
            .doc(documentId)
            .delete();

        console.log('Document deleted from Firestore:', documentId);

        // 3. Clear from local cache
        try {
            await removeCachedDocument(documentId);
            console.log('Document removed from local cache:', documentId);
        } catch (cacheError) {
            // Log but don't fail the deletion if cache cleanup fails
            console.warn('Failed to remove document from cache:', cacheError);
        }

        return { success: true };
    } catch (error) {
        console.error('Error deleting document:', error);
        return { success: false, error: error.message };
    }
};

// Subscribe to documents for a case
export const subscribeToCaseDocuments = (userId, caseId, callback) => {
    try {
        const unsubscribe = firestore()
            .collection('users')
            .doc(userId)
            .collection('documents')
            .where('caseId', '==', caseId)
            .orderBy('createdAt', 'desc')
            .onSnapshot(
                (snapshot) => {
                    const documents = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                    }));
                    callback({ success: true, documents });
                },
                (error) => {
                    console.error('Error in documents subscription:', error);
                    callback({ success: false, error: error.message, documents: [] });
                }
            );

        return unsubscribe;
    } catch (error) {
        console.error('Error setting up documents subscription:', error);
        callback({ success: false, error: error.message, documents: [] });
        return () => { };
    }
};
