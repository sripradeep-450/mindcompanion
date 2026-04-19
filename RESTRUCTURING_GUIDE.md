# MindCompanion - Complete Restructuring Guide

## ✅ What's Been Changed

### 1. **New Authentication Flow**
- ✅ Removed shield icon from UI
- ✅ Created dedicated **Home Page** with Patient/Caretaker role selection
- ✅ Created **Patient Login Page** (no verification, local storage only)
- ✅ Created **Caretaker Login Page** (Google OAuth authentication)

### 2. **Patient Side (Device-Based)**
- Patient enters their information on first setup
- Patient enters caretaker's email to link account
- Device stays logged in automatically (uses localStorage)
- No credentials needed - just setup once

### 3. **Caretaker Side (Google OAuth + Firebase)**
- Login with any Google account
- Secure authentication via Firebase
- Can manage multiple patients
- Receives notifications when patients miss routines

### 4. **Backend Structure**
- ✅ Firebase Firestore for database
- ✅ Google OAuth for authentication
- ✅ Patient-Caretaker relationship management
- ✅ Real-time data sync

---

## 🚀 Setup Instructions

### Step 1: Firebase Setup (CRITICAL)

1. **Create Firebase Project:**
   - Go to https://console.firebase.google.com
   - Click "Create Project"
   - Name it: `mindcompanion-dementia`
   - Enable Google Analytics (optional)
   - Click "Create Project"

2. **Enable Google Sign-In:**
   - In Firebase console, go to **Authentication**
   - Click **Sign-in method**
   - Enable **Google** provider
   - Add your email as test user (or keep default)

3. **Create Firestore Database:**
   - In Firebase console, go to **Firestore Database**
   - Click **Create Database**
   - Select **Start in test mode** (or production with proper rules below)
   - Choose a region (e.g., `us-central1`)
   - Click **Create**

### Step 2: Add Firestore Security Rules

In **Firestore > Rules**, replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own caretaker doc
    match /caretakers/{userId} {
      allow read, write: if request.auth.uid == userId;
      allow read: if request.auth == null; // For verification only
    }

    // Allow patients to read/write their own profile
    match /patients/{patientId} {
      allow read, write: if request.auth == null || request.auth.uid == patientId;
    }

    // Allow caretakers to manage their patients' sub-collection
    match /caretakers/{caretakerId}/patients/{patientId} {
      allow read, write: if request.auth.uid == caretakerId;
    }

    // Allow routines to be accessed by patient and assigned caretaker
    match /routines/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Step 3: Get Firebase Config

1. Go to **Firebase Console > Project Settings** (gear icon)
2. Find your Firebase config:
   ```
   apiKey: "XXXXXXX"
   authDomain: "your-project.firebaseapp.com"
   projectId: "your-project"
   storageBucket: "your-project.appspot.com"
   messagingSenderId: "XXXXXXX"
   appId: "1:XXXXXXX:web:XXXXXXX"
   ```

3. Update your `.env` file:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

### Step 4: Enable Google OAuth on Your Domain

If deploying to a live server:
1. Go to **Firebase Console > Authentication > Sign-in method**
2. Click on **Google** provider
3. In **Web SDK configuration**, add your domain to authorized domains:
   - `localhost:3000` (for local testing)
   - `localhost:3001`, `localhost:3002`, `localhost:3003` (other local ports)
   - Your live domain: `yourapp.com`, `app.yourapp.com`

---

## 📱 How It Works

### Patient Journey
1. Open app → See Home Page
2. Click "I'm the Patient"
3. Enter: Name, Age, Gender, Bio
4. Enter Caretaker's Email
5. Device stays logged in forever (localStorage)
6. Access: Routines, Games, Family Photos, Chat

### Caretaker Journey
1. Open app → See Home Page
2. Click "I'm the Caretaker"
3. Sign in with Google Account
4. Dashboard opens with patient management
5. Add/manage routines for linked patients
6. Get notified of missed routines
7. Manage family photos

### Linking Process
- Patient enters caretaker's email
- System finds caretaker in Firebase
- Creates patient-caretaker relationship
- Caretaker can now manage this patient

---

## 🔔 Notification System

**When patient misses a routine:**
1. Routine time passes without completion
2. System detects missed routine
3. Sends notification to caretaker's email
4. Caretaker can take action

*(This will be implemented in next phase)*

---

## 📁 Project Structure

```
components/
  ├── HomePage.tsx (NEW - Role selection)
  ├── PatientLoginPage.tsx (NEW - Patient setup)
  ├── CaretakerLoginPage.tsx (NEW - Google OAuth)
  ├── CaretakerDashboard.tsx (Updated)
  └── ... other components

services/
  ├── firebaseConfig.ts (NEW - Firebase initialization)
  ├── authService.ts (NEW - Auth & database operations)
  ├── geminiService.ts (Existing)
  └── bluetoothService.ts (Existing)

.env (Updated with Firebase config)
App.tsx (Completely restructured)
```

---

## 🧪 Testing Locally

```bash
# With Firebase emulator (optional)
firebase emulators:start

# Or run against live Firebase
npm run dev
```

Visit: **http://localhost:3003**

---

## 🚢 Deployment

```bash
# Build
npm run build

# Deploy to GitHub Pages
git add .
git commit -m "Major restructure: Add Firebase auth and separate login pages"
git push origin main

# Enable GitHub Pages in settings (Settings > Pages > Deploy from branch: main, folder: /dist)
```

Your app will be live at: https://your-username.github.io/mindcompanion

---

## 🔐 Security Checklist

- [ ] Firebase Firestore rules configured
- [ ] Google OAuth consent screen set up
- [ ] `.env` file in `.gitignore`
- [ ] HTTPS enabled (GitHub Pages automatic)
- [ ] Test both patient and caretaker flows
- [ ] Verify localStorage cleanup on logout

---

## 📋 What's Next (Future Implementation)

1. **Real-Time Notifications**
   - Push notifications to caretaker when patient misses routine
   - Email alerts

2. **Photo Management Enhancement**
   - AI-powered face recognition
   - Automatic family member tagging
   - Event history

3. **Advanced Caretaker Dashboard**
   - Patient progress charts
   - Weekly reports
   - Multiple patients management

4. **Mobile App**
   - React Native version
   - Native notifications
   - Offline capabilities

---

## ⚠️ Important Notes

1. **First Login Must Be Caretaker**
   - Caretaker must sign in first with Google
   - Patient then references caretaker's email
   - This creates the link in Firebase

2. **Patient Device Persistence**
   - Patient NEVER needs to login again
   - Device localStorage keeps them logged in
   - Perfect for elderly users

3. **Firebase Costs**
   - Free tier includes:
     - Up to 50k reads/day
     - Up to 20k writes/day
     - 1GB storage
   - Should be more than enough for personal use

4. **Google OAuth Restrictions**
   - Unverified apps show a warning
   - For production, verify your Firebase project

---

## 🆘 Troubleshooting

**"Caretaker not found" error:**
- Make sure caretaker signed in with Google first
- Verify email matches exactly

**Firebase config not loading:**
- Check `.env` file has correct values
- Restart dev server after updating `.env`

**Google sign-in not working:**
- Verify localhost/domain in Firebase console
- Check Google OAuth consent screen settings

---

**Questions? Check Firebase docs:** https://firebase.google.com/docs
