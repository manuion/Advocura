import firestore from '@react-native-firebase/firestore';

/**
 * Cases Service - Firestore CRUD operations for cases
 * All cases are stored under: users/{userId}/cases/{caseId}
 */

// Get firestore instance
const db = firestore();

// Create a new case
export const createCase = async (userId, caseData) => {
    try {
        console.log('Creating case for user:', userId);
        console.log('Case data:', caseData);

        const casesRef = db.collection('users').doc(userId).collection('cases');
        console.log('Cases ref created');

        const docRef = await casesRef.add({
            ...caseData,
            createdAt: firestore.FieldValue.serverTimestamp(),
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });

        console.log('Case created with ID:', docRef.id);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Error creating case:', error);
        console.error('Error details:', error.message, error.code);
        return { success: false, error: error.message };
    }
};

// Get all cases for a user
export const getCases = async (userId) => {
    try {
        const casesRef = db.collection('users').doc(userId).collection('cases');
        const snapshot = await casesRef.orderBy('createdAt', 'desc').get();

        const cases = [];
        snapshot.forEach(doc => {
            cases.push({
                id: doc.id,
                ...doc.data(),
            });
        });

        return { success: true, cases };
    } catch (error) {
        console.error('Error getting cases:', error);
        return { success: false, error: error.message, cases: [] };
    }
};

// Get a single case by ID
export const getCaseById = async (userId, caseId) => {
    try {
        const caseRef = db.collection('users').doc(userId).collection('cases').doc(caseId);
        const doc = await caseRef.get();

        if (!doc.exists) {
            return { success: false, error: 'Case not found' };
        }

        return {
            success: true,
            case: {
                id: doc.id,
                ...doc.data(),
            },
        };
    } catch (error) {
        console.error('Error getting case:', error);
        return { success: false, error: error.message };
    }
};

// Update a case
export const updateCase = async (userId, caseId, updates) => {
    try {
        const caseRef = db.collection('users').doc(userId).collection('cases').doc(caseId);
        await caseRef.update({
            ...updates,
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });
        return { success: true };
    } catch (error) {
        console.error('Error updating case:', error);
        return { success: false, error: error.message };
    }
};

// Delete a case
export const deleteCase = async (userId, caseId) => {
    try {
        const caseRef = db.collection('users').doc(userId).collection('cases').doc(caseId);
        await caseRef.delete();
        return { success: true };
    } catch (error) {
        console.error('Error deleting case:', error);
        return { success: false, error: error.message };
    }
};

// Subscribe to real-time updates for all cases
export const subscribeToCases = (userId, callback) => {
    try {
        const casesRef = db.collection('users').doc(userId).collection('cases');

        const unsubscribe = casesRef.orderBy('createdAt', 'desc').onSnapshot(
            (snapshot) => {
                const cases = [];
                snapshot.forEach(doc => {
                    cases.push({
                        id: doc.id,
                        ...doc.data(),
                    });
                });
                callback({ success: true, cases });
            },
            (error) => {
                console.error('Error in cases listener:', error);
                callback({ success: false, error: error.message, cases: [] });
            }
        );

        return unsubscribe;
    } catch (error) {
        console.error('Error setting up cases listener:', error);
        return null;
    }
};
