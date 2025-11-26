import firestore from '@react-native-firebase/firestore';

/**
 * Clients Service - Firestore CRUD operations for clients
 */

// Create a new client
export const createClient = async (userId, clientData) => {
    try {
        console.log('Creating client for user:', userId);
        console.log('Client data:', clientData);

        const clientRef = await firestore()
            .collection('users')
            .doc(userId)
            .collection('clients')
            .add({
                ...clientData,
                createdAt: firestore.FieldValue.serverTimestamp(),
                updatedAt: firestore.FieldValue.serverTimestamp(),
            });

        console.log('Client created successfully with ID:', clientRef.id);
        return { success: true, clientId: clientRef.id };
    } catch (error) {
        console.error('Error creating client:', error);
        return { success: false, error: error.message };
    }
};

// Get all clients for a user
export const getClients = async (userId) => {
    try {
        const snapshot = await firestore()
            .collection('users')
            .doc(userId)
            .collection('clients')
            .orderBy('createdAt', 'desc')
            .get();

        const clients = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        return { success: true, clients };
    } catch (error) {
        console.error('Error getting clients:', error);
        return { success: false, error: error.message, clients: [] };
    }
};

// Get a single client by ID
export const getClientById = async (userId, clientId) => {
    try {
        const doc = await firestore()
            .collection('users')
            .doc(userId)
            .collection('clients')
            .doc(clientId)
            .get();

        if (!doc.exists) {
            return { success: false, error: 'Client not found' };
        }

        return { success: true, client: { id: doc.id, ...doc.data() } };
    } catch (error) {
        console.error('Error getting client:', error);
        return { success: false, error: error.message };
    }
};

// Update a client
export const updateClient = async (userId, clientId, updates) => {
    try {
        await firestore()
            .collection('users')
            .doc(userId)
            .collection('clients')
            .doc(clientId)
            .update({
                ...updates,
                updatedAt: firestore.FieldValue.serverTimestamp(),
            });

        return { success: true };
    } catch (error) {
        console.error('Error updating client:', error);
        return { success: false, error: error.message };
    }
};

// Delete a client
export const deleteClient = async (userId, clientId) => {
    try {
        await firestore()
            .collection('users')
            .doc(userId)
            .collection('clients')
            .doc(clientId)
            .delete();

        return { success: true };
    } catch (error) {
        console.error('Error deleting client:', error);
        return { success: false, error: error.message };
    }
};

// Subscribe to real-time client updates
export const subscribeToClients = (userId, callback) => {
    try {
        const unsubscribe = firestore()
            .collection('users')
            .doc(userId)
            .collection('clients')
            .orderBy('createdAt', 'desc')
            .onSnapshot(
                (snapshot) => {
                    const clients = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                    }));
                    callback({ success: true, clients });
                },
                (error) => {
                    console.error('Error in clients subscription:', error);
                    callback({ success: false, error: error.message, clients: [] });
                }
            );

        return unsubscribe;
    } catch (error) {
        console.error('Error setting up clients subscription:', error);
        callback({ success: false, error: error.message, clients: [] });
        return () => { };
    }
};
