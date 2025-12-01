import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { createClient, updateClient, getClientById } from '../../services/clientsService';
import { getCurrentUser } from '../../services/authService';
import { validateOptionalEmail, validateOptionalPhone, formatPhoneNumber } from '../../utils/validation';

const AddClientScreen = ({ navigation, route }) => {
    const isEditMode = route?.params?.clientId;
    const fromAddCase = route?.params?.fromAddCase; // Check if navigated from AddCase
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [company, setCompany] = useState('');
    const [address, setAddress] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (isEditMode) {
            loadClient();
        } else {
            // Clear form only when component mounts in add mode
            setName('');
            setEmail('');
            setPhone('');
            setCompany('');
            setAddress('');
            setNotes('');
        }
    }, []);

    const loadClient = async () => {
        const user = getCurrentUser();
        const result = await getClientById(user.uid, route.params.clientId);
        if (result.success) {
            const client = result.client;
            setName(client.name || '');
            setEmail(client.email || '');
            setPhone(client.phone || '');
            setCompany(client.company || '');
            setAddress(client.address || '');
            setNotes(client.notes || '');
        }
    };

    const handleSave = async () => {
        // Validate name
        if (!name.trim()) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter client name' });
            return;
        }

        // Validate email (if provided)
        const emailValidation = validateOptionalEmail(email);
        if (!emailValidation.isValid) {
            Toast.show({ type: 'error', text1: 'Invalid Email', text2: emailValidation.error });
            return;
        }

        // Validate phone (if provided)
        const phoneValidation = validateOptionalPhone(phone);
        if (!phoneValidation.isValid) {
            Toast.show({ type: 'error', text1: 'Invalid Phone', text2: phoneValidation.error });
            return;
        }

        setLoading(true);

        const user = getCurrentUser();
        const clientData = {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            company: company.trim(),
            address: address.trim(),
            notes: notes.trim(),
        };

        let result;
        if (isEditMode) {
            result = await updateClient(user.uid, route.params.clientId, clientData);
        } else {
            result = await createClient(user.uid, clientData);
        }

        setLoading(false);

        if (result.success) {
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: `Client ${isEditMode ? 'updated' : 'created'} successfully!`
            });

            // If we came from AddCase, navigate back to Cases tab with the new client
            if (fromAddCase && !isEditMode) {
                const newClientId = result.clientId;
                // Navigate back to Cases tab -> AddCase screen with new client selected
                navigation.getParent()?.navigate('Cases', {
                    screen: 'AddCase',
                    params: {
                        selectedClientId: newClientId,
                        selectedClientName: name.trim()
                    }
                });
            } else {
                // Navigate back to ClientsList explicitly
                navigation.navigate('ClientsList');
            }
        } else {
            Toast.show({ type: 'error', text1: 'Error', text2: result.error || 'Failed to save client' });
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isEditMode ? 'Edit Client' : 'Add Client'}</Text>
                <View style={{ width: 50 }} />
            </View>

            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                {/* Name */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>NAME *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., Rajesh Kumar"
                        placeholderTextColor="#555"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                    />
                </View>

                {/* Email */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>EMAIL</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., rajesh@example.com"
                        placeholderTextColor="#555"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                {/* Phone */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>PHONE</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="9876543210"
                        placeholderTextColor="#555"
                        value={phone}
                        onChangeText={(text) => setPhone(formatPhoneNumber(text))}
                        keyboardType="phone-pad"
                        maxLength={10}
                    />
                </View>

                {/* Company */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>COMPANY/ORGANIZATION</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., ABC Pvt Ltd"
                        placeholderTextColor="#555"
                        value={company}
                        onChangeText={setCompany}
                    />
                </View>

                {/* Address */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>ADDRESS</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Full address..."
                        placeholderTextColor="#555"
                        value={address}
                        onChangeText={setAddress}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                    />
                </View>

                {/* Notes */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>NOTES</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Additional notes..."
                        placeholderTextColor="#555"
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    <Text style={styles.saveButtonText}>
                        {loading ? 'SAVING...' : (isEditMode ? 'UPDATE CLIENT' : 'CREATE CLIENT')}
                    </Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
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
        paddingHorizontal: 20,
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
    textArea: {
        height: 80,
        paddingTop: 14,
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

export default AddClientScreen;
