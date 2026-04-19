import React from 'react';
import { motion } from 'motion/react';
import { Users, Shield, Heart, Smile } from 'lucide-react';

interface Props {
  onSelectRole: (role: 'patient' | 'caretaker') => void;
}

const HomePage: React.FC<Props> = ({ onSelectRole }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <Heart size={40} className="text-white" />
            </div>
          </motion.div>
          <h1 className="text-5xl font-black text-slate-900 mb-4">MindCompanion</h1>
          <p className="text-2xl text-slate-600 font-bold">Dementia Care Assistant</p>
          <p className="text-slate-500 mt-2 text-lg">Supporting memory, connection, and daily care</p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Patient Card */}
          <motion.button
            onClick={() => onSelectRole('patient')}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group p-8 bg-white rounded-[40px] border-4 border-slate-200 shadow-xl hover:shadow-2xl transition-all cursor-pointer"
          >
            <div className="flex flex-col items-center gap-6">
              <motion.div
                whileHover={{ rotate: 10 }}
                className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center group-hover:shadow-xl transition-all"
              >
                <Smile size={48} className="text-emerald-600" />
              </motion.div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 mb-2">I'm the Patient</h2>
                <p className="text-slate-600 font-bold">
                  Access your routines, games, and family memories
                </p>
              </div>
              <div className="w-full pt-6 border-t-2 border-slate-100">
                <p className="text-sm text-slate-500 font-bold">
                  ✓ No login needed <br/>
                  ✓ Safe and easy to use
                </p>
              </div>
            </div>
          </motion.button>

          {/* Caretaker Card */}
          <motion.button
            onClick={() => onSelectRole('caretaker')}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group p-8 bg-white rounded-[40px] border-4 border-slate-200 shadow-xl hover:shadow-2xl transition-all cursor-pointer"
          >
            <div className="flex flex-col items-center gap-6">
              <motion.div
                whileHover={{ rotate: -10 }}
                className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center group-hover:shadow-xl transition-all"
              >
                <Shield size={48} className="text-blue-600" />
              </motion.div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 mb-2">I'm the Caretaker</h2>
                <p className="text-slate-600 font-bold">
                  Manage routines, track progress, and support your loved one
                </p>
              </div>
              <div className="w-full pt-6 border-t-2 border-slate-100">
                <p className="text-sm text-slate-500 font-bold">
                  ✓ Secure Google login <br/>
                  ✓ Full management control
                </p>
              </div>
            </div>
          </motion.button>
        </div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-[30px] border-2 border-slate-100 p-8 shadow-lg"
        >
          <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
            <Users className="text-purple-600" size={28} />
            How It Works
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-2xl font-black text-purple-600 mb-2">1</div>
              <h4 className="font-black text-slate-900 mb-2">Patient Links</h4>
              <p className="text-slate-600 font-bold text-sm">
                Patient enters caretaker's email to link their account
              </p>
            </div>
            <div>
              <div className="text-2xl font-black text-purple-600 mb-2">2</div>
              <h4 className="font-black text-slate-900 mb-2">Stays Logged In</h4>
              <p className="text-slate-600 font-bold text-sm">
                Patient device stays logged in automatically
              </p>
            </div>
            <div>
              <div className="text-2xl font-black text-purple-600 mb-2">3</div>
              <h4 className="font-black text-slate-900 mb-2">Caretaker Controls</h4>
              <p className="text-slate-600 font-bold text-sm">
                Caretaker manages routines and receives notifications
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default HomePage;
