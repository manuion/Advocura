# ADVOCURA - Technical Implementation Guide

## For Interview Preparation

---

## 1. PERSISTENT LOGIN - How It Works

### What Happens When User Opens App?

```
App Starts → Firebase checks stored auth token → If valid → User stays logged in
                                               → If invalid/expired → Show Login screen
```

### What We Store vs What We Don't

| Stored on Device | NOT Stored on Device |
|------------------|----------------------|
| Firebase Auth token (auto-managed by Firebase SDK) | User password |
| Cache index in AsyncStorage | Gmail OAuth tokens (stored in Firestore) |
| Downloaded documents in app's private folder | User profile data |
| Cache config settings | Cases, clients, hearings data |

### The Code Flow (AppNavigator.js)

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

### Why User Stays Logged In After App Restart?

Firebase Auth SDK automatically:
1. Stores auth token in device's secure storage (Keychain on iOS, Keystore on Android)
2. Refreshes token before expiry (tokens valid for 1 hour, refreshed automatically)
3. Persists session until explicit sign out

**No manual token storage needed** - Firebase handles everything.

---

## 2. FIREBASE DATA STRUCTURE

### How Data is Organized (No Tables - It's Documents!)

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

### How Data is Linked

**Case ↔ Client Link:**
```javascript
// When creating a case, we store clientId
{
    title: "Smith vs State",
    clientId: "abc123",        // Reference to client document
    clientName: "John Smith"   // Denormalized for quick display
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

---

## 3. FIRESTORE QUERIES - How to Get Data

### Create (Add Document)

```javascript
// Add new case - Firestore auto-generates ID
const docRef = await firestore()
    .collection('users')
    .doc(userId)
    .collection('cases')
    .add({
        title: "Smith vs State",
        clientId: selectedClient.id,
        status: "Active",
        createdAt: firestore.FieldValue.serverTimestamp(),
    });

console.log("New case ID:", docRef.id);
```

### Read (Get Documents)

```javascript
// Get single document by ID
const doc = await firestore()
    .collection('users')
    .doc(userId)
    .collection('cases')
    .doc(caseId)
    .get();

if (doc.exists) {
    const caseData = { id: doc.id, ...doc.data() };
}

// Get all documents in collection
const snapshot = await firestore()
    .collection('users')
    .doc(userId)
    .collection('cases')
    .orderBy('createdAt', 'desc')
    .get();

const cases = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
}));
```

### Query with Filters

```javascript
// Get documents for a specific case
const snapshot = await firestore()
    .collection('users')
    .doc(userId)
    .collection('documents')
    .where('caseId', '==', caseId)          // Filter by caseId
    .orderBy('createdAt', 'desc')           // Sort by date
    .get();

// Get active cases only
const snapshot = await firestore()
    .collection('users')
    .doc(userId)
    .collection('cases')
    .where('status', '==', 'Active')
    .get();
```

### Real-time Listener (Live Updates)

```javascript
// Subscribe to changes - UI updates automatically when data changes
const unsubscribe = firestore()
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
            setCases(cases);  // Update React state
        },
        (error) => {
            console.error('Listener error:', error);
        }
    );

// Call unsubscribe() when component unmounts
```

### Update Document

```javascript
await firestore()
    .collection('users')
    .doc(userId)
    .collection('cases')
    .doc(caseId)
    .update({
        status: "Closed",
        updatedAt: firestore.FieldValue.serverTimestamp(),
    });
```

### Delete Document

```javascript
await firestore()
    .collection('users')
    .doc(userId)
    .collection('cases')
    .doc(caseId)
    .delete();
```

---

## 4. FILE STORAGE - Documents Flow

### Upload Flow

```
User picks file → Normalize URI → Upload to Firebase Storage → Get download URL → Save metadata to Firestore
```

```javascript
// 1. Create storage reference
const storagePath = `users/${userId}/cases/${caseId}/documents/${fileName}`;
const reference = storage().ref(storagePath);

// 2. Upload file
await reference.putFile(fileUri);

// 3. Get download URL
const downloadUrl = await reference.getDownloadURL();

