import { RoutineItem } from '../types';
import { notificationService } from './notificationService';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';

export const routineCheckerService = {
  // Check if a routine has been missed (compared to current time)
  isMissed(routine: RoutineItem, currentTime: Date): boolean {
    if (!routine.time) return false;
    
    const [hours, minutes] = routine.time.split(':').map(Number);
    const routineDate = new Date(currentTime);
    routineDate.setHours(hours, minutes, 0, 0);
    
    // Routine is missed if current time is more than 5 minutes past the routine time
    const fiveMinutesLater = new Date(routineDate.getTime() + 5 * 60 * 1000);
    return currentTime > fiveMinutesLater && !routine.completed;
  },

  // Get all patients' routines and check for missed ones
  async checkMissedRoutines(caretakerId: string, patientProfiles: any[]): Promise<void> {
    try {
      const currentTime = new Date();
      
      // Get all existing unacknowledged notifications for this caretaker
      const notificationsRef = collection(db, 'notifications');
      const existingQuery = query(
        notificationsRef,
        where('caretakerId', '==', caretakerId),
        where('acknowledged', '==', false)
      );
      const existingSnapshot = await getDocs(existingQuery);
      const existingNotifications = new Set(
        existingSnapshot.docs.map(doc => {
          const data = doc.data();
          return `${data.patientId}-${data.routineTitle}-${data.routineTime}`;
        })
      );

      // For each patient, get their routines from localStorage
      for (const patient of patientProfiles) {
        // Try to get routines from localStorage if patient is device-based
        // or from Firestore if patient is authenticated
        let routines: RoutineItem[] = [];
        
        // First try localStorage for device patients
        const savedRoutines = localStorage.getItem('mind_routine');
        if (savedRoutines) {
          try {
            routines = JSON.parse(savedRoutines);
          } catch (e) {
            console.warn('Error parsing routines from localStorage:', e);
          }
        }

        // Check each routine
        for (const routine of routines) {
          if (this.isMissed(routine, currentTime)) {
            const notificationKey = `${patient.uid}-${routine.title}-${routine.time}`;
            
            // Only create notification if one doesn't already exist for this routine
            if (!existingNotifications.has(notificationKey)) {
              try {
                await notificationService.createMissedRoutineNotification(
                  caretakerId,
                  patient.uid,
                  patient.name || 'Patient',
                  routine.title,
                  routine.time,
                  (routine.type || 'other') as 'medicine' | 'meal' | 'exercise' | 'other'
                );
                console.log(`Created notification for missed routine: ${routine.title}`);
              } catch (err) {
                console.error('Error creating notification:', err);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking missed routines:', error);
    }
  },

  // Start a periodic routine checker
  startRoutineChecker(caretakerId: string, patientProfiles: any[]): () => void {
    // Check immediately
    this.checkMissedRoutines(caretakerId, patientProfiles);

    // Then check every minute
    const interval = setInterval(() => {
      this.checkMissedRoutines(caretakerId, patientProfiles);
    }, 60000); // 60 seconds

    // Return cleanup function
    return () => {
      clearInterval(interval);
    };
  }
};
