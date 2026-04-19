
import React, { useState, useRef, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { UserProfile } from '../types';
import { MessageSquare, Mic, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  profile: UserProfile;
}

const ChatModule: React.FC<Props> = ({ profile }) => {
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const response = await geminiService.chat(userMsg, profile);
      setMessages(prev => [...prev, { role: 'ai', text: response }]);
      geminiService.speak(response);
    } catch (error) {
      console.error(error);
      const errMsg = "I'm sorry, I'm having a little trouble hearing you. Can you say that again?";
      setMessages(prev => [...prev, { role: 'ai', text: errMsg }]);
      geminiService.speak(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.start();
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        geminiService.speak("I heard you say: " + transcript);
      };
    } else {
      alert("Voice input is not supported in this browser.");
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4 max-h-[70vh]">
      <div 
        ref={scrollRef}
        className="flex-grow overflow-y-auto space-y-4 p-6 bg-white/50 rounded-[40px] border-4 border-slate-100 shadow-inner no-scrollbar"
      >
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-center p-10 opacity-60"
            >
              <MessageSquare size={64} className="text-blue-200 mb-6" />
              <p className="text-2xl font-bold">Hello {profile.name || 'there'}! <br/> Want to talk about your day?</p>
            </motion.div>
          )}
          {messages.map((msg, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] p-6 rounded-[30px] shadow-sm border-2 ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white border-blue-700' 
                  : 'bg-white text-slate-900 border-slate-200'
              }`}>
                <p className="text-xl font-bold">{msg.text}</p>
              </div>
            </motion.div>
          ))}
          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white p-6 rounded-[30px] border-2 border-slate-200">
                <Loader2 className="animate-spin text-blue-600" size={24} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex gap-4 p-2">
        <button 
          onClick={startVoiceInput}
          className="tactile-btn w-20 h-20 rounded-[28px] bg-rose-500 text-white flex items-center justify-center"
        >
          <Mic size={32} />
        </button>
        <div className="flex-grow relative">
          <input 
            type="text"
            placeholder="Type a message..."
            className="w-full h-20 px-8 rounded-[28px] border-4 border-slate-900 text-xl font-bold focus:outline-none pr-24"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="absolute right-4 top-1/2 -translate-y-1/2 tactile-btn h-12 px-6 rounded-xl bg-blue-600 text-white text-sm font-black uppercase"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatModule;
