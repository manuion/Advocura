import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { subscribeToCases } from '../../services/casesService';
import { subscribeToClients } from '../../services/clientsService';
import { getCurrentUser } from '../../services/authService';

const SearchScreen = ({ navigation }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [allData, setAllData] = useState({ cases: [], clients: [] });

    useEffect(() => {
        const user = getCurrentUser();
        if (user) {
            const unsubscribeCases = subscribeToCases(user.uid, (result) => {
                if (result.success) {
                    setAllData(prev => ({ ...prev, cases: result.cases }));
                }
            });

            const unsubscribeClients = subscribeToClients(user.uid, (result) => {
                if (result.success) {
                    setAllData(prev => ({ ...prev, clients: result.clients }));
                }
                setLoading(false);
            });

            return () => {
                unsubscribeCases();
                unsubscribeClients();
            };
        }
    }, []);

    useEffect(() => {
        if (query.trim() === '') {
            setResults([]);
            return;
        }

        const lowerQuery = query.toLowerCase();

        const filteredCases = allData.cases.filter(c =>
            c.title?.toLowerCase().includes(lowerQuery) ||
            c.caseNumber?.toLowerCase().includes(lowerQuery) ||
            c.courtName?.toLowerCase().includes(lowerQuery)
        ).map(c => ({ ...c, type: 'Case' }));

        const filteredClients = allData.clients.filter(c =>
            c.name?.toLowerCase().includes(lowerQuery) ||
            c.email?.toLowerCase().includes(lowerQuery) ||
            c.phone?.includes(query)
        ).map(c => ({ ...c, type: 'Client' }));

        setResults([...filteredCases, ...filteredClients]);
    }, [query, allData]);

    const handlePress = (item) => {
        if (item.type === 'Case') {
            navigation.navigate('Cases', {
                screen: 'CaseDetails',
                params: { caseId: item.id }
            });
        } else if (item.type === 'Client') {
            navigation.navigate('Clients', {
                screen: 'ClientDetails',
                params: { clientId: item.id }
            });
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.resultItem} onPress={() => handlePress(item)}>
            <View style={styles.iconContainer}>
                <Text style={styles.icon}>{item.type === 'Case' ? '⚖️' : '👤'}</Text>
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.title}>{item.type === 'Case' ? item.title : item.name}</Text>
                <Text style={styles.subtitle}>
                    {item.type === 'Case'
                        ? `${item.caseNumber} • ${item.courtName}`
                        : item.email || item.phone || 'No contact info'}
                </Text>
            </View>
            <View style={styles.typeBadge}>
                <Text style={styles.typeText}>{item.type.toUpperCase()}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search cases, clients..."
                        placeholderTextColor="#666"
                        value={query}
                        onChangeText={setQuery}
                        autoFocus
                    />
                </View>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color="#CD7F32" />
                </View>
            ) : (
                <FlatList
                    data={results}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        query.trim() !== '' ? (
                            <View style={styles.center}>
                                <Text style={styles.emptyText}>No results found</Text>
                            </View>
                        ) : (
                            <View style={styles.center}>
                                <Text style={styles.placeholderText}>Type to search...</Text>
                            </View>
                        )
                    }
                />
            )}
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
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    backButtonText: {
        color: '#CD7F32',
        fontSize: 24,
        fontWeight: 'bold',
    },
    searchContainer: {
        flex: 1,
        backgroundColor: '#1E1E1E',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 40,
        justifyContent: 'center',
    },
    searchInput: {
        color: '#FFFFFF',
        fontSize: 16,
        height: '100%',
    },
    listContent: {
        padding: 16,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#2A2A2A',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    icon: {
        fontSize: 20,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    subtitle: {
        color: '#999',
        fontSize: 12,
    },
    typeBadge: {
        backgroundColor: '#2A2A2A',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginLeft: 8,
    },
    typeText: {
        color: '#CD7F32',
        fontSize: 10,
        fontWeight: 'bold',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
    },
    emptyText: {
        color: '#666',
        fontSize: 16,
    },
    placeholderText: {
        color: '#444',
        fontSize: 16,
    },
});

export default SearchScreen;
