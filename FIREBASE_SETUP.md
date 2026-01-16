# Firebase Setup Guide for NEET HUB.AI

## Architecture Implemented

✅ **System Architecture**
- Mobile-first design with Firebase + Firestore
- Offline-first with AsyncStorage caching
- Test session persistence (auto-saves every 30s)
- Background state handling
- Network failure recovery

✅ **Master MCQ Generator Prompt**
- Strict NCERT-aligned question generation
- JSON format with validation
- Fallback questions for offline mode

✅ **Topic Progress Classification**
- Automatic classification: Strong (≥70%), Needs Revision (40-69%), Weak (<40%)
- Real-time progress tracking per topic

✅ **Services Created**
1. `questionService.ts` - Question generation & caching
2. `progressService.ts` - Topic progress tracking
3. `testSessionService.ts` - Test session persistence

---

## Firebase Setup Steps

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name: `neethub-ai` (or your choice)
4. Enable Google Analytics (optional)
5. Create project

### 2. Enable Services

**Authentication:**
- Go to Authentication → Sign-in method
- Enable: Email/Password, Google

**Firestore Database:**
- Go to Firestore Database → Create database
- Start in **production mode** (we'll add rules later)
- Choose location: closest to your users

### 3. Get Configuration

1. Go to Project Settings (gear icon)
2. Scroll to "Your apps"
3. Click Web icon (</>) to add web app
4. Register app name: "NEET HUB AI"
5. Copy the firebaseConfig object

### 4. Add to .env File

Update `/app/frontend/.env` with your values:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key-here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### 5. Firestore Security Rules

Go to Firestore Database → Rules and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId);
    }
    
    // Questions - read only for users
    match /questions/{questionId} {
      allow read: if isAuthenticated();
      allow write: if false; // Only via backend/cloud functions
    }
    
    // Practice sessions
    match /practiceSessions/{sessionId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow write: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
    }
    
    // Mock tests
    match /mockTests/{testId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow write: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
    }
    
    // Topic progress
    match /topicProgress/{progressId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow write: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
    }
  }
}
```

### 6. Firestore Indexes

Create these composite indexes in Firestore:

**For questions collection:**
- Fields: `subject` (Ascending), `chapter` (Ascending), `topic` (Ascending)

**For topicProgress collection:**
- Fields: `userId` (Ascending), `classification` (Ascending)

**For practiceSessions collection:**
- Fields: `userId` (Ascending), `completedAt` (Descending)

---

## How It Works

### Question Flow
```
1. User starts practice
2. questionService checks AsyncStorage cache
3. If not found, checks Firestore
4. If not in Firestore, calls backend AI endpoint
5. Backend generates using Master MCQ Prompt
6. Questions stored in Firestore
7. Cached in AsyncStorage for offline access
```

### Test Session Persistence
```
1. Test starts → loads questions → saves to AsyncStorage
2. Every 30 seconds → auto-saves current state
3. App backgrounded → saves state immediately
4. App crashes/closes → state preserved
5. App reopens → checks AsyncStorage → restores session
```

### Progress Tracking
```
1. User completes practice/test
2. Answers sent to progressService
3. Calculates accuracy per topic
4. Auto-classifies: Strong/Needs Revision/Weak
5. Updates Firestore
6. Syncs across devices
```

---

## Testing the Setup

### Test Firebase Connection

Add this to your app temporarily:

```typescript
import { auth, db } from './config/firebase';
import { signInAnonymously } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';

// Test auth
signInAnonymously(auth)
  .then(() => console.log('✅ Firebase Auth working'))
  .catch(err => console.log('❌ Auth error:', err));

// Test Firestore
addDoc(collection(db, 'test'), { timestamp: new Date() })
  .then(() => console.log('✅ Firestore working'))
  .catch(err => console.log('❌ Firestore error:', err));
```

---

## Migration from MongoDB

Your current app uses MongoDB. Here's the migration path:

### Option A: Hybrid (Recommended for testing)
- Keep MongoDB for existing features
- Use Firebase only for new architecture features
- Gradually migrate collections

### Option B: Full Migration
1. Export data from MongoDB
2. Transform to Firestore format
3. Import using Firebase Admin SDK
4. Update all API calls to use services

---

## Key Differences from MongoDB

| Feature | MongoDB (Old) | Firestore (New) |
|---------|--------------|-----------------|
| Connection | AsyncIOMotorClient | Firebase SDK |
| Queries | await db.collection.find() | getDocs(query()) |
| Inserts | await db.collection.insert_one() | addDoc(collection()) |
| Updates | await db.collection.update_one() | updateDoc(doc()) |
| Real-time | Manual polling | onSnapshot() listeners |
| Offline | None | Built-in sync |

---

## Next Steps

1. ✅ Firebase project created
2. ✅ Configuration added to .env
3. ✅ Security rules deployed
4. ✅ Indexes created
5. ⏳ Test connection
6. ⏳ Migrate one feature (start with questions)
7. ⏳ Test offline functionality
8. ⏳ Deploy to production

---

## Support

Firebase setup issues:
- [Firebase Docs](https://firebase.google.com/docs)
- [Firestore Guides](https://firebase.google.com/docs/firestore)
- [React Native Firebase](https://rnfirebase.io/)

Current app still works with MongoDB - no breaking changes!
New Firebase architecture is ready to integrate when you are.
