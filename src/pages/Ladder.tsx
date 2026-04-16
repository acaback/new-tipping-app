
import React, { useMemo, useState, useEffect } from 'react';
import { Game, User, AFLLadderEntry, LadderEntry } from '../types';
import { generateLadder, fetchAFLLadder, getTeamLogoUrl, cleanTeamName, getTeamColors, calculateAFLLadder } from '../utils';
import { Trophy, Medal, MinusCircle, Info, ChevronUp, ChevronDown, Users, BarChart2, ArrowUpDown, BookOpen } from 'lucide-react';
import RulesModal from '../components/RulesModal.tsx';

interface LadderPageProps {
  users: User[];
  games: Game[];
  year: number;
}

type FamilySortKey = 'rank' | 'userName' | 'correctTips' | 'totalMarginError' | 'points';
type AFLSortKey = 'rank' | 'name' | 'wins' | 'losses' | 'draws' | 'percentage' | 'points';

const LadderPage: React.FC<LadderPageProps> = ({ users, games, year }) => {
  const [activeTab, setActiveTab] = useState('family');
  const [aflLadder, setAflLadder] = useState<AFLLadderEntry[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  
  // Sorting state
  const [familySort, setFamilySort] = useState<{ key: FamilySortKey; direction: 'asc' | 'desc' }>({ key: 'rank', direction: 'asc' });
  const [aflSort, setAflSort] = useState<{ key: AFLSortKey; direction: 'asc' | 'desc' }>({ key: 'rank', direction: 'asc' });

  const rawLadder = useMemo(() => generateLadder(users, games, year), [users, games, year]);
  
  const sortedFamilyLadder = useMemo(() => {
    const sorted = [...rawLadder].map((entry, index) => ({ ...entry, rank: index + 1 }));
    
    if (familySort.key === 'rank' && familySort.direction === 'asc') return sorted;

    return sorted.sort((a, b) => {
      const aValue = a[familySort.key as keyof typeof a];
      const bValue = b[familySort.key as keyof typeof b];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return familySort.direction === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }

      return familySort.direction === 'asc' 
        ? (aValue as number) - (bValue as number) 
        : (bValue as number) - (aValue as number);
    });
  }, [rawLadder, familySort]);

  const sortedAFLLadder = useMemo(() => {
    const sorted = [...aflLadder];
    
    return sorted.sort((a, b) => {
      const aValue = a[aflSort.key];
      const bValue = b[aflSort.key];

      if (aValue === undefined || bValue === undefined) return 0;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return aflSort.direction === 'asc' ? comparison : -comparison;
      }

      const numA = Number(aValue);
      const numB = Number(bValue);
      
      if (aflSort.direction === 'asc') {
        return numA - numB;
      } else {
        return numB - numA;
      }
    });
  }, [aflLadder, aflSort]);

  const completedGames = games.filter(g => g.complete === 100);

  const loadAFLLadder = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    
    // First, calculate from local games to ensure immediate update including Opening Round
    const calculated = calculateAFLLadder(games);
    
    // Then, try to fetch official ladder for comparison or as fallback
    const official = await fetchAFLLadder(year);
    
    // Compare total points to see which ladder is more up-to-date
    // If calculated has more points or equal, it's likely more "live"
    const totalOfficialPoints = official.reduce((acc, t) => acc + (t.points || 0), 0);
    const totalCalculatedPoints = calculated.reduce((acc, t) => acc + (t.points || 0), 0);
    
    if (official && official.length > 0 && totalOfficialPoints > totalCalculatedPoints) {
      setAflLadder(official);
    } else {
      setAflLadder(calculated);
    }
    
    setLastUpdated(new Date());
    if (!silent) setIsRefreshing(false);
  };

  useEffect(() => {
    loadAFLLadder();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      loadAFLLadder(true);
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [year]);

  const toggleFamilySort = (key: FamilySortKey) => {
    setFamilySort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const toggleAFLSort = (key: AFLSortKey) => {
    setAflSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const SortIcon = ({ currentKey, targetKey, direction }: { currentKey: string, targetKey: string, direction: 'asc' | 'desc' }) => {
    if (currentKey !== targetKey) return <ArrowUpDown size={12} className="ml-1 opacity-30 group-hover:opacity-100 transition-opacity" />;
    return direction === 'asc' ? <ChevronUp size={12} className="ml-1 text-blue-600" /> : <ChevronDown size={12} className="ml-1 text-blue-600" />;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic"><span className="text-blue-600">Competition</span> Central</h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[11px] tracking-widest">Rankings & Live AFL Standings {year}</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-2 rounded-2xl">
          <button onClick={() => setActiveTab('family')} className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest px-6 py-3 rounded-xl transition-all ${activeTab === 'family' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-md' : 'text-slate-500'}`}>
            <Users size={16} /> Family Rankings
          </button>
          <button onClick={() => setActiveTab('afl')} className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest px-6 py-3 rounded-xl transition-all relative ${activeTab === 'afl' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-md' : 'text-slate-500'}`}>
            <BarChart2 size={16} /> Live AFL Ladder
            {activeTab === 'afl' && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
            )}
          </button>
        </div>
        <div className="bg-white dark:bg-slate-800/50 border-2 border-slate-100 dark:border-white/10 rounded-[1.5rem] px-8 py-4 text-right shadow-sm flex items-center gap-6">
          <div className="text-right">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">Games Completed</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{completedGames.length} <span className="text-slate-200 dark:text-slate-600">/</span> {games.length}</span>
          </div>
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-100 dark:shadow-blue-900/50 rotate-6">
            <Trophy size={24} />
          </div>
        </div>
      </div>

      <div>
        {activeTab === 'family' && (
          <div className="bg-white dark:bg-slate-800/50 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border-2 border-slate-50 dark:border-white/10 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b-2 border-slate-50 dark:border-white/5">
                    <th onClick={() => toggleFamilySort('rank')} className="px-8 py-6 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] italic cursor-pointer group">
                      <div className="flex items-center">Pos <SortIcon currentKey={familySort.key} targetKey="rank" direction={familySort.direction} /></div>
                    </th>
                    <th onClick={() => toggleFamilySort('userName')} className="px-8 py-6 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] italic cursor-pointer group">
                      <div className="flex items-center">Contender <SortIcon currentKey={familySort.key} targetKey="userName" direction={familySort.direction} /></div>
                    </th>
                    <th onClick={() => toggleFamilySort('correctTips')} className="px-8 py-6 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] italic text-center cursor-pointer group">
                      <div className="flex items-center justify-center">Correct <SortIcon currentKey={familySort.key} targetKey="correctTips" direction={familySort.direction} /></div>
                    </th>
                    <th onClick={() => toggleFamilySort('totalMarginError')} className="px-8 py-6 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] italic text-center cursor-pointer group">
                      <div className="flex items-center justify-center">Margin Error <SortIcon currentKey={familySort.key} targetKey="totalMarginError" direction={familySort.direction} /></div>
                    </th>
                    <th onClick={() => toggleFamilySort('points')} className="px-8 py-6 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] italic text-center cursor-pointer group">
                      <div className="flex items-center justify-center">Score <SortIcon currentKey={familySort.key} targetKey="points" direction={familySort.direction} /></div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-50 dark:divide-white/5">
                  {sortedFamilyLadder.map((entry, idx) => {
                    const rank = entry.rank;
                    return (
                      <tr key={`family-${entry.userId}-${idx}`} className={`group transition-all duration-300 hover:bg-blue-50/30 dark:hover:bg-blue-500/10 ${idx === 0 ? 'bg-gradient-to-r from-yellow-50/30 to-transparent dark:from-yellow-500/10 dark:to-transparent' : ''}`}>
                        <td className="px-8 py-6">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-2xl font-black text-base relative ${rank === 1 ? 'bg-yellow-400 text-yellow-950 shadow-lg shadow-yellow-100 dark:shadow-yellow-900/50 rotate-6' : rank === 2 ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rotate-3' : rank === 3 ? 'bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-300 rotate-2' : 'bg-slate-50 dark:bg-slate-700 text-slate-400 dark:text-slate-500'}`}>
                            {rank}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className={`absolute -inset-1 rounded-full blur-sm opacity-30 ${rank === 1 ? 'bg-yellow-400' : 'bg-blue-400'}`} />
                              <div className="relative w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-700 border-2 border-slate-100 dark:border-white/10 flex items-center justify-center overflow-hidden shadow-lg group-hover:scale-110 transition-transform">
                                <img 
                                  src={users.find(u => u.id === entry.userId)?.avatar || `https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(entry.userName)}`} 
                                  alt={entry.userName} 
                                  className="w-full h-full object-cover" 
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              {users.find(u => u.id === entry.userId)?.favoriteTeam && (
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white dark:bg-slate-800 rounded-lg p-1 shadow-lg border border-slate-100 dark:border-white/10 z-10">
                                  <img 
                                    src={getTeamLogoUrl(users.find(u => u.id === entry.userId)!.favoriteTeam!)} 
                                    alt="Fav Team" 
                                    className="w-full h-full object-contain"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className={`font-black text-base uppercase tracking-tight italic ${rank === 1 ? 'text-blue-900 dark:text-blue-300' : 'text-slate-800 dark:text-white'}`}>{entry.userName}</span>
                              {rank === 1 && <span className="text-[9px] font-black uppercase tracking-widest text-yellow-600 mt-0.5">League Leader</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center text-slate-600 dark:text-slate-300 font-black text-lg tabular-nums">
                          {entry.correctTips}
                        </td>
                        <td className="px-8 py-6 text-center">
                          <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest ${entry.totalMarginError < 50 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                            {entry.totalMarginError} pts
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className={`text-2xl font-black italic tracking-tighter tabular-nums ${rank === 1 ? 'text-blue-600' : 'text-slate-900 dark:text-white'}`}>{entry.points}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'afl' && (
          <div className="flex items-center justify-between px-8 mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isRefreshing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {isRefreshing ? 'Syncing Live Data...' : 'System Online'}
              </span>
            </div>
            {lastUpdated && (
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                Last Sync: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        )}

        {activeTab === 'afl' && (
          <div className="bg-white dark:bg-slate-800/50 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border-2 border-slate-50 dark:border-white/10 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b-2 border-slate-50 dark:border-white/5">
                    <th onClick={() => toggleAFLSort('rank')} className="px-8 py-6 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] italic cursor-pointer group">
                      <div className="flex items-center">Pos <SortIcon currentKey={aflSort.key} targetKey="rank" direction={aflSort.direction} /></div>
                    </th>
                    <th onClick={() => toggleAFLSort('name')} className="px-8 py-6 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] italic cursor-pointer group">
                      <div className="flex items-center">Team <SortIcon currentKey={aflSort.key} targetKey="name" direction={aflSort.direction} /></div>
                    </th>
                    <th onClick={() => toggleAFLSort('wins')} className="px-8 py-6 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] italic text-center cursor-pointer group">
                      <div className="flex items-center justify-center">W <SortIcon currentKey={aflSort.key} targetKey="wins" direction={aflSort.direction} /></div>
                    </th>
                    <th onClick={() => toggleAFLSort('losses')} className="px-8 py-6 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] italic text-center cursor-pointer group">
                      <div className="flex items-center justify-center">L <SortIcon currentKey={aflSort.key} targetKey="losses" direction={aflSort.direction} /></div>
                    </th>
                    <th onClick={() => toggleAFLSort('draws')} className="px-8 py-6 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] italic text-center cursor-pointer group">
                      <div className="flex items-center justify-center">D <SortIcon currentKey={aflSort.key} targetKey="draws" direction={aflSort.direction} /></div>
                    </th>
                    <th onClick={() => toggleAFLSort('percentage')} className="px-8 py-6 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] italic text-center cursor-pointer group">
                      <div className="flex items-center justify-center">% <SortIcon currentKey={aflSort.key} targetKey="percentage" direction={aflSort.direction} /></div>
                    </th>
                    <th onClick={() => toggleAFLSort('points')} className="px-8 py-6 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] italic text-center cursor-pointer group">
                      <div className="flex items-center justify-center">Pts <SortIcon currentKey={aflSort.key} targetKey="points" direction={aflSort.direction} /></div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-50 dark:divide-white/5">
                  {sortedAFLLadder.length > 0 ? (
                    sortedAFLLadder.map((team, idx) => {
                      const colors = getTeamColors(team.name);
                      return (
                        <tr 
                          key={`afl-${team.name}-${idx}`} 
                          className="group transition-all duration-300 hover:brightness-95 dark:hover:brightness-110 border-b border-slate-50 dark:border-white/5"
                          style={{ backgroundColor: `${colors.primary}08` }}
                        >
                          <td className="px-8 py-4">
                            <div className="flex items-center justify-center w-10 h-10 rounded-2xl font-black text-base bg-white/50 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-white/5">{team.rank}</div>
                          </td>
                          <td className="px-8 py-4">
                            <div className="flex items-center gap-4">
                              <div 
                                className="w-14 h-14 bg-white dark:bg-slate-700 p-2.5 rounded-2xl shadow-md flex items-center justify-center border-2 group-hover:scale-110 transition-transform"
                                style={{ borderColor: colors.primary }}
                              >
                                <img 
                                  src={team.logo || getTeamLogoUrl(team.name)} 
                                  alt={team.name} 
                                  className="w-full h-full object-contain" 
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-black text-base uppercase tracking-tight italic text-slate-800 dark:text-white">{cleanTeamName(team.name)}</span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{team.name}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-4 text-center text-slate-600 dark:text-slate-300 font-black text-lg tabular-nums">{team.wins}</td>
                          <td className="px-8 py-4 text-center text-slate-600 dark:text-slate-300 font-black text-lg tabular-nums">{team.wins}</td>
                          <td className="px-8 py-4 text-center text-slate-600 dark:text-slate-300 font-black text-lg tabular-nums">{team.losses}</td>
                          <td className="px-8 py-4 text-center text-slate-600 dark:text-slate-300 font-black text-lg tabular-nums">{team.draws}</td>
                          <td className="px-8 py-4 text-center text-slate-400 dark:text-slate-500 font-bold text-sm tabular-nums">{typeof team.percentage === 'number' ? team.percentage.toFixed(1) : 'N/A'}%</td>
                          <td className="px-8 py-4 text-center text-blue-600 font-black text-2xl italic tracking-tighter tabular-nums" style={{ color: colors.primary }}>{team.points}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-700">
                            <BarChart2 size={32} />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">No 2026 Data Yet</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">The 2026 season hasn't started. Check back after Round 1!</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 bg-white dark:bg-slate-800/50 border-2 border-slate-100 dark:border-white/10 rounded-[2.5rem] shadow-sm animate-in fade-in duration-1000">
        <div className="flex items-start gap-4">
          <div className="bg-blue-50 dark:bg-blue-500/10 p-3 rounded-2xl text-blue-400 shrink-0 shadow-inner">
            <Info size={24} />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Competition Protocol</p>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-bold leading-relaxed italic">
              Tie-breaker rule: If players have the same total points, the player with the <span className="text-blue-600 font-black">lowest cumulative margin error</span> is ranked higher. 
            </p>
          </div>
        </div>
        <button 
          onClick={() => setIsRulesOpen(true)}
          className="px-8 py-4 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest italic flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg"
        >
          <BookOpen size={16} /> Full Competition Rules
        </button>
      </div>
    </div>
  );
};

export default LadderPage;

