import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Mail, Loader2, AlertCircle, Check } from 'lucide-react';
import { authService, CaretakerProfile } from '../services/authService';

interface Props {
  onBack: () => void;
  onSuccess: (caretakerProfile: CaretakerProfile) => void;
}

const CaretakerLoginPage: React.FC<Props> = ({ onBack, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      const user = await authService.signInWithGoogle();
      
      if (!user) {
        throw new Error('Failed to sign in');
      }

      // Register/update caretaker profile
      const caretakerProfile = await authService.registerCaretaker(user);
      
      // Store in local storage for session
      localStorage.setItem('mind_caretaker_id', caretakerProfile.uid);
      localStorage.setItem('mind_caretaker_email', caretakerProfile.email);
      localStorage.setItem('mind_user_role', 'caretaker');
      
      setSuccess(true);
      
      // Small delay to show success message
      setTimeout(() => {
        onSuccess(caretakerProfile);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
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
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-8 text-white">
            <h1 className="text-3xl font-black mb-2">Caretaker Login</h1>
            <p className="text-blue-100 font-bold">
              Sign in to manage patient care
            </p>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            {/* Success State */}
            {success && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-green-50 border-2 border-green-400 p-6 rounded-2xl text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Check size={32} className="text-white" />
                </motion.div>
                <p className="font-black text-green-700 text-lg">
                  Welcome Caretaker!
                </p>
                <p className="text-green-600 font-bold text-sm mt-2">
                  Loading your dashboard...
                </p>
              </motion.div>
            )}

            {!success && (
              <>
                <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                  <p className="font-bold text-slate-700">
                    About Caretaker Account
                  </p>
                  <ul className="text-sm text-slate-600 mt-3 space-y-2">
                    <li>✓ Use your Google account for login</li>
                    <li>✓ Add patients by their email</li>
                    <li>✓ Manage routines and receive alerts</li>
                    <li>✓ Stay updated on patient progress</li>
                  </ul>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-100 border-2 border-red-400 p-4 rounded-xl flex items-center gap-2"
                  >
                    <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                    <p className="text-red-700 font-bold text-sm">{error}</p>
                  </motion.div>
                )}

                {/* Google Sign In Button */}
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full bg-white border-2 border-slate-200 text-slate-900 p-4 rounded-2xl font-black text-lg hover:border-slate-900 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Sign in with Google
                    </>
                  )}
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t-2 border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-slate-500 font-bold">OR</span>
                  </div>
                </div>

                <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-xl">
                  <p className="text-sm font-bold text-amber-900">
                    💡 First time? 
                  </p>
                  <p className="text-sm text-amber-800 mt-2">
                    Just click "Sign in with Google" and we'll create your account automatically. No additional registration needed!
                  </p>
                </div>

                {/* Security Note */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-600 font-bold">
                    🔒 <strong>Security:</strong> We use Google's secure authentication. Your password is never stored.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-slate-600 font-bold mt-8 text-sm"
        >
          🛡️ Your patient data is secure and encrypted
        </motion.p>
      </motion.div>
    </div>
  );
};

export default CaretakerLoginPage;
