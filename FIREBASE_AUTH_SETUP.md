# FIREBASE AUTHENTICATION SETUP GUIDE

## COST: **FREE** (Generous free tier)

**Firebase Auth is FREE for:**
- Unlimited authentication
- Email/Password auth
- Anonymous auth
- Google/social auth
- Up to 50K monthly active users

**You only pay if:**
- Phone auth: $0.01 per verification (after 10K/month)
- You exceed Spark plan limits

**For NEET app:** 100% FREE (unless 10K+ users using phone)

---

## STEP 1: CREATE FIREBASE PROJECT (5 mins)

1. Go to: https://console.firebase.google.com/
2. Click "Add project"
3. Project name: `neet-hub-ai` (or your choice)
4. Google Analytics: Enable (optional)
5. Click "Create project"
6. Wait for setup to complete

---

## STEP 2: ENABLE AUTHENTICATION (3 mins)

1. In Firebase Console → **Authentication**
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable these providers:

### A. Email/Password
- Click "Email/Password"
- Toggle **Enable**
- Click "Save"

### B. Anonymous
- Click "Anonymous"
- Toggle **Enable**
- Click "Save"

### C. Google (Optional)
- Click "Google"
- Toggle **Enable**
- Enter support email
- Click "Save"

---

## STEP 3: GET FIREBASE CONFIG (2 mins)

1. Click ⚙️ (Settings) → Project settings
2. Scroll to "Your apps"
3. Click Web icon `</>`
4. App nickname: "NEET HUB AI Web"
5. Click "Register app"
6. **Copy the firebaseConfig object**

Example:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "neet-hub-ai.firebaseapp.com",
  projectId: "neet-hub-ai",
  storageBucket: "neet-hub-ai.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:xxxxx"
};
```

---

## STEP 4: ADD CONFIG TO APP (2 mins)

1. Open `/app/frontend/.env`
2. Replace placeholders with YOUR values:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXX
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=neet-hub-ai.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=neet-hub-ai
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=neet-hub-ai.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:xxxxx
```

3. Save file
4. Restart Expo: `sudo supervisorctl restart expo`

---

## STEP 5: UPDATE LOGIN SCREEN (Code already exists, just activate)

The code is already in `/app/frontend/app/auth/login.tsx`

**To activate real Firebase:**

1. Install Firebase (already done):
```bash
cd /app/frontend
yarn add firebase
```

2. Firebase config exists in `/app/frontend/config/firebase.ts`

3. Update login screen to use Firebase:

```typescript
import { signInWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { auth } from '../../config/firebase';

// Email/Password Login
const handleEmailLogin = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Save to your backend
    const response = await api.post('/users', {
      id: user.uid,
      email: user.email,
      name: user.displayName || 'User',
      prepLevel: 'class12'
    });
    
    await login(response.data);
    router.replace('/(tabs)/home');
  } catch (error) {
    alert('Login failed: ' + error.message);
  }
};

// Anonymous/Guest Login
const handleGuestLogin = async () => {
  try {
    const userCredential = await signInAnonymously(auth);
    const user = userCredential.user;
    
    // Save to your backend
    const response = await api.post('/users', {
      id: user.uid,
      email: 'guest@neethub.ai',
      name: 'Guest User',
      prepLevel: 'class12'
    });
    
    await login(response.data);
    router.replace('/(tabs)/home');
  } catch (error) {
    alert('Guest login failed');
  }
};
```

---

## STEP 6: CREATE ACCOUNT/PROFILE PAGE (Already exists!)

File: `/app/frontend/app/account/index.tsx`

**Features:**
- ✅ User profile display
- ✅ Account details (email, prep level)
- ✅ Settings menu
- ✅ Logout button

**To add Firebase signOut:**

```typescript
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';

const handleLogout = () => {
  Alert.alert('Logout', 'Are you sure?', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Logout',
      style: 'destructive',
      onPress: async () => {
        await signOut(auth);
        await logout();
        router.replace('/auth/login');
      }
    }
  ]);
};
```

---

## STEP 7: FIRESTORE DATABASE (Optional, 5 mins)

1. Firebase Console → **Firestore Database**
2. Click "Create database"
3. Start in **production mode**
4. Select location (closest to users)
5. Click "Enable"

**Security Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /questions/{questionId} {
      allow read: if request.auth != null;
    }
    match /progress/{progressId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## TESTING

### Test Email/Password:
1. Go to Firebase Console → Authentication → Users
2. Click "Add user"
3. Email: test@student.com
4. Password: test123456
5. Click "Add user"
6. Now login with these credentials

### Test Anonymous:
1. Click "Continue as Guest" in app
2. Check Firebase Console → Authentication → Users
3. You'll see anonymous user with UID

---

## CURRENT STATUS

**Already implemented:**
- ✅ Firebase config file created
- ✅ Login screen with Google + Guest
- ✅ Account page with logout
- ✅ Session management
- ✅ Auto-redirect

**To activate:**
1. Create Firebase project (10 mins)
2. Add config to .env (2 mins)
3. Test login (1 min)

**That's it! Firebase Auth is ready.** 🔥

---

## TROUBLESHOOTING

**"API key not valid"**
→ Check .env file has correct EXPO_PUBLIC_FIREBASE_API_KEY

**"Auth domain not whitelisted"**
→ Go to Firebase → Authentication → Settings → Authorized domains
→ Add your domain

**"Anonymous auth failed"**
→ Verify Anonymous is enabled in Firebase Console

**Users not appearing in Firebase**
→ Check console.log for errors
→ Verify firebaseConfig is correct

---

## MIGRATION PATH

**Current:** Simulated auth (works offline)
**After Firebase:** Real authentication with:
- Password reset
- Email verification
- Multi-device sync
- Secure user management

**No breaking changes needed!**
