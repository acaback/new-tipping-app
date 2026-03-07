
import React, { useState, useMemo } from 'react';
import { Game, User, Tip } from '../types.ts';
import { getTeamLogoUrl, cleanTeamName } from '../utils.ts';
import { Printer, ChevronRight, ChevronLeft, User as UserIcon, Calendar, Trophy, CheckCircle, XCircle, Send, X, AlertCircle, Copy, Check } from 'lucide-react';

interface ReportsPageProps {
  users: User[];
  games: Game[];
  year: number;
}

const ReportsPage: React.FC<ReportsPageProps> = ({ users, games, year }) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || '');
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [reportType, setReportType] = useState<'results' | 'selections' | 'summary'>('results');

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

  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopy = () => {
    let content = "";
    if (reportType === 'summary') {
      // Header
      content += "Matchup\t" + users.map(u => u.name).join("\t") + "\n";
      // Rows
      roundGames.forEach(game => {
        content += `${game.hteam} vs ${game.ateam}\t`;
        content += users.map(u => {
          const tip = u.tips[year]?.[selectedRound]?.find(t => t.gameId === game.id);
          return tip ? tip.winner : "---";
        }).join("\t") + "\n";
      });
    } else {
      // Header
      content += "#\tHome Team\tScore\tAway Team\tScore\tStatus\tTip\n";
      // Rows
      roundGames.forEach((game, idx) => {
        const tip = userTips.find(t => t.gameId === game.id);
        content += `${idx + 1}\t${game.hteam}\t${game.hscore || 0}\t${game.ateam}\t${game.ascore || 0}\t${game.complete === 100 ? 'Final' : 'Live'}\t${tip ? tip.winner : 'No Tip'}\n`;
      });
    }

    navigator.clipboard.writeText(content).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const handlePrint = () => {
    // Try to open in a new window for printing (bypasses iframe restrictions)
    const printContent = document.querySelector('.printable-area')?.innerHTML;
    const styles = Array.from(document.querySelectorAll('style'))
      .map(s => s.innerHTML)
      .join('\n');
    
    // We also need the tailwind styles which are in the main document
    const tailwindStyles = Array.from(document.styleSheets)
      .map(sheet => {
        try {
          return Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n');
        } catch (e) {
          return '';
        }
      })
      .join('\n');

    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Adrian's Tipping - Print Report</title>
            <style>
              ${tailwindStyles}
              ${styles}
              body { padding: 2rem; background: white !important; color: black !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .print\\:hidden { display: none !important; }
              @page { margin: 1cm; }
            </style>
          </head>
          <body class="dark:bg-white">
            <div class="max-w-5xl mx-auto">
              ${printContent}
            </div>
            <script>
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      // Fallback to in-app preview if popup is blocked
      setIsPrintPreview(true);
      setTimeout(() => {
        try {
          window.focus();
          window.print();
        } catch (e) {
          console.error("Print error:", e);
        }
      }, 500);
    }
  };

  const isIframe = useMemo(() => {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }, []);

  

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
        <div className="fixed top-6 right-6 z-[100] print:hidden flex flex-col items-end gap-3">
          <div className="flex gap-3">
            <button 
              onClick={() => {
                window.focus();
                window.print();
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase shadow-lg flex items-center gap-2 hover:bg-blue-700 transition-all active:scale-95"
            >
              <Printer size={16} />
              Print Now
            </button>
            <button 
              onClick={() => setIsPrintPreview(false)}
              className="px-6 py-3 bg-rose-600 text-white rounded-xl font-bold text-xs uppercase shadow-lg flex items-center gap-2 hover:bg-rose-700 transition-all active:scale-95"
            >
              <X size={16} />
              Exit Preview
            </button>
          </div>
          
          {isIframe && (
            <div className="bg-amber-50 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-500/30 p-4 rounded-2xl max-w-xs shadow-xl animate-in slide-in-from-right-4">
              <div className="flex gap-3">
                <AlertCircle className="text-amber-500 shrink-0" size={18} />
                <p className="text-[10px] font-bold text-amber-800 dark:text-amber-200 leading-relaxed uppercase tracking-tight">
                  Printing is often blocked inside preview windows. If the dialog doesn't open, please <span className="text-amber-600 dark:text-amber-400 underline">open this app in a new tab</span> using the button in the top-right of your screen.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Controls - Hidden on Print */}
      {!isPrintPreview && (
      <div className="print:hidden bg-white dark:bg-slate-800/50 rounded-[2.5rem] p-8 shadow-xl border border-slate-200 dark:border-white/10 space-y-8">
        <div className="flex flex-wrap items-center gap-6">
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
                  <option key={u.id} value={u.id}>{u.name}</option>
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

          <button 
            onClick={handleCopy}
            className={`px-8 py-4 rounded-2xl font-heading font-black text-xs uppercase italic tracking-widest flex items-center gap-3 transition-all shadow-lg ${copySuccess ? 'bg-emerald-500 text-white' : 'bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800'}`}
          >
            {copySuccess ? <Check size={18} /> : <Copy size={18} />}
            {copySuccess ? 'Copied!' : 'Copy to Spreadsheet'}
          </button>
        </div>

        <div className="flex items-center gap-4 border-t border-slate-100 dark:border-white/5 pt-8">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 italic mr-4">Report Type:</p>
          <button 
            onClick={() => setReportType('results')}
            className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${reportType === 'results' ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
          >
            Results & Scores
          </button>
          <button 
            onClick={() => setReportType('selections')}
            className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${reportType === 'selections' ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
          >
            Selections Only
          </button>
          <button 
            onClick={() => setReportType('summary')}
            className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${reportType === 'summary' ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
          >
            Round Summary (All Players)
          </button>
        </div>
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
              {reportType === 'summary' ? 'Round' : selectedUser?.name + "'s"} <span className="text-blue-500">{reportType === 'results' ? 'Results' : reportType === 'selections' ? 'Selections' : 'Summary'}</span>
            </h2>
            <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[10px] mt-4 italic">Round {selectedRound} • {year} AFL Premiership</p>
          </div>
          <div className="text-right">
            {reportType === 'results' ? (
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
            ) : reportType === 'selections' ? (
              <div className="inline-flex items-center gap-6 bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-xl">
                <div className="text-center">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Games</p>
                  <p className="text-3xl font-heading font-black text-white italic">{roundGames.length}</p>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="text-center">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Status</p>
                  <p className="text-3xl font-heading font-black text-blue-500 italic">READY</p>
                </div>
              </div>
            ) : (
              <div className="inline-flex items-center gap-6 bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-xl">
                <div className="text-center">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Players</p>
                  <p className="text-3xl font-heading font-black text-white italic">{users.length}</p>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="text-center">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Tips</p>
                  <p className="text-3xl font-heading font-black text-blue-500 italic">
                    {users.reduce((acc, u) => acc + (u.tips[year]?.[selectedRound]?.length || 0), 0)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Table */}
        <div className="p-8">
          <div className="overflow-x-auto border-2 border-slate-100 dark:border-white/10 rounded-2xl">
            {reportType === 'summary' ? (
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/80 border-b-2 border-slate-100 dark:border-white/10">
                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic border-r border-slate-100 dark:border-white/10">Matchup</th>
                    {users.map(u => (
                      <th key={u.id} className="px-4 py-4 text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest italic border-r border-slate-100 dark:border-white/10 text-center min-w-[100px]">
                        {u.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y border-slate-100 dark:border-white/10">
                  {roundGames.map((game, idx) => (
                    <tr key={game.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-500/5 transition-colors even:bg-slate-50/50 dark:even:bg-slate-900/30">
                      <td className="px-4 py-4 border-r border-slate-100 dark:border-white/10">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <img src={getTeamLogoUrl(game.hteam)} className="w-4 h-4 object-contain" alt="" />
                            <span className="text-[10px] font-black uppercase text-slate-900 dark:text-white">{cleanTeamName(game.hteam)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <img src={getTeamLogoUrl(game.ateam)} className="w-4 h-4 object-contain" alt="" />
                            <span className="text-[10px] font-black uppercase text-slate-900 dark:text-white">{cleanTeamName(game.ateam)}</span>
                          </div>
                        </div>
                      </td>
                      {users.map(u => {
                        const tip = u.tips[year]?.[selectedRound]?.find(t => t.gameId === game.id);
                        const isCorrect = game.complete === 100 && tip?.winner === game.winner;
                        const isIncorrect = game.complete === 100 && tip?.winner && tip.winner !== game.winner;
                        
                        return (
                          <td key={u.id} className={`px-4 py-4 border-r border-slate-100 dark:border-white/10 text-center ${isCorrect ? 'bg-emerald-500/10' : isIncorrect ? 'bg-rose-500/10' : ''}`}>
                            {tip ? (
                              <div className="flex flex-col items-center gap-1">
                                <span className={`text-[10px] font-black uppercase italic ${isCorrect ? 'text-emerald-600' : isIncorrect ? 'text-rose-600' : 'text-blue-600 dark:text-blue-400'}`}>
                                  {cleanTeamName(tip.winner || '')}
                                </span>
                                {idx === 0 && tip.margin !== null && (
                                  <span className="text-[8px] font-black text-slate-400">M: {tip.margin}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[9px] font-black text-slate-300 uppercase italic opacity-50">---</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/80 border-b-2 border-slate-100 dark:border-white/10">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic border-r border-slate-100 dark:border-white/10">#</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic border-r border-slate-100 dark:border-white/10">Home Team</th>
                    {reportType === 'results' && (
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic border-r border-slate-100 dark:border-white/10 text-center">Score</th>
                    )}
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic border-r border-slate-100 dark:border-white/10 text-center">VS</th>
                    {reportType === 'results' && (
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic border-r border-slate-100 dark:border-white/10 text-center">Score</th>
                    )}
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic border-r border-slate-100 dark:border-white/10">Away Team</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic border-r border-slate-100 dark:border-white/10 text-center">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic">Player's Tip</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-slate-100 dark:border-white/10">
                  {roundGames.map((game, idx) => {
                    const tip = userTips.find(t => t.gameId === game.id);
                    const result = getGameResult(game, tip);
                    
                    return (
                      <tr key={game.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-500/5 transition-colors even:bg-slate-50/50 dark:even:bg-slate-900/30">
                        <td className="px-6 py-4 font-mono text-xs font-black text-slate-400 border-r border-slate-100 dark:border-white/10">{idx + 1}</td>
                        <td className="px-6 py-4 border-r border-slate-100 dark:border-white/10">
                          <div className="flex items-center gap-3">
                            <img src={getTeamLogoUrl(game.hteam)} alt="" className="w-6 h-6 object-contain" />
                            <span className={`text-xs font-black uppercase italic ${reportType === 'results' && game.winner === game.hteam ? 'text-slate-900 dark:text-white' : reportType === 'results' ? 'text-slate-400 opacity-50' : 'text-slate-900 dark:text-white'}`}>
                              {cleanTeamName(game.hteam)}
                            </span>
                          </div>
                        </td>
                        {reportType === 'results' && (
                          <td className={`px-6 py-4 font-mono text-sm font-black text-center border-r border-slate-100 dark:border-white/10 ${game.winner === game.hteam ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                            {game.hscore || 0}
                          </td>
                        )}
                        <td className="px-6 py-4 text-center border-r border-slate-100 dark:border-white/10">
                          <span className="text-[9px] font-black text-slate-300 uppercase italic">VS</span>
                        </td>
                        {reportType === 'results' && (
                          <td className={`px-6 py-4 font-mono text-sm font-black text-center border-r border-slate-100 dark:border-white/10 ${game.winner === game.ateam ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                            {game.ascore || 0}
                          </td>
                        )}
                        <td className="px-6 py-4 border-r border-slate-100 dark:border-white/10">
                          <div className="flex items-center gap-3">
                            <img src={getTeamLogoUrl(game.ateam)} alt="" className="w-6 h-6 object-contain" />
                            <span className={`text-xs font-black uppercase italic ${reportType === 'results' && game.winner === game.ateam ? 'text-slate-900 dark:text-white' : reportType === 'results' ? 'text-slate-400 opacity-50' : 'text-slate-900 dark:text-white'}`}>
                              {cleanTeamName(game.ateam)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center border-r border-slate-100 dark:border-white/10">
                          {game.complete === 100 ? (
                            <span className="px-2 py-1 bg-slate-200 dark:bg-slate-800 rounded text-[8px] font-black text-slate-500 uppercase tracking-tighter">Final</span>
                          ) : (
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded text-[8px] font-black text-blue-500 uppercase tracking-tighter">Live</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-between gap-3">
                            {tip ? (
                              <>
                                <span className={`text-xs font-black uppercase italic ${reportType === 'results' ? (result === 'correct' ? 'text-emerald-600' : result === 'incorrect' ? 'text-rose-600' : 'text-slate-600 dark:text-slate-300') : 'text-blue-600 dark:text-blue-400'}`}>
                                  {cleanTeamName(tip.winner || '')}
                                  {idx === 0 && tip.margin !== null && ` [M:${tip.margin}]`}
                                </span>
                                {reportType === 'results' && result === 'correct' && <CheckCircle size={14} className="text-emerald-500 shrink-0" />}
                                {reportType === 'results' && result === 'incorrect' && <XCircle size={14} className="text-rose-500 shrink-0" />}
                              </>
                            ) : (
                              <span className="text-xs font-black uppercase italic text-slate-300 dark:text-slate-500 italic opacity-50">No Tip</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
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
          @page {
            margin: 1cm;
            size: auto;
          }
          body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .shadow-2xl, .shadow-xl, .shadow-lg, .shadow-md, .shadow-sm {
            box-shadow: none !important;
          }
          .rounded-\\[3rem\\], .rounded-[3rem] {
            border-radius: 0 !important;
          }
          .bg-slate-950 {
            background-color: #020617 !important;
            color: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .text-blue-500 {
            color: #3b82f6 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .bg-blue-500 {
            background-color: #3b82f6 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .bg-emerald-500\\/10 {
            background-color: rgba(16, 185, 129, 0.1) !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .bg-rose-500\\/10 {
            background-color: rgba(244, 63, 94, 0.1) !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            border: 1px solid #e2e8f0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ReportsPage;