// 4. Save metadata to Firestore (NOT the file itself)
await firestore()
    .collection('users')
    .doc(userId)
    .collection('documents')
    .add({
        caseId,
        name: file.name,
        size: file.size,
        storagePath,      // Path in Firebase Storage
        downloadUrl,      // URL to download
        createdAt: firestore.FieldValue.serverTimestamp(),
    });
```

### View Document Flow (with Caching)

```
User opens document → Check local cache → If cached: open local file
                                        → If not cached: download → cache → open
```

```javascript
// getCachedDocument handles everything
const localPath = await getCachedDocument(documentId, documentData);
await FileViewer.open(localPath);
```

---

## 5. LOCAL CACHING SYSTEM

### Where Cached Files Are Stored

```
App's Documents Directory/
└── lexmate_cache/
    └── documents/
        └── user_{userId}/
            └── case_{caseId}/
                └── {timestamp}_{filename}
```

### Cache Index (Stored in AsyncStorage)

```javascript
// Key: @lexmate_cache:index
{
    version: "1.0",
    totalSize: 52428800,       // 50MB in bytes
    documentCount: 15,
    documents: {
        "doc123": {
            documentId: "doc123",
            caseId: "case456",
            name: "contract.pdf",
            size: 1048576,            // 1MB
            localPath: "/path/to/file",
            downloadUrl: "https://...",
            cachedAt: 1699900000000,
            lastAccessed: 1699950000000,  // For LRU eviction
            accessCount: 5
        },
        // ... more documents
    }
}
```

### LRU Eviction - How It Works

When cache is full and new file needs space:

```javascript
// 1. Sort all cached files by lastAccessed (oldest first)
allDocs.sort((a, b) => a.lastAccessed - b.lastAccessed);

// 2. Delete oldest files until we have enough space
for (const doc of allDocs) {
    if (freedBytes >= bytesNeeded) break;

    await RNFS.unlink(doc.localPath);  // Delete file
    delete _cacheIndex.documents[doc.documentId];  // Remove from index
    freedBytes += doc.size;
}
```

---

## 6. GMAIL INTEGRATION

### OAuth Flow

```
User taps "Link Gmail" → Google Sign-In → User authorizes scopes → Get access token → Store in Firestore
```

### Where Gmail Tokens Are Stored

```javascript
// In Firestore: users/{userId}
{
    linkedGmailAccounts: [
        {
            email: "user@gmail.com",
            name: "John Doe",
            accessToken: "ya29.xxx...",    // OAuth access token
            idToken: "eyJhbGci...",
            linkedAt: "2024-01-15T10:30:00Z"
        }
    ]
}
```

**Why Firestore and not device?** - Tokens sync across devices, survives app reinstall.

### Token Refresh Flow

```javascript
// When API returns 401/403
const makeRequest = async (token) => {
    const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.status === 401) {
        // Token expired - refresh it
        const newToken = await refreshAccessToken(account);
        // Update in Firestore
        // Retry request with new token
        return makeRequest(newToken);
    }

    return response;
};
```

### Email Search Query

```javascript
// Gmail search query format
const query = `in:inbox subject:${keyword}`;

// API call
const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=50`,
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
);
```

---

## 7. PATCH-PACKAGE EXPLANATION

### What is patch-package?

When an npm package has a bug, you can:
1. Fork the entire repo (overkill for small fix)
2. Wait for maintainer to fix (could take months)
3. **Use patch-package** - modify locally and persist changes

### Our Patch: react-native-document-picker

```
patches/react-native-document-picker+9.3.1.patch
```

**Note:** This patch file contains build artifacts (generated .dex files for New Architecture support), not actual source code fixes. It was created when the library was built locally.

### How to Create a Patch (If Needed)

```bash
# 1. Install patch-package
npm install patch-package --save-dev

# 2. Add postinstall script to package.json
{
  "scripts": {
    "postinstall": "patch-package"
  }
}

# 3. Make your fix in node_modules/package-name/...

# 4. Create the patch
npx patch-package package-name

# 5. Commit the patch file in patches/ folder
```

