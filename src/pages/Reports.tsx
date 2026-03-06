
import React, { useState, useMemo } from 'react';
import { Game, User, Tip } from '../types.ts';
import { getTeamLogoUrl, cleanTeamName } from '../utils.ts';
import { Printer, ChevronRight, ChevronLeft, User as UserIcon, Calendar, Trophy, CheckCircle, XCircle, Send, X } from 'lucide-react';

interface ReportsPageProps {
  users: User[];
  games: Game[];
  year: number;
}

const ReportsPage: React.FC<ReportsPageProps> = ({ users, games, year }) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || '');
  const [selectedRound, setSelectedRound] = useState<number>(1);

  const [isPrintPreview, setIsPrintPreview] = useState(false);

  const rounds = useMemo(() => Array.from(new Set(games.map(g => g.round))).sort((a: number, b: number) => a - b), [games]);
  const selectedUser = useMemo(() => users.find(u => u.id === selectedUserId), [users, selectedUserId]);
  
  const roundGames = useMemo(() => {
    return games
      .filter(g => g.round === selectedRound)
      .sort((a: Game, b: Game) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [games, selectedRound]);

  const userTips = useMemo(() => {
    if (!selectedUser) return [];
    return selectedUser.tips[year]?.[selectedRound] || [];
  }, [selectedUser, selectedRound, year]);

  const handlePrint = () => {
    setIsPrintPreview(true);
    // Give the UI a moment to update before triggering the print dialog
    setTimeout(() => {
      window.focus();
      window.print();
    }, 200);
  };

  

  const getGameResult = (game: Game, tip: Tip | undefined) => {
    if (game.complete < 100) return 'pending';
    if (!tip) return 'no-tip';
    return tip.winner === game.winner ? 'correct' : 'incorrect';
  };

  const roundStats = useMemo(() => {
    let correct = 0;
    let total = 0;
    let marginError: number | null = null;

    roundGames.forEach((g, idx) => {
      const tip = userTips.find(t => t.gameId === g.id);
      if (g.complete === 100) {
        total++;
        if (tip && tip.winner === g.winner) {
          correct++;
        }
        // Margin error is usually only for the first game of the round in this comp
        if (idx === 0 && tip && typeof tip.margin === 'number') {
          marginError = Math.abs(tip.margin - Math.abs((g.hscore || 0) - (g.ascore || 0)));
        }
      }
    });

    return { correct, total, marginError };
  }, [roundGames, userTips]);

  return (
    <div className="space-y-8">
      {isPrintPreview && (
        <div className="fixed top-6 right-6 z-[100] print:hidden">
          <button 
            onClick={() => setIsPrintPreview(false)}
            className="px-6 py-3 bg-rose-600 text-white rounded-xl font-bold text-xs uppercase shadow-lg flex items-center gap-2 hover:bg-rose-700 transition-colors"
          >
            <X size={16} />
            Exit Preview
          </button>
        </div>
      )}
      {/* Controls - Hidden on Print */}
      {!isPrintPreview && (
      <div className="print:hidden bg-white dark:bg-slate-800/50 rounded-[2.5rem] p-8 shadow-xl border border-slate-200 dark:border-white/10 flex flex-wrap items-center gap-6">
        <div className="flex-1 min-w-[240px]">
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 ml-2 italic">Select Player</label>
          <div className="relative">
            <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
            <select 
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-white/10 rounded-2xl outline-none focus:border-blue-500 transition-all font-heading font-black text-xs uppercase italic text-slate-900 dark:text-white"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 min-w-[240px]">
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 ml-2 italic">Select Round</label>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSelectedRound(r => Math.max(1, r - 1))}
              className="p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-white/10 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-white"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex-1 relative">
              <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
              <select 
                value={selectedRound}
                onChange={(e) => setSelectedRound(Number(e.target.value))}
                className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-white/10 rounded-2xl outline-none focus:border-blue-500 transition-all font-heading font-black text-xs uppercase italic appearance-none text-slate-900 dark:text-white"
              >
                {rounds.map(r => (
                  <option key={r} value={r}>Round {r}</option>
                ))}
              </select>
            </div>
            <button 
              onClick={() => setSelectedRound(r => Math.min(rounds.length, r + 1))}
              className="p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-white/10 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-white"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <button 
          onClick={handlePrint}
          className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-heading font-black text-xs uppercase italic tracking-widest flex items-center gap-3 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-blue-900/50"
        >
          <Printer size={18} />
          Print Report
        </button>

        
      </div>
      )}

      {/* Report Content */}
      <div className="bg-white dark:bg-slate-800/50 rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-white/10 print:shadow-none print:border-none print:rounded-none printable-area">
        {/* Report Header */}
        <div className="bg-slate-950 p-12 text-white flex justify-between items-end">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 italic">Official Season Report</span>
            </div>
            <h2 className="text-5xl font-heading font-black uppercase italic tracking-tighter leading-none">
              {selectedUser?.name}'s <span className="text-blue-500">Results</span>
            </h2>
            <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[10px] mt-4 italic">Round {selectedRound} • {year} AFL Premiership</p>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-6 bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-xl">
              <div className="text-center">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Score</p>
                <p className="text-3xl font-heading font-black text-white italic">{roundStats.correct} / {roundStats.total}</p>
              </div>
              {roundStats.marginError !== null && (
                <>
                  <div className="w-px h-10 bg-white/10" />
                  <div className="text-center">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Margin Err</p>
                    <p className="text-3xl font-heading font-black text-blue-500 italic">{roundStats.marginError}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="p-12">
          <div className="space-y-4">
            {roundGames.map((game, idx) => {
              const tip = userTips.find(t => t.gameId === game.id);
              const result = getGameResult(game, tip);
              
              return (
                <div key={game.id} className="flex items-center gap-8 p-8 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/10">
                  <div className="w-16 text-center shrink-0">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase italic">Game</p>
                    <p className="text-xl font-heading font-black text-slate-900 dark:text-white italic">#{idx + 1}</p>
                  </div>

                  <div className="flex-1 flex items-center justify-center gap-12">
                    <div className={`flex flex-col items-center gap-3 w-32 ${game.winner === game.hteam ? 'scale-110' : 'opacity-50'}`}>
                      <img src={getTeamLogoUrl(game.hteam)} alt={game.hteam} className="w-12 h-12 object-contain" />
                      <p className="text-[10px] font-black uppercase text-slate-900 dark:text-white text-center leading-tight">{cleanTeamName(game.hteam)}</p>
                      <p className="text-2xl font-heading font-black text-slate-900 dark:text-white">{game.hscore || 0}</p>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      <div className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 rounded-full">
                        <span className="text-[9px] font-black uppercase text-slate-600 dark:text-slate-300 italic">VS</span>
                      </div>
                      {game.complete === 100 && (
                        <div className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 italic">Final</div>
                      )}
                    </div>

                    <div className={`flex flex-col items-center gap-3 w-32 ${game.winner === game.ateam ? 'scale-110' : 'opacity-50'}`}>
                      <img src={getTeamLogoUrl(game.ateam)} alt={game.ateam} className="w-12 h-12 object-contain" />
                      <p className="text-[10px] font-black uppercase text-slate-900 dark:text-white text-center leading-tight">{cleanTeamName(game.ateam)}</p>
                      <p className="text-2xl font-heading font-black text-slate-900 dark:text-white">{game.ascore || 0}</p>
                    </div>
                  </div>

                  <div className="w-48 shrink-0 flex flex-col items-end gap-2">
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic">Player's Tip</p>
                    <div className="flex items-center gap-3">
                      {tip ? (
                        <>
                          <span className={`text-xs font-black uppercase italic ${result === 'correct' ? 'text-emerald-600' : result === 'incorrect' ? 'text-rose-600' : 'text-slate-600 dark:text-slate-300'}`}>
                            {cleanTeamName(tip.winner || '')}
                            {idx === 0 && tip.margin !== null && ` (${tip.margin})`}
                          </span>
                          {result === 'correct' && <CheckCircle size={18} className="text-emerald-500" />}
                          {result === 'incorrect' && <XCircle size={18} className="text-rose-500" />}
                        </>
                      ) : (
                        <span className="text-xs font-black uppercase italic text-slate-300 dark:text-slate-500 italic">No Tip</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-12 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-white/10 flex justify-between items-center italic">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Generated on {new Date().toLocaleDateString('en-AU', { timeZone: 'Australia/Perth' })} (AWST) • Adrian's Family Tipping Comp
          </p>
          <div className="flex items-center gap-2">
            <Trophy size={14} className="text-blue-500" />
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Official Record</span>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }
          .bg-slate-950 {
            background-color: #020617 !important;
            -webkit-print-color-adjust: exact;
          }
          .bg-slate-50 {
            background-color: #f8fafc !important;
            -webkit-print-color-adjust: exact;
          }
          .text-blue-500 {
            color: #3b82f6 !important;
            -webkit-print-color-adjust: exact;
          }
          .text-blue-400 {
            color: #60a5fa !important;
            -webkit-print-color-adjust: exact;
          }
          .bg-blue-600 {
            background-color: #2563eb !important;
            -webkit-print-color-adjust: exact;
          }
          .shadow-2xl, .shadow-xl {
            box-shadow: none !important;
          }
          .rounded-\\[3rem\\] {
            border-radius: 0 !important;
          }
          /* Hide sidebar and system bar if they are not already hidden by print:hidden */
          nav, .h-12 {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ReportsPage;
