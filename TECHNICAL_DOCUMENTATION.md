# ADVOCURA (LexMate) - Complete Technical Documentation

## Comprehensive Architecture & Implementation Guide

---

# TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Technology Stack Deep Dive](#2-technology-stack-deep-dive)
3. [React Native Fundamentals Used](#3-react-native-fundamentals-used)
4. [Project Architecture & Structure](#4-project-architecture--structure)
5. [Firebase Integration](#5-firebase-integration)
6. [Gmail API Integration](#6-gmail-api-integration)
7. [Navigation System](#7-navigation-system)
8. [State Management](#8-state-management)
9. [Offline-First Architecture & Caching](#9-offline-first-architecture--caching)
10. [Native Module Integration](#10-native-module-integration)
11. [Security Implementation](#11-security-implementation)
12. [Performance Optimization](#12-performance-optimization)
13. [Build & Deployment](#13-build--deployment)
14. [Patches & Native Modifications](#14-patches--native-modifications)
15. [Testing Strategy](#15-testing-strategy)
16. [Technical Q&A Reference](#16-technical-qa-reference)

---

# 1. PROJECT OVERVIEW

## 1.1 What is Advocura?

Advocura is a **legal case management mobile application** designed for lawyers and legal professionals to manage their cases, clients, hearings, documents, and case-related emails - all from their mobile device.

## 1.2 Key Business Features

| Feature | Description |
|---------|-------------|
| **Case Management** | Create, edit, track cases with full details (case number, type, status, parties) |
| **Client Management** | Maintain client database with contact info and case associations |
| **Hearing Calendar** | Schedule hearings, set reminders, view by date |
| **Document Management** | Upload, view, organize case documents with offline access |
| **Email Integration** | Link Gmail accounts, search case-related emails by keyword |
| **Notifications** | Push notifications for upcoming hearings |
| **Offline Support** | Full offline capability with intelligent caching |
| **Data Export** | Export all user data for backup/portability |

## 1.3 Technical Specifications

```
App Name:           Advocura (Internal: LexMate)
Package ID:         com.mk.ac (Android), com.lexmate (iOS)
Current Version:    1.8 (Build 9)
React Native:       0.82.1
Node Requirement:   >=20
Platforms:          iOS 13+, Android API 24+ (Android 7.0+)
Architecture:       New Architecture enabled (TurboModules, Fabric)
JS Engine:          Hermes (enabled)
```

---

# 2. TECHNOLOGY STACK DEEP DIVE

## 2.1 Core Framework

### React Native 0.82.1

**What is React Native?**
React Native is a JavaScript framework for building native mobile applications. It allows developers to write code in JavaScript/TypeScript that renders to native UI components.

**Why React Native for this project?**
1. **Cross-platform**: Single codebase for iOS and Android
2. **Performance**: Near-native performance with native UI rendering
3. **Developer Experience**: Hot reloading, familiar React patterns
4. **Ecosystem**: Rich library ecosystem for mobile features
5. **Cost Effective**: One team maintains both platforms

**Key Concepts Used:**
```javascript
// Functional Components with Hooks
const CaseDetailsScreen = ({ navigation, route }) => {
    const [loading, setLoading] = useState(true);
    const [caseData, setCaseData] = useState(null);

    useEffect(() => {
        loadCaseData();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            {/* Native UI components */}
        </SafeAreaView>
    );
};
```

### React 19.1.1

Latest React with:
- **Concurrent Features**: Better handling of async operations
- **Automatic Batching**: Multiple state updates batched automatically
- **Transitions**: Non-blocking UI updates

## 2.2 Backend Services

### Firebase Suite

| Service | Version | Purpose |
|---------|---------|---------|
| **Firebase Auth** | 23.5.0 | User authentication (email/password) |
| **Cloud Firestore** | 23.5.0 | NoSQL document database |
| **Cloud Storage** | 23.5.0 | File storage for documents |
| **Firebase Console** | - | Admin dashboard, analytics |

**Why Firebase?**
1. **Serverless**: No backend server to maintain
2. **Real-time**: Built-in real-time synchronization
3. **Scalable**: Automatic scaling with usage
4. **Security**: Built-in security rules
5. **Offline Support**: Native offline persistence

## 2.3 Navigation

### React Navigation 7.x

```
@react-navigation/native: 7.1.21
@react-navigation/native-stack: 7.7.0
@react-navigation/bottom-tabs: 7.8.6
```

**Why React Navigation?**
- Industry standard for RN navigation
- Native performance (uses native navigation primitives)
- Flexible nested navigation support
- Deep linking support
- TypeScript support

## 2.4 Styling

### NativeWind 4.2.1 (Tailwind CSS for React Native)

**What is NativeWind?**
NativeWind brings Tailwind CSS utility classes to React Native, allowing rapid UI development with consistent styling.

```javascript
// Traditional StyleSheet
<View style={{ flex: 1, backgroundColor: '#121212', padding: 16 }}>

// With NativeWind
<View className="flex-1 bg-gray-900 p-4">
```

**Configuration:**
```javascript
// tailwind.config.js
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: { extend: {} },
  plugins: [],
}

// babel.config.js
module.exports = {
  presets: [
    ['module:@react-native/babel-preset', { jsxImportSource: 'nativewind' }]
  ],
  plugins: ["react-native-reanimated/plugin"],
};

// metro.config.js
const { withNativeWind } = require('nativewind/metro');
module.exports = withNativeWind(config, { input: './global.css' });
```

## 2.5 All Dependencies Explained

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | 19.1.1 | Core React library |
| `react-native` | 0.82.1 | React Native framework |
| `@react-native-firebase/app` | 23.5.0 | Firebase core |
| `@react-native-firebase/auth` | 23.5.0 | Authentication |
| `@react-native-firebase/firestore` | 23.5.0 | Database |
| `@react-native-firebase/storage` | 23.5.0 | File storage |
| `@react-native-google-signin/google-signin` | 16.0.0 | Google OAuth |
| `@react-native-async-storage/async-storage` | 1.24.0 | Local key-value storage |
| `@react-navigation/native` | 7.1.21 | Navigation core |
| `@react-navigation/native-stack` | 7.7.0 | Stack navigator |
| `@react-navigation/bottom-tabs` | 7.8.6 | Tab navigator |
| `react-native-screens` | 4.18.0 | Native screen components |
| `react-native-safe-area-context` | 5.6.2 | Safe area handling |
| `react-native-vector-icons` | 10.3.0 | Icon library |
| `react-native-toast-message` | 2.3.3 | Toast notifications |
| `react-native-document-picker` | 9.3.1 | File picker |
| `react-native-document-scanner-plugin` | 2.0.2 | Document scanning |
| `react-native-image-picker` | 8.2.1 | Image selection |
| `react-native-file-viewer` | 2.1.5 | Open files in native apps |
| `react-native-fs` | 2.20.0 | File system operations |
| `react-native-pdf` | 7.0.3 | PDF viewing |
| `react-native-webview` | 13.16.0 | Web content display |
| `react-native-share` | 12.2.1 | Native share dialog |
| `react-native-compressor` | 1.13.0 | Image/video compression |
| `react-native-date-picker` | 5.0.13 | Date/time picker |
| `react-native-permissions` | 5.4.4 | Permission handling |
| `react-native-reanimated` | 4.2.0 | Advanced animations |
| `react-native-pell-rich-editor` | 1.10.0 | Rich text editor |
| `@notifee/react-native` | 9.1.8 | Local notifications |
| `nativewind` | 4.2.1 | Tailwind CSS |
| `jspdf` | 3.0.4 | PDF generation |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@babel/core` | 7.25.2 | JavaScript transpilation |
| `@react-native/babel-preset` | 0.82.3 | RN Babel configuration |
| `@react-native/metro-config` | 0.82.3 | Metro bundler config |
| `typescript` | 5.8.3 | TypeScript support |
| `eslint` | 8.19.0 | Code linting |
| `prettier` | 2.8.8 | Code formatting |
| `jest` | 29.6.3 | Testing framework |
| `patch-package` | 8.0.1 | Package patching |

---

# 3. REACT NATIVE FUNDAMENTALS USED

## 3.1 Component Architecture

### Functional Components with Hooks

All screens and components use functional components with React Hooks:

```javascript
// Example: CaseDetailsScreen.js
import React, { useState, useEffect, useCallback } from 'react';

const CaseDetailsScreen = ({ navigation, route }) => {
    // State hooks
    const [caseData, setCaseData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('details');

    // Effect hooks for lifecycle
    useEffect(() => {
        loadCaseData();
        return () => {
            // Cleanup function (like componentWillUnmount)
            unsubscribe();
        };
    }, [caseId]); // Dependency array

    // Callback hooks for memoization
    const handleSave = useCallback(async () => {
        await updateCase(userId, caseId, formData);
    }, [formData]);

    return (/* JSX */);
};
```

### Hooks Used in This Project

| Hook | Purpose | Example Usage |
|------|---------|---------------|
| `useState` | Local component state | Form inputs, loading states, UI toggles |
| `useEffect` | Side effects & lifecycle | API calls, subscriptions, cleanup |
| `useCallback` | Memoize functions | Event handlers passed to children |
| `useMemo` | Memoize computed values | Filtered lists, formatted data |
| `useRef` | Mutable references | Scroll positions, intervals |
| `useContext` | Access context values | Theme, user data (if using context) |

## 3.2 Core React Native Components

### View & SafeAreaView

```javascript
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// SafeAreaView handles notches, status bars, home indicators
<SafeAreaView style={styles.container}>
    <View style={styles.content}>
        {/* Content */}
    </View>
</SafeAreaView>
```

### Text

```javascript
import { Text } from 'react-native';

<Text style={styles.title}>Case Details</Text>
<Text style={[styles.text, { color: '#CD7F32' }]}>Status: Active</Text>
```

### TextInput

```javascript
import { TextInput } from 'react-native';

<TextInput
    style={styles.input}
    value={email}
    onChangeText={setEmail}
    placeholder="Enter email"
    placeholderTextColor="#666"
    keyboardType="email-address"
    autoCapitalize="none"
    autoCorrect={false}
/>
```

### TouchableOpacity

```javascript
import { TouchableOpacity } from 'react-native';

<TouchableOpacity
    style={styles.button}
    onPress={handleSubmit}
    disabled={loading}
    activeOpacity={0.7}
>
    <Text style={styles.buttonText}>Submit</Text>
</TouchableOpacity>
```

### ScrollView & FlatList

```javascript
// For simple scrollable content
<ScrollView
    style={styles.scroll}
    contentContainerStyle={styles.scrollContent}
    showsVerticalScrollIndicator={false}
>
    {/* Content */}
</ScrollView>

// For lists (virtualized, performant)
<FlatList
    data={cases}
    keyExtractor={(item) => item.id}
    renderItem={({ item }) => <CaseCard case={item} />}
    onRefresh={handleRefresh}
    refreshing={refreshing}
    ListEmptyComponent={<EmptyState />}
/>
```

### Modal

```javascript
import { Modal } from 'react-native';

<Modal
    visible={showModal}
    animationType="slide"
    transparent={true}
    onRequestClose={() => setShowModal(false)}
>
    <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
            {/* Modal content */}
        </View>
    </View>
</Modal>
```

### ActivityIndicator

```javascript
import { ActivityIndicator } from 'react-native';

{loading && (
    <ActivityIndicator size="large" color="#CD7F32" />
)}
```

## 3.3 StyleSheet API

```javascript
import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    card: {
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        // Shadow for iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        // Shadow for Android
        elevation: 4,
    },
    text: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '500',
    },
    // Dynamic width
    halfWidth: {
        width: width / 2 - 24,
    },
});
```

## 3.4 Platform-Specific Code

```javascript
import { Platform } from 'react-native';

// Platform-specific values
const styles = StyleSheet.create({
    container: {
        paddingTop: Platform.OS === 'ios' ? 20 : 0,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
            },
            android: {
                elevation: 4,
            },
        }),
    },
});

// Platform-specific code execution
if (Platform.OS === 'android') {
    // Android-specific code
}

// Platform-specific file extensions
// MyComponent.ios.js
// MyComponent.android.js
```

## 3.5 Keyboard Handling

```javascript
import { KeyboardAvoidingView, Platform, Keyboard } from 'react-native';

// Keyboard avoiding view
<KeyboardAvoidingView
    style={styles.container}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    keyboardVerticalOffset={100}
>
    <ScrollView keyboardShouldPersistTaps="handled">
        {/* Form content */}
    </ScrollView>
</KeyboardAvoidingView>

// Dismiss keyboard
const dismissKeyboard = () => {
    Keyboard.dismiss();
};
```

## 3.6 Linking (External URLs)

```javascript
import { Linking } from 'react-native';

const openURL = async (url) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
        await Linking.openURL(url);
    } else {
        Alert.alert('Error', 'Cannot open this URL');
    }
};

// Open phone dialer
Linking.openURL(`tel:${phoneNumber}`);

// Open email
Linking.openURL(`mailto:${email}`);

// Open maps
Linking.openURL(`https://maps.google.com/?q=${address}`);
```

## 3.7 Alert Dialog

```javascript
import { Alert } from 'react-native';

// Simple alert
Alert.alert('Success', 'Case created successfully');

// Confirmation dialog
Alert.alert(
    'Delete Case',
    'Are you sure you want to delete this case? This action cannot be undone.',
    [
        {
            text: 'Cancel',
            style: 'cancel',
        },
        {
            text: 'Delete',
            style: 'destructive',
            onPress: () => handleDelete(),
        },
    ]
);
```

---

# 4. PROJECT ARCHITECTURE & STRUCTURE

## 4.1 Directory Structure

```
LexMate/
├── src/                          # Main source code
│   ├── assets/                   # Static assets (images, fonts)
│   ├── navigation/               # Navigation configuration
│   │   └── AppNavigator.js       # Root navigator
│   ├── screens/                  # Screen components (by feature)
│   │   ├── Auth/                 # Login, Signup, ForgotPassword
│   │   ├── Dashboard/            # Home screen
│   │   ├── Cases/                # Case CRUD screens
│   │   ├── Clients/              # Client management
│   │   ├── Emails/               # Email integration
│   │   ├── Documents/            # Document viewer
│   │   ├── Hearings/             # Hearing management
│   │   ├── Settings/             # User settings
│   │   ├── Search/               # Global search
│   │   └── Reports/              # Reporting
│   ├── services/                 # Business logic & API calls
│   │   ├── authService.js        # Authentication
│   │   ├── firebase.js           # Firebase config
│   │   ├── gmailService.js       # Gmail API
│   │   ├── casesService.js       # Case operations
│   │   ├── clientsService.js     # Client operations
│   │   ├── hearingsService.js    # Hearing operations
│   │   ├── documentsService.js   # Document operations
│   │   ├── documentCacheService.js # Offline caching
│   │   ├── emailCacheService.js  # Email caching
│   │   ├── cacheConfigService.js # Cache configuration
│   │   ├── notificationsService.js # Push notifications
│   │   └── exportService.js      # Data export
│   ├── utils/                    # Utility functions
│   │   ├── validation.js         # Form validation
│   │   └── fileUtils.js          # File helpers
│   └── theme/                    # Theming (if any)
├── android/                      # Android native code
├── ios/                          # iOS native code
├── patches/                      # Package patches
├── __tests__/                    # Test files
├── App.js                        # Root component
├── index.js                      # Entry point
├── package.json                  # Dependencies
├── babel.config.js               # Babel config
├── metro.config.js               # Metro bundler config
├── tailwind.config.js            # Tailwind/NativeWind config
└── tsconfig.json                 # TypeScript config
```

## 4.2 Architecture Pattern

This project follows a **Feature-Based Architecture** with **Service Layer Pattern**:

```
┌─────────────────────────────────────────────────────┐
│                     SCREENS                          │
│  (UI Layer - React Native Components)               │
│  - Handles user interaction                          │
│  - Renders UI based on state                         │
│  - Calls service methods                             │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│                    SERVICES                          │
│  (Business Logic Layer)                             │
│  - Encapsulates business logic                       │
│  - Communicates with external APIs                   │
│  - Handles data transformation                       │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│              EXTERNAL SERVICES                       │
│  - Firebase (Auth, Firestore, Storage)              │
│  - Gmail API                                         │
│  - Local Storage (AsyncStorage, RNFS)               │
└─────────────────────────────────────────────────────┘
```

## 4.3 Data Flow

```
User Action → Screen Component → Service Method → Firebase/API → Response
                    ↓                                    │
            Update Local State ←─────────────────────────┘
                    ↓
               Re-render UI
```

**Example: Creating a Case**

```javascript
// 1. User fills form and taps "Create"
// 2. Screen calls service
const handleCreateCase = async () => {
    setLoading(true);
    const result = await createCase(userId, {
        title: formData.title,
        caseNumber: formData.caseNumber,
        // ... other fields
    });
    if (result.success) {
        Toast.show({ type: 'success', text1: 'Case created!' });
        navigation.goBack();
    } else {
        Toast.show({ type: 'error', text1: result.error });
    }
    setLoading(false);
};

// 3. Service method (casesService.js)
export const createCase = async (userId, caseData) => {
    try {
        const docRef = await firebaseDb
            .collection('users')
            .doc(userId)
            .collection('cases')
            .add({
                ...caseData,
                createdAt: firestore.FieldValue.serverTimestamp(),
                updatedAt: firestore.FieldValue.serverTimestamp(),
            });
        return { success: true, id: docRef.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
};
```

---

# 5. FIREBASE INTEGRATION

## 5.1 Firebase Setup

### Installation

```bash
# Install Firebase packages
npm install @react-native-firebase/app
npm install @react-native-firebase/auth
npm install @react-native-firebase/firestore
npm install @react-native-firebase/storage
```

### Android Configuration

1. Create Firebase project at console.firebase.google.com
2. Add Android app with package name `com.mk.ac`
3. Download `google-services.json` to `android/app/`
4. Add to `android/build.gradle`:

```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

5. Add to `android/app/build.gradle`:

```gradle
apply plugin: 'com.google.gms.google-services'
```

### iOS Configuration

1. Add iOS app in Firebase Console
2. Download `GoogleService-Info.plist` to `ios/LexMate/`
3. Update `ios/Podfile` with Firebase pods
4. Run `cd ios && pod install`

## 5.2 Firebase Initialization

```javascript
// src/services/firebase.js
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

// Firebase auto-initializes from google-services.json / GoogleService-Info.plist
export const firebaseAuth = auth();
export const firebaseDb = firestore();
export const firebaseStorage = storage();

export const getCurrentUser = () => firebaseAuth.currentUser;

export const logout = async () => {
    await firebaseAuth.signOut();
};
```

## 5.3 Firebase Authentication

### Sign Up

```javascript
export const signUp = async (email, password, userData) => {
    try {
        // Create auth account
        const userCredential = await firebaseAuth.createUserWithEmailAndPassword(
            email,
            password
        );

        // Create user profile in Firestore
        await firebaseDb.collection('users').doc(userCredential.user.uid).set({
            email,
            name: userData.name,
            phone: userData.phone,
            barCouncilId: userData.barCouncilId,
            isAllowed: true, // Admin can set to false to block access
            createdAt: firestore.FieldValue.serverTimestamp(),
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });

        return { success: true, user: userCredential.user };
    } catch (error) {
        return { success: false, error: getAuthErrorMessage(error.code) };
    }
};
```

### Sign In

```javascript
export const signIn = async (email, password) => {
    try {
        const userCredential = await firebaseAuth.signInWithEmailAndPassword(
            email,
            password
        );

        // Check if user is allowed
        const userDoc = await firebaseDb
            .collection('users')
            .doc(userCredential.user.uid)
            .get();

        if (userDoc.exists && userDoc.data().isAllowed === false) {
            await firebaseAuth.signOut();
            return {
                success: false,
                error: 'Your account has been deactivated. Please contact support.'
            };
        }

        return { success: true, user: userCredential.user };
    } catch (error) {
        return { success: false, error: getAuthErrorMessage(error.code) };
    }
};
```

### Auth State Listener

```javascript
export const onAuthStateChanged = (callback) => {
    return firebaseAuth.onAuthStateChanged(callback);
};

// Usage in AppNavigator.js
useEffect(() => {
    const unsubscribe = onAuthStateChanged((user) => {
        setUser(user);
        setLoading(false);
    });
    return unsubscribe; // Cleanup on unmount
}, []);
```

## 5.4 Cloud Firestore

### Data Structure

```
firestore/
├── users/
│   └── {userId}/
│       ├── email, name, phone, barCouncilId
│       ├── linkedGmailAccounts: []
│       ├── createdAt, updatedAt
│       │
│       ├── cases/
│       │   └── {caseId}/
│       │       ├── title, caseNumber, description
│       │       ├── clientId, clientName
│       │       ├── courtName, judgeName
│       │       ├── caseType, status
│       │       ├── emailKeyword
│       │       ├── filingDate, nextHearingDate
│       │       └── createdAt, updatedAt
│       │
│       ├── clients/
│       │   └── {clientId}/
│       │       ├── name, email, phone
│       │       ├── company, address, notes
│       │       └── createdAt, updatedAt
│       │
│       ├── hearings/
│       │   └── {hearingId}/
│       │       ├── caseId, type, date, time
│       │       ├── courtName, judgeName
│       │       ├── description
│       │       └── createdAt, updatedAt
│       │
│       └── documents/
│           └── {documentId}/
│               ├── caseId, name, type, size
│               ├── storagePath, downloadUrl
│               └── createdAt
│
└── app_config/
    └── cache_settings/
        └── maxCacheSizeMB: number
```

### CRUD Operations

```javascript
// CREATE
const createCase = async (userId, caseData) => {
    const docRef = await firebaseDb
        .collection('users')
        .doc(userId)
        .collection('cases')
        .add({
            ...caseData,
            createdAt: firestore.FieldValue.serverTimestamp(),
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });
    return docRef.id;
};

// READ (single document)
const getCaseById = async (userId, caseId) => {
    const doc = await firebaseDb
        .collection('users')
        .doc(userId)
        .collection('cases')
        .doc(caseId)
        .get();

    if (doc.exists) {
        return { id: doc.id, ...doc.data() };
    }
    return null;
};

// READ (collection with query)
const getCases = async (userId) => {
    const snapshot = await firebaseDb
        .collection('users')
        .doc(userId)
        .collection('cases')
        .orderBy('createdAt', 'desc')
        .get();

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};

// UPDATE
const updateCase = async (userId, caseId, updates) => {
    await firebaseDb
        .collection('users')
        .doc(userId)
        .collection('cases')
        .doc(caseId)
        .update({
            ...updates,
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });
};

// DELETE
const deleteCase = async (userId, caseId) => {
    await firebaseDb
        .collection('users')
        .doc(userId)
        .collection('cases')
        .doc(caseId)
        .delete();
};
```

### Real-time Listeners

```javascript
// Subscribe to real-time updates
const subscribeToCases = (userId, callback) => {
    const unsubscribe = firebaseDb
        .collection('users')
        .doc(userId)
        .collection('cases')
        .orderBy('createdAt', 'desc')
        .onSnapshot(
            (snapshot) => {
                const cases = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(cases);
            },
            (error) => {
                console.error('Subscription error:', error);
            }
        );

    return unsubscribe; // Call to stop listening
};

// Usage in component
useEffect(() => {
    const unsubscribe = subscribeToCases(userId, (cases) => {
        setCases(cases);
        setLoading(false);
    });

    return () => unsubscribe(); // Cleanup
}, [userId]);
```

### Querying Data

```javascript
// Filter by field
const getActiveCases = async (userId) => {
    const snapshot = await firebaseDb
        .collection('users')
        .doc(userId)
        .collection('cases')
        .where('status', '==', 'Active')
        .get();
    // ...
};

// Date range query
const getHearingsByDate = async (userId, date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const snapshot = await firebaseDb
        .collection('users')
        .doc(userId)
        .collection('hearings')
        .where('date', '>=', firestore.Timestamp.fromDate(startOfDay))
        .where('date', '<=', firestore.Timestamp.fromDate(endOfDay))
        .orderBy('date', 'asc')
        .get();
    // ...
};

// Compound queries (requires composite index)
const searchCases = async (userId, clientId, status) => {
    const snapshot = await firebaseDb
        .collection('users')
        .doc(userId)
        .collection('cases')
        .where('clientId', '==', clientId)
        .where('status', '==', status)
        .get();
    // ...
};
```

## 5.5 Firebase Storage

### Upload File

```javascript
export const uploadDocument = async (userId, caseId, file) => {
    try {
        // Normalize file URI for Android
        let fileUri = file.uri;
        if (Platform.OS === 'android' && !fileUri.startsWith('file://')) {
            fileUri = `file://${fileUri}`;
        }

        // Create storage reference
        const fileName = `${Date.now()}_${file.name}`;
        const storagePath = `users/${userId}/cases/${caseId}/documents/${fileName}`;
        const storageRef = firebaseStorage.ref(storagePath);

        // Upload file
        const task = storageRef.putFile(fileUri);

        // Track progress (optional)
        task.on('state_changed', (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`Upload: ${progress}%`);
        });

        // Wait for completion
        await task;

        // Get download URL
        const downloadUrl = await storageRef.getDownloadURL();

        // Save metadata to Firestore
        const docRef = await firebaseDb
            .collection('users')
            .doc(userId)
            .collection('documents')
            .add({
                caseId,
                name: file.name,
                type: file.type,
                size: file.size,
                storagePath,
                downloadUrl,
                createdAt: firestore.FieldValue.serverTimestamp(),
            });

        return {
            success: true,
            documentId: docRef.id,
            downloadUrl
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
};
```

### Download File

```javascript
// Using download URL directly
const downloadDocument = async (downloadUrl, localPath) => {
    try {
        const response = await RNFS.downloadFile({
            fromUrl: downloadUrl,
            toFile: localPath,
        }).promise;

        if (response.statusCode === 200) {
            return { success: true, path: localPath };
        }
        throw new Error('Download failed');
    } catch (error) {
        return { success: false, error: error.message };
    }
};
```

### Delete File

```javascript
export const deleteDocument = async (userId, documentId, storagePath) => {
    try {
        // Delete from Storage
        try {
            await firebaseStorage.ref(storagePath).delete();
        } catch (e) {
            // File might not exist, continue with Firestore deletion
        }

        // Delete from Firestore
        await firebaseDb
            .collection('users')
            .doc(userId)
            .collection('documents')
            .doc(documentId)
            .delete();

        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};
```

## 5.6 Firestore Security Rules

```javascript
// firestore.rules
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function isAdmin() {
      return isSignedIn() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // User documents - only owner can access
    match /users/{userId} {
      allow read, write: if isOwner(userId);
      allow read, update: if isAdmin(); // Admin can read and block users

      // Subcollections
      match /cases/{caseId} {
        allow read, write, create, delete: if isOwner(userId);
      }
      match /clients/{clientId} {
        allow read, write, create, delete: if isOwner(userId);
      }
      match /documents/{documentId} {
        allow read, write, create, delete: if isOwner(userId);
      }
      match /hearings/{hearingId} {
        allow read, write, create, delete: if isOwner(userId);
      }
    }

    // App config - read only
    match /app_config/{document} {
      allow read: if isSignedIn();
      allow write: if false; // Admin console only
    }

    // Default deny
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

# 6. GMAIL API INTEGRATION

## 6.1 Overview

The app integrates with Gmail API to:
- Link multiple Gmail accounts (max 3)
- Search emails by case keywords
- View email content and attachments
- Reply to and forward emails

## 6.2 Setup

### Google Cloud Console

1. Create project at console.cloud.google.com
2. Enable Gmail API
3. Configure OAuth consent screen
4. Create OAuth 2.0 credentials:
   - Web client ID (for token exchange)
   - Android client ID (with SHA-1 fingerprint)
   - iOS client ID (with bundle ID)

### React Native Google Sign-In

```bash
npm install @react-native-google-signin/google-signin
```

### Configuration

```javascript
// gmailService.js
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';
const WEB_CLIENT_ID = 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com';

const GMAIL_SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify',
];

export const configureGoogleSignIn = () => {
    GoogleSignin.configure({
        webClientId: WEB_CLIENT_ID,
        offlineAccess: true,
        scopes: GMAIL_SCOPES,
    });
};
```

## 6.3 Account Linking

```javascript
export const linkGmailAccount = async () => {
    try {
        // Configure if not already
        configureGoogleSignIn();

        // Sign out first to show account picker
        await GoogleSignin.signOut();

        // Sign in to get tokens
        const response = await GoogleSignin.signIn();
        const tokens = await GoogleSignin.getTokens();

        // Handle v10+ response format
        const user = response.data?.user || response.user;

        if (!user?.email) {
            return { success: false, error: 'Could not get user info' };
        }

        // Get current user's linked accounts
        const userId = getCurrentUser()?.uid;
        const userDoc = await firebaseDb.collection('users').doc(userId).get();
        const existingAccounts = userDoc.data()?.linkedGmailAccounts || [];

        // Check if already linked
        if (existingAccounts.some(acc => acc.email === user.email)) {
            return { success: false, error: 'Account already linked' };
        }

        // Check limit
        if (existingAccounts.length >= 3) {
            return { success: false, error: 'Maximum 3 accounts allowed' };
        }

        // Save to Firestore
        const newAccount = {
            email: user.email,
            name: user.name,
            photo: user.photo,
            accessToken: tokens.accessToken,
            idToken: tokens.idToken,
            linkedAt: new Date().toISOString(),
        };

        await firebaseDb.collection('users').doc(userId).update({
            linkedGmailAccounts: [...existingAccounts, newAccount],
        });

        return { success: true, account: newAccount };
    } catch (error) {
        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
            return { success: false, error: 'Sign in cancelled' };
        }
        return { success: false, error: error.message };
    }
};
```

## 6.4 Token Refresh

```javascript
const refreshAccessToken = async (account) => {
    try {
        // Try silent sign-in
        const currentUser = await GoogleSignin.getCurrentUser();
        if (!currentUser || currentUser?.user?.email !== account.email) {
            await GoogleSignin.signOut();
            await GoogleSignin.signInSilently();
        }

        const tokens = await GoogleSignin.getTokens();

        // Update in Firestore
        const userId = getCurrentUser()?.uid;
        const userDoc = await firebaseDb.collection('users').doc(userId).get();
        const accounts = userDoc.data()?.linkedGmailAccounts || [];

        const updatedAccounts = accounts.map(acc =>
            acc.email === account.email
                ? { ...acc, accessToken: tokens.accessToken }
                : acc
        );

        await firebaseDb.collection('users').doc(userId).update({
            linkedGmailAccounts: updatedAccounts,
        });

        return tokens.accessToken;
    } catch (error) {
        // Fallback to interactive sign-in
        await GoogleSignin.signOut();
        await GoogleSignin.signIn();
        const tokens = await GoogleSignin.getTokens();
        return tokens.accessToken;
    }
};
```

## 6.5 Gmail API Requests

```javascript
const gmailApiRequest = async (account, endpoint, method = 'GET', body = null) => {
    let accessToken = account.accessToken;

    const makeRequest = async (token) => {
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${GMAIL_API_BASE}${endpoint}`, options);

        if (response.status === 401 || response.status === 403) {
            throw new Error('TOKEN_EXPIRED');
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API request failed');
        }

        return response.json();
    };

    try {
        return await makeRequest(accessToken);
    } catch (error) {
        if (error.message === 'TOKEN_EXPIRED') {
            // Refresh token and retry
            accessToken = await refreshAccessToken(account);
            return await makeRequest(accessToken);
        }
        throw error;
    }
};
```

## 6.6 Search Emails

```javascript
export const searchEmails = async (subjectKeyword, maxResults = 50) => {
    try {
        const { accounts } = await getLinkedAccounts();

        if (accounts.length === 0) {
            return { success: true, emails: [], message: 'No Gmail accounts linked' };
        }

        const allEmails = [];
        const query = `in:inbox subject:${subjectKeyword}`;

        for (const account of accounts) {
            try {
                // Search for messages
                const searchResult = await gmailApiRequest(
                    account,
                    `/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`
                );

                if (searchResult.messages?.length > 0) {
                    // Fetch details for each message
                    for (const msg of searchResult.messages) {
                        const emailDetail = await gmailApiRequest(
                            account,
                            `/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`
                        );

                        const headers = emailDetail.payload?.headers || [];
                        const getHeader = (name) =>
                            headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

                        allEmails.push({
                            id: emailDetail.id,
                            threadId: emailDetail.threadId,
                            accountEmail: account.email,
                            subject: getHeader('Subject'),
                            from: getHeader('From'),
                            to: getHeader('To'),
                            date: getHeader('Date'),
                            snippet: emailDetail.snippet,
                            isUnread: emailDetail.labelIds?.includes('UNREAD'),
                        });
                    }
                }
            } catch (accountError) {
                console.error(`Error fetching from ${account.email}:`, accountError);
                // Continue with other accounts
            }
        }

        // Sort by date (newest first)
        allEmails.sort((a, b) => new Date(b.date) - new Date(a.date));

        return { success: true, emails: allEmails };
    } catch (error) {
        return { success: false, error: error.message, emails: [] };
    }
};
```

## 6.7 Send Email / Reply / Forward

```javascript
// Create MIME message for sending
const createMimeMessage = ({ to, cc, from, subject, body, inReplyTo, references, attachments = [] }) => {
    const boundary = '----=_Part_' + Date.now();
    const hasAttachments = attachments && attachments.length > 0;

    let message = [
        `To: ${to}`,
        `From: ${from}`,
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
    ];

    if (cc && cc.trim()) {
        message.splice(2, 0, `Cc: ${cc}`);
    }

    if (inReplyTo) {
        message.push(`In-Reply-To: <${inReplyTo}>`);
    }
    if (references) {
        message.push(`References: <${references}>`);
    }

    if (hasAttachments) {
        // Multipart/mixed for attachments
        message.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
        message.push('');

        // Text body part
        const altBoundary = '----=_Alt_' + Date.now();
        message.push(`--${boundary}`);
        message.push(`Content-Type: multipart/alternative; boundary="${altBoundary}"`);
        message.push('');

        // Plain text
        message.push(`--${altBoundary}`);
        message.push('Content-Type: text/plain; charset=UTF-8');
        message.push('');
        message.push(stripHtml(body));
        message.push('');

        // HTML
        message.push(`--${altBoundary}`);
        message.push('Content-Type: text/html; charset=UTF-8');
        message.push('');
        message.push(body);
        message.push('');
        message.push(`--${altBoundary}--`);

        // Attachments
        for (const att of attachments) {
            message.push('');
            message.push(`--${boundary}`);
            message.push(`Content-Type: ${att.mimeType}; name="${att.filename}"`);
            message.push('Content-Transfer-Encoding: base64');
            message.push(`Content-Disposition: attachment; filename="${att.filename}"`);
            message.push('');
            message.push(att.data);
        }

        message.push('');
        message.push(`--${boundary}--`);
    } else {
        // Simple text/html
        message.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
        message.push('');
        message.push(`--${boundary}`);
        message.push('Content-Type: text/plain; charset=UTF-8');
        message.push('');
        message.push(stripHtml(body));
        message.push('');
        message.push(`--${boundary}`);
        message.push('Content-Type: text/html; charset=UTF-8');
        message.push('');
        message.push(body);
        message.push('');
        message.push(`--${boundary}--`);
    }

    const rawMessage = message.join('\r\n');

    // Base64 URL-safe encode
    return btoa(unescape(encodeURIComponent(rawMessage)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
};

// Send reply
export const sendReply = async (accountEmail, originalEmail, replyBody, toAddress, ccAddress) => {
    try {
        const { accounts } = await getLinkedAccounts();
        const account = accounts.find(acc => acc.email === accountEmail);

        const message = createMimeMessage({
            to: toAddress,
            cc: ccAddress,
            from: accountEmail,
            subject: `Re: ${originalEmail.subject}`,
            body: replyBody,
            inReplyTo: originalEmail.id,
            references: originalEmail.id,
        });

        const result = await gmailApiRequest(account, '/messages/send', 'POST', {
            raw: message,
            threadId: originalEmail.threadId,
        });

        return { success: true, messageId: result.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
};
```

---

# 7. NAVIGATION SYSTEM

## 7.1 React Navigation Setup

```bash
npm install @react-navigation/native
npm install @react-navigation/native-stack
npm install @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
```

## 7.2 Navigation Structure

```javascript
// src/navigation/AppNavigator.js
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { onAuthStateChanged } from '../services/authService';

// Import all screens...

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const CasesStack = createNativeStackNavigator();
const ClientsStack = createNativeStackNavigator();
const SettingsStack = createNativeStackNavigator();

// Nested stack for Cases tab
const CasesStackNavigator = () => (
    <CasesStack.Navigator screenOptions={{ headerShown: false }}>
        <CasesStack.Screen name="CasesList" component={CasesListScreen} />
        <CasesStack.Screen name="AddCase" component={AddCaseScreen} />
        <CasesStack.Screen name="CaseDetails" component={CaseDetailsScreen} />
        <CasesStack.Screen name="AddHearing" component={AddHearingScreen} />
        <CasesStack.Screen name="DocumentViewer" component={DocumentViewerScreen} />
        <CasesStack.Screen name="EmailViewer" component={EmailViewerScreen} />
        <CasesStack.Screen name="ComposeEmail" component={ComposeEmailScreen} />
    </CasesStack.Navigator>
);

// Nested stack for Clients tab
const ClientsStackNavigator = () => (
    <ClientsStack.Navigator screenOptions={{ headerShown: false }}>
        <ClientsStack.Screen name="ClientsList" component={ClientsListScreen} />
        <ClientsStack.Screen name="AddClient" component={AddClientScreen} />
        <ClientsStack.Screen name="ClientDetails" component={ClientDetailsScreen} />
    </ClientsStack.Navigator>
);

// Nested stack for Settings tab
const SettingsStackNavigator = () => (
    <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
        <SettingsStack.Screen name="Settings" component={SettingsScreen} />
        <SettingsStack.Screen name="EditProfile" component={EditProfileScreen} />
        <SettingsStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <SettingsStack.Screen name="StorageManagement" component={StorageManagementScreen} />
        <SettingsStack.Screen name="LinkedGmailAccounts" component={LinkedGmailAccountsScreen} />
    </SettingsStack.Navigator>
);

// Main Tab Navigator
const MainTabs = () => {
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#1E1E1E',
                    borderTopColor: '#333',
                    height: 60 + insets.bottom,
                    paddingBottom: 8 + insets.bottom,
                },
                tabBarActiveTintColor: '#CD7F32',
                tabBarInactiveTintColor: '#666',
            }}
        >
            <Tab.Screen
                name="Home"
                component={DashboardScreen}
                options={{
                    tabBarIcon: () => <Text style={{ fontSize: 24 }}>🏠</Text>,
                }}
            />
            <Tab.Screen
                name="Cases"
                component={CasesStackNavigator}
                options={{
                    tabBarIcon: () => <Text style={{ fontSize: 24 }}>📁</Text>,
                }}
            />
            <Tab.Screen
                name="Clients"
                component={ClientsStackNavigator}
                options={{
                    tabBarIcon: () => <Text style={{ fontSize: 24 }}>👥</Text>,
                }}
            />
            <Tab.Screen
                name="More"
                component={SettingsStackNavigator}
                options={{
                    tabBarIcon: () => <Text style={{ fontSize: 24 }}>⚙️</Text>,
                }}
            />
        </Tab.Navigator>
    );
};

// Root Navigator
const AppNavigator = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged((authUser) => {
            setUser(authUser);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {user ? (
                    // Logged in
                    <>
                        <Stack.Screen name="Main" component={MainTabs} />
                        <Stack.Screen name="Search" component={SearchScreen} />
                    </>
                ) : (
                    // Not logged in
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="GetAccess" component={GetAccessScreen} />
                        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
```

## 7.3 Navigation Patterns

### Navigate to Screen

```javascript
// Simple navigation
navigation.navigate('CaseDetails', { caseId: '123' });

// Navigate within nested stack
navigation.navigate('Cases', {
    screen: 'CaseDetails',
    params: { caseId: '123' }
});

// Go back
navigation.goBack();

// Pop to top of stack
navigation.popToTop();

// Reset navigation state
navigation.reset({
    index: 0,
    routes: [{ name: 'Login' }],
});
```

### Receive Parameters

```javascript
const CaseDetailsScreen = ({ navigation, route }) => {
    const { caseId, caseData } = route.params;

    // Use params...
};
```

### Navigation Options

```javascript
// Set options dynamically
useEffect(() => {
    navigation.setOptions({
        title: caseData?.title || 'Case Details',
        headerRight: () => (
            <TouchableOpacity onPress={handleEdit}>
                <Text>Edit</Text>
            </TouchableOpacity>
        ),
    });
}, [caseData]);
```

---

# 8. STATE MANAGEMENT

## 8.1 Local State with useState

This project primarily uses local component state with `useState`:

```javascript
const [cases, setCases] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [selectedFilter, setSelectedFilter] = useState('all');
```

## 8.2 Real-time State with Firestore Listeners

Instead of a global state manager, the app uses Firestore's real-time listeners:

```javascript
useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribe = subscribeToCases(userId, (casesData) => {
        setCases(casesData);
        setLoading(false);
    });

    // Cleanup on unmount
    return () => unsubscribe();
}, [userId]);
```

## 8.3 Why No Redux/Context?

1. **Data Source of Truth**: Firebase serves as the single source of truth
2. **Real-time Sync**: Firestore handles synchronization automatically
3. **Simplicity**: Local state is sufficient for UI concerns
4. **Performance**: No unnecessary re-renders from global state changes

## 8.4 Form State Management

```javascript
const [formData, setFormData] = useState({
    title: '',
    caseNumber: '',
    description: '',
    clientId: '',
    status: 'Active',
});

const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
};

// Or using individual states for better performance
const [title, setTitle] = useState('');
const [caseNumber, setCaseNumber] = useState('');
```

---

# 9. OFFLINE-FIRST ARCHITECTURE & CACHING

## 9.1 Overview

The app implements an **offline-first architecture** for documents and emails using:
- Local file storage (react-native-fs)
- AsyncStorage for metadata
- LRU (Least Recently Used) eviction policy
- Configurable cache sizes from Firebase

## 9.2 Document Cache Service

```javascript
// src/services/documentCacheService.js

const CACHE_ROOT = `${RNFS.DocumentDirectoryPath}/lexmate_cache`;
const CACHE_INDEX_KEY = '@lexmate_cache:index';

// Initialize cache directory
export const initializeCache = async (userId) => {
    try {
        const cacheDir = `${CACHE_ROOT}/${userId}`;
        const exists = await RNFS.exists(cacheDir);

        if (!exists) {
            await RNFS.mkdir(cacheDir);
        }

        // Load cache index from AsyncStorage
        const indexJson = await AsyncStorage.getItem(CACHE_INDEX_KEY);
        const index = indexJson ? JSON.parse(indexJson) : {
            version: '1.0',
            totalSize: 0,
            documentCount: 0,
            documents: {},
        };

        return true;
    } catch (error) {
        console.error('Cache init error:', error);
        return false;
    }
};

// Get cached document or download
export const getCachedDocument = async (documentId, documentData, forceDownload = false) => {
    const maxCacheSize = await getMaxCacheSize(); // From Firebase config

    // Check if cached
    const cachedPath = await getCachedPath(documentId);
    if (cachedPath && !forceDownload) {
        // Update last accessed time
        await updateAccessTime(documentId);
        return cachedPath;
    }

    // Need to download
    // First, ensure we have space (LRU eviction)
    await ensureCacheSpace(documentData.size, maxCacheSize);

    // Download file
    const localPath = `${CACHE_ROOT}/${userId}/${documentId}_${documentData.name}`;

    await RNFS.downloadFile({
        fromUrl: documentData.downloadUrl,
        toFile: localPath,
    }).promise;

    // Compress if image
    if (isImage(documentData.name)) {
        const compressedPath = await compressImage(localPath);
        // ... replace with compressed
    }

    // Update cache index
    await updateCacheIndex(documentId, {
        fileName: documentData.name,
        size: documentData.size,
        lastAccessed: Date.now(),
        createdAt: Date.now(),
    });

    return localPath;
};

// LRU Eviction
const ensureCacheSpace = async (requiredSize, maxSize) => {
    const index = await getCacheIndex();
    let currentSize = index.totalSize;

    while (currentSize + requiredSize > maxSize * 1024 * 1024) {
        // Find least recently used document
        const documents = Object.entries(index.documents);
        if (documents.length === 0) break;

        documents.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
        const [oldestId, oldestData] = documents[0];

        // Remove oldest
        await removeCachedDocument(oldestId);
        currentSize -= oldestData.size;
    }
};

// Clear all cache
export const clearCache = async () => {
    const cacheDir = `${CACHE_ROOT}/${userId}`;
    await RNFS.unlink(cacheDir);
    await RNFS.mkdir(cacheDir);
    await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify({
        version: '1.0',
        totalSize: 0,
        documentCount: 0,
        documents: {},
    }));
};
```

## 9.3 Cache Configuration Service

```javascript
// src/services/cacheConfigService.js

const CACHE_CONFIG_KEY = '@lexmate:cache_config';
const DEFAULT_CACHE_SIZE_MB = 300;

export const getMaxCacheSize = async () => {
    try {
        // Check local cache first
        const cached = await AsyncStorage.getItem(CACHE_CONFIG_KEY);
        if (cached) {
            return parseInt(cached, 10);
        }

        // Fetch from Firebase
        const configDoc = await firebaseDb
            .collection('app_config')
            .doc('cache_settings')
            .get();

        const size = configDoc.exists
            ? configDoc.data().maxCacheSizeMB
            : DEFAULT_CACHE_SIZE_MB;

        // Cache locally
        await AsyncStorage.setItem(CACHE_CONFIG_KEY, size.toString());

        return size;
    } catch (error) {
        return DEFAULT_CACHE_SIZE_MB;
    }
};

export const clearCachedConfig = async () => {
    await AsyncStorage.removeItem(CACHE_CONFIG_KEY);
};
```

## 9.4 Email Cache Service

Similar structure to document cache, with email-specific handling:

```javascript
// src/services/emailCacheService.js

const EMAIL_CACHE_ROOT = `${RNFS.DocumentDirectoryPath}/lexmate_email_cache`;
const EMAIL_CACHE_INDEX_KEY = '@lexmate_email_cache:index';
const MAX_EMAIL_CACHE_MB = 200;

export const cacheEmail = async (email) => {
    // Store email content as JSON file
    const emailPath = `${EMAIL_CACHE_ROOT}/${email.id}.json`;
    await RNFS.writeFile(emailPath, JSON.stringify(email), 'utf8');
    // Update index...
};

export const getCachedEmail = async (emailId) => {
    const emailPath = `${EMAIL_CACHE_ROOT}/${emailId}.json`;
    const exists = await RNFS.exists(emailPath);

    if (exists) {
        const content = await RNFS.readFile(emailPath, 'utf8');
        return JSON.parse(content);
    }
    return null;
};
```

---

# 10. NATIVE MODULE INTEGRATION

## 10.1 react-native-fs (File System)

```javascript
import RNFS from 'react-native-fs';

// Common paths
RNFS.DocumentDirectoryPath  // App's documents directory
RNFS.CachesDirectoryPath    // App's cache directory
RNFS.TemporaryDirectoryPath // Temp directory

// File operations
await RNFS.exists(path);                    // Check if exists
await RNFS.mkdir(path);                     // Create directory
await RNFS.unlink(path);                    // Delete file/directory
await RNFS.readFile(path, 'utf8');          // Read file
await RNFS.writeFile(path, content, 'utf8'); // Write file
await RNFS.copyFile(source, dest);          // Copy file
await RNFS.moveFile(source, dest);          // Move file
await RNFS.stat(path);                      // Get file info

// Download file
const download = RNFS.downloadFile({
    fromUrl: url,
    toFile: localPath,
    progress: (res) => {
        const progress = res.bytesWritten / res.contentLength;
    },
});
await download.promise;
```

## 10.2 react-native-image-picker

```javascript
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

const pickImage = async () => {
    const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1920,
    });

    if (!result.didCancel && result.assets?.length > 0) {
        const image = result.assets[0];
        // image.uri, image.type, image.fileName, image.fileSize
    }
};

const takePhoto = async () => {
    const result = await launchCamera({
        mediaType: 'photo',
        cameraType: 'back',
        quality: 0.8,
    });
    // ...
};
```

## 10.3 react-native-document-picker

```javascript
import DocumentPicker from 'react-native-document-picker';

const pickDocument = async () => {
    try {
        const result = await DocumentPicker.pick({
            type: [DocumentPicker.types.allFiles],
            // type: [DocumentPicker.types.pdf, DocumentPicker.types.images],
        });

        const file = result[0];
        // file.uri, file.type, file.name, file.size
    } catch (err) {
        if (DocumentPicker.isCancel(err)) {
            // User cancelled
        } else {
            throw err;
        }
    }
};

// Pick multiple files
const results = await DocumentPicker.pick({
    type: [DocumentPicker.types.allFiles],
    allowMultiSelection: true,
});
```

## 10.4 react-native-document-scanner-plugin

```javascript
import DocumentScanner from 'react-native-document-scanner-plugin';

const scanDocument = async () => {
    const { scannedImages } = await DocumentScanner.scanDocument({
        croppedImageQuality: 100,
        maxNumDocuments: 5,
    });

    if (scannedImages.length > 0) {
        // scannedImages is array of file URIs
        const scannedUri = scannedImages[0];
    }
};
```

## 10.5 react-native-compressor

```javascript
import { Image, Video } from 'react-native-compressor';

// Compress image
const compressImage = async (uri) => {
    const compressedUri = await Image.compress(uri, {
        compressionMethod: 'auto',
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.8,
    });
    return compressedUri;
};

// Compress video
const compressVideo = async (uri) => {
    const compressedUri = await Video.compress(uri, {
        compressionMethod: 'auto',
        maxSize: 1280,
    });
    return compressedUri;
};
```

## 10.6 react-native-file-viewer

```javascript
import FileViewer from 'react-native-file-viewer';

const openFile = async (filePath) => {
    try {
        await FileViewer.open(filePath, {
            showOpenWithDialog: true,
            showAppsSuggestions: true,
        });
    } catch (error) {
        // Fallback to share
        await Share.open({ url: `file://${filePath}` });
    }
};
```

## 10.7 @notifee/react-native (Notifications)

```javascript
import notifee, { AndroidImportance, TriggerType } from '@notifee/react-native';

class NotificationsService {
    channelId = 'hearings_channel';

    async init() {
        // Create notification channel (Android)
        await notifee.createChannel({
            id: this.channelId,
            name: 'Hearing Reminders',
            importance: AndroidImportance.HIGH,
        });
    }

    async requestPermission() {
        const settings = await notifee.requestPermission();
        return settings.authorizationStatus >= 1;
    }

    async scheduleHearingNotification(hearing) {
        // Schedule for 1 day before at 9 AM
        const hearingDate = new Date(hearing.date);
        const triggerDate = new Date(hearingDate);
        triggerDate.setDate(triggerDate.getDate() - 1);
        triggerDate.setHours(9, 0, 0, 0);

        if (triggerDate <= new Date()) return;

        await notifee.createTriggerNotification(
            {
                id: hearing.id,
                title: 'Hearing Tomorrow',
                body: `${hearing.type} at ${hearing.courtName}`,
                android: {
                    channelId: this.channelId,
                    pressAction: { id: 'default' },
                },
            },
            {
                type: TriggerType.TIMESTAMP,
                timestamp: triggerDate.getTime(),
            }
        );
    }

    async cancelNotification(hearingId) {
        await notifee.cancelNotification(hearingId);
    }
}

export const notificationsService = new NotificationsService();
```

---

# 11. SECURITY IMPLEMENTATION

## 11.1 Authentication Security

- **Firebase Auth**: Industry-standard authentication
- **Password Requirements**: Minimum 6 characters (Firebase default)
- **Access Control**: `isAllowed` field to block users
- **Session Management**: Firebase handles token refresh

## 11.2 Data Security

### Firestore Rules

```javascript
// Only user can access their own data
match /users/{userId} {
    allow read, write: if request.auth.uid == userId;

    match /cases/{caseId} {
        allow read, write, create, delete: if request.auth.uid == userId;
    }
    // ... same for clients, documents, hearings
}
```

### Data Isolation

Each user's data is stored in their own subcollections:
```
users/{userId}/cases
users/{userId}/clients
users/{userId}/documents
users/{userId}/hearings
```

## 11.3 API Security

- **OAuth 2.0**: Gmail API uses OAuth with scopes
- **Token Refresh**: Automatic token refresh on expiry
- **Scope Limitation**: Only requested Gmail scopes

## 11.4 Local Data Security

- **App Sandbox**: All cached files in app's private directory
- **No Sensitive Storage**: Tokens stored in Firebase, not locally
- **Cache Clearable**: Users can clear cached data

## 11.5 Input Validation

```javascript
// src/utils/validation.js

export const validateEmail = (email) => {
    if (!email || !email.trim()) {
        return { isValid: false, error: 'Email is required' };
    }
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
        return { isValid: false, error: 'Invalid email format' };
    }
    return { isValid: true, error: null };
};

export const validatePhone = (phone) => {
    if (!phone) return { isValid: true, error: null }; // Optional
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) {
        return { isValid: false, error: 'Phone must be 10 digits' };
    }
    return { isValid: true, error: null };
};

export const validatePassword = (password) => {
    if (!password || password.length < 6) {
        return { isValid: false, error: 'Password must be at least 6 characters' };
    }
    return { isValid: true, error: null };
};
```

---

# 12. PERFORMANCE OPTIMIZATION

## 12.1 List Virtualization

```javascript
// Use FlatList instead of map in ScrollView
<FlatList
    data={cases}
    keyExtractor={(item) => item.id}
    renderItem={({ item }) => <CaseCard case={item} />}
    initialNumToRender={10}
    maxToRenderPerBatch={10}
    windowSize={5}
    removeClippedSubviews={true}
/>
```

## 12.2 Memoization

```javascript
// Memoize expensive computations
const filteredCases = useMemo(() => {
    return cases.filter(c => c.status === selectedFilter);
}, [cases, selectedFilter]);

// Memoize callbacks
const handlePress = useCallback(() => {
    navigation.navigate('CaseDetails', { caseId: item.id });
}, [item.id]);

// Memoize components
const CaseCard = React.memo(({ case, onPress }) => {
    // ...
});
```

## 12.3 Image Optimization

```javascript
// Compress images before upload
import { Image } from 'react-native-compressor';

const compressedUri = await Image.compress(uri, {
    compressionMethod: 'auto',
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.8,
});
```

## 12.4 Lazy Loading

```javascript
// Load data on demand
const loadMore = () => {
    if (!loading && hasMore) {
        fetchNextPage();
    }
};

<FlatList
    onEndReached={loadMore}
    onEndReachedThreshold={0.5}
/>
```

## 12.5 Hermes Engine

Hermes is enabled for faster startup and lower memory usage:

```properties
# android/gradle.properties
hermesEnabled=true
```

## 12.6 New Architecture

TurboModules and Fabric are enabled:

```properties
# android/gradle.properties
newArchEnabled=true
```

---

# 13. BUILD & DEPLOYMENT

## 13.1 Development Build

```bash
# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
# or
cd ios && pod install && cd ..
npx react-native run-ios
```

## 13.2 Android Release Build

### Keystore Setup

```bash
# Generate keystore (one time)
keytool -genkey -v -keystore my-upload-key.keystore \
  -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

### Configure Signing

```properties
# android/keystore.properties
MYAPP_UPLOAD_STORE_FILE=my-upload-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=my-key-alias
MYAPP_UPLOAD_STORE_PASSWORD=your-store-password
MYAPP_UPLOAD_KEY_PASSWORD=your-key-password
```

### Build Commands

```bash
# Build APK (for direct installation)
cd android && ./gradlew assembleRelease

# Build AAB (for Play Store)
cd android && ./gradlew bundleRelease

# Output location
# APK: android/app/build/outputs/apk/release/app-release.apk
# AAB: android/app/build/outputs/bundle/release/app-release.aab
```

### Version Management

```gradle
// android/app/build.gradle
defaultConfig {
    applicationId "com.mk.ac"
    versionCode 9        // Increment for each release
    versionName "1.8"    // User-visible version
}
```

## 13.3 iOS Release Build

```bash
# Install pods
cd ios && pod install

# Open in Xcode
open ios/LexMate.xcworkspace

# In Xcode:
# 1. Select "Any iOS Device" as target
# 2. Product > Archive
# 3. Distribute App > App Store Connect
```

## 13.4 Play Store Deployment

1. Create app in Google Play Console
2. Upload AAB file
3. Fill store listing (description, screenshots)
4. Complete content rating questionnaire
5. Set pricing and distribution
6. Submit for review

### SHA-1 Fingerprints

For Google Sign-In to work in release:

```bash
# Debug SHA-1
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android

# Release SHA-1 (your keystore)
keytool -list -v -keystore my-upload-key.keystore -alias my-key-alias

# Play Store App Signing SHA-1
# Get from Play Console > Setup > App signing
```

Add all SHA-1s to:
1. Firebase Console > Project Settings > Android app
2. Google Cloud Console > APIs & Services > Credentials

---

# 14. PATCHES & NATIVE MODIFICATIONS

## 14.1 What is patch-package?

`patch-package` allows you to make and persist modifications to npm packages. Changes survive `npm install`.

## 14.2 Why Patches Are Needed

Sometimes npm packages have bugs or need customization that aren't yet in a published version. Patches allow you to:
- Fix bugs in third-party packages
- Add missing functionality
- Customize behavior for your needs

## 14.3 How to Create a Patch

```bash
# 1. Install patch-package
npm install patch-package --save-dev

# 2. Add postinstall script to package.json
{
  "scripts": {
    "postinstall": "patch-package"
  }
}

# 3. Make changes to node_modules/package-name/...

# 4. Create patch
npx patch-package package-name

# This creates patches/package-name+version.patch
```

## 14.4 Our Patch: react-native-document-picker

```
patches/react-native-document-picker+9.3.1.patch
```

This patch contains modifications to the document picker library, likely fixing Android-specific issues or adding functionality.

## 14.5 How Patches Work

1. After `npm install`, the `postinstall` script runs
2. `patch-package` reads patches from `patches/` folder
3. Applies each patch to corresponding package in `node_modules/`
4. Changes are applied automatically

## 14.6 Maintaining Patches

When upgrading a patched package:
1. Delete the old patch file
2. Upgrade the package: `npm update package-name`
3. Check if the fix is included in new version
4. If not, reapply changes and create new patch

---

# 15. TESTING STRATEGY

## 15.1 Testing Setup

```javascript
// jest.config.js
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation)/)',
  ],
};
```

## 15.2 Unit Tests

```javascript
// __tests__/validation.test.js
import { validateEmail, validatePhone } from '../src/utils/validation';

describe('validateEmail', () => {
  it('returns valid for correct email', () => {
    const result = validateEmail('test@example.com');
    expect(result.isValid).toBe(true);
  });

  it('returns invalid for missing @', () => {
    const result = validateEmail('testexample.com');
    expect(result.isValid).toBe(false);
  });
});

describe('validatePhone', () => {
  it('returns valid for 10-digit number', () => {
    const result = validatePhone('9876543210');
    expect(result.isValid).toBe(true);
  });

  it('returns invalid for less than 10 digits', () => {
    const result = validatePhone('12345');
    expect(result.isValid).toBe(false);
  });
});
```

## 15.3 Component Tests

```javascript
// __tests__/LoginScreen.test.js
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../src/screens/Auth/LoginScreen';

jest.mock('../src/services/authService');

describe('LoginScreen', () => {
  it('renders email and password inputs', () => {
    const { getByPlaceholderText } = render(<LoginScreen />);
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
  });

  it('shows error for invalid email', async () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'invalid');
    fireEvent.press(getByText('Login'));

    await waitFor(() => {
      expect(getByText('Invalid email format')).toBeTruthy();
    });
  });
});
```

## 15.4 Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- LoginScreen.test.js

# Watch mode
npm test -- --watch
```

---

# 16. TECHNICAL Q&A REFERENCE

## React Native Basics

### Q: What is the difference between React Native and React?

**A:**
React is a JavaScript library for building web user interfaces. React Native is a framework that uses React to build native mobile applications.

Key differences:
- **React** renders to DOM elements (`<div>`, `<span>`)
- **React Native** renders to native components (`<View>`, `<Text>`)
- **React** uses CSS for styling
- **React Native** uses StyleSheet API (similar to CSS but with differences)
- **React Native** has no browser APIs, uses native modules instead

### Q: What is the bridge in React Native?

**A:**
The bridge is the communication layer between JavaScript and native code. In the old architecture:
1. JS thread sends serialized JSON messages
2. Bridge queues and batches messages
3. Native side deserializes and executes

**New Architecture (TurboModules):**
- Direct JSI (JavaScript Interface) calls
- No serialization overhead
- Synchronous native calls possible

### Q: What is Hermes?

**A:**
Hermes is a JavaScript engine optimized for React Native:
- **Faster startup**: Bytecode precompilation
- **Lower memory usage**: Optimized garbage collector
- **Better debugging**: Enhanced error messages

Enabled in `gradle.properties`:
```properties
hermesEnabled=true
```

### Q: Explain the New Architecture (TurboModules, Fabric)

**A:**
- **TurboModules**: New native module system
  - Direct JSI calls (no bridge)
  - Lazy loading of modules
  - Synchronous native calls

- **Fabric**: New rendering system
  - Concurrent rendering support
  - Direct manipulation of native views
  - Better performance for complex UIs

## Firebase Questions

### Q: Why did you choose Firebase over a custom backend?

**A:**
1. **Rapid Development**: No server setup, immediate functionality
2. **Real-time Sync**: Built-in real-time database updates
3. **Scalability**: Auto-scales with usage
4. **Security**: Declarative security rules
5. **Offline Support**: Native offline persistence
6. **Cost**: Pay-as-you-go, free tier for development
7. **Integration**: First-party React Native SDKs

### Q: How do you handle offline data in Firebase?

**A:**
Firestore has built-in offline persistence:
```javascript
// Enable offline persistence (enabled by default on mobile)
firestore().settings({
    persistence: true,
    cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
});
```

For custom offline handling:
1. Use `onSnapshot` listeners (work offline)
2. Queue operations when offline
3. Sync when connection restored

### Q: Explain Firestore Security Rules

**A:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }

    // Only owner can access their data
    match /users/{userId}/cases/{caseId} {
      allow read, write: if isOwner(userId);
    }
  }
}
```

Key concepts:
- **match**: Path patterns
- **allow**: Read/write permissions
- **request.auth**: Current user
- **request.resource**: Incoming data
- **resource.data**: Existing data

## State Management

### Q: Why didn't you use Redux in this project?

**A:**
Redux wasn't necessary because:
1. **Firebase is the source of truth**: Real-time listeners provide state
2. **Local state suffices**: UI state managed with useState
3. **Simpler code**: No action creators, reducers, selectors
4. **Real-time updates**: Firestore handles sync automatically

When to use Redux:
- Complex state relationships
- Time-travel debugging needed
- Offline-first with complex sync logic
- Large team needing strict patterns

### Q: How do you manage form state?

**A:**
```javascript
// Simple approach - individual states
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');

// Object approach for complex forms
const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'Active',
});

const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
};
```

## Performance

### Q: How do you optimize list performance?

**A:**
```javascript
<FlatList
    data={items}
    keyExtractor={(item) => item.id}
    renderItem={({ item }) => <ItemCard item={item} />}
    // Optimization props
    initialNumToRender={10}
    maxToRenderPerBatch={10}
    windowSize={5}
    removeClippedSubviews={true}
    getItemLayout={(data, index) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
    })}
/>
```

Additional optimizations:
- Use `React.memo()` for list items
- Avoid inline functions in renderItem
- Use `useCallback` for event handlers

### Q: How do you handle memory management?

**A:**
1. **Cleanup effects**: Return cleanup functions
```javascript
useEffect(() => {
    const subscription = subscribe();
    return () => subscription.unsubscribe();
}, []);
```

2. **Cancel API calls**: Use AbortController
3. **Image caching**: Use react-native-fast-image
4. **Clear cache**: Implement cache eviction (LRU)
5. **Avoid memory leaks**: No state updates on unmounted components

## Navigation

### Q: Explain your navigation structure

**A:**
```
NavigationContainer
├── Auth Stack (logged out)
│   ├── Login
│   ├── Signup
│   └── ForgotPassword
└── Main Tabs (logged in)
    ├── Home (Dashboard)
    ├── Cases (nested stack)
    │   ├── CasesList
    │   ├── AddCase
    │   └── CaseDetails
    ├── Clients (nested stack)
    └── Settings (nested stack)
```

Why nested stacks?
- Each tab maintains its own navigation history
- Back button works correctly within tabs
- Deep linking support

## Security

### Q: How do you secure user data?

**A:**
1. **Authentication**: Firebase Auth (email/password)
2. **Authorization**: Firestore security rules
3. **Data isolation**: User data in user-specific subcollections
4. **Input validation**: Client-side and server-side (rules)
5. **Token management**: Firebase handles token refresh
6. **Local storage**: App's private directory only

### Q: How do you handle OAuth tokens?

**A:**
```javascript
// Store in Firestore (encrypted at rest)
await firebaseDb.collection('users').doc(userId).update({
    linkedGmailAccounts: [...accounts, {
        email: user.email,
        accessToken: tokens.accessToken,
        // ...
    }],
});

// Refresh on 401/403
const makeRequest = async (token) => {
    const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
    });

    if (response.status === 401) {
        const newToken = await refreshToken();
        return makeRequest(newToken);
    }
    return response;
};
```

## Architecture

### Q: Describe your architecture pattern

**A:**
**Feature-Based Architecture with Service Layer**

```
Screens (UI Layer)
    ↓ calls
Services (Business Logic)
    ↓ calls
Firebase/External APIs
```

Benefits:
- **Separation of concerns**: UI separate from logic
- **Testability**: Services can be unit tested
- **Reusability**: Services used across screens
- **Maintainability**: Changes isolated to layers

### Q: How do you handle errors?

**A:**
```javascript
// Service layer - return structured response
export const createCase = async (userId, data) => {
    try {
        const docRef = await firebaseDb.collection(...).add(data);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Create case error:', error);
        return { success: false, error: error.message };
    }
};

// Screen layer - handle response
const handleCreate = async () => {
    setLoading(true);
    const result = await createCase(userId, formData);

    if (result.success) {
        Toast.show({ type: 'success', text1: 'Case created!' });
        navigation.goBack();
    } else {
        Toast.show({ type: 'error', text1: result.error });
    }
    setLoading(false);
};
```

## Gmail Integration

### Q: How does Gmail integration work?

**A:**
1. **Account Linking**: Google Sign-In with Gmail scopes
2. **Token Storage**: Store in Firestore
3. **API Calls**: REST API with Bearer token
4. **Token Refresh**: Silent refresh on 401/403
5. **Search**: Gmail search query syntax

```javascript
// Search emails by subject
const query = `in:inbox subject:${keyword}`;
const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
);
```

### Q: How do you send emails via Gmail API?

**A:**
1. Create MIME message with proper headers
2. Base64 URL-safe encode
3. POST to messages/send endpoint

```javascript
const createMimeMessage = ({ to, from, subject, body }) => {
    const message = [
        `To: ${to}`,
        `From: ${from}`,
        `Subject: ${subject}`,
        'Content-Type: text/html; charset=UTF-8',
        '',
        body,
    ].join('\r\n');

    return btoa(message)
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
};
```

## Caching

### Q: Explain your caching strategy

**A:**
**LRU (Least Recently Used) Cache Implementation:**

1. **Initialize**: Create cache directory, load index
2. **Read**: Check cache first, download if missing
3. **Write**: Save file, update index with metadata
4. **Evict**: When cache full, remove least recently used
5. **Configure**: Max size from Firebase config

```javascript
const getCachedDocument = async (docId, docData) => {
    // Check cache
    const cached = await getCachedPath(docId);
    if (cached) {
        updateAccessTime(docId);
        return cached;
    }

    // Ensure space (LRU eviction)
    await ensureCacheSpace(docData.size);

    // Download and cache
    const path = await downloadAndCache(docData);
    return path;
};
```

---

# 17. DEEP DIVE: PERSISTENT LOGIN IMPLEMENTATION

## 17.1 What Happens When User Opens App?

```
App Starts → Firebase checks stored auth token → If valid → User stays logged in
                                               → If invalid/expired → Show Login screen
```

## 17.2 What We Store vs What We Don't

| Stored on Device | NOT Stored on Device |
|------------------|----------------------|
| Firebase Auth token (auto-managed by Firebase SDK) | User password |
| Cache index in AsyncStorage | Gmail OAuth tokens (stored in Firestore) |
| Downloaded documents in app's private folder | User profile data |
| Cache config settings | Cases, clients, hearings data |

## 17.3 The Code Flow (AppNavigator.js)

```javascript
const AppNavigator = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Firebase Auth SDK handles token persistence automatically
        // It stores encrypted token in device's secure storage
        const unsubscribe = onAuthStateChanged((authUser) => {
            setUser(authUser);  // null if not logged in, user object if logged in
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    // Conditional rendering based on auth state
    return (
        <NavigationContainer>
            {user ? <MainTabs /> : <AuthStack />}
        </NavigationContainer>
    );
};
```

## 17.4 Why User Stays Logged In After App Restart?

Firebase Auth SDK automatically:
1. Stores auth token in device's secure storage (Keychain on iOS, Keystore on Android)
2. Refreshes token before expiry (tokens valid for 1 hour, refreshed automatically)
3. Persists session until explicit sign out

**No manual token storage needed** - Firebase handles everything.

---

# 18. DEEP DIVE: FIREBASE DATA LINKING

## 18.1 How Data is Organized (No Tables - It's Documents!)

Firebase Firestore is a **NoSQL document database**, not SQL. No tables, no rows - just collections and documents.

```
firestore/
├── users/                          ← Collection
│   └── {userId}/                   ← Document (user profile)
│       ├── email: "john@example.com"
│       ├── name: "John Doe"
│       ├── linkedGmailAccounts: [...]  ← Array field
│       │
│       ├── cases/                  ← Subcollection
│       │   └── {caseId}/           ← Document
│       │       ├── title: "Smith vs State"
│       │       ├── clientId: "abc123"  ← Reference to client
│       │       ├── emailKeyword: "smith"
│       │       └── ...
│       │
│       ├── clients/                ← Subcollection
│       │   └── {clientId}/
│       │       ├── name: "John Smith"
│       │       └── ...
│       │
│       ├── documents/              ← Subcollection (metadata only)
│       │   └── {documentId}/
│       │       ├── caseId: "xyz789"    ← Links to case
│       │       ├── downloadUrl: "https://..."
│       │       └── storagePath: "users/123/..."
│       │
│       └── hearings/               ← Subcollection
│           └── {hearingId}/
│               ├── caseId: "xyz789"    ← Links to case
│               └── ...
```

## 18.2 How Data is Linked Between Collections

**Case ↔ Client Link:**
```javascript
// When creating a case, we store clientId
{
    title: "Smith vs State",
    clientId: "abc123",        // Reference to client document
    clientName: "John Smith"   // Denormalized for quick display (avoids extra query)
}
```

**Case ↔ Documents Link:**
```javascript
// Document metadata has caseId
{
    name: "evidence.pdf",
    caseId: "xyz789",          // Reference to case
    downloadUrl: "https://..."
}

// To get all documents for a case:
firestore().collection('users').doc(userId)
    .collection('documents')
    .where('caseId', '==', caseId)  // Query by caseId
```

**Case ↔ Hearings Link:**
```javascript
// Hearing has caseId
{
    type: "Final Arguments",
    caseId: "xyz789",          // Reference to case
    date: Timestamp
}
```

## 18.3 Why Denormalization?

In NoSQL, we sometimes duplicate data (like `clientName` in case document) to avoid extra queries:

```javascript
// WITHOUT denormalization - need 2 queries
const caseDoc = await getCaseById(caseId);
const clientDoc = await getClientById(caseDoc.clientId);  // Extra query!
display(clientDoc.name);

// WITH denormalization - 1 query
const caseDoc = await getCaseById(caseId);
display(caseDoc.clientName);  // Already there!
```

---

# 19. DEEP DIVE: FIRESTORE QUERIES EXPLAINED

## 19.1 Create (Add Document)

```javascript
// Add new case - Firestore auto-generates unique ID
const docRef = await firestore()
    .collection('users')
    .doc(userId)
    .collection('cases')
    .add({
        title: "Smith vs State",
        clientId: selectedClient.id,
        status: "Active",
        createdAt: firestore.FieldValue.serverTimestamp(),  // Server time, not device time
    });

console.log("New case ID:", docRef.id);  // e.g., "abc123xyz"
```

## 19.2 Read Single Document

```javascript
// Get case by ID
const doc = await firestore()
    .collection('users')
    .doc(userId)
    .collection('cases')
    .doc(caseId)
    .get();

if (doc.exists) {
    const caseData = { id: doc.id, ...doc.data() };
    // doc.id = "abc123xyz"
    // doc.data() = { title: "Smith vs State", ... }
} else {
    console.log("Case not found");
}
```

## 19.3 Read All Documents in Collection

```javascript
const snapshot = await firestore()
    .collection('users')
    .doc(userId)
    .collection('cases')
    .orderBy('createdAt', 'desc')  // Newest first
    .get();

// snapshot.docs is array of document snapshots
const cases = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
}));
// Result: [{ id: "abc", title: "..." }, { id: "xyz", title: "..." }]
```

## 19.4 Query with Filters

```javascript
// Get documents for a specific case
const snapshot = await firestore()
    .collection('users')
    .doc(userId)
    .collection('documents')
    .where('caseId', '==', caseId)          // Filter: only this case
    .orderBy('createdAt', 'desc')           // Sort: newest first
    .get();

// Get only active cases
const activeCases = await firestore()
    .collection('users')
    .doc(userId)
    .collection('cases')
    .where('status', '==', 'Active')
    .get();

// Multiple conditions (requires composite index in Firebase Console)
const urgentHearings = await firestore()
    .collection('users')
    .doc(userId)
    .collection('hearings')
    .where('caseId', '==', caseId)
    .where('date', '>=', today)
    .orderBy('date', 'asc')
    .get();
```

## 19.5 Real-time Listener (Live Updates)

```javascript
// Subscribe to changes - UI updates automatically when data changes anywhere
const unsubscribe = firestore()
    .collection('users')
    .doc(userId)
    .collection('cases')
    .orderBy('createdAt', 'desc')
    .onSnapshot(
        (snapshot) => {
            // This runs every time data changes!
            const cases = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setCases(cases);  // Update React state → UI re-renders
        },
        (error) => {
            console.error('Listener error:', error);
        }
    );

// IMPORTANT: Call unsubscribe() when component unmounts to prevent memory leaks
useEffect(() => {
    const unsubscribe = subscribeToData();
    return () => unsubscribe();  // Cleanup
}, []);
```

## 19.6 Update Document

```javascript
await firestore()
    .collection('users')
    .doc(userId)
    .collection('cases')
    .doc(caseId)
    .update({
        status: "Closed",
        closedAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
    });

// Note: update() fails if document doesn't exist
// Use set() with merge option if document might not exist:
await docRef.set({ status: "Closed" }, { merge: true });
```

## 19.7 Delete Document

```javascript
await firestore()
    .collection('users')
    .doc(userId)
    .collection('cases')
    .doc(caseId)
    .delete();

// Note: Deleting a document does NOT delete its subcollections
// You need to delete subcollection documents manually
```

---

# 20. DEEP DIVE: FILE STORAGE & CACHING

## 20.1 Upload Flow Explained

```
User picks file → Normalize URI → Upload to Firebase Storage → Get download URL → Save metadata to Firestore
```

```javascript
// Complete upload flow
const uploadDocument = async (userId, caseId, file) => {
    // 1. Create storage reference (path in Firebase Storage)
    const fileName = `${Date.now()}_${file.name}`;
    const storagePath = `users/${userId}/cases/${caseId}/documents/${fileName}`;
    const reference = storage().ref(storagePath);

    // 2. Normalize URI for Android
    let uploadUri = file.uri;
    if (Platform.OS === 'android' && !uploadUri.startsWith('file://')) {
        uploadUri = 'file://' + uploadUri;
    }

    // 3. Upload file to Firebase Storage
    await reference.putFile(uploadUri);

    // 4. Get download URL (public URL to access the file)
    const downloadUrl = await reference.getDownloadURL();

    // 5. Save metadata to Firestore (NOT the file itself!)
    await firestore()
        .collection('users')
        .doc(userId)
        .collection('documents')
        .add({
            caseId,
            name: file.name,
            type: file.type,
            size: file.size,
            storagePath,      // To delete from Storage later
            downloadUrl,      // To download/view the file
            createdAt: firestore.FieldValue.serverTimestamp(),
        });
};
```

## 20.2 View Document Flow (with Caching)

```
User opens document → Check local cache → If cached: open local file
                                        → If not cached: download → compress (if image) → cache → open
```

```javascript
const viewDocument = async (document) => {
    // getCachedDocument handles all caching logic
    const localPath = await getCachedDocument(document.id, document);

    // Open with native file viewer
    await FileViewer.open(localPath);
};
```

## 20.3 Cache Directory Structure

```
App's Documents Directory/
└── lexmate_cache/
    └── documents/
        └── user_{userId}/
            └── case_{caseId}/
                ├── 1699900000000_contract.pdf
                ├── 1699900001000_evidence.jpg
                └── ...
```

## 20.4 Cache Index Structure (AsyncStorage)

```javascript
// Stored in AsyncStorage with key: @lexmate_cache:index
{
    version: "1.0",
    totalSize: 52428800,       // Total cache size in bytes (50MB)
    documentCount: 15,
    documents: {
        "documentId123": {
            documentId: "documentId123",
            caseId: "caseId456",
            name: "contract.pdf",
            size: 1048576,                    // 1MB
            localPath: "/path/to/cached/file",
            downloadUrl: "https://firebasestorage...",
            cachedAt: 1699900000000,          // When downloaded
            lastAccessed: 1699950000000,      // For LRU eviction
            accessCount: 5,                   // How many times opened
            compressionSavings: 204800        // Bytes saved (for images)
        },
        // ... more documents
    }
}
```

## 20.5 LRU Eviction Algorithm

When cache is full and new file needs space:

```javascript
const evictLRUDocuments = async (bytesNeeded) => {
    // 1. Sort all cached files by lastAccessed (oldest first)
    const allDocs = Object.values(_cacheIndex.documents);
    allDocs.sort((a, b) => a.lastAccessed - b.lastAccessed);

    let freedBytes = 0;

    // 2. Delete oldest files until we have enough space
    for (const doc of allDocs) {
        if (freedBytes >= bytesNeeded) break;

        // Delete the actual file
        await RNFS.unlink(doc.localPath);

        // Remove from index
        delete _cacheIndex.documents[doc.documentId];
        freedBytes += doc.size;

        console.log(`Evicted: ${doc.name} (last accessed: ${new Date(doc.lastAccessed)})`);
    }

    // 3. Update index totals
    _cacheIndex.totalSize -= freedBytes;
    await saveCacheIndex();
};
```

---

# 21. DEEP DIVE: GMAIL TOKENS & REFRESH

## 21.1 Where Gmail Tokens Are Stored

```javascript
// In Firestore: users/{userId} document
{
    email: "user@example.com",
    name: "John Doe",
    // ... other profile fields
    linkedGmailAccounts: [
        {
            email: "user@gmail.com",
            name: "John Doe",
            photo: "https://...",
            accessToken: "ya29.a0AfH6SMB...",    // OAuth access token (expires in 1 hour)
            idToken: "eyJhbGciOiJSUzI1NiIs...",  // ID token
            linkedAt: "2024-01-15T10:30:00Z"
        },
        // Can have up to 3 accounts
    ]
}
```

**Why Firestore and not device?**
- Tokens sync across devices (login on new phone, emails work immediately)
- Survives app reinstall
- Can be managed from admin portal

## 21.2 Token Refresh Flow

```javascript
const gmailApiRequest = async (account, endpoint, method = 'GET', body = null) => {
    let accessToken = account.accessToken;

    const makeRequest = async (token) => {
        const response = await fetch(`${GMAIL_API_BASE}${endpoint}`, {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : null,
        });

        // Token expired?
        if (response.status === 401 || response.status === 403) {
            throw new Error('TOKEN_EXPIRED');
        }

        return response.json();
    };

    try {
        return await makeRequest(accessToken);
    } catch (error) {
        if (error.message === 'TOKEN_EXPIRED') {
            // Refresh the token
            accessToken = await refreshAccessToken(account);
            // Retry with new token
            return await makeRequest(accessToken);
        }
        throw error;
    }
};

const refreshAccessToken = async (account) => {
    // Use Google Sign-In to get fresh tokens
    await GoogleSignin.signInSilently();
    const tokens = await GoogleSignin.getTokens();

    // Update in Firestore
    const userId = getCurrentUser()?.uid;
    const userDoc = await firebaseDb.collection('users').doc(userId).get();
    const accounts = userDoc.data()?.linkedGmailAccounts || [];

    const updatedAccounts = accounts.map(acc =>
        acc.email === account.email
            ? { ...acc, accessToken: tokens.accessToken }
            : acc
    );

    await firebaseDb.collection('users').doc(userId).update({
        linkedGmailAccounts: updatedAccounts,
    });

    return tokens.accessToken;
};
```

---

# 22. QUICK REFERENCE TABLE

| What | Where Stored | Why |
|------|--------------|-----|
| User session | Firebase Auth SDK (Keychain/Keystore) | Auto-managed, encrypted, secure |
| User profile | Firestore: `users/{userId}` | Syncs across devices |
| Cases, Clients, Hearings | Firestore: `users/{userId}/subcollection` | Real-time sync, security rules |
| Document files | Firebase Storage | Large file storage, CDN delivery |
| Document metadata | Firestore: `users/{userId}/documents` | Quick queries, linked to Storage |
| Gmail tokens | Firestore: `users/{userId}.linkedGmailAccounts` | Syncs across devices, admin manageable |
| Cached documents | Device: `DocumentDirectory/lexmate_cache` | Offline access, fast viewing |
| Cache index | AsyncStorage: `@lexmate_cache:index` | Quick lookup, persists across sessions |
| Cache config | AsyncStorage (fetched from Firebase) | Configurable limits |

---

# 23. IMPLEMENTATION SUMMARY

## Document Viewing Flow
When user taps a document, we first check our local cache using an index stored in AsyncStorage. The index tracks document ID to local file path mapping. If the document is cached and the file exists, we update the lastAccessed timestamp for LRU tracking and open it directly with FileViewer. If not cached, we download from the Firebase Storage URL, optionally compress images using react-native-compressor to save space, save to the app's documents directory, update the cache index, then open. When cache exceeds the limit configured in Firebase, we evict least recently used files first.

## Persistent Login Flow
Firebase Auth SDK handles this automatically. When user logs in, Firebase stores an encrypted auth token in the device's secure storage - Keychain on iOS, Keystore on Android. On app launch, we call onAuthStateChanged which checks this stored token. If valid, it returns the user object and we show the main app. If expired, Firebase tries to refresh it silently. Only if refresh fails do we show the login screen. We don't manually store any tokens - Firebase manages the entire lifecycle.

---

# CONCLUSION

This documentation covers all aspects of the Advocura (LexMate) project. Key highlights:

1. **Modern React Native**: Using latest RN 0.82.1 with New Architecture, Hermes, and modern patterns
2. **Firebase Backend**: Serverless, real-time, secure data management
3. **Gmail Integration**: Full OAuth flow with token management
4. **Offline-First**: LRU caching for documents and emails
5. **Security**: Multi-layer security with auth, rules, and validation
6. **Performance**: Optimized lists, memoization, compression
7. **Production-Ready**: Proper build configuration, signing, deployment

Key architectural decisions covered:
- Feature-based architecture with service layer pattern
- NoSQL data modeling with denormalization
- LRU caching with configurable limits
- OAuth token management and refresh
- Native module integration patterns
