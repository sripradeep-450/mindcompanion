import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebaseConfig';

export interface MissedRoutineNotification {
  id: string;
  caretakerId: string;
  patientId: string;
  patientName: string;
  routineTitle: string;
  routineTime: string;
  routineType: 'medicine' | 'meal' | 'exercise' | 'other';
  missedAt: Timestamp;
  acknowledged: boolean;
  acknowledgedAt?: Timestamp;
}

export const notificationService = {
  // Create a missed routine notification
  async createMissedRoutineNotification(
    caretakerId: string,
    patientId: string,
    patientName: string,
    routineTitle: string,
    routineTime: string,
    routineType: 'medicine' | 'meal' | 'exercise' | 'other'
  ): Promise<string> {
    try {
      const notificationsRef = collection(db, 'notifications');
      const docRef = await addDoc(notificationsRef, {
        caretakerId,
        patientId,
        patientName,
        routineTitle,
        routineTime,
        routineType,
        missedAt: serverTimestamp(),
        acknowledged: false,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  // Get all missed routine notifications for a caretaker
  async getMissedRoutineNotifications(
    caretakerId: string
  ): Promise<MissedRoutineNotification[]> {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('caretakerId', '==', caretakerId)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MissedRoutineNotification));
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  },

  // Get unacknowledged notifications only
  async getUnacknowledgedNotifications(
    caretakerId: string
  ): Promise<MissedRoutineNotification[]> {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('caretakerId', '==', caretakerId),
        where('acknowledged', '==', false)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MissedRoutineNotification));
    } catch (error) {
      console.error('Error getting unacknowledged notifications:', error);
      return [];
    }
  },

  // Acknowledge a notification
  async acknowledgeNotification(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        acknowledged: true,
        acknowledgedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error acknowledging notification:', error);
      throw error;
    }
  },

  // Delete a notification
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await deleteDoc(notificationRef);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  // Listen for real-time updates on notifications
  listenToNotifications(
    caretakerId: string,
    callback: (notifications: MissedRoutineNotification[]) => void
  ) {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('caretakerId', '==', caretakerId)
      );
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const notifications = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as MissedRoutineNotification));
        callback(notifications);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error listening to notifications:', error);
      return () => {};
    }
  },

  // Listen for unacknowledged notifications only
  listenToUnacknowledgedNotifications(
    caretakerId: string,
    callback: (notifications: MissedRoutineNotification[]) => void
  ) {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('caretakerId', '==', caretakerId),
        where('acknowledged', '==', false)
      );
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const notifications = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as MissedRoutineNotification));
        callback(notifications);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error listening to unacknowledged notifications:', error);
      return () => {};
    }
  }
};
