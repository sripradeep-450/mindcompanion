
import React, { useState } from 'react';
import { Shield, Lock, User, ChevronRight, X } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  onLogin: (success: boolean) => void;
  onClose: () => void;
}

const CaretakerLogin: React.FC<Props> = ({ onLogin, onClose }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Unique username/password as requested
    if (username === 'admin' && password === 'care123') {
      onLogin(true);
    } else {
      setError('Invalid username or password. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-md rounded-[40px] border-8 border-slate-900 shadow-2xl overflow-hidden"
      >
        <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Shield className="text-blue-400" size={32} />
            <h2 className="text-2xl font-black uppercase tracking-tight">Caretaker Access</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="Username" 
                className="w-full pl-12 pr-4 py-4 rounded-2xl border-4 border-slate-100 focus:border-blue-500 outline-none font-bold text-lg transition-all"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="password" 
                placeholder="Password" 
                className="w-full pl-12 pr-4 py-4 rounded-2xl border-4 border-slate-100 focus:border-blue-500 outline-none font-bold text-lg transition-all"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500 font-bold text-sm text-center animate-shake">{error}</p>
          )}

          <button 
            type="submit"
            className="tactile-btn w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-2"
          >
            Login to Dashboard <ChevronRight size={24} />
          </button>

          <p className="text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
            Authorized Personnel Only
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default CaretakerLogin;
