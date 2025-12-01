import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import DatePicker from 'react-native-date-picker';
import { createCase, updateCase } from '../../services/casesService';
import { getCurrentUser } from '../../services/authService';
import { getClients, createClient } from '../../services/clientsService';

const AddCaseScreen = ({ navigation, route }) => {
    const isEditMode = route?.params?.caseData;
    const existingCase = route?.params?.caseData || {};

    const [caseNumber, setCaseNumber] = useState(existingCase.caseNumber || '');
    const [title, setTitle] = useState(existingCase.title || '');
    const [description, setDescription] = useState(existingCase.description || '');
    const [selectedClient, setSelectedClient] = useState(existingCase.clientId ? { id: existingCase.clientId, name: existingCase.clientName } : null);
    const [courtName, setCourtName] = useState(existingCase.courtName || '');
    const [judgeName, setJudgeName] = useState(existingCase.judgeName || '');
    const [caseType, setCaseType] = useState(existingCase.caseType || 'Civil');
    const [status, setStatus] = useState(existingCase.status || 'Active');
    const [saving, setSaving] = useState(false);

    // Client picker states
    const [showClientPicker, setShowClientPicker] = useState(false);
    const [clients, setClients] = useState([]);
    const [clientSearch, setClientSearch] = useState('');
    const [filteredClients, setFilteredClients] = useState([]);
    const [quickAddClientName, setQuickAddClientName] = useState('');
    const [creatingClient, setCreatingClient] = useState(false);

    // Date states
    const [filingDate, setFilingDate] = useState(existingCase.filingDate || new Date());
    const [nextHearingDate, setNextHearingDate] = useState(existingCase.nextHearingDate || null);
    const [nextHearingTime, setNextHearingTime] = useState(
        existingCase.nextHearingDate || null
    );
    const [showFilingDatePicker, setShowFilingDatePicker] = useState(false);
    const [showHearingDatePicker, setShowHearingDatePicker] = useState(false);
    const [showHearingTimePicker, setShowHearingTimePicker] = useState(false);

    const caseTypes = ['Civil', 'Criminal', 'Family', 'Corporate', 'Tax', 'Property', 'Other'];
    const statuses = ['Active', 'Pending', 'Closed', 'Won', 'Lost'];

    useEffect(() => {
        loadClients();
    }, []);

    // Clear form when screen gains focus (unless in edit mode or receiving client from AddClient)
    useFocusEffect(
        React.useCallback(() => {
            // Don't clear if in edit mode
            if (isEditMode) {
                return;
            }

            // Don't clear if we're receiving a client selection from AddClient
            if (route.params?.selectedClientId) {
                return;
            }

            // Clear all form fields
            setCaseNumber('');
            setTitle('');
            setDescription('');
            setSelectedClient(null);
            setCourtName('');
            setJudgeName('');
            setCaseType('Civil');
            setStatus('Active');
            setFilingDate(new Date());
            setNextHearingDate(null);
            setNextHearingTime(null);
            setClientSearch('');
            setQuickAddClientName('');

            // Refresh clients list
            loadClients();
        }, [isEditMode, route.params?.selectedClientId])
    );

    // Handle returned client from AddClient screen
    useEffect(() => {
        if (route.params?.selectedClientId && route.params?.selectedClientName) {
            setSelectedClient({
                id: route.params.selectedClientId,
                name: route.params.selectedClientName
            });
            // Clear the params to avoid reapplying on future focus
            navigation.setParams({
                selectedClientId: undefined,
                selectedClientName: undefined
            });
        }
    }, [route.params?.selectedClientId, route.params?.selectedClientName]);

    useEffect(() => {
        if (clientSearch.trim() === '') {
            setFilteredClients(clients);
        } else {
            const query = clientSearch.toLowerCase();
            const filtered = clients.filter(client =>
                client.name?.toLowerCase().includes(query) ||
                client.email?.toLowerCase().includes(query) ||
                client.phone?.includes(query)
            );
            setFilteredClients(filtered);
        }
    }, [clientSearch, clients]);

    const loadClients = async () => {
        const user = getCurrentUser();
        const result = await getClients(user.uid);
        if (result.success) {
            setClients(result.clients);
            setFilteredClients(result.clients);
        }
    };

    const handleQuickAddClient = async () => {
        if (!quickAddClientName.trim()) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter a client name' });
            return;
        }

        setCreatingClient(true);
        const user = getCurrentUser();

        const result = await createClient(user.uid, {
            name: quickAddClientName.trim(),
        });

        setCreatingClient(false);

        if (result.success) {
            Toast.show({ type: 'success', text1: 'Success', text2: 'Client created successfully' });
            setQuickAddClientName('');
            // Reload clients and auto-select the new one
            await loadClients();
            // Find and select the newly created client
            const newlyCreated = { id: result.clientId, name: quickAddClientName.trim() };
            setSelectedClient(newlyCreated);
            setShowClientPicker(false);
        } else {
            Toast.show({ type: 'error', text1: 'Error', text2: result.error });
        }
    };

    const handleOpenClientPicker = () => {
        setShowClientPicker(true);
        loadClients(); // Refresh clients when opening picker
    };

    const handleNavigateToAddClient = () => {
        setShowClientPicker(false);
        // Navigate to Clients tab, then to AddClient screen within that stack
        navigation.getParent().navigate('Clients', {
            screen: 'AddClient',
            params: { fromAddCase: true }
        });
    };

    const handleSave = async () => {
        // Validation
        if (!caseNumber || !title || !selectedClient || !courtName) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Please fill in all required fields (including client)' });
            return;
        }

        setSaving(true);

        try {
            console.log('=== SAVE CASE START ===');

            // Get current user
            const user = getCurrentUser();
            if (!user) {
                Toast.show({ type: 'error', text1: 'Error', text2: 'You must be logged in to save a case' });
                setSaving(false);
                return;
            }

            // Combine hearing date and time if both are set
            let finalHearingDateTime = null;
            if (nextHearingDate && nextHearingTime) {
                finalHearingDateTime = new Date(nextHearingDate);
                finalHearingDateTime.setHours(nextHearingTime.getHours());
                finalHearingDateTime.setMinutes(nextHearingTime.getMinutes());
            } else if (nextHearingDate) {
                finalHearingDateTime = nextHearingDate;
            }

            const caseData = {
                caseNumber,
                title,
                description,
                clientId: selectedClient.id,
                clientName: selectedClient.name,
                courtName,
                judgeName,
                caseType,
                status,
                filingDate: filingDate,
                nextHearingDate: finalHearingDateTime,
            };

            console.log('Calling createCase/updateCase...');

            let result;
            if (isEditMode) {
                result = await updateCase(user.uid, existingCase.id, caseData);
            } else {
                result = await createCase(user.uid, caseData);
            }

            console.log('Save result:', result);
            setSaving(false);

            if (result.success) {
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: `Case ${isEditMode ? 'updated' : 'created'} successfully!`
                });
                navigation.goBack();
            } else {
                Toast.show({ type: 'error', text1: 'Error', text2: result.error || 'Failed to save case' });
            }
        } catch (error) {
            console.error('=== SAVE ERROR ===');
            console.error('Error:', error);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);

            setSaving(false);
            Toast.show({ type: 'error', text1: 'Error', text2: `An unexpected error occurred: ${error.message}` });
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isEditMode ? 'Edit Case' : 'Add Case'}</Text>
                <View style={{ width: 50 }} />
            </View>

            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                {/* Case Number */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>CASE NUMBER *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., CIV/2024/001"
                        placeholderTextColor="#555"
                        value={caseNumber}
                        onChangeText={setCaseNumber}
                    />
                </View>

                {/* Title */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>CASE TITLE *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., Property Dispute - Kumar vs Sharma"
                        placeholderTextColor="#555"
                        value={title}
                        onChangeText={setTitle}
                    />
                </View>

                {/* Description */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>DESCRIPTION</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Brief description of the case..."
                        placeholderTextColor="#555"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                </View>

                {/* Client Picker */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>CLIENT *</Text>
                    <TouchableOpacity
                        style={styles.clientPickerButton}
                        onPress={handleOpenClientPicker}
                    >
                        <Text style={selectedClient ? styles.clientPickerTextSelected : styles.clientPickerTextPlaceholder}>
                            {selectedClient ? selectedClient.name : 'Tap to select client'}
                        </Text>
                        <Text style={styles.clientPickerIcon}>👤</Text>
                    </TouchableOpacity>
                    {selectedClient && (
                        <TouchableOpacity
                            style={styles.clearClientButton}
                            onPress={() => setSelectedClient(null)}
                        >
                            <Text style={styles.clearClientText}>Clear Selection</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Court Name */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>COURT NAME *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., District Court"
                        placeholderTextColor="#555"
                        value={courtName}
                        onChangeText={setCourtName}
                    />
                </View>

                {/* Judge Name */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>JUDGE NAME</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., Hon. Justice Sharma"
                        placeholderTextColor="#555"
                        value={judgeName}
                        onChangeText={setJudgeName}
                    />
                </View>

                {/* Filing Date */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>FILING DATE *</Text>
                    <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setShowFilingDatePicker(true)}
                    >
                        <Text style={styles.dateButtonText}>
                            {filingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Next Hearing Date */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>NEXT HEARING DATE</Text>
                    <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setShowHearingDatePicker(true)}
                    >
                        <Text style={styles.dateButtonText}>
                            {nextHearingDate
                                ? nextHearingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                : 'Not set - Tap to select'}
                        </Text>
                    </TouchableOpacity>
                    {nextHearingDate && (
                        <TouchableOpacity
                            style={styles.clearButton}
                            onPress={() => {
                                setNextHearingDate(null);
                                setNextHearingTime(null);
                            }}
                        >
                            <Text style={styles.clearButtonText}>Clear</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Next Hearing Time - Only show if date is set */}
                {nextHearingDate && (
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>HEARING TIME (Optional)</Text>
                        <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => setShowHearingTimePicker(true)}
                        >
                            <Text style={styles.dateButtonText}>
                                {nextHearingTime
                                    ? nextHearingTime.toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: true
                                    })
                                    : 'Not set - Tap to select'}
                            </Text>
                        </TouchableOpacity>
                        {nextHearingTime && (
                            <TouchableOpacity
                                style={styles.clearButton}
                                onPress={() => setNextHearingTime(null)}
                            >
                                <Text style={styles.clearButtonText}>Clear Time</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Case Type */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>CASE TYPE</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
                        {caseTypes.map((type) => (
                            <TouchableOpacity
                                key={type}
                                style={[styles.chip, caseType === type && styles.chipActive]}
                                onPress={() => setCaseType(type)}
                            >
                                <Text style={[styles.chipText, caseType === type && styles.chipTextActive]}>
                                    {type}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Status */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>STATUS</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
                        {statuses.map((s) => (
                            <TouchableOpacity
                                key={s}
                                style={[styles.chip, status === s && styles.chipActive]}
                                onPress={() => setStatus(s)}
                            >
                                <Text style={[styles.chipText, status === s && styles.chipTextActive]}>
                                    {s}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    <Text style={styles.saveButtonText}>
                        {saving ? 'SAVING...' : (isEditMode ? 'UPDATE CASE' : 'CREATE CASE')}
                    </Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Filing Date Picker */}
            <DatePicker
                modal
                open={showFilingDatePicker}
                date={filingDate}
                mode="date"
                onConfirm={(date) => {
                    setShowFilingDatePicker(false);
                    setFilingDate(date);
                }}
                onCancel={() => setShowFilingDatePicker(false)}
                theme="dark"
            />

            {/* Hearing Date Picker */}
            <DatePicker
                modal
                open={showHearingDatePicker}
                date={nextHearingDate || new Date()}
                mode="date"
                minimumDate={new Date()}
                onConfirm={(date) => {
                    setShowHearingDatePicker(false);
                    setNextHearingDate(date);
                }}
                onCancel={() => setShowHearingDatePicker(false)}
                theme="dark"
            />

            {/* Hearing Time Picker */}
            <DatePicker
                modal
                open={showHearingTimePicker}
                date={nextHearingTime || new Date()}
                mode="time"
                onConfirm={(time) => {
                    setShowHearingTimePicker(false);
                    setNextHearingTime(time);
                }}
                onCancel={() => setShowHearingTimePicker(false)}
                theme="dark"
            />

            {/* Client Picker Modal */}
            <Modal
                visible={showClientPicker}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowClientPicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Client</Text>
                            <TouchableOpacity onPress={() => setShowClientPicker(false)}>
                                <Text style={styles.modalClose}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Quick Add Client */}
                        <View style={styles.quickAddContainer}>
                            <Text style={styles.quickAddLabel}>Quick Add Client (name only):</Text>
                            <View style={styles.quickAddRow}>
                                <TextInput
                                    style={styles.quickAddInput}
                                    placeholder="Type client name here..."
                                    placeholderTextColor="#666"
                                    value={quickAddClientName}
                                    onChangeText={setQuickAddClientName}
                                    editable={!creatingClient}
                                />
                                <TouchableOpacity
                                    style={[styles.quickAddButton, creatingClient && styles.quickAddButtonDisabled]}
                                    onPress={handleQuickAddClient}
                                    disabled={creatingClient}
                                >
                                    <Text style={styles.quickAddButtonText}>
                                        {creatingClient ? '...' : 'Add'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Create Full Client Button */}
                        <TouchableOpacity
                            style={styles.createFullClientButton}
                            onPress={handleNavigateToAddClient}
                        >
                            <Text style={styles.createFullClientButtonText}>
                                + Create Client with Full Details
                            </Text>
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>OR SELECT EXISTING</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <TextInput
                            style={styles.modalSearch}
                            placeholder="Search existing clients..."
                            placeholderTextColor="#666"
                            value={clientSearch}
                            onChangeText={setClientSearch}
                        />

                        <FlatList
                            data={filteredClients}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.clientItem}
                                    onPress={() => {
                                        setSelectedClient({ id: item.id, name: item.name });
                                        setShowClientPicker(false);
                                        setClientSearch('');
                                    }}
                                >
                                    <View style={styles.clientItemAvatar}>
                                        <Text style={styles.clientItemInitial}>
                                            {item.name?.charAt(0).toUpperCase() || 'C'}
                                        </Text>
                                    </View>
                                    <View style={styles.clientItemInfo}>
                                        <Text style={styles.clientItemName}>{item.name}</Text>
                                        {item.email && (
                                            <Text style={styles.clientItemDetail}>{item.email}</Text>
                                        )}
                                        {item.phone && (
                                            <Text style={styles.clientItemDetail}>{item.phone}</Text>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View style={styles.emptyList}>
                                    <Text style={styles.emptyListText}>
                                        {clientSearch ? 'No clients found' : 'No clients yet'}
                                    </Text>
                                    <Text style={styles.emptyListSubtext}>
                                        {clientSearch ? 'Try a different search' : 'Add clients from the Clients tab'}
                                    </Text>
                                </View>
                            }
                        />
                    </View>
                </View>
            </Modal>
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
        height: 100,
        paddingTop: 14,
    },
    chipContainer: {
        flexDirection: 'row',
        maxHeight: 45,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#1E1E1E',
        borderWidth: 1,
        borderColor: '#333',
        marginRight: 8,
    },
    chipActive: {
        backgroundColor: '#CD7F32',
        borderColor: '#CD7F32',
    },
    chipText: {
        color: '#999',
        fontSize: 13,
        fontWeight: '600',
    },
    chipTextActive: {
        color: '#121212',
    },
    dateButton: {
        backgroundColor: '#1E1E1E',
        padding: 14,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333',
    },
    dateButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
    },
    clearButton: {
        marginTop: 8,
        alignSelf: 'flex-start',
    },
    clearButtonText: {
        color: '#CD7F32',
        fontSize: 13,
        fontWeight: '600',
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
    clientPickerButton: {
        backgroundColor: '#1E1E1E',
        padding: 14,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    clientPickerTextSelected: {
        color: '#FFFFFF',
        fontSize: 15,
    },
    clientPickerTextPlaceholder: {
        color: '#666',
        fontSize: 15,
    },
    clientPickerIcon: {
        fontSize: 20,
    },
    clearClientButton: {
        marginTop: 8,
        alignSelf: 'flex-start',
    },
    clearClientText: {
        color: '#CD7F32',
        fontSize: 13,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1E1E1E',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    modalTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    modalClose: {
        color: '#CD7F32',
        fontSize: 24,
        fontWeight: 'bold',
    },
    modalSearch: {
        backgroundColor: '#121212',
        color: '#FFFFFF',
        padding: 14,
        margin: 20,
        marginBottom: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333',
        fontSize: 15,
    },
    clientItem: {
        flexDirection: 'row',
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 8,
        backgroundColor: '#121212',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333',
        alignItems: 'center',
    },
    clientItemAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#CD7F32',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    clientItemInitial: {
        color: '#121212',
        fontSize: 16,
        fontWeight: 'bold',
    },
    clientItemInfo: {
        flex: 1,
    },
    clientItemName: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    clientItemDetail: {
        color: '#999',
        fontSize: 12,
    },
    emptyList: {
        padding: 40,
        alignItems: 'center',
    },
    emptyListText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    emptyListSubtext: {
        color: '#666',
        fontSize: 14,
        textAlign: 'center',
    },
    quickAddContainer: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
    },
    quickAddLabel: {
        color: '#CD7F32',
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    quickAddRow: {
        flexDirection: 'row',
        gap: 8,
    },
    quickAddInput: {
        flex: 1,
        backgroundColor: '#121212',
        color: '#FFFFFF',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333',
        fontSize: 15,
    },
    quickAddButton: {
        backgroundColor: '#CD7F32',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 60,
    },
    quickAddButtonDisabled: {
        opacity: 0.5,
    },
    quickAddButtonText: {
        color: '#121212',
        fontSize: 15,
        fontWeight: 'bold',
    },
    createFullClientButton: {
        backgroundColor: '#2A2A2A',
        marginHorizontal: 20,
        marginTop: 8,
        padding: 14,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#CD7F32',
        alignItems: 'center',
    },
    createFullClientButtonText: {
        color: '#CD7F32',
        fontSize: 14,
        fontWeight: 'bold',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginVertical: 16,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#333',
    },
    dividerText: {
        color: '#666',
        fontSize: 11,
        fontWeight: 'bold',
        marginHorizontal: 12,
        letterSpacing: 1,
    },
});

export default AddCaseScreen;
