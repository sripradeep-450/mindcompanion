import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  updateDoc,
  onSnapshot
} from 'firebase/firestore';
import { auth, db } from './firebaseConfig';

const googleProvider = new GoogleAuthProvider();

export interface CaretakerProfile {
  uid: string;
  email: string;
  name: string;
  photo?: string;
  createdAt: number;
}

export interface PatientProfile {
  uid: string;
  name: string;
  age: string;
  gender: string;
  bio: string;
  photo?: string;
  caretakerId: string; // Reference to caretaker
  caretakerEmail: string;
  linkedAt: number;
}

export const authService = {
  // Google Sign In
  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error: any) {
      console.error("Google Sign In Error:", error);
      throw error;
    }
  },

  // Sign Out
  async signOut() {
    try {
      await signOut(auth);
      localStorage.removeItem('mind_user_role');
      localStorage.removeItem('mind_user_id');
    } catch (error) {
      console.error("Sign Out Error:", error);
      throw error;
    }
  },

  // Register/Update Caretaker
  async registerCaretaker(user: User): Promise<CaretakerProfile> {
    const caretakerRef = doc(db, 'caretakers', user.uid);
    const caretakerProfile: CaretakerProfile = {
      uid: user.uid,
      email: user.email || '',
      name: user.displayName || 'Caretaker',
      photo: user.photoURL || undefined,
      createdAt: Date.now()
    };
    
    await setDoc(caretakerRef, caretakerProfile, { merge: true });
    return caretakerProfile;
  },

  // Link Patient to Caretaker
  async linkPatientToCaretaker(
    patientData: Omit<PatientProfile, 'uid' | 'linkedAt'>,
    caretakerEmail: string
  ) {
    try {
      // Find caretaker by email
      const caretakersRef = collection(db, 'caretakers');
      const q = query(caretakersRef, where('email', '==', caretakerEmail));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error(`Caretaker with email ${caretakerEmail} not found. Caretaker must sign in first.`);
      }

      const caretakerDoc = querySnapshot.docs[0];
      const caretakerId = caretakerDoc.id;
      
      // Create patient profile with caretaker link
      const patientRef = doc(db, 'patients', auth.currentUser?.uid || '');
      const patientProfile: PatientProfile = {
        ...patientData,
        uid: auth.currentUser?.uid || '',
        caretakerId,
        caretakerEmail,
        linkedAt: Date.now()
      };
      
      await setDoc(patientRef, patientProfile, { merge: true });
      
      // Add patient to caretaker's list
      const caretakerPatientsRef = collection(db, 'caretakers', caretakerId, 'patients');
      await setDoc(doc(caretakerPatientsRef, patientRef.id), {
        patientId: patientRef.id,
        name: patientData.name,
        addedAt: Date.now()
      });
      
      return patientProfile;
    } catch (error) {
      console.error("Patient Linking Error:", error);
      throw error;
    }
  },

  // Get Patient Profile
  async getPatientProfile(patientId: string): Promise<PatientProfile | null> {
    try {
      const patientRef = doc(db, 'patients', patientId);
      const patientDoc = await getDoc(patientRef);
      return patientDoc.exists() ? (patientDoc.data() as PatientProfile) : null;
    } catch (error) {
      console.error("Get Patient Error:", error);
      return null;
    }
  },

  // Get Caretaker Profile
  async getCaretakerProfile(caretakerId: string): Promise<CaretakerProfile | null> {
    try {
      const caretakerRef = doc(db, 'caretakers', caretakerId);
      const caretakerDoc = await getDoc(caretakerRef);
      return caretakerDoc.exists() ? (caretakerDoc.data() as CaretakerProfile) : null;
    } catch (error) {
      console.error("Get Caretaker Error:", error);
      return null;
    }
  },

  // Get all patients under a caretaker
  async getCaretakerPatients(caretakerId: string) {
    try {
      const patientsRef = collection(db, 'caretakers', caretakerId, 'patients');
      const snapshot = await getDocs(patientsRef);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Get Patients Error:", error);
      return [];
    }
  },

  // Link device-based patient to caretaker (no authentication required)
  async linkDevicePatientToCaretaker(
    patientData: Omit<PatientProfile, 'uid' | 'linkedAt' | 'caretakerId'>,
    caretakerEmail: string,
    patientId: string
  ): Promise<PatientProfile> {
    try {
      // Find caretaker by email
      const caretakersRef = collection(db, 'caretakers');
      const q = query(caretakersRef, where('email', '==', caretakerEmail));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error(`Caretaker with email ${caretakerEmail} not found. Caretaker must sign in first.`);
      }

      const caretakerDoc = querySnapshot.docs[0];
      const caretakerId = caretakerDoc.id;
      
      // Create patient profile with caretaker link
      const patientRef = doc(db, 'patients', patientId);
      const patientProfile: PatientProfile = {
        ...patientData,
        uid: patientId,
        caretakerId,
        linkedAt: Date.now()
      };
      
      await setDoc(patientRef, patientProfile, { merge: true });
      
      // Add patient to caretaker's list
      const caretakerPatientsRef = collection(db, 'caretakers', caretakerId, 'patients');
      await setDoc(doc(caretakerPatientsRef, patientId), {
        patientId,
        name: patientData.name,
        addedAt: Date.now()
      });
      
      return patientProfile;
    } catch (error) {
      console.error("Device Patient Linking Error:", error);
      throw error;
    }
  },

  // Subscribe to auth state
  onAuthStateChanged: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
  },

  // Get current user
  getCurrentUser: () => auth.currentUser,

  // Real-time listener for caretaker's patients
  listenToCaretakerPatients(
    caretakerId: string,
    callback: (patients: PatientProfile[]) => void
  ) {
    try {
      const patientsRef = collection(db, 'caretakers', caretakerId, 'patients');
      
      // First get patient refs, then get their full profile data
      const unsubscribe = onSnapshot(patientsRef, async (snapshot) => {
        const patientIds = snapshot.docs.map(doc => doc.data().patientId);
        
        if (patientIds.length === 0) {
          callback([]);
          return;
        }
        
        // Get full patient profiles from patients collection
        const patientProfiles: PatientProfile[] = [];
        for (const patientId of patientIds) {
          const patientRef = doc(db, 'patients', patientId);
          const patientDoc = await getDoc(patientRef);
          if (patientDoc.exists()) {
            patientProfiles.push({ id: patientId, ...patientDoc.data() } as PatientProfile & { id: string });
          }
        }
        
        callback(patientProfiles);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error listening to caretaker patients:', error);
      return () => {};
    }
  },

  // Real-time listener for single patient profile
  listenToPatientProfile(
    patientId: string,
    callback: (patient: PatientProfile | null) => void
  ) {
    try {
      const patientRef = doc(db, 'patients', patientId);
      
      const unsubscribe = onSnapshot(patientRef, (snapshot) => {
        if (snapshot.exists()) {
          callback({ id: patientId, ...snapshot.data() } as PatientProfile & { id: string });
        } else {
          callback(null);
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error listening to patient profile:', error);
      return () => {};
    }
  }
};
