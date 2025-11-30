import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { getCurrentUser, getUserProfile, updateUserProfile } from '../../services/authService';

const EditProfileScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [barCouncilId, setBarCouncilId] = useState('');

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        const user = getCurrentUser();
        if (user) {
            setEmail(user.email);
            const result = await getUserProfile(user.uid);
            if (result.success) {
                setName(result.profile.name || '');
                setPhone(result.profile.phone || '');
                setBarCouncilId(result.profile.barCouncilId || '');
            }
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Name is required' });
            return;
        }

        setLoading(true);
        const user = getCurrentUser();

        const updates = {
            name: name.trim(),
            phone: phone.trim(),
            barCouncilId: barCouncilId.trim(),
        };

        const result = await updateUserProfile(user.uid, updates);
        setLoading(false);

        if (result.success) {
            Alert.alert('Success', 'Profile updated successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } else {
            Toast.show({ type: 'error', text1: 'Error', text2: result.error || 'Failed to update profile' });
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <View style={{ width: 50 }} />
            </View>

            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                {/* Name */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>FULL NAME</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Enter your name"
                        placeholderTextColor="#555"
                    />
                </View>

                {/* Email (Read-only) */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>EMAIL (Read-only)</Text>
                    <TextInput
                        style={[styles.input, styles.disabledInput]}
                        value={email}
                        editable={false}
                    />
                </View>

                {/* Phone */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>PHONE NUMBER</Text>
                    <TextInput
                        style={styles.input}
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="Enter phone number"
                        placeholderTextColor="#555"
                        keyboardType="phone-pad"
                    />
                </View>

                {/* Bar Council ID */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>BAR COUNCIL ID</Text>
                    <TextInput
                        style={styles.input}
                        value={barCouncilId}
                        onChangeText={setBarCouncilId}
                        placeholder="Enter ID"
                        placeholderTextColor="#555"
                    />
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    <Text style={styles.saveButtonText}>
                        {loading ? 'SAVING...' : 'SAVE CHANGES'}
                    </Text>
                </TouchableOpacity>
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
    disabledInput: {
        opacity: 0.5,
        backgroundColor: '#181818',
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

export default EditProfileScreen;
