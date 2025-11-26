import firestore from '@react-native-firebase/firestore';
import { notificationsService } from './notificationsService';

/**
 * Hearings Service - Firestore CRUD operations for hearings
 */

// Create a new hearing
export const createHearing = async (userId, hearingData) => {
    try {
        console.log('Creating hearing for user:', userId);

        const hearingRef = await firestore()
            .collection('users')
            .doc(userId)
            .collection('hearings')
            .add({
                ...hearingData,
                createdAt: firestore.FieldValue.serverTimestamp(),
                updatedAt: firestore.FieldValue.serverTimestamp(),
            });

        // Also update the case with the next hearing date if this is the latest one
        // This is a simplification; ideally we'd check if this is effectively the "next" one
        if (hearingData.caseId && hearingData.date) {
            await firestore()
                .collection('users')
                .doc(userId)
                .collection('cases')
                .doc(hearingData.caseId)
                .update({
                    nextHearingDate: hearingData.date,
                    updatedAt: firestore.FieldValue.serverTimestamp(),
                });
        }

        // Schedule notification
        await notificationsService.scheduleHearingNotification({
            id: hearingRef.id,
            ...hearingData
        });

        return { success: true, hearingId: hearingRef.id };
    } catch (error) {
        console.error('Error creating hearing:', error);
        return { success: false, error: error.message };
    }
};

// Get all hearings for a specific case
export const getHearingsByCaseId = async (userId, caseId) => {
    try {
        const snapshot = await firestore()
            .collection('users')
            .doc(userId)
            .collection('hearings')
            .where('caseId', '==', caseId)
            .orderBy('date', 'desc')
            .get();

        const hearings = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        return { success: true, hearings };
    } catch (error) {
        console.error('Error getting hearings:', error);
        return { success: false, error: error.message, hearings: [] };
    }
};

// Get hearings for a specific date
export const getHearingsByDate = async (userId, date) => {
    try {
        // Create start and end of the day
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const snapshot = await firestore()
            .collection('users')
            .doc(userId)
            .collection('hearings')
            .where('date', '>=', startOfDay)
            .where('date', '<=', endOfDay)
            .orderBy('date', 'asc')
            .get();

        const hearings = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        return { success: true, hearings };
    } catch (error) {
        console.error('Error getting hearings for date:', error);
        return { success: false, error: error.message, hearings: [] };
    }
};

// Get upcoming hearings for dashboard
export const getUpcomingHearings = async (userId) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const snapshot = await firestore()
            .collection('users')
            .doc(userId)
            .collection('hearings')
            .where('date', '>=', today)
            .orderBy('date', 'asc')
            .limit(10)
            .get();

        const hearings = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        return { success: true, hearings };
    } catch (error) {
        console.error('Error getting upcoming hearings:', error);
        return { success: false, error: error.message, hearings: [] };
    }
};

// Update a hearing
export const updateHearing = async (userId, hearingId, updates) => {
    try {
        await firestore()
            .collection('users')
            .doc(userId)
            .collection('hearings')
            .doc(hearingId)
            .update({
                ...updates,
                updatedAt: firestore.FieldValue.serverTimestamp(),
            });

        return { success: true };
    } catch (error) {
        console.error('Error updating hearing:', error);
        return { success: false, error: error.message };
    }
};

// Delete a hearing
export const deleteHearing = async (userId, hearingId) => {
    try {
        await firestore()
            .collection('users')
            .doc(userId)
            .collection('hearings')
            .doc(hearingId)
            .delete();

        return { success: true };
    } catch (error) {
        console.error('Error deleting hearing:', error);
        return { success: false, error: error.message };
    }
};

// Subscribe to hearings for a case
export const subscribeToCaseHearings = (userId, caseId, callback) => {
    try {
        const unsubscribe = firestore()
            .collection('users')
            .doc(userId)
            .collection('hearings')
            .where('caseId', '==', caseId)
            .orderBy('date', 'desc')
            .onSnapshot(
                (snapshot) => {
                    const hearings = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                    }));
                    callback({ success: true, hearings });
                },
                (error) => {
                    console.error('Error in hearings subscription:', error);
                    callback({ success: false, error: error.message, hearings: [] });
                }
            );

        return unsubscribe;
    } catch (error) {
        console.error('Error setting up hearings subscription:', error);
        callback({ success: false, error: error.message, hearings: [] });
        return () => { };
    }
};
