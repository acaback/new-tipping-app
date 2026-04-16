
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, Target, ShieldCheck, AlertCircle, Info, Zap, Award } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border-2 border-slate-100 dark:border-white/10 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-slate-950 p-8 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-900/50 rotate-6">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h2 className="text-3xl font-heading font-black uppercase italic tracking-tighter leading-none">Competition <span className="text-blue-500">Rules</span></h2>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2 italic">Official Protocol v2026.1</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 md:p-12 overflow-y-auto max-h-[70vh] space-y-10 custom-scrollbar">
              
              {/* Points Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                    <Trophy size={18} />
                  </div>
                  <h3 className="text-lg font-black uppercase italic tracking-tight text-slate-900 dark:text-white">Scoring System</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Standard Points</p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed">
                      You receive <span className="text-emerald-600 font-black">1 point</span> for every correct tip. Incorrect tips result in <span className="text-rose-600 font-black">0 points</span>.
                    </p>
                  </div>
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Default Tips</p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed">
                      If you fail to enter a tip before a game locks, the system automatically assigns you the <span className="text-blue-600 font-black">Away Team</span>.
                    </p>
                  </div>
                </div>
              </section>

              {/* Margin Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                    <Target size={18} />
                  </div>
                  <h3 className="text-lg font-black uppercase italic tracking-tight text-slate-900 dark:text-white">The Margin Tie-Breaker</h3>
                </div>
                <div className="p-8 bg-blue-50/50 dark:bg-blue-500/5 rounded-[2rem] border-2 border-blue-100 dark:border-blue-500/10 space-y-4">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed italic">
                    The <span className="text-blue-600 font-black">first game of every round</span> is designated as the Margin Game. You must predict the winning margin for this specific match.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">
                        <span className="text-slate-900 dark:text-white">Margin Error:</span> The absolute difference between your predicted margin and the actual final margin.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">
                        <span className="text-slate-900 dark:text-white">Ladder Ranking:</span> If two or more players have the same total points, the player with the <span className="text-blue-600 font-black">lowest cumulative margin error</span> is ranked higher.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Admin Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                    <Zap size={18} />
                  </div>
                  <h3 className="text-lg font-black uppercase italic tracking-tight text-slate-900 dark:text-white">Admin Overrides</h3>
                </div>
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 space-y-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle size={16} className="text-amber-500" />
                    <p className="text-xs font-black uppercase tracking-widest text-amber-700 dark:text-amber-400 italic">Command Authority</p>
                  </div>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                    <li className="flex items-center gap-2 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight italic">
                      <div className="w-1 h-1 rounded-full bg-slate-400" /> Manual game locking/unlocking
                    </li>
                    <li className="flex items-center gap-2 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight italic">
                      <div className="w-1 h-1 rounded-full bg-slate-400" /> Score and result verification
                    </li>
                    <li className="flex items-center gap-2 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight italic">
                      <div className="w-1 h-1 rounded-full bg-slate-400" /> User profile management
                    </li>
                    <li className="flex items-center gap-2 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight italic">
                      <div className="w-1 h-1 rounded-full bg-slate-400" /> Tip adjustments for technical issues
                    </li>
                  </ul>
                </div>
              </section>

              {/* Footer Note */}
              <div className="pt-6 border-t border-slate-100 dark:border-white/5 flex items-center gap-3">
                <Info size={16} className="text-blue-500" />
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] italic">
                  Rules are subject to change at the discretion of the League Commissioner. Good luck!
                </p>
              </div>
            </div>
            
            {/* Action */}
            <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-white/10 flex justify-end">
              <button 
                onClick={onClose}
                className="px-10 py-4 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-heading font-black text-xs uppercase italic tracking-widest hover:bg-slate-800 dark:hover:bg-blue-700 transition-all shadow-xl"
              >
                Understood, Commander
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RulesModal;
