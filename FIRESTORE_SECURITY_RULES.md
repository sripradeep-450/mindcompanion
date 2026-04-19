# Updated Firestore Security Rules

Replace the Firestore security rules in your Firebase Console with these updated rules that include support for missed routine notifications:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Caretaker documents - only accessible by the caretaker themselves
    match /caretakers/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Patients subcollection under caretaker
      match /patients/{patientId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }

    // Patient documents - accessible by patient device (no auth) or by assigned caretaker
    match /patients/{patientId} {
      allow create, read, write: if request.auth == null;  // Device-based patient (no auth)
      allow read, write: if request.auth != null && request.auth.uid == resource.data.caretakerId;  // Caretaker managing patient
    }

    // Notifications collection - device patients create, caretakers manage
    match /notifications/{notificationId} {
      allow create: if request.auth == null;  // Device-based patient creates notifications
      allow read, update, delete: if request.auth != null && request.auth.uid == resource.data.caretakerId;  // Caretaker manages their notifications
    }

    // Routines - accessible to authenticated users
    match /routines/{document=**} {
      allow read, write: if request.auth != null;
    }

    // Family Photos - accessible to authenticated users
    match /familyPhotos/{document=**} {
      allow read, write: if request.auth != null;
    }

    // Deny all other access by default
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

## Key Fixes Applied:

1. **Proper null auth handling**: Separated conditions using proper if-else logic instead of OR operators with null checks
   - ✅ `allow create: if request.auth == null;` (Device patients only)
   - ✅ `allow read, write: if request.auth != null && request.auth.uid == resource.data.caretakerId;` (Authenticated caretakers only)

2. **Separate operation rules**: Split `read, write` into specific operations where needed
   - `create` - Only for device patients creating notifications
   - `read, update, delete` - Only for authenticated caretakers

3. **Removed invalid string conversion**: Removed `string(request.resource.data.caretakerId)` which caused syntax errors

## Explanation of Each Rule:

| Collection | Rule | Who | Purpose |
|-----------|------|-----|---------|
| `caretakers/{userId}` | `read, write` | Authenticated user matching UID | Caretaker profile only accessible by themselves |
| `caretakers/{userId}/patients/{patientId}` | `read, write` | Authenticated caretaker | Caretaker's patient list |
| `patients/{patientId}` | `create, read, write` | Unauthenticated (device) | Device-based patient self-management |
| `patients/{patientId}` | `read, write` | Authenticated caretaker | Caretaker viewing/updating patient info |
| `notifications/{notificationId}` | `create` | Unauthenticated (device) | Device creates missed routine notifications |
| `notifications/{notificationId}` | `read, update, delete` | Authenticated caretaker | Caretaker manages their notifications |
| `routines/**` | `read, write` | Authenticated users | Only logged-in caretakers |
| `familyPhotos/**` | `read, write` | Authenticated users | Only logged-in caretakers |

## Testing:

After updating the rules:
1. Have a **patient** complete the setup and enter their caretaker's email
2. Check Firestore to confirm the patient document is created under `/patients/{patientId}`
3. When a patient misses a routine (5+ minutes past scheduled time), a notification should appear in `/notifications/{notificationId}`
4. The **caretaker** dashboard should display missed routines with options to acknowledge or dismiss

## Troubleshooting Permission Errors:

### ❌ "Missing or insufficient permissions"

1. **Rules not published?**
   - Go to Firebase Console → Firestore → Rules
   - Check if there's a "PUBLISH" button (orange dot means unpublished)
   - Click "PUBLISH" to deploy rules

2. **Caretaker not logged in?**
   - Make sure the caretaker signed in with Google OAuth FIRST
   - Check browser console: `localStorage.getItem('mind_caretaker_id')` should have a value

3. **Patient entered wrong caretaker email?**
   - Must be the EXACT email the caretaker used to sign in with Google
   - If wrong, patient won't sync to the caretaker's account

4. **In test mode?**
   - If you see the message "Running in test mode", rules will auto-expire after 30 days
   - Publish permanent rules instead of using test mode

### 📱 Device Patient Errors:

- Patient getting permission denied on `/patients/{patientId}` creation?
  - Make sure `request.auth == null` rule is published
  - Try in incognito/private browser to ensure no auth is cached

### 👥 Caretaker Permission Issues:

- Can't see patient notifications?
  - Check the `notifications` document has correct `caretakerId` field
  - Verify your auth UID matches the `caretakerId` in notifications

## Quick Test Commands (Browser Console):

```javascript
// Check if caretaker is logged in
console.log(localStorage.getItem('mind_caretaker_id'));

// Check if patient is set up
console.log(localStorage.getItem('mind_patient_profile'));

// Check patient ID
console.log(JSON.parse(localStorage.getItem('mind_patient_profile')).uid);
```
