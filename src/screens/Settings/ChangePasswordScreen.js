import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import auth from '@react-native-firebase/auth';

const ChangePasswordScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Please fill in all fields' });
            return;
        }

        if (newPassword !== confirmPassword) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'New passwords do not match' });
            return;
        }

        if (newPassword.length < 6) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Password must be at least 6 characters long' });
            return;
        }

        setLoading(true);
        try {
            const user = auth().currentUser;
            const credential = auth.EmailAuthProvider.credential(user.email, currentPassword);

            // Re-authenticate user
            await user.reauthenticateWithCredential(credential);

            // Update password
            await user.updatePassword(newPassword);

            setLoading(false);
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Password updated successfully'
            });
            navigation.goBack();
        } catch (error) {
            setLoading(false);
            console.error(error);
            if (error.code === 'auth/wrong-password') {
                Toast.show({ type: 'error', text1: 'Error', text2: 'Current password is incorrect' });
            } else {
                Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to update password. Please try again.' });
            }
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Change Password</Text>
                <View style={{ width: 50 }} />
            </View>

            <View style={styles.form}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>CURRENT PASSWORD</Text>
                    <TextInput
                        style={styles.input}
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        placeholder="Enter current password"
                        placeholderTextColor="#555"
                        secureTextEntry
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>NEW PASSWORD</Text>
                    <TextInput
                        style={styles.input}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholder="Enter new password"
                        placeholderTextColor="#555"
                        secureTextEntry
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>CONFIRM NEW PASSWORD</Text>
                    <TextInput
                        style={styles.input}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Confirm new password"
                        placeholderTextColor="#555"
                        secureTextEntry
                    />
                </View>

                <TouchableOpacity
                    style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                    onPress={handleChangePassword}
                    disabled={loading}
                >
                    <Text style={styles.saveButtonText}>
                        {loading ? 'UPDATING...' : 'UPDATE PASSWORD'}
                    </Text>
                </TouchableOpacity>
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
        paddingBottom: 10,
    },
    backButton: {
        color: '#CD7F32',
        fontSize: 16,
        fontWeight: '600',
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    form: {
        flex: 1,
        padding: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        color: '#CD7F32',
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 1.2,
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: '#1E1E1E',
        color: '#FFFFFF',
        padding: 14,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333',
        fontSize: 15,
    },
    saveButton: {
        backgroundColor: '#CD7F32',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#CD7F32',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    saveButtonText: {
        color: '#121212',
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 2,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
});

export default ChangePasswordScreen;
