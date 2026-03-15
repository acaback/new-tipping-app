
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types.ts';
import { db } from '../firebase';
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
import { MessageSquare, Send, Trash2, Shield, User as UserIcon, Clock, Sparkles } from 'lucide-react';

interface BanterMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: Timestamp;
}

interface BanterPageProps {
  user: User;
}

const BanterPage: React.FC<BanterPageProps> = ({ user }) => {
  const [messages, setMessages] = useState<BanterMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'banter'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BanterMessage[];
      setMessages(msgs.reverse());
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await addDoc(collection(db, 'banter'), {
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar || null,
        text: newMessage,
        createdAt: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col space-y-8">
      <div className="flex items-center justify-between shrink-0">
        <div className="space-y-1">
          <h2 className="text-4xl font-heading font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
            The <span className="text-amber-500">Banter</span> Board
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest italic">Family Trash Talk Arena</p>
        </div>
        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-500/10 px-6 py-3 rounded-2xl border border-amber-100 dark:border-amber-500/20">
          <MessageSquare size={18} className="text-amber-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">{messages.length} Messages Broadcasted</span>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-800/50 rounded-[3rem] border-2 border-slate-100 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-[2rem] flex items-center justify-center">
                <Sparkles size={40} className="text-slate-400" />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Silence in the Arena...</p>
              <p className="text-[10px] font-medium text-slate-400 max-w-[200px]">Be the first to start the banter!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${msg.userId === user.id ? 'items-end' : 'items-start'}`}
              >
                <div className={`flex items-center gap-2 mb-2 ${msg.userId === user.id ? 'flex-row-reverse' : ''}`}>
                  <img 
                    src={msg.userAvatar || `https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(msg.userName)}`} 
                    className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 object-cover" 
                    alt="" 
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 italic">{msg.userName}</span>
                  <span className="text-[8px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-tighter">
                    {msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className={`max-w-[80%] p-5 rounded-[2rem] text-sm font-bold leading-relaxed shadow-sm ${
                  msg.userId === user.id 
                    ? 'bg-amber-500 text-white rounded-tr-none' 
                    : 'bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white border border-slate-100 dark:border-white/5 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </motion.div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-white/5">
          <form onSubmit={handleSendMessage} className="relative">
            <input 
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your banter here..."
              className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-white/10 rounded-2xl py-5 pl-8 pr-20 outline-none focus:border-amber-500 transition-all font-bold text-sm text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600"
            />
            <button 
              type="submit"
              disabled={!newMessage.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-amber-200 dark:shadow-amber-900/50 hover:bg-amber-600 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BanterPage;
