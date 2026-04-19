
import React, { useState, useEffect } from 'react';
import { UserProfile, RoutineItem, FamilyPhoto } from '../types';
import { Plus, Trash2, Image as ImageIcon, Calendar, User, Save, Sparkles, X, Tag as TagIcon, Check, Bell, AlertCircle, ChevronDown, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { notificationService, MissedRoutineNotification } from '../services/notificationService';
import { authService, PatientProfile } from '../services/authService';

interface Props {
  profile: UserProfile;
}

const CaretakerDashboard: React.FC<Props> = ({ profile }) => {
  const [localProfile, setLocalProfile] = useState(profile);
  const [patients, setPatients] = useState<(PatientProfile & { id: string })[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null);
  const [patientsLoading, setPatientsLoading] = useState(true);
  
  const [routines, setRoutines] = useState<RoutineItem[]>(() => {
    const saved = localStorage.getItem('mind_routine');
    return saved ? JSON.parse(saved) : [];
  });

  const [photos, setPhotos] = useState<FamilyPhoto[]>(() => {
    const saved = localStorage.getItem('mind_family_photos');
    return saved ? JSON.parse(saved) : [];
  });

  const [missedRoutineNotifications, setMissedRoutineNotifications] = useState<MissedRoutineNotification[]>([]);

  const [newRoutine, setNewRoutine] = useState({ 
    title: '', 
    time: '', 
    type: 'other' as const,
    howToDo: '',
    whereToDo: ''
  });

  const [photoForm, setPhotoForm] = useState({ url: '', eventName: '', date: '' });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedPhoto, setAnalyzedPhoto] = useState<FamilyPhoto | null>(null);
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem('mind_routine', JSON.stringify(routines));
  }, [routines]);

  useEffect(() => {
    localStorage.setItem('mind_family_photos', JSON.stringify(photos));
  }, [photos]);

  // Load patients from Firebase when component mounts
  useEffect(() => {
    const caretakerId = localStorage.getItem('mind_caretaker_id');
    if (!caretakerId) {
      setPatientsLoading(false);
      return;
    }

    setPatientsLoading(true);
    
    // Set up real-time listener for patients
    const unsubscribe = authService.listenToCaretakerPatients(
      caretakerId,
      (patientList) => {
        setPatients(patientList);
        // Auto-select first patient if available
        if (patientList.length > 0 && !selectedPatientId) {
          setSelectedPatientId(patientList[0].id || patientList[0].uid);
        }
        setPatientsLoading(false);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Load selected patient's full profile
  useEffect(() => {
    if (!selectedPatientId) {
      setSelectedPatient(null);
      return;
    }

    // First check if we have it in the patients list
    const foundPatient = patients.find(p => (p.id || p.uid) === selectedPatientId);
    if (foundPatient) {
      setSelectedPatient(foundPatient);
    } else {
      // Otherwise, listen to real-time updates
      const unsubscribe = authService.listenToPatientProfile(
        selectedPatientId,
        (patient) => {
          setSelectedPatient(patient);
        }
      );

      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [selectedPatientId, patients]);

  // Listen for missed routine notifications from Firestore
  useEffect(() => {
    const caretakerId = localStorage.getItem('mind_caretaker_id');
    if (!caretakerId) return;

    try {
      const unsubscribe = notificationService.listenToNotifications(
        caretakerId,
        (notifications) => {
          setMissedRoutineNotifications(notifications);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up notification listener:', err);
    }
  }, []);

  const handleAcknowledgeNotification = async (notificationId: string) => {
    try {
      await notificationService.acknowledgeNotification(notificationId);
      setMissedRoutineNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, acknowledged: true } : n)
      );
    } catch (err) {
      console.error('Error acknowledging notification:', err);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setMissedRoutineNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const saveProfile = () => {
    localStorage.setItem('mind_user_profile', JSON.stringify(localProfile));
    alert("Profile saved successfully!");
    window.location.reload(); // Refresh to update App state
  };

  const addRoutine = () => {
    if (!newRoutine.title || !newRoutine.time) return;
    const item: RoutineItem = {
      id: Date.now().toString(),
      ...newRoutine,
      completed: false
    };
    setRoutines([...routines, item].sort((a, b) => a.time.localeCompare(b.time)));
    setNewRoutine({ title: '', time: '', type: 'other', howToDo: '', whereToDo: '' });
  };

  const deleteRoutine = (id: string) => {
    setRoutines(routines.filter(r => r.id !== id));
  };

  const startPhotoAnalysis = () => {
    if (!photoForm.url || !photoForm.eventName) return;
    setIsAnalyzing(true);
    
    // Simulate AI analysis delay
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalyzedPhoto({
        id: Date.now().toString(),
        url: photoForm.url,
        eventName: photoForm.eventName,
        date: photoForm.date || new Date().toISOString().split('T')[0],
        tags: [
          { name: '', relation: '', x: 30, y: 40 }, // Simulated detected face 1
          { name: '', relation: '', x: 60, y: 35 }  // Simulated detected face 2
        ]
      });
    }, 1500);
  };

  const saveAnalyzedPhoto = () => {
    if (!analyzedPhoto) return;
    setPhotos([...photos, analyzedPhoto]);
    setAnalyzedPhoto(null);
    setPhotoForm({ url: '', eventName: '', date: '' });
  };

  const deletePhoto = (id: string) => {
    setPhotos(photos.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Patient Selection */}
      {patientsLoading ? (
        <div className="card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-4 border-blue-300 flex items-center justify-center gap-3">
          <Loader2 className="animate-spin text-blue-600" size={24} />
          <p className="font-black text-blue-900">Loading patient list...</p>
        </div>
      ) : patients.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-4 border-blue-300"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-blue-900">Select Patient</h3>
            <div className="relative">
              <select
                value={selectedPatientId || ''}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="appearance-none p-3 pr-10 rounded-xl border-2 border-blue-400 font-bold focus:outline-none focus:border-blue-600 bg-white cursor-pointer"
              >
                <option value="">-- Choose Patient --</option>
                {patients.map((p) => (
                  <option key={p.id || p.uid} value={p.id || p.uid}>
                    {p.name} (Age: {p.age})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400 pointer-events-none" size={20} />
            </div>
          </div>
          
          {selectedPatient && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 p-4 bg-white rounded-xl border-2 border-blue-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-black text-xl shadow-lg">
                    {selectedPatient.name?.charAt(0) || 'P'}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Patient Status</p>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <div><span className="font-black text-slate-600">Name:</span> <span className="font-bold text-slate-900">{selectedPatient.name}</span></div>
                  <div><span className="font-black text-slate-600">Age:</span> <span className="font-bold text-slate-900">{selectedPatient.age}</span></div>
                  <div><span className="font-black text-slate-600">Gender:</span> <span className="font-bold text-slate-900">{selectedPatient.gender}</span></div>
                  <div><span className="font-black text-slate-600">Bio:</span> <span className="font-bold text-slate-900">{selectedPatient.bio}</span></div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      ) : (
        <div className="card p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-4 border-amber-300">
          <p className="font-black text-amber-900">No patients linked yet. Patients will appear here once they enter your email during their setup.</p>
        </div>
      )}
      {/* Missed Routines Alert & Management */}
      {missedRoutineNotifications.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 bg-gradient-to-r from-red-50 to-orange-50 border-4 border-red-400"
        >
          <div className="flex items-center gap-2 mb-4">
            <Bell className="text-red-600 animate-pulse" size={28} />
            <h2 className="text-2xl font-black text-red-900">
              ⚠️ {missedRoutineNotifications.filter(n => !n.acknowledged).length} Missed Routine{missedRoutineNotifications.filter(n => !n.acknowledged).length !== 1 ? 's' : ''}
            </h2>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            <AnimatePresence>
              {missedRoutineNotifications.map((notification, idx) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`p-4 rounded-2xl border-2 flex items-start justify-between gap-4 ${
                    notification.acknowledged
                      ? 'bg-white border-slate-200'
                      : 'bg-white border-red-300'
                  }`}
                >
                  <div className="flex-grow flex items-start gap-3">
                    {!notification.acknowledged && (
                      <div className="bg-red-100 p-2 rounded-full mt-1">
                        <AlertCircle className="text-red-600" size={18} />
                      </div>
                    )}
                    <div className="flex-grow">
                      <p className="font-black text-slate-900">{notification.patientName}</p>
                      <p className="text-sm font-bold text-slate-600">
                        Missed <span className="text-red-600">{notification.routineTitle}</span> at {notification.routineTime}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        <span className="bg-slate-100 px-2 py-0.5 rounded font-bold inline-block">
                          {notification.routineType}
                        </span>
                      </p>
                      {notification.acknowledged && (
                        <p className="text-xs text-emerald-600 font-bold mt-1">✓ Acknowledged</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!notification.acknowledged && (
                      <button
                        onClick={() => handleAcknowledgeNotification(notification.id)}
                        className="tactile-btn bg-emerald-500 text-white p-2 rounded-lg hover:bg-emerald-600 transition-colors"
                        title="Mark as acknowledged"
                      >
                        <Check size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteNotification(notification.id)}
                      className="tactile-btn bg-slate-200 text-slate-600 p-2 rounded-lg hover:bg-red-400 hover:text-white transition-colors"
                      title="Dismiss"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Routine Management */}
        <div className="card p-6 bg-white border-4 border-slate-900">
          <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
            <Calendar className="text-blue-600" /> Manage Routines
          </h2>
          
          <div className="space-y-4 mb-8 bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input 
                  type="text" 
                  placeholder="Task Title (e.g. Medicine)" 
                  className="p-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none font-bold"
                  value={newRoutine.title}
                  onChange={e => setNewRoutine({...newRoutine, title: e.target.value})}
                />
                <input 
                  type="time" 
                  className="p-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none font-bold"
                  value={newRoutine.time}
                  onChange={e => setNewRoutine({...newRoutine, time: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input 
                  type="text" 
                  placeholder="How to do it? (Optional)" 
                  className="p-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none font-bold"
                  value={newRoutine.howToDo}
                  onChange={e => setNewRoutine({...newRoutine, howToDo: e.target.value})}
                />
                <input 
                  type="text" 
                  placeholder="Where to do it? (Optional)" 
                  className="p-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none font-bold"
                  value={newRoutine.whereToDo}
                  onChange={e => setNewRoutine({...newRoutine, whereToDo: e.target.value})}
                />
              </div>
              <select 
                className="p-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none font-bold"
                value={newRoutine.type}
                onChange={e => setNewRoutine({...newRoutine, type: e.target.value as any})}
              >
                <option value="medicine">Medicine</option>
                <option value="meal">Meal</option>
                <option value="exercise">Exercise</option>
                <option value="other">Other</option>
              </select>
              <button 
                onClick={addRoutine}
                className="tactile-btn bg-blue-600 text-white p-3 rounded-xl font-black flex items-center justify-center gap-2"
              >
                <Plus size={20} /> Add to Patient's Day
              </button>
            </div>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {routines.map(item => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-slate-200 shadow-sm">
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-slate-800">{item.title}</p>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-slate-100 rounded-full">{item.type}</span>
                  </div>
                  <p className="text-sm font-bold text-blue-600">{item.time}</p>
                  {(item.howToDo || item.whereToDo) && (
                    <div className="mt-1 text-xs font-bold text-slate-500 flex gap-2">
                      {item.howToDo && <span>How: {item.howToDo}</span>}
                      {item.whereToDo && <span>Where: {item.whereToDo}</span>}
                    </div>
                  )}
                </div>
                <button onClick={() => deleteRoutine(item.id)} className="text-red-500 hover:text-red-700 p-2">
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Photo Management with AI Tagging */}
        <div className="card p-6 bg-white border-4 border-slate-900">
          <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
            <ImageIcon className="text-rose-600" /> Manage Family Photos
          </h2>

          {!analyzedPhoto ? (
            <div className="space-y-4 mb-8 bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
              <div className="flex flex-col gap-3">
                <input 
                  type="text" 
                  placeholder="Photo URL (Unsplash/Direct Link)" 
                  className="p-3 rounded-xl border-2 border-slate-200 focus:border-rose-500 outline-none font-bold"
                  value={photoForm.url}
                  onChange={e => setPhotoForm({...photoForm, url: e.target.value})}
                />
                <input 
                  type="text" 
                  placeholder="Event Name (e.g. Grandma's 80th)" 
                  className="p-3 rounded-xl border-2 border-slate-200 focus:border-rose-500 outline-none font-bold"
                  value={photoForm.eventName}
                  onChange={e => setPhotoForm({...photoForm, eventName: e.target.value})}
                />
                <input 
                  type="date" 
                  className="p-3 rounded-xl border-2 border-slate-200 focus:border-rose-500 outline-none font-bold"
                  value={photoForm.date}
                  onChange={e => setPhotoForm({...photoForm, date: e.target.value})}
                />
                <button 
                  onClick={startPhotoAnalysis}
                  disabled={isAnalyzing}
                  className="tactile-btn bg-rose-600 text-white p-3 rounded-xl font-black flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isAnalyzing ? <Sparkles className="animate-spin" /> : <ImageIcon size={20} />}
                  {isAnalyzing ? "AI Analyzing Faces..." : "Upload & Tag Faces"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 mb-8 bg-rose-50 p-4 rounded-2xl border-4 border-rose-200">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-black text-rose-900">AI Detected Faces</h3>
                <button onClick={() => setAnalyzedPhoto(null)} className="text-rose-900"><X size={20} /></button>
              </div>
              <div className="relative aspect-video rounded-xl overflow-hidden border-4 border-white shadow-lg bg-black">
                <img src={analyzedPhoto.url} className="w-full h-full object-contain" alt="Analyzing" />
                {analyzedPhoto.tags.map((tag, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveTagIndex(idx)}
                    style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-4 flex items-center justify-center transition-all ${
                      activeTagIndex === idx ? 'bg-yellow-400 border-white scale-125 z-10' : 'bg-white/50 border-white hover:bg-white'
                    }`}
                  >
                    <TagIcon size={12} className={activeTagIndex === idx ? 'text-white' : 'text-rose-600'} />
                  </button>
                ))}
              </div>
              
              <AnimatePresence mode="wait">
                {activeTagIndex !== null && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="bg-white p-4 rounded-xl border-2 border-rose-200 space-y-3"
                  >
                    <p className="text-sm font-black text-slate-700">Identify this person:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="text" 
                        placeholder="Name" 
                        className="p-2 rounded-lg border-2 border-slate-100 font-bold text-sm"
                        value={analyzedPhoto.tags[activeTagIndex].name}
                        onChange={e => {
                          const newTags = [...analyzedPhoto.tags];
                          newTags[activeTagIndex].name = e.target.value;
                          setAnalyzedPhoto({...analyzedPhoto, tags: newTags});
                        }}
                      />
                      <input 
                        type="text" 
                        placeholder="Relation (e.g. Son)" 
                        className="p-2 rounded-lg border-2 border-slate-100 font-bold text-sm"
                        value={analyzedPhoto.tags[activeTagIndex].relation || ''}
                        onChange={e => {
                          const newTags = [...analyzedPhoto.tags];
                          newTags[activeTagIndex].relation = e.target.value;
                          setAnalyzedPhoto({...analyzedPhoto, tags: newTags});
                        }}
                      />
                    </div>
                    <button 
                      onClick={() => setActiveTagIndex(null)}
                      className="w-full bg-rose-600 text-white p-2 rounded-lg font-black text-sm flex items-center justify-center gap-2"
                    >
                      <Check size={16} /> Confirm Identity
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                onClick={saveAnalyzedPhoto}
                className="tactile-btn w-full bg-emerald-600 text-white p-3 rounded-xl font-black flex items-center justify-center gap-2"
              >
                <Save size={20} /> Save Photo to Memory Book
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {photos.map(photo => (
              <div key={photo.id} className="relative group rounded-xl overflow-hidden border-2 border-slate-100">
                <img src={photo.url} className="w-full h-32 object-cover" alt={photo.eventName} />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button onClick={() => deletePhoto(photo.id)} className="bg-white p-2 rounded-full text-red-600">
                    <Trash2 size={20} />
                  </button>
                </div>
                <div className="p-2 bg-white">
                  <p className="text-[10px] font-black truncate">{photo.eventName}</p>
                  <p className="text-[8px] font-bold text-slate-400">{photo.tags.length} people tagged</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Profile Settings */}
      <div className="card p-6 bg-white border-4 border-slate-900">
        <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
          <User className="text-emerald-600" /> Patient Profile
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-full bg-slate-100 border-4 border-slate-900 overflow-hidden mb-4">
              {profile.photo ? <img src={profile.photo} className="w-full h-full object-cover" /> : <User size={64} className="text-slate-300 m-auto" />}
            </div>
            <button className="text-sm font-bold text-blue-600">Change Photo</button>
          </div>
          <div className="md:col-span-2 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-xs font-black uppercase opacity-50 mb-1">Name</label>
                <input 
                  type="text" 
                  value={localProfile.name} 
                  onChange={e => setLocalProfile({...localProfile, name: e.target.value})}
                  className="p-3 rounded-xl border-2 border-slate-100 font-bold" 
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-black uppercase opacity-50 mb-1">Age</label>
                <input 
                  type="text" 
                  value={localProfile.age} 
                  onChange={e => setLocalProfile({...localProfile, age: e.target.value})}
                  className="p-3 rounded-xl border-2 border-slate-100 font-bold" 
                />
              </div>
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-black uppercase opacity-50 mb-1">Bio / Notes</label>
              <textarea 
                value={localProfile.bio} 
                onChange={e => setLocalProfile({...localProfile, bio: e.target.value})}
                className="p-3 rounded-xl border-2 border-slate-100 font-bold h-24" 
              />
            </div>
            <button 
              onClick={saveProfile}
              className="tactile-btn bg-emerald-600 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2"
            >
              <Save size={20} /> Save Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaretakerDashboard;
