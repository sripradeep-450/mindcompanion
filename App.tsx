
import React, { useState, useEffect } from 'react';
import { AppState, ThemeType, UserRole } from './types';
import RoutineModule from './components/RoutineModule';
import CognitiveGames from './components/CognitiveGames';
import FamilyDashboard from './components/FamilyDashboard';
import CaretakerDashboard from './components/CaretakerDashboard';
import ChatModule from './components/ChatModule';
import HomePage from './components/HomePage';
import PatientLoginPage from './components/PatientLoginPage';
import CaretakerLoginPage from './components/CaretakerLoginPage';
import { bluetoothService } from './services/bluetoothService';
import { authService, PatientProfile, CaretakerProfile } from './services/authService';
import { User, Brain, Heart, Calendar, MessageSquare, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type AuthState = 'home' | 'patient-login' | 'caretaker-login' | 'authenticated';

const App: React.FC = () => {
  // Auth state
  const [authState, setAuthState] = useState<AuthState>('home');
  const [role, setRole] = useState<UserRole | null>(null);
  const [caretakerProfile, setCaretakerProfile] = useState<CaretakerProfile | null>(null);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);

  // App state
  const [currentTab, setCurrentTab] = useState<AppState>(AppState.ROUTINE);
  const [theme, setTheme] = useState<ThemeType>('default');
  const [time, setTime] = useState(new Date());
  const [isWatchConnected, setIsWatchConnected] = useState(false);
  // Initialize from localStorage
  useEffect(() => {
    const savedRole = localStorage.getItem('mind_user_role');
    const {caretakerId, patientProfile: savedPatient} = {
      caretakerId: localStorage.getItem('mind_caretaker_id'),
      patientProfile: localStorage.getItem('mind_patient_profile')
    };

    if (savedRole === 'patient') {
      setRole('patient');
      if (savedPatient) {
        setPatientProfile(JSON.parse(savedPatient));
      }
      setAuthState('authenticated');
    } else if (savedRole === 'caretaker' && caretakerId) {
      setRole('caretaker');
      setAuthState('authenticated');
    }
  }, []);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSelectRole = (selectedRole: 'patient' | 'caretaker') => {
    if (selectedRole === 'patient') {
      setAuthState('patient-login');
    } else {
      setAuthState('caretaker-login');
    }
  };

  const handlePatientLoginSuccess = (profile: PatientProfile) => {
    setPatientProfile(profile);
    setRole('patient');
    localStorage.setItem('mind_user_role', 'patient');
    localStorage.setItem('mind_patient_profile', JSON.stringify(profile));
    setAuthState('authenticated');
    setCurrentTab(AppState.ROUTINE);
  };

  const handleCaretakerLoginSuccess = (profile: CaretakerProfile) => {
    setCaretakerProfile(profile);
    setRole('caretaker');
    localStorage.setItem('mind_user_role', 'caretaker');
    localStorage.setItem('mind_caretaker_id', profile.uid);
    setAuthState('authenticated');
    setCurrentTab(AppState.CARETAKER);
  };

  const cycleTheme = () => {
    const themes: ThemeType[] = ['default', 'lavender', 'contrast'];
    const next = themes[(themes.indexOf(theme) + 1) % themes.length];
    setTheme(next);
  };

  const handleConnectWatch = async () => {
    const success = await bluetoothService.connect();
    setIsWatchConnected(success);
  };

  const getGreeting = () => {
    const hour = time.getHours();
    const prefix = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
    return patientProfile?.name ? `${prefix}, ${patientProfile.name}!` : `${prefix}!`;
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      setRole(null);
      setCaretakerProfile(null);
      setPatientProfile(null);
      setAuthState('home');
      localStorage.removeItem('mind_user_role');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Authentication pages
  if (authState === 'home') {
    return <HomePage onSelectRole={handleSelectRole} />;
  }

  if (authState === 'patient-login') {
    return (
      <PatientLoginPage
        onBack={() => setAuthState('home')}
        onSuccess={handlePatientLoginSuccess}
      />
    );
  }

  if (authState === 'caretaker-login') {
    return (
      <CaretakerLoginPage
        onBack={() => setAuthState('home')}
        onSuccess={handleCaretakerLoginSuccess}
      />
    );
  }

  // Main authenticated app
  if (authState === 'authenticated' && (role === 'patient' || role === 'caretaker')) {
    return (
      <div className="min-h-screen flex flex-col max-w-5xl mx-auto px-4 py-4 sm:py-8">
        {/* Header */}
        <header className="card mb-6 p-6 sm:p-8 flex flex-col md:flex-row justify-between items-center gap-6 relative">
          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className="absolute top-4 right-4 p-3 rounded-full bg-red-100 hover:bg-red-200 transition-colors border-2 border-red-500 shadow-sm"
            title="Logout"
          >
            <LogOut size={24} className="text-red-600" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center shadow-lg border-2 border-[var(--border-color)]">
              {role === 'patient' && patientProfile?.photo ? (
                <img src={patientProfile.photo} className="w-full h-full object-cover" alt="Profile" />
              ) : caretakerProfile?.photo ? (
                <img src={caretakerProfile.photo} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <User size={32} className="text-slate-400" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-black" style={{ color: 'var(--text-color)' }}>
                {role === 'caretaker' ? 'Caretaker Dashboard' : getGreeting()}
              </h1>
              <p className="text-lg font-bold opacity-70">
                {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end">
            <div className="text-5xl font-black tracking-tighter" style={{ color: 'var(--text-color)' }}>
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="flex gap-2 mt-2">
              <button 
                onClick={cycleTheme}
                className="px-3 py-1 rounded-full border-2 border-[var(--border-color)] bg-white text-xs font-black uppercase"
              >
                Theme
              </button>
              {role === 'patient' && (
                <button 
                  onClick={handleConnectWatch}
                  className={`px-3 py-1 rounded-full border-2 text-xs font-black uppercase transition-all ${
                    isWatchConnected ? 'bg-green-100 border-green-500 text-green-700' : 'bg-slate-100 border-slate-300 text-slate-500'
                  }`}
                >
                  {isWatchConnected ? 'Watch Active' : 'Link Watch'}
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Navigation */}
        {role === 'patient' && (
          <nav className="grid grid-cols-4 gap-4 mb-6">
            {[
              { id: AppState.ROUTINE, label: 'Routine', icon: <Calendar />, color: 'var(--primary-color)' },
              { id: AppState.GAMES, label: 'Games', icon: <Brain />, color: 'var(--secondary-color)' },
              { id: AppState.FAMILY, label: 'Family', icon: <Heart />, color: '#E63946' },
              { id: AppState.CHAT, label: 'Chat', icon: <MessageSquare />, color: '#3B82F6' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`tactile-btn p-4 rounded-[24px] flex flex-col items-center justify-center gap-2 transition-all ${
                  currentTab === item.id 
                    ? 'bg-white text-slate-900 border-[var(--border-color)] scale-105' 
                    : 'bg-[var(--card-bg)] opacity-70 border-transparent text-[var(--text-color)]'
                }`}
              >
                <span style={{ color: currentTab === item.id ? item.color : 'inherit' }}>
                  {React.cloneElement(item.icon as React.ReactElement, { size: 32 })}
                </span>
                <span className="text-xs font-black uppercase tracking-wider">{item.label}</span>
              </button>
            ))}
          </nav>
        )}

        {/* Main Experience */}
        <main className="flex-grow">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {role === 'caretaker' ? (
                <CaretakerDashboard profile={patientProfile || { name: 'Patient', age: '', gender: '', bio: '', photo: null } as any} />
              ) : (
                <>
                  {currentTab === AppState.ROUTINE && patientProfile && <RoutineModule profile={patientProfile} onNavigate={setCurrentTab} />}
                  {currentTab === AppState.GAMES && <CognitiveGames />}
                  {currentTab === AppState.FAMILY && <FamilyDashboard />}
                  {currentTab === AppState.CHAT && patientProfile && <ChatModule profile={patientProfile} />}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Supportive Floating Buddy */}
        {role === 'patient' && patientProfile && (
          <footer className="mt-8">
            <div className="card p-4 flex items-center justify-between gap-4 border-2 border-dashed border-[var(--primary-color)]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[var(--primary-color)] rounded-full flex items-center justify-center text-white shadow-lg">
                  <MessageSquare size={24} />
                </div>
                <p className="text-sm font-bold opacity-80 italic">
                  "I'm here to help you, {patientProfile.name}! Should we chat?"
                </p>
              </div>
              <button 
                onClick={() => setCurrentTab(AppState.CHAT)}
                className="tactile-btn bg-white px-4 py-2 rounded-xl font-black text-xs uppercase"
              >
                Let's Talk
              </button>
            </div>
          </footer>
        )}
      </div>
    );
  }

  return null;
};

export default App;
