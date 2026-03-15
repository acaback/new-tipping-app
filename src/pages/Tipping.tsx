
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Game, User, Tip, GameSettings } from '../types.ts';
import { isGameLocked, getTeamLogoUrl, getTeamColors, cleanTeamName, isLocalMode, formatAFLDate } from '../utils.ts';
import { Lock, Unlock, CheckCircle, Trophy, HelpCircle, Star, Users, AlertCircle, Send, Save, Info, Clock, Palette, Activity, PlayCircle, ChevronRight, ChevronLeft, Plus, Minus, Dices, Sparkles, Printer, ShieldCheck } from 'lucide-react';

interface TippingPageProps {
  user: User;
  users: User[];
  onUpdateUsers: (users: User[]) => void;
  games: Game[];
  year: number;
  gameSettings: GameSettings;
}

const MarginSelector: React.FC<{ 
  value: number | null, 
  onChange: (val: number) => void, 
  disabled?: boolean 
}> = ({ value, onChange, disabled }) => {
  const margin = value ?? 0;

  const adjust = (amount: number) => {
    if (disabled) return;
    onChange(Math.max(0, margin + amount));
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4">
        <div className="flex flex-col gap-2">
          <button 
            onClick={() => adjust(-10)} 
            disabled={disabled}
            className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl text-[10px] font-black text-slate-600 dark:text-slate-300 transition-all disabled:opacity-50"
          >
            -10
          </button>
          <button 
            onClick={() => adjust(-1)} 
            disabled={disabled}
            className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl text-slate-600 dark:text-slate-300 transition-all disabled:opacity-50"
          >
            <Minus size={14} />
          </button>
        </div>

        <div className="relative group">
          <div className="absolute -inset-2 bg-purple-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative w-24 h-24 bg-white dark:bg-slate-800 border-4 border-purple-100 dark:border-purple-500/20 rounded-[2rem] flex flex-col items-center justify-center shadow-xl shadow-purple-100/50 dark:shadow-purple-900/50">
            <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-1">Margin</span>
            <input 
              type="number"
              value={margin}
              onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
              disabled={disabled}
              className="w-full bg-transparent text-center text-3xl font-heading font-black text-purple-900 dark:text-white outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button 
            onClick={() => adjust(10)} 
            disabled={disabled}
            className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl text-[10px] font-black text-slate-600 dark:text-slate-300 transition-all disabled:opacity-50"
          >
            +10
          </button>
          <button 
            onClick={() => adjust(1)} 
            disabled={disabled}
            className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl text-slate-600 dark:text-slate-300 transition-all disabled:opacity-50"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
      
      <div className="w-48 px-4">
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={margin} 
          onChange={(e) => onChange(parseInt(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600 disabled:opacity-50"
        />
        <div className="flex justify-between mt-2">
          <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase">0</span>
          <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase">50</span>
          <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase">100+</span>
        </div>
      </div>
    </div>
  );
};

const TippingPage: React.FC<TippingPageProps> = ({ user, users, onUpdateUsers, games, year, gameSettings }) => {
  const rounds = useMemo(() => Array.from(new Set(games.map(g => g.round))).sort((a: number, b: number) => a - b), [games]);
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [draftTips, setDraftTips] = useState<Record<number, Tip[]>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeButton = scrollContainerRef.current.querySelector(`[data-round="${selectedRound}"]`);
      if (activeButton) {
        activeButton.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [selectedRound]);

  useEffect(() => {
    const activeRound = games.find(g => g.complete < 100)?.round || rounds[0] || 1;
    if (!rounds.includes(selectedRound)) {
      setSelectedRound(activeRound);
    }
  }, [rounds, games]);

  useEffect(() => {
    // Load draft from localStorage if it exists
    const savedDraft = localStorage.getItem(`tipping_draft_${user.id}_${year}`);
    if (savedDraft) {
      try {
        setDraftTips(JSON.parse(savedDraft));
      } catch (e) {
        setDraftTips(user.tips[year] || {});
      }
    } else {
      setDraftTips(user.tips[year] || {});
    }
  }, [user.id, year]);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (Object.keys(draftTips).length > 0) {
      localStorage.setItem(`tipping_draft_${user.id}_${year}`, JSON.stringify(draftTips));
    }
  }, [draftTips, user.id, year]);

  const roundGames = useMemo(() => {
    return games
      .filter(g => g.round === selectedRound)
      .sort((a: Game, b: Game) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [games, selectedRound]);

  const hasChanges = useMemo(() => {
    const savedTips = user.tips[year] || {};
    const rounds = Object.keys({ ...savedTips, ...draftTips }).map(Number);
    
    return rounds.some(r => {
      const dTips = draftTips[r] || [];
      const sTips = savedTips[r] || [];
      if (dTips.length !== sTips.length) return true;
      return dTips.some(dt => {
        const saved = sTips.find(st => st.gameId === dt.gameId);
        return !saved || saved.winner !== dt.winner || saved.margin !== dt.margin;
      });
    });
  }, [draftTips, user, year]);

  const handleTipClick = (gameId: number, team: string) => {
    const game = games.find(g => g.id === gameId);
    if (!game || isGameLocked(game, user, gameSettings)) return;

    setDraftTips(current => {
      const currentTips = [...(current[selectedRound] || [])];
      const tipIndex = currentTips.findIndex(t => t.gameId === gameId);
      
      if (tipIndex > -1) {
        const newTips = [...currentTips];
        const existingTip = newTips[tipIndex];
        const isDeselecting = existingTip.winner === team;

        newTips[tipIndex] = {
          ...existingTip,
          winner: isDeselecting ? null : team,
        };
        return { ...current, [selectedRound]: newTips };
      } else {
        const newTip: Tip = { gameId, winner: team, margin: null };
        return { ...current, [selectedRound]: [...currentTips, newTip] };
      }
    });
  };

  const handleRandomize = () => {
    setDraftTips(current => {
      const newTips = [...(current[selectedRound] || [])];
      roundGames.forEach(game => {
        if (!isGameLocked(game, user, gameSettings)) {
          const tipIndex = newTips.findIndex(t => t.gameId === game.id);
          const winner = Math.random() > 0.5 ? game.hteam : game.ateam;
          const margin = game.id === roundGames[0].id ? Math.floor(Math.random() * 40) + 10 : null;

          if (tipIndex > -1) {
            newTips[tipIndex] = { ...newTips[tipIndex], winner, margin: margin ?? newTips[tipIndex].margin };
          } else {
            newTips.push({ gameId: game.id, winner, margin });
          }
        }
      });
      return { ...current, [selectedRound]: newTips };
    });
  };

  const handleMarginChange = (gameId: number, margin: number) => {
    setDraftTips(current => {
      const currentTips = [...(current[selectedRound] || [])];
      const tipIndex = currentTips.findIndex(t => t.gameId === gameId);

      if (tipIndex > -1) {
        const newTips = [...currentTips];
        newTips[tipIndex] = {
          ...newTips[tipIndex],
          margin,
        };
        return { ...current, [selectedRound]: newTips };
      } else {
        const newTip: Tip = { gameId, winner: null, margin };
        return { ...current, [selectedRound]: [...currentTips, newTip] };
      }
    });
  };

  const handleFinalSubmit = () => {
    const newUsers = users.map(u => {
      if (u.id === user.id) {
        return { ...u, tips: { ...u.tips, [year]: draftTips } };
      }
      return u;
    });
    onUpdateUsers(newUsers);
    localStorage.removeItem(`tipping_draft_${user.id}_${year}`);
    setShowConfirmModal(false);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  const familyPicks = useMemo(() => {
    const picks: Record<number, { teams: Record<string, User[]>, total: number }> = {};
    roundGames.forEach(game => {
      picks[game.id] = { teams: { [game.hteam]: [], [game.ateam]: [] }, total: 0 };
      users.forEach(u => {
        // For the current user, use draftTips if available, otherwise saved tips
        let uTip;
        if (u.id === user.id) {
          uTip = (draftTips[selectedRound] || []).find(t => t.gameId === game.id);
        } else {
          uTip = (u.tips[year]?.[selectedRound] || []).find(t => t.gameId === game.id);
        }

        if (uTip?.winner) {
          const teamPicks = picks[game.id].teams[uTip.winner];
          if (teamPicks) {
            teamPicks.push(u);
            picks[game.id].total++;
          }
        } else if (isGameLocked(game, u, gameSettings)) {
          // Automatic Away Team Fallback for locked games with no tip
          const teamPicks = picks[game.id].teams[game.ateam];
          if (teamPicks) {
            teamPicks.push(u);
            picks[game.id].total++;
          }
        }
      });
    });
    return picks;
  }, [users, roundGames, selectedRound, year, user.id, draftTips]);

  const roundProgress = useMemo(() => {
    return users.map(u => {
      const uTips = u.tips[year]?.[selectedRound] || [];
      const completed = uTips.filter(t => t.winner !== null).length;
      return { id: u.id, name: u.name, completed, total: roundGames.length };
    });
  }, [users, roundGames, selectedRound, year]);

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-48">
      {/* Sticky Submit Button */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[60] w-full max-w-md px-6 print-hidden"
          >
            <button
              onClick={() => setShowConfirmModal(true)}
              className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] shadow-[0_30px_60px_rgba(0,0,0,0.4)] dark:shadow-[0_30px_60px_rgba(255,255,255,0.1)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 border-4 border-purple-500"
            >
              <Sparkles size={20} className="text-purple-400" />
              Submit All Tips
              <div className="bg-purple-500 text-white text-[10px] px-2 py-0.5 rounded-full">Pending</div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saved Toast */}
      <AnimatePresence>
        {showSavedToast && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[70] print-hidden"
          >
            <div className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl flex items-center gap-3">
              <CheckCircle size={18} />
              Tips Successfully Broadcasted
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 dark:bg-slate-950/90 backdrop-blur-xl">
          <div className="bg-white dark:bg-slate-800 rounded-[3rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border-[6px] border-purple-500">
            <div className="p-10 text-center space-y-8">
              <div className="mx-auto w-24 h-24 bg-purple-50 dark:bg-purple-500/10 text-purple-600 rounded-[2rem] flex items-center justify-center shadow-inner">
                <Send size={40} className="animate-bounce" />
              </div>
              <div>
                <h3 className="text-3xl font-heading font-black text-slate-900 dark:text-white uppercase italic leading-tight">Submit Tips?</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 font-medium px-4">Locked tips can be edited until match kickoff. Ready to broadcast?</p>
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={handleFinalSubmit} className="w-full bg-purple-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-purple-200 dark:shadow-purple-900/50 hover:bg-purple-700 transition-all">Publish Picks</button>
                <button onClick={() => setShowConfirmModal(false)} className="w-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-600 transition-all">Wait, not yet</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 print-hidden">
        <div className="space-y-2">
          <h2 className="text-5xl font-heading font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
            Season <span className="text-purple-600">Tipping</span>
          </h2>
          <div className="flex items-center gap-3">
            <span className="bg-slate-950 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full">
              {selectedRound === 0 ? 'Opening Round' : `Round ${selectedRound}`}
            </span>
            <span className="text-slate-400 dark:text-slate-500 font-black uppercase text-[10px] tracking-[0.4em] italic">{year} SEASON</span>
            <button 
              onClick={handleRandomize}
              className="flex items-center gap-2 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-white/10 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:border-purple-400 transition-all"
            >
              <Dices size={14} className="text-purple-600" />
              Randomize
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-4 min-w-[300px] bg-white dark:bg-slate-800/50 p-6 rounded-[2.5rem] border-2 border-slate-100 dark:border-white/10 shadow-xl shadow-slate-200/50 dark:shadow-none">
                <div className="flex items-center justify-between mb-1 px-2">
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    {rounds[0] === 0 ? 'Opening' : `Round ${rounds[0]}`}
                  </span>
                  <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest italic">Quick Navigation</span>
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Round {rounds[rounds.length - 1]}</span>
                </div>
          <div className="flex items-center gap-4 px-2">
            <button 
              onClick={() => {
                window.focus();
                window.print();
              }} 
              className="p-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl text-slate-600 dark:text-slate-300 transition-all z-50"
              title="Print Round"
            >
              <Printer size={16} />
            </button>
            <input 
              type="range" 
              min={rounds[0] || 1} 
              max={rounds[rounds.length - 1] || 1} 
              value={selectedRound} 
              onChange={(e) => setSelectedRound(parseInt(e.target.value))}
              className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600 hover:accent-purple-700 transition-all"
            />
          </div>
          <div ref={scrollContainerRef} className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
            {rounds.map(r => (
              <button
                key={r}
                data-round={r}
                onClick={() => setSelectedRound(r)}
                className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-[10px] font-heading font-black transition-all snap-center ${selectedRound === r ? 'bg-purple-600 text-white shadow-lg shadow-purple-200 dark:shadow-purple-900/50 -rotate-3 scale-105' : 'bg-slate-50 dark:bg-slate-700 text-slate-400 dark:text-slate-300 border border-slate-100 dark:border-white/10 hover:border-purple-300 dark:hover:border-purple-500'}`}
              >
                {r === 0 ? 'OR' : r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Roster Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 bg-white dark:bg-slate-800/50 border-[3px] border-slate-100 dark:border-white/10 rounded-[3rem] p-10 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500" />
          <div className="flex items-center gap-3 mb-10">
            <Users size={24} className="text-purple-600" />
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white italic">Family Participation</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {roundProgress.map(p => (
              <div key={p.id} className={`p-4 rounded-[2rem] border-2 transition-all ${p.id === user.id ? 'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20 ring-4 ring-purple-50 dark:ring-purple-500/10' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-white/10'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <img src={`https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(p.name)}`} className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 shadow-sm" alt={p.name} />
                  <span className="text-[10px] font-black uppercase tracking-tight truncate text-slate-900 dark:text-white">{p.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mr-3">
                    <div className={`h-full bg-purple-500 transition-all duration-1000`} style={{ width: `${(p.completed / p.total) * 100}%` }} />
                  </div>
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400">{p.completed}/{p.total}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-500/20 rounded-[3rem] p-8 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity rotate-12">
            <ShieldCheck size={120} />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-lg">
                <Info size={20} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-amber-900 dark:text-amber-200 italic">League Rule #1</h3>
            </div>
            <p className="text-xs font-bold text-amber-800 dark:text-amber-300 leading-relaxed uppercase tracking-tight">
              Forgot to tip? Don't stress! <br />
              <span className="text-amber-600 dark:text-amber-400">Away Teams</span> are automatically awarded to players who miss a kickoff.
            </p>
            <div className="pt-2">
              <span className="inline-block px-3 py-1 bg-amber-200 dark:bg-amber-500/30 rounded-lg text-[9px] font-black text-amber-900 dark:text-amber-100 uppercase tracking-widest">Automatic Fallback Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Games List */}
      <div className="space-y-10 printable-area">
        {roundGames.map((game, idx) => {
          const locked = isGameLocked(game, user, gameSettings);
          let currentTip = (draftTips[selectedRound] || []).find(t => t.gameId === game.id);
          
          // Fallback to Away Team if locked and no tip
          const effectiveWinner = currentTip?.winner || (locked ? game.ateam : null);
          const isFallback = locked && !currentTip?.winner;

          const gameFinished = game.complete === 100;
          const isWinner = gameFinished && effectiveWinner === game.winner;
          const hUsers = familyPicks[game.id].teams[game.hteam] || [];
          const aUsers = familyPicks[game.id].teams[game.ateam] || [];
          const hPercent = familyPicks[game.id].total > 0 ? Math.round((hUsers.length / familyPicks[game.id].total) * 100) : 50;
          const aPercent = 100 - hPercent;

          return (
            <div key={game.id} className={`group bg-white dark:bg-slate-800/50 rounded-[2.5rem] border-[3px] overflow-hidden transition-all duration-500 ${isWinner ? 'border-emerald-500 shadow-2xl ring-[12px] ring-emerald-50 dark:ring-emerald-500/10 scale-[1.02]' : 'border-slate-100 dark:border-white/10 hover:border-purple-400 dark:hover:border-purple-500'}`}>
              {/* Card Header */}
              <div className="px-12 pt-10 pb-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${locked ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-300' : 'bg-purple-600 text-white animate-pulse'}`}>
                    {locked ? <Lock size={12} /> : <Unlock size={12} />}
                    {locked ? 'Closed' : 'Open'}
                  </div>
                  {gameFinished && <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-full">Final Score</span>}
                  {isFallback && <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-full flex items-center gap-1"><Clock size={10} /> Auto Away</span>}
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-300 dark:text-slate-500 uppercase tracking-[0.4em]">{game.venue}</p>
                </div>
              </div>

              {/* Countdown / Time */}
              {!locked && (
                <div className="text-center mb-6">
                   <div className="inline-block px-8 py-3 bg-slate-900 dark:bg-slate-950 rounded-2xl shadow-xl">
                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.5em] mb-1">Match Start (AWST)</p>
                    <p className="text-xl font-heading font-black text-white italic">
                      {formatAFLDate(game.date, { weekday: 'short', day: 'numeric', month: 'short' })} @ {formatAFLDate(game.date, { hour: '2-digit', minute: '2-digit' })}
                    </p>
                   </div>
                </div>
              )}

              {/* Battle Grid */}
              <div className="px-12 py-12 grid grid-cols-1 md:grid-cols-7 items-center gap-8">
                <div className="md:col-span-3">
                  <MatchTeam 
                    name={game.hteam} 
                    score={game.hscore} 
                    isSelected={effectiveWinner === game.hteam} 
                    isWinner={gameFinished && game.winner === game.hteam}
                    percent={hPercent}
                    tippedUsers={hUsers}
                    currentUser={user}
                    align="left"
                    disabled={locked}
                    onClick={() => handleTipClick(game.id, game.hteam)}
                  />
                </div>
                <div className="md:col-span-1 flex flex-col items-center z-20">
                    <span className="text-5xl font-heading font-black text-slate-100 dark:text-slate-700 italic select-none group-hover:scale-125 transition-transform">VS</span>
                  {idx === 0 && (
                    <div className="mt-8 flex flex-col items-center gap-6 animate-in slide-in-from-top-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                        <label className="text-[10px] font-black text-purple-600 uppercase tracking-[0.2em] italic">Tiebreaker Margin</label>
                      </div>
                      <MarginSelector 
                        value={currentTip?.margin ?? null}
                        onChange={(val) => handleMarginChange(game.id, val)}
                        disabled={locked}
                      />
                    </div>
                  )}
                </div>
                <div className="md:col-span-3">
                  <MatchTeam 
                    name={game.ateam} 
                    score={game.ascore} 
                    isSelected={effectiveWinner === game.ateam} 
                    isWinner={gameFinished && game.winner === game.ateam}
                    percent={aPercent}
                    tippedUsers={aUsers}
                    currentUser={user}
                    align="right"
                    disabled={locked}
                    isFallback={isFallback}
                    onClick={() => handleTipClick(game.id, game.ateam)}
                  />
                </div>
              </div>

              {/* Status Footer */}
              {gameFinished && (
                <div className={`px-12 py-6 border-t-2 border-slate-50 dark:border-white/5 flex items-center justify-between ${isWinner ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-rose-50 dark:bg-rose-500/10'}`}>
                   <div className="flex items-center gap-2">
                     {isWinner ? (
                       <><div className="bg-emerald-500 text-white p-2 rounded-xl"><CheckCircle size={16} /></div> <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase italic">Victory point added</span></>
                     ) : (
                       <><div className="bg-rose-500 text-white p-2 rounded-xl"><AlertCircle size={16} /></div> <span className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase italic">Tip inaccurate</span></>
                     )}
                   </div>
                   {idx === 0 && currentTip && typeof currentTip.margin === 'number' && (
                     <div className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">
                        Error: <span className="text-slate-900 dark:text-white">{Math.abs((currentTip.margin || 0) - Math.abs((game.hscore || 0) - (game.ascore || 0)))} pts</span>
                     </div>
                   )}
                </div>
              )}
            </div>
          );
        })}

        {/* Action Footer */}
        <div className="bg-slate-950 dark:bg-slate-900 rounded-[4rem] p-16 shadow-2xl relative overflow-hidden text-center md:text-left print-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-purple-600/10 blur-[100px]" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div>
              <h3 className="text-4xl font-heading font-black text-white italic uppercase mb-2">Deploy Tactics?</h3>
              <p className="text-purple-300 font-bold text-sm uppercase tracking-widest opacity-80">{hasChanges ? "Your round tips are pending broadcast." : "Round data is fully synchronized."}</p>
            </div>
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={!hasChanges}
              className={`px-16 py-6 rounded-[2rem] font-black text-sm uppercase tracking-[0.4em] transition-all italic ${hasChanges ? 'bg-white text-slate-950 shadow-2xl hover:scale-105 active:scale-95' : 'bg-white/5 text-white/20'}`}
            >
              {hasChanges ? "Submit Tips" : "Tips Synced"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MatchTeam: React.FC<{ 
  name: string, 
  score: number | null, 
  isSelected: boolean, 
  isWinner: boolean, 
  percent: number,
  tippedUsers: User[],
  currentUser: User,
  align: 'left' | 'right',
  disabled: boolean,
  isFallback?: boolean,
  onClick: () => void 
}> = ({ name, score, isSelected, isWinner, percent, tippedUsers, currentUser, align, disabled, isFallback, onClick }) => {
  const colors = getTeamColors(name);
  const clean = cleanTeamName(name);

  return (
    <motion.button 
      layout
      onClick={onClick} 
      disabled={disabled}
      initial={false}
      animate={{
        scale: isSelected ? 1.05 : 1,
        zIndex: isSelected ? 20 : 10,
        backgroundColor: isSelected ? colors.primary : 'transparent',
        borderColor: isSelected ? colors.secondary : 'transparent',
      }}
      whileHover={!disabled ? { scale: isSelected ? 1.08 : 1.03, y: -4 } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      className={`relative w-full h-32 rounded-[2.5rem] border-[4px] transition-all p-6 flex items-center gap-4 ${align === 'right' ? 'flex-row-reverse text-right' : 'text-left'} ${isSelected ? 'shadow-2xl' : 'bg-white dark:bg-slate-900 border-slate-50 dark:border-white/10 hover:border-purple-300 dark:hover:border-purple-500 hover:shadow-xl'} ${disabled ? 'opacity-90' : 'cursor-pointer'}`}
      style={isSelected ? { 
        backgroundColor: colors.primary, 
        borderColor: colors.secondary, 
        color: colors.text, 
        boxShadow: `0 20px 40px -10px ${colors.primary}60, 0 0 20px ${colors.secondary}40` 
      } : {}}
    >
      <div className="shrink-0 relative">
        <motion.div 
          animate={isSelected ? { 
            rotate: [0, -10, 10, -10, 0],
            scale: [1, 1.15, 1],
          } : { scale: 1 }}
          whileTap={!disabled ? { scale: 0.9 } : {}}
          transition={{ duration: 0.4 }}
          className={`w-16 h-16 p-3 rounded-[1.5rem] shadow-xl flex items-center justify-center border-2 transition-all ${isSelected ? 'bg-white border-white' : 'bg-white dark:bg-slate-700 border-slate-50 dark:border-white/10'}`}
        >
          <img src={getTeamLogoUrl(name)} alt={name} className="w-full h-full object-contain" />
        </motion.div>
        
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg z-20"
            >
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: colors.secondary }} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-lg font-heading font-black uppercase italic tracking-tighter truncate leading-none">{clean}</h4>
          {isFallback && isSelected && (
            <div className="px-2 py-0.5 bg-amber-100 dark:bg-amber-500/20 rounded-md flex items-center gap-1">
              <ShieldCheck size={10} className="text-amber-600 dark:text-amber-400" />
              <span className="text-[8px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-widest">Fallback</span>
            </div>
          )}
        </div>
        {score !== null ? (
          <p className="text-3xl font-heading font-black">{score}</p>
        ) : (
          <div className={`mt-1 space-y-1.5 ${align === 'right' ? 'flex flex-col items-end' : ''}`}>
             <div className="flex items-center gap-1.5">
                <span className={`text-[9px] font-black uppercase tracking-widest opacity-70`}>{percent}%</span>
                <div className="flex -space-x-2">
                  {tippedUsers.slice(0, 5).map(u => (
                    <div 
                      key={u.id} 
                      className={`w-5 h-5 rounded-full border-2 border-white dark:border-slate-800 bg-white dark:bg-slate-700 overflow-hidden relative ${u.id === currentUser.id ? 'ring-2 ring-yellow-400 z-10' : 'z-0'}`}
                      title={u.name}
                    >
                      <img src={`https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(u.name)}`} alt={u.name} className="w-full h-full object-cover" />
                      {u.id === currentUser.id && (
                        <div className="absolute inset-0 bg-yellow-400/20" />
                      )}
                    </div>
                  ))}
                  {tippedUsers.length > 5 && (
                    <div className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[7px] font-black text-slate-500">
                      +{tippedUsers.length - 5}
                    </div>
                  )}
                </div>
             </div>
             <div className="w-20 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800/50 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  className="h-full" 
                  style={{ backgroundColor: isSelected ? 'white' : colors.primary }} 
                />
             </div>
          </div>
        )}
      </div>

      {isSelected && (
        <motion.div 
          initial={{ opacity: 0, x: align === 'left' ? 20 : -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`absolute ${align === 'left' ? 'right-6' : 'left-6'} top-1/2 -translate-y-1/2`}
        >
          <div className="flex flex-col items-center">
            <CheckCircle size={24} className={isSelected ? 'text-white' : 'text-emerald-500'} />
            <span className="text-[8px] font-black uppercase tracking-tighter mt-1">Selected</span>
          </div>
        </motion.div>
      )}

      {isWinner && (
        <motion.div 
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 12 }}
          className={`absolute -top-6 ${align === 'left' ? '-left-6' : '-right-6'} bg-yellow-400 text-slate-900 p-4 rounded-3xl shadow-2xl border-4 border-white dark:border-slate-800`}
        >
          <Trophy size={28} />
        </motion.div>
      )}
    </motion.button>
  );
};

export default TippingPage;
