# Updated Firestore Security Rules

Replace the Firestore security rules in your Firebase Console with these updated rules that include support for missed routine notifications:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Caretaker documents - only accessible by the caretaker themselves
    match /caretakers/{userId} {
      allow read, write: if request.auth.uid == userId;
      
      // Patients subcollection under caretaker
      match /patients/{patientId} {
        allow read, write: if request.auth.uid == userId;
      }
    }

    // Patient documents - accessible by patient device (no auth) or by assigned caretaker
    match /patients/{patientId} {
      allow read, write: if 
        request.auth == null ||  // Device-based patient (no auth)
        request.auth.uid == resource.data.caretakerId;  // Caretaker managing the patient
    }

    // Notifications collection - caretakers can read/write their own notifications
    // Device-based patients (not authenticated) cannot directly access, but routines check them
    match /notifications/{notificationId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.caretakerId;
      allow create: if request.auth == null || request.auth.uid == string(request.resource.data.caretakerId);
    }

    // Routines - accessible to authenticated users
    match /routines/{document=**} {
      allow read, write: if request.auth != null;
    }

    // Family Photos - accessible to authenticated users
    match /familyPhotos/{document=**} {
      allow read, write: if request.auth != null;
    }

    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## How to Update Your Security Rules:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `mindcompanion---dementia`
3. Navigate to **Firestore Database** → **Rules**
4. Replace all the existing code with the updated rules above
5. Click **Publish**

## Key Updates:

- **notifications collection**: New rules allow caretakers to create and manage notifications
- **Device-based patients**: `request.auth == null` allows patients on devices to work without authentication
- **Caretaker access**: Notifications are scoped to the caretaker's UID for security

## Testing:

After updating the rules:
1. Have a **patient** complete the setup and enter their caretaker's email
2. Check Firestore to confirm the patient document is created under `/patients/{patientId}`
3. When a patient misses a routine (5+ minutes past scheduled time), a notification should appear in `/notifications/{notificationId}`
4. The **caretaker** dashboard should display missed routines with options to acknowledge or dismiss

---

**Note**: If you see permission errors in the browser console, verify:
- The caretaker has logged in with Google OAuth first
- The patient entered a VALID caretaker email address
- Security rules are published (not in test mode)
- Firebase credentials are correctly configured in `.env`
