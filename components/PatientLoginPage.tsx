import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { authService, PatientProfile } from '../services/authService';

interface Props {
  onBack: () => void;
  onSuccess: (patientProfile: PatientProfile) => void;
}

const PatientLoginPage: React.FC<Props> = ({ onBack, onSuccess }) => {
  const [step, setStep] = useState<'patient-info' | 'caretaker-email'>('patient-info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [patientInfo, setPatientInfo] = useState({
    name: localStorage.getItem('mind_patient_name') || 'Arthur',
    age: localStorage.getItem('mind_patient_age') || '75',
    gender: localStorage.getItem('mind_patient_gender') || 'Male',
    bio: localStorage.getItem('mind_patient_bio') || 'Loves gardening and classical music.'
  });

  const [caretakerEmail, setCaretakerEmail] = useState('');

  const handlePatientInfoSubmit = () => {
    if (!patientInfo.name || !patientInfo.age) {
      setError('Please fill in all fields');
      return;
    }
    localStorage.setItem('mind_patient_name', patientInfo.name);
    localStorage.setItem('mind_patient_age', patientInfo.age);
    localStorage.setItem('mind_patient_gender', patientInfo.gender);
    localStorage.setItem('mind_patient_bio', patientInfo.bio);
    setStep('caretaker-email');
  };

  const handleCaretakerEmailSubmit = async () => {
    if (!caretakerEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Generate device-based patient ID
      const patientId = 'device-patient-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

      console.log('[PatientLogin] Attempting to link patient to caretaker:', { patientId, caretakerEmail });

      // TRY to sync to Firebase, but provide detailed error message if it fails
      try {
        const patientProfile = await authService.linkDevicePatientToCaretaker(
          {
            name: patientInfo.name,
            age: patientInfo.age,
            gender: patientInfo.gender,
            bio: patientInfo.bio,
            caretakerEmail
          },
          caretakerEmail,
          patientId
        );

        console.log('[PatientLogin] SUCCESS: Patient linked to Firebase!', patientProfile);
        localStorage.setItem('mind_patient_profile', JSON.stringify(patientProfile));
        localStorage.setItem('mind_patient_id', patientId);
        localStorage.setItem('mind_caretaker_email', caretakerEmail);
        
        onSuccess(patientProfile);
      } catch (firebaseErr: any) {
        // Firebase link failed - this is critical, don't proceed with local-only
        console.error('[PatientLogin] CRITICAL ERROR - Firebase link failed:', firebaseErr);
        setError(firebaseErr.message || 'Failed to link to caretaker. Make sure your caretaker has already logged in with that email address.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to link caretaker');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 font-bold mb-8 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Home
        </button>

        <div className="bg-white rounded-[40px] border-4 border-slate-900 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-white">
            <h1 className="text-3xl font-black mb-2">Patient Setup</h1>
            <p className="text-green-100 font-bold">
              {step === 'patient-info' ? 'Your Information' : 'Caretaker Email'}
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {step === 'patient-info' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div>
                  <label className="block font-black text-slate-900 mb-2">Your Name</label>
                  <input
                    type="text"
                    value={patientInfo.name}
                    onChange={(e) => setPatientInfo({ ...patientInfo, name: e.target.value })}
                    className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-green-500 outline-none font-bold text-lg"
                    placeholder="Your name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-black text-slate-900 mb-2">Age</label>
                    <input
                      type="number"
                      value={patientInfo.age}
                      onChange={(e) => setPatientInfo({ ...patientInfo, age: e.target.value })}
                      className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-green-500 outline-none font-bold"
                      placeholder="Age"
                    />
                  </div>
                  <div>
                    <label className="block font-black text-slate-900 mb-2">Gender</label>
                    <select
                      value={patientInfo.gender}
                      onChange={(e) => setPatientInfo({ ...patientInfo, gender: e.target.value })}
                      className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-green-500 outline-none font-bold"
                    >
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-black text-slate-900 mb-2">About You</label>
                  <textarea
                    value={patientInfo.bio}
                    onChange={(e) => setPatientInfo({ ...patientInfo, bio: e.target.value })}
                    className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-green-500 outline-none font-bold resize-none"
                    rows={3}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                {error && (
                  <div className="bg-red-100 border-2 border-red-400 p-4 rounded-xl flex items-center gap-2">
                    <AlertCircle className="text-red-600" size={20} />
                    <p className="text-red-700 font-bold">{error}</p>
                  </div>
                )}

                <button
                  onClick={handlePatientInfoSubmit}
                  className="w-full bg-green-500 text-white p-4 rounded-2xl font-black text-lg hover:bg-green-600 transition-colors"
                >
                  Next: Caretaker Email
                </button>
              </motion.div>
            )}

            {step === 'caretaker-email' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="bg-green-50 p-4 rounded-xl border-2 border-green-200">
                  <p className="font-bold text-slate-700">
                    👋 Hi <span className="text-green-600">{patientInfo.name}</span>!
                  </p>
                  <p className="text-sm text-slate-600 mt-2">
                    Enter your caretaker's email below. Your caretaker must have already logged in.
                  </p>
                </div>

                <div>
                  <label className="block font-black text-slate-900 mb-2">
                    <Mail className="inline mr-2" size={18} />
                    Caretaker's Email
                  </label>
                  <input
                    type="email"
                    value={caretakerEmail}
                    onChange={(e) => setCaretakerEmail(e.target.value)}
                    className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-green-500 outline-none font-bold text-lg"
                    placeholder="caretaker@example.com"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    This email will be used to add you as a patient in the caretaker's dashboard
                  </p>
                </div>

                <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-xl">
                  <p className="text-sm font-bold text-amber-900">
                    💡 <strong>Don't worry!</strong> Once you finish, your phone will stay logged in automatically.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-100 border-2 border-red-400 p-4 rounded-xl flex items-center gap-2">
                    <AlertCircle className="text-red-600" size={20} />
                    <p className="text-red-700 font-bold">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleCaretakerEmailSubmit}
                  disabled={loading}
                  className="w-full bg-green-500 text-white p-4 rounded-2xl font-black text-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Setting up...
                    </>
                  ) : (
                    'Complete Setup'
                  )}
                </button>

                <button
                  onClick={() => setStep('patient-info')}
                  className="w-full bg-white text-slate-600 p-4 rounded-2xl font-bold border-2 border-slate-200 hover:border-slate-900 transition-colors"
                >
                  Back
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PatientLoginPage;
