import firestore from '@react-native-firebase/firestore';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';

export const exportUserData = async (userId) => {
    try {
        // 1. Fetch all data
        const profileSnap = await firestore().collection('users').doc(userId).get();
        const profile = profileSnap.data();

        const casesSnap = await firestore().collection('users').doc(userId).collection('cases').get();
        const cases = casesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const clientsSnap = await firestore().collection('users').doc(userId).collection('clients').get();
        const clients = clientsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const hearingsSnap = await firestore().collection('users').doc(userId).collection('hearings').get();
        const hearings = hearingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const documentsSnap = await firestore().collection('users').doc(userId).collection('documents').get();
        const documents = documentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // 2. Create JSON object
        const exportData = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            profile,
            cases,
            clients,
            hearings,
            documents,
        };

        // 3. Write to file
        const path = `${RNFS.DocumentDirectoryPath}/advocura_export_${Date.now()}.json`;
        await RNFS.writeFile(path, JSON.stringify(exportData, null, 2), 'utf8');

        // 4. Share file
        await Share.open({
            title: 'Export Data',
            url: `file://${path}`,
            type: 'application/json',
        });

        return { success: true };
    } catch (error) {
        console.error('Error exporting data:', error);
        return { success: false, error: error.message };
    }
};
