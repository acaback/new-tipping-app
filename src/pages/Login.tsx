
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User } from '../types.ts';
import { Lock, User as UserIcon, LogIn, ShieldCheck, Zap } from 'lucide-react';

interface LoginPageProps {
  users: User[];
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ users, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const user = users.find(u => u.username && u.username.toLowerCase() === username.toLowerCase());
    
    if (user && user.password === password) {
      onLogin(user);
    } else {
      setError('Invalid username or password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.05),transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(147,51,234,0.05),transparent_50%)]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 shadow-2xl border-2 border-slate-100 dark:border-white/10">
          <div className="text-center space-y-4 mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-blue-600 text-white shadow-2xl shadow-blue-200 dark:shadow-blue-900/50 mb-4">
              <Zap size={40} className="fill-current" />
            </div>
            <h1 className="text-4xl font-heading font-black uppercase italic tracking-tighter text-slate-900 dark:text-white">
              The War Room
            </h1>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] italic">
              AFL Tipping Competition
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Username</label>
              <div className="relative">
                <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-900 dark:text-white"
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-900 dark:text-white"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl text-xs font-bold text-rose-600 dark:text-rose-400 text-center"
              >
                {error}
              </motion.div>
            )}

            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-200 dark:shadow-blue-900/50 transition-all flex items-center justify-center gap-3 group"
            >
              Enter Competition
              <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-50 dark:border-white/5 text-center">
            <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              <ShieldCheck size={14} />
              Secure Access Only
            </div>
          </div>
        </div>
        
        <p className="mt-8 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest opacity-50">
          © 2026 Family Tipping Comp • Built for the Bold
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