### How Patches Are Applied

After every `npm install`, the `postinstall` script runs:
```
npm install → postinstall runs → patch-package reads patches/ → applies each patch to node_modules
```

---

## 8. SECURITY - Who Can Access What?

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // User can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // All subcollections inherit the same rule
      match /cases/{caseId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /clients/{clientId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      // ... same for documents, hearings
    }
  }
}
```

### Key Security Points

1. **No user can access another user's data** - Rules enforce `request.auth.uid == userId`
2. **Tokens not stored on device** - Gmail tokens in Firestore, Firebase auth token managed by SDK
3. **Files in app's private directory** - Other apps can't access cached documents
4. **isAllowed check** - Admin can block user by setting `isAllowed: false`

---

## 9. KEY IMPLEMENTATION PATTERNS

### Service Layer Pattern

Every screen calls services, services call Firebase:

```
Screen (UI) → Service (Business Logic) → Firebase (Data)
```

```javascript
// Screen: AddCaseScreen.js
const handleSave = async () => {
    setLoading(true);
    const result = await createCase(userId, formData);  // Call service
    if (result.success) {
        navigation.goBack();
    } else {
        showError(result.error);
    }
    setLoading(false);
};

// Service: casesService.js
export const createCase = async (userId, caseData) => {
    try {
        const docRef = await firestore()
            .collection('users').doc(userId)
            .collection('cases')
            .add({ ...caseData, createdAt: firestore.FieldValue.serverTimestamp() });
        return { success: true, id: docRef.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
};
```

### Error Handling Pattern

Services return `{ success, data/error }` - never throw:

```javascript
// Service always returns object
const result = await someService();

if (result.success) {
    // Use result.data
} else {
    // Show result.error to user
}
```

### Cleanup Pattern

Always cleanup subscriptions on unmount:

```javascript
useEffect(() => {
    const unsubscribe = subscribeToCases(userId, (data) => {
        setCases(data.cases);
    });

    return () => unsubscribe();  // Cleanup on unmount
}, [userId]);
```

---

## 10. BUILD & DEPLOY

### Version Management

```gradle
// android/app/build.gradle
defaultConfig {
    versionCode 9        // Increment EVERY release
    versionName "1.8"    // User-visible version
}
```

### Build Commands

```bash
# Development
npm start              # Start Metro
npm run android        # Run on Android device/emulator

# Production AAB (for Play Store)
cd android && ./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

### SHA-1 Fingerprints for Google Sign-In

You need 3 SHA-1 fingerprints in Firebase Console:
1. **Debug** - For development (`~/.android/debug.keystore`)
2. **Release** - Your signing keystore
3. **Play Store App Signing** - From Play Console → App integrity → App signing

---

## QUICK REFERENCE

| What | Where Stored | Why |
|------|--------------|-----|
| User session | Firebase Auth SDK (secure storage) | Auto-managed, encrypted |
| User profile | Firestore: users/{userId} | Syncs across devices |
| Cases, Clients, Hearings | Firestore: users/{userId}/subcollection | Real-time sync, security rules |
| Document files | Firebase Storage | Large file storage |
| Document metadata | Firestore: users/{userId}/documents | Quick queries, linked to Storage |
| Gmail tokens | Firestore: users/{userId}.linkedGmailAccounts | Syncs across devices |
| Cached documents | Device: DocumentDirectory/lexmate_cache | Offline access |
| Cache index | AsyncStorage | Quick lookup, persists |
| Cache config | AsyncStorage (from Firebase) | Configurable limits |

---

## INTERVIEW TIPS

When asked "How does X work?", structure your answer:
1. **The flow** - User action → what happens
2. **Where data goes** - Storage location
3. **Why this approach** - Trade-offs considered

Example: "How does document viewing work?"
> "When user taps a document, we first check local cache using AsyncStorage index. If cached and file exists, we open it directly with FileViewer. If not cached, we download from Firebase Storage URL, optionally compress images, save to app's documents directory, update cache index, then open. We use LRU eviction when cache exceeds limit from Firebase config."
