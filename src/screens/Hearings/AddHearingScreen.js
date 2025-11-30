import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import DatePicker from 'react-native-date-picker';
import { createHearing, updateHearing } from '../../services/hearingsService';
import { getCurrentUser } from '../../services/authService';

const AddHearingScreen = ({ navigation, route }) => {
    const { caseId, hearingData } = route.params || {};
    const isEditMode = !!hearingData;

    const [date, setDate] = useState(hearingData?.date?.toDate ? hearingData.date.toDate() : (hearingData?.date || new Date()));
    const [type, setType] = useState(hearingData?.type || 'Routine');
    const [court, setCourt] = useState(hearingData?.courtName || '');
    const [judge, setJudge] = useState(hearingData?.judgeName || '');
    const [notes, setNotes] = useState(hearingData?.notes || '');
    const [status, setStatus] = useState(hearingData?.status || 'Scheduled');
    const [outcome, setOutcome] = useState(hearingData?.outcome || '');

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);

    const hearingTypes = ['Routine', 'Evidence', 'Arguments', 'Judgment', 'Miscellaneous'];
    const statuses = ['Scheduled', 'Completed', 'Adjourned', 'Cancelled'];

    const handleSave = async () => {
        if (!date || !type) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Date and Type are required' });
            return;
        }

        setLoading(true);
        const user = getCurrentUser();

        const data = {
            caseId,
            date,
            type,
            courtName: court,
            judgeName: judge,
            notes,
            status,
            outcome: status === 'Completed' ? outcome : '',
        };

        let result;
        if (isEditMode) {
            result = await updateHearing(user.uid, hearingData.id, data);
        } else {
            result = await createHearing(user.uid, data);
        }

        setLoading(false);

        if (result.success) {
            Alert.alert(
                'Success',
                `Hearing ${isEditMode ? 'updated' : 'added'} successfully`,
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } else {
            Toast.show({ type: 'error', text1: 'Error', text2: result.error || 'Failed to save hearing' });
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isEditMode ? 'Edit Hearing' : 'Add Hearing'}</Text>
                <View style={{ width: 50 }} />
            </View>

            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                {/* Date & Time */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>DATE & TIME *</Text>
                    <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text style={styles.dateText}>
                            {date.toLocaleString('en-US', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Hearing Type */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>TYPE *</Text>
                    <View style={styles.chipsContainer}>
                        {hearingTypes.map((t) => (
                            <TouchableOpacity
                                key={t}
                                style={[styles.chip, type === t && styles.chipSelected]}
                                onPress={() => setType(t)}
                            >
                                <Text style={[styles.chipText, type === t && styles.chipTextSelected]}>
                                    {t}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Status */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>STATUS</Text>
                    <View style={styles.chipsContainer}>
                        {statuses.map((s) => (
                            <TouchableOpacity
                                key={s}
                                style={[styles.chip, status === s && styles.chipSelected]}
                                onPress={() => setStatus(s)}
                            >
                                <Text style={[styles.chipText, status === s && styles.chipTextSelected]}>
                                    {s}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Court & Judge */}
                <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                        <Text style={styles.label}>COURT</Text>
                        <TextInput
                            style={styles.input}
                            value={court}
                            onChangeText={setCourt}
                            placeholder="Court name"
                            placeholderTextColor="#555"
                        />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                        <Text style={styles.label}>JUDGE</Text>
                        <TextInput
                            style={styles.input}
                            value={judge}
                            onChangeText={setJudge}
                            placeholder="Judge name"
                            placeholderTextColor="#555"
                        />
                    </View>
                </View>

                {/* Outcome (if completed) */}
                {status === 'Completed' && (
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>OUTCOME</Text>
                        <TextInput
                            style={styles.input}
                            value={outcome}
                            onChangeText={setOutcome}
                            placeholder="What happened?"
                            placeholderTextColor="#555"
                            multiline
                        />
                    </View>
                )}

                {/* Notes */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>NOTES</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="Additional notes..."
                        placeholderTextColor="#555"
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                </View>

                <TouchableOpacity
                    style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    <Text style={styles.saveButtonText}>
                        {loading ? 'SAVING...' : 'SAVE HEARING'}
                    </Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>

            <DatePicker
                modal
                open={showDatePicker}
                date={date}
                onConfirm={(date) => {
                    setShowDatePicker(false);
                    setDate(date);
                }}
                onCancel={() => {
                    setShowDatePicker(false);
                }}
                theme="dark"
            />
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
    textArea: {
        height: 100,
        paddingTop: 14,
    },
    dateButton: {
        backgroundColor: '#1E1E1E',
        padding: 14,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333',
    },
    dateText: {
        color: '#FFFFFF',
        fontSize: 15,
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        backgroundColor: '#1E1E1E',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#333',
        marginBottom: 8,
    },
    chipSelected: {
        backgroundColor: '#CD7F32',
        borderColor: '#CD7F32',
    },
    chipText: {
        color: '#999',
        fontSize: 13,
        fontWeight: '500',
    },
    chipTextSelected: {
        color: '#121212',
        fontWeight: 'bold',
    },
    row: {
        flexDirection: 'row',
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

export default AddHearingScreen;
