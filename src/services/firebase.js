import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { Platform } from 'react-native';

// Firebase is auto-initialized by the native SDKs using google-services.json / GoogleService-Info.plist
// This file exports the instances for use in the app

// Initialize Firebase (this helps ensure it's ready)
const initializeFirebase = () => {
    try {
        // Check if Firebase is configured
        const app = auth().app;
        console.log('Firebase initialized successfully:', app.name);
        return true;
    } catch (error) {
        console.error('Firebase initialization error:', error);
        return false;
    }
};

// Run initialization check
initializeFirebase();

export const firebaseAuth = auth();
export const firebaseDb = firestore();
export const firebaseStorage = storage();

export const getCurrentUser = () => firebaseAuth.currentUser;

export const logout = async () => {
    try {
        await firebaseAuth.signOut();
    } catch (error) {
        console.error('Logout error:', error);
    }
};
