
import React, { useState, useEffect, useRef } from 'react';
import { RoutineItem, UserProfile, AppState } from '../types';
import { geminiService } from '../services/geminiService';
import { bluetoothService } from '../services/bluetoothService';
import { notificationService } from '../services/notificationService';
import { CheckCircle2, Circle, Clock, Brain, Heart, Sparkles, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  profile: UserProfile;
  onNavigate: (tab: AppState) => void;
}

const RoutineModule: React.FC<Props> = ({ profile, onNavigate }) => {
  const [items, setItems] = useState<RoutineItem[]>(() => {
    const saved = localStorage.getItem('mind_routine');
    return saved ? JSON.parse(saved) : [
      { id: '1', title: 'Morning Medicine', time: '08:00', completed: false, type: 'medicine' },
      { id: '2', title: 'Healthy Breakfast', time: '09:00', completed: false, type: 'meal' },
      { id: '3', title: 'Afternoon Walk', time: '16:00', completed: false, type: 'exercise' },
      { id: '4', title: 'Night Vitamins', time: '21:00', completed: false, type: 'medicine' },
    ];
  });

  const [activeReminder, setActiveReminder] = useState<RoutineItem | null>(null);
  const [suggestion, setSuggestion] = useState<{ text: string, type: 'games' | 'family' } | null>(null);
  
  const lastNotifiedRef = useRef<string | null>(null);
  const lastTimeRef = useRef<string | null>(null);
  const missedNotificationsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    localStorage.setItem('mind_routine', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    const checkReminders = () => {
      if (document.hidden) return;

      const now = new Date();
      const currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      
      const due = items.find(item => item.time === currentTime && !item.completed);
      
      if (due && (lastNotifiedRef.current !== due.id || lastTimeRef.current !== currentTime)) {
        setActiveReminder(due);
        lastNotifiedRef.current = due.id;
        lastTimeRef.current = currentTime;
        
        const userName = profile.name || 'my friend';
        geminiService.speak(`Hello ${userName}, it is ${due.time}. It is time for your ${due.title}. Have you completed this yet?`);
        
        if (bluetoothService.isConnected()) {
          bluetoothService.sendVibrationAlert(2);
        }
      }
    };

    const interval = setInterval(checkReminders, 15000);
    return () => clearInterval(interval);
  }, [items, profile]);

  // Periodic suggestions
  useEffect(() => {
    const suggestions = [
      { text: "Would you like to play a memory game to keep your mind sharp?", type: 'games' as const },
      { text: "How about looking at some family photos? It's always nice to see friendly faces.", type: 'family' as const },
      { text: "Shall we try a jigsaw puzzle today?", type: 'games' as const }
    ];

    const interval = setInterval(() => {
      if (!activeReminder && !suggestion) {
        const random = suggestions[Math.floor(Math.random() * suggestions.length)];
        setSuggestion(random);
        geminiService.speak(random.text);
      }
    }, 60000); // Suggest something every minute if idle

    return () => clearInterval(interval);
  }, [activeReminder, suggestion]);

  // Check for missed routines and create notifications
  useEffect(() => {
    const checkMissedRoutines = async () => {
      const patientProfile = localStorage.getItem('mind_patient_profile');
      const caretakerEmail = localStorage.getItem('mind_caretaker_email');
      
      if (!patientProfile || !caretakerEmail) return;

      try {
        const patient = JSON.parse(patientProfile);
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeInMinutes = currentHour * 60 + currentMinute;

        items.forEach(async (item) => {
          if (item.completed) return; // Skip completed routines

          const [scheduleHour, scheduleMinute] = item.time.split(':').map(Number);
          const scheduleTimeInMinutes = scheduleHour * 60 + scheduleMinute;
          const minutesPast = currentTimeInMinutes - scheduleTimeInMinutes;

          // If routine is more than 5 minutes past scheduled time and not completed
          if (minutesPast > 5 && minutesPast < 1440 && !missedNotificationsRef.current.has(item.id)) {
            try {
              await notificationService.createMissedRoutineNotification(
                patient.caretakerId || patient.caretakerEmail,
                patient.uid,
                patient.name,
                item.title,
                item.time,
                item.type
              );
              missedNotificationsRef.current.add(item.id);
            } catch (err) {
              console.error('Error creating missed routine notification:', err);
            }
          }
        });
      } catch (err) {
        console.error('Error checking missed routines:', err);
      }
    };

    const interval = setInterval(checkMissedRoutines, 60000); // Check every minute
    checkMissedRoutines(); // Check immediately on mount
    
    return () => clearInterval(interval);
  }, [items]);

  const toggleComplete = (id: string) => {
    const updated = items.map(item => {
      if (item.id === id) {
        const newState = !item.completed;
        if (newState) {
          const userName = profile.name || 'my friend';
          geminiService.speak(`Great job, ${userName}! I've marked that as done.`);
          if (activeReminder?.id === id) setActiveReminder(null);
        }
        return { ...item, completed: newState };
      }
      return item;
    });
    setItems(updated);
  };

  const completedCount = items.filter(i => i.completed).length;
  const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Active Reminder Modal */}
      {activeReminder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="card p-10 max-w-xl w-full text-center space-y-8 border-8 border-[var(--primary-color)] shadow-2xl"
          >
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-blue-600">
              <Clock className="text-blue-600 animate-bounce" size={48} />
            </div>
            <div>
              <h2 className="text-4xl font-black mb-2">Time for {activeReminder.title}!</h2>
              <p className="text-2xl font-bold text-slate-500">It's {activeReminder.time}. Have you done this yet?</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => toggleComplete(activeReminder.id)}
                className="tactile-btn bg-emerald-500 text-white p-6 rounded-[30px] font-black text-2xl"
              >
                Yes, Done!
              </button>
              <button 
                onClick={() => setActiveReminder(null)}
                className="tactile-btn bg-white text-slate-400 p-6 rounded-[30px] font-black text-2xl border-4 border-slate-200"
              >
                Not Yet
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Suggestion Pop-up */}
      {suggestion && (
        <motion.div 
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="bg-amber-100 border-4 border-amber-400 p-6 rounded-[30px] flex items-center justify-between gap-4 shadow-xl"
        >
          <div className="flex items-center gap-4">
            <div className="bg-amber-400 p-3 rounded-full text-white">
              <Sparkles size={24} />
            </div>
            <p className="text-xl font-black text-amber-900">{suggestion.text}</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                onNavigate(suggestion.type === 'games' ? AppState.GAMES : AppState.FAMILY);
                setSuggestion(null);
              }}
              className="tactile-btn bg-amber-600 text-white px-6 py-3 rounded-xl font-black"
            >
              Yes, Let's Go!
            </button>
            <button 
              onClick={() => setSuggestion(null)}
              className="p-3 text-amber-600 font-bold"
            >
              Maybe later
            </button>
          </div>
        </motion.div>
      )}

      {/* Progress Card */}
      <div className="card p-8 bg-gradient-to-br from-blue-50 to-white flex items-center justify-between border-blue-200">
        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
              <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={251} strokeDashoffset={251 - (251 * progressPercent) / 100} className="text-blue-600 transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-black text-xl text-blue-800">
              {progressPercent}%
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-blue-900">Daily Progress</h3>
            <p className="font-bold text-blue-700/60 uppercase tracking-widest text-sm">{completedCount} of {items.length} Activities Done</p>
          </div>
        </div>
      </div>

      {/* Routine List */}
      <div className="card p-8 shadow-xl border-4 border-slate-900">
        <h2 className="text-3xl font-black text-slate-900 mb-8 flex items-center">
          <Calendar className="mr-4 text-blue-600" size={32} />
          My Daily Routine
        </h2>
        
        <div className="space-y-5">
          {items.map(item => (
            <div 
              key={item.id} 
              className={`flex items-center p-6 rounded-[30px] border-4 transition-all ${
                item.completed 
                  ? 'bg-slate-50 border-slate-200 opacity-60' 
                  : 'bg-white border-slate-900 shadow-[8px_8px_0px_rgba(0,0,0,0.1)]'
              }`}
            >
              <div className="mr-6 flex-shrink-0 bg-slate-100 w-16 h-16 rounded-2xl flex items-center justify-center border-2 border-slate-200">
                <span className="text-3xl">
                  {item.type === 'medicine' ? '💊' : 
                   item.type === 'meal' ? '🍲' :
                   item.type === 'exercise' ? '🚶' : '⭐'}
                </span>
              </div>
              <div className="flex-grow">
                <h3 className={`font-black text-2xl ${item.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                  {item.title}
                </h3>
                <div className="flex items-center gap-4">
                  <p className="text-xl font-bold text-slate-500">{item.time}</p>
                  {(item.howToDo || item.whereToDo) && (
                    <div className="flex gap-3 text-sm font-bold text-blue-600/70">
                      {item.howToDo && <span>• How: {item.howToDo}</span>}
                      {item.whereToDo && <span>• Where: {item.whereToDo}</span>}
                    </div>
                  )}
                </div>
              </div>
              <button 
                onClick={() => toggleComplete(item.id)}
                className={`tactile-btn w-20 h-20 rounded-[24px] flex items-center justify-center transition-all border-4 ${
                  item.completed 
                    ? 'bg-emerald-500 text-white border-slate-900 shadow-[0_4px_0_#065f46]' 
                    : 'bg-white text-slate-400 border-slate-200'
                }`}
              >
                {item.completed ? <CheckCircle2 size={40} /> : <Circle size={40} />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Suggestions Footer */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => onNavigate(AppState.GAMES)}
          className="card p-6 bg-white border-2 border-slate-200 hover:border-blue-500 transition-colors flex items-center gap-4 group"
        >
          <div className="p-4 bg-blue-100 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform">
            <Brain size={32} />
          </div>
          <div className="text-left">
            <p className="font-black text-xl">Play Puzzles</p>
            <p className="text-sm font-bold opacity-50">Keep your brain active</p>
          </div>
        </button>
        <button 
          onClick={() => onNavigate(AppState.FAMILY)}
          className="card p-6 bg-white border-2 border-slate-200 hover:border-rose-500 transition-colors flex items-center gap-4 group"
        >
          <div className="p-4 bg-rose-100 rounded-2xl text-rose-600 group-hover:scale-110 transition-transform">
            <Heart size={32} />
          </div>
          <div className="text-left">
            <p className="font-black text-xl">Family Photos</p>
            <p className="text-sm font-bold opacity-50">See your loved ones</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default RoutineModule;
