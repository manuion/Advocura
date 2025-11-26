import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

/**
 * Authentication Service - Firebase Auth operations
 */

// Sign up with email and password
export const signUp = async (email, password, userData) => {
    try {
        // Create Firebase Auth account
        const userCredential = await auth().createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Create user profile in Firestore
        await firestore().collection('users').doc(user.uid).set({
            email: user.email,
            name: userData.name || '',
            phone: userData.phone || '',
            barCouncilId: userData.barCouncilId || '',
            createdAt: firestore.FieldValue.serverTimestamp(),
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });

        return { success: true, user };
    } catch (error) {
        console.error('Error signing up:', error);
        return { success: false, error: error.message };
    }
};

// Sign in with email and password
export const signIn = async (email, password) => {
    try {
        const userCredential = await auth().signInWithEmailAndPassword(email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        console.error('Error signing in:', error);
        let errorMessage = 'Failed to sign in';

        if (error.code === 'auth/user-not-found') {
            errorMessage = 'No account found with this email';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Incorrect password';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address';
        } else if (error.code === 'auth/user-disabled') {
            errorMessage = 'This account has been disabled';
        }

        return { success: false, error: errorMessage };
    }
};

// Sign out
export const signOut = async () => {
    try {
        await auth().signOut();
        return { success: true };
    } catch (error) {
        console.error('Error signing out:', error);
        return { success: false, error: error.message };
    }
};

// Send password reset email
export const resetPassword = async (email) => {
    try {
        await auth().sendPasswordResetEmail(email);
        return { success: true };
    } catch (error) {
        console.error('Error sending password reset:', error);
        let errorMessage = 'Failed to send reset email';

        if (error.code === 'auth/user-not-found') {
            errorMessage = 'No account found with this email';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address';
        }

        return { success: false, error: errorMessage };
    }
};

// Get current user
export const getCurrentUser = () => {
    return auth().currentUser;
};

// Get user profile from Firestore
export const getUserProfile = async (userId) => {
    try {
        const doc = await firestore().collection('users').doc(userId).get();

        if (!doc.exists) {
            return { success: false, error: 'User profile not found' };
        }

        return { success: true, profile: doc.data() };
    } catch (error) {
        console.error('Error getting user profile:', error);
        return { success: false, error: error.message };
    }
};

// Update user profile
export const updateUserProfile = async (userId, updates) => {
    try {
        await firestore().collection('users').doc(userId).update({
            ...updates,
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });
        return { success: true };
    } catch (error) {
        console.error('Error updating user profile:', error);
        return { success: false, error: error.message };
    }
};

// Auth state listener
export const onAuthStateChanged = (callback) => {
    return auth().onAuthStateChanged(callback);
};
