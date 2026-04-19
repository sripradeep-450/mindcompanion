
import React, { useState, useEffect } from 'react';
import { AppState, ThemeType, UserProfile, UserRole } from './types';
import RoutineModule from './components/RoutineModule';
import CognitiveGames from './components/CognitiveGames';
import FamilyDashboard from './components/FamilyDashboard';
import CaretakerDashboard from './components/CaretakerDashboard';
import ChatModule from './components/ChatModule';
import CaretakerLogin from './components/CaretakerLogin';
import { bluetoothService } from './services/bluetoothService';
import { User, Shield, Brain, Heart, Calendar, MessageSquare, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<AppState>(AppState.ROUTINE);
  const [role, setRole] = useState<UserRole>('patient');
  const [showLogin, setShowLogin] = useState(false);
  const [theme, setTheme] = useState<ThemeType>('default');
  const [time, setTime] = useState(new Date());
  const [isWatchConnected, setIsWatchConnected] = useState(false);
  
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('mind_user_profile');
    return saved ? JSON.parse(saved) : {
      name: 'Arthur',
      age: '75',
      gender: 'Male',
      photo: null,
      bio: 'Loves gardening and classical music.'
    };
  });

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('mind_user_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
    return userProfile.name ? `${prefix}, ${userProfile.name}!` : `${prefix}!`;
  };

  const toggleRole = () => {
    if (role === 'patient') {
      setShowLogin(true);
    } else {
      setRole('patient');
      setCurrentTab(AppState.ROUTINE);
    }
  };

  const handleLoginSuccess = (success: boolean) => {
    if (success) {
      setRole('caretaker');
      setCurrentTab(AppState.CARETAKER);
      setShowLogin(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col max-w-5xl mx-auto px-4 py-4 sm:py-8">
      {showLogin && <CaretakerLogin onLogin={handleLoginSuccess} onClose={() => setShowLogin(false)} />}
      {/* Header */}
      <header className="card mb-6 p-6 sm:p-8 flex flex-col md:flex-row justify-between items-center gap-6 relative">
        {/* Caretaker Login Icon */}
        <button 
          onClick={toggleRole}
          className="absolute top-4 right-4 p-3 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors border-2 border-slate-900 shadow-sm"
          title={role === 'patient' ? "Caretaker Login" : "Switch to Patient View"}
        >
          {role === 'patient' ? <Shield size={24} className="text-slate-700" /> : <LogOut size={24} className="text-red-600" />}
        </button>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center shadow-lg border-2 border-[var(--border-color)]">
            {userProfile.photo ? (
              <img src={userProfile.photo} className="w-full h-full object-cover" alt="Profile" />
            ) : (
              <User size={32} className="text-slate-400" />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-black" style={{ color: 'var(--text-color)' }}>
              {role === 'caretaker' ? "Caretaker Dashboard" : getGreeting()}
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
            <button 
              onClick={handleConnectWatch}
              className={`px-3 py-1 rounded-full border-2 text-xs font-black uppercase transition-all ${
                isWatchConnected ? 'bg-green-100 border-green-500 text-green-700' : 'bg-slate-100 border-slate-300 text-slate-500'
              }`}
            >
              {isWatchConnected ? 'Watch Active' : 'Link Watch'}
            </button>
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
              <CaretakerDashboard profile={userProfile} />
            ) : (
              <>
                {currentTab === AppState.ROUTINE && <RoutineModule profile={userProfile} onNavigate={setCurrentTab} />}
                {currentTab === AppState.GAMES && <CognitiveGames />}
                {currentTab === AppState.FAMILY && <FamilyDashboard />}
                {currentTab === AppState.CHAT && <ChatModule profile={userProfile} />}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Supportive Floating Buddy */}
      {role === 'patient' && (
        <footer className="mt-8">
          <div className="card p-4 flex items-center justify-between gap-4 border-2 border-dashed border-[var(--primary-color)]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[var(--primary-color)] rounded-full flex items-center justify-center text-white shadow-lg">
                <MessageSquare size={24} />
              </div>
              <p className="text-sm font-bold opacity-80 italic">
                "{userProfile.name ? `I'm here to help you, ${userProfile.name}!` : "I'm monitoring your tasks for you today!"} Should we chat?"
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
};

export default App;
