
import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Game, User, LadderEntry } from '../types.ts';
import { generateLadder, getTeamLogoUrl, cleanTeamName, formatAFLDate, getTeamColors } from '../utils.ts';
import { 
  Trophy, 
  Clock, 
  TrendingUp, 
  MessageSquare, 
  ChevronRight, 
  Zap, 
  Star, 
  Activity,
  Target,
  Award,
  ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardProps {
  user: User;
  users: User[];
  games: Game[];
  year: number;
}

const Dashboard: React.FC<DashboardProps> = ({ user, users, games, year }) => {
  const ladder = useMemo(() => generateLadder(users, games, year), [users, games, year]);
  const userRank = useMemo(() => ladder.findIndex(l => l.userId === user.id) + 1, [ladder, user.id]);
  const userStats = useMemo(() => ladder.find(l => l.userId === user.id), [ladder, user.id]);
  const teamColors = user.favoriteTeam ? getTeamColors(user.favoriteTeam) : { primary: '#2563eb', secondary: '#3b82f6', text: 'white' };

  const nextGame = useMemo(() => {
    const now = new Date();
    return games
      .filter(g => new Date(g.date.includes('+') || g.date.includes('Z') ? g.date : g.date.replace(' ', 'T') + '+10:00') > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  }, [games]);

  const recentGames = useMemo(() => {
    return games
      .filter(g => g.complete === 100)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
  }, [games]);

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      {/* Hero Welcome */}
      <div className="relative overflow-hidden rounded-[3.5rem] bg-slate-950 p-12 text-white shadow-2xl" style={{ borderLeft: `8px solid ${teamColors.primary}` }}>
        <div className="absolute top-0 right-0 w-1/2 h-full blur-[120px] -rotate-12 translate-x-1/4" style={{ backgroundColor: `${teamColors.primary}30` }} />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 border rounded-full text-[10px] font-black uppercase tracking-[0.3em] italic" style={{ backgroundColor: `${teamColors.primary}20`, borderColor: `${teamColors.primary}40`, color: teamColors.secondary }}>
              <Zap size={12} className="animate-pulse" />
              Operational Status: Active
            </div>
            <h1 className="text-6xl md:text-8xl font-heading font-black uppercase italic tracking-tighter leading-[0.85]">
              Welcome Back, <br />
              <span style={{ color: teamColors.primary }}>{user.name}</span>
            </h1>
            <p className="text-slate-400 font-bold text-sm uppercase tracking-[0.4em] italic">The War Room is Ready</p>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Current Rank</p>
              <div className="w-24 h-24 rounded-[2rem] bg-white/5 border-2 border-white/10 flex items-center justify-center text-4xl font-heading font-black italic shadow-2xl" style={{ color: teamColors.primary }}>
                #{userRank}
              </div>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Points</p>
              <div className="w-24 h-24 rounded-[2rem] bg-white/5 border-2 border-white/10 flex items-center justify-center text-4xl font-heading font-black italic text-white shadow-2xl">
                {userStats?.points || 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Next Match Countdown - Large */}
        <div className="md:col-span-8 bg-white dark:bg-slate-800/50 rounded-[3rem] p-10 border-2 border-slate-100 dark:border-white/10 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Clock size={120} />
          </div>
          <div className="relative z-10 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: teamColors.primary }}>
                  <TrendingUp size={20} />
                </div>
                <h3 className="text-xl font-heading font-black uppercase italic text-slate-900 dark:text-white">Next Battle</h3>
              </div>
              <Link to="/tips" className="text-[10px] font-black uppercase tracking-widest hover:underline flex items-center gap-1" style={{ color: teamColors.primary }}>
                Enter Tips <ChevronRight size={14} />
              </Link>
            </div>

            {nextGame ? (
              <div className="flex flex-col md:flex-row items-center justify-between gap-12 bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5">
                <div className="flex flex-col items-center gap-4 w-40">
                  <img src={getTeamLogoUrl(nextGame.hteam)} alt={nextGame.hteam} className="w-20 h-20 object-contain drop-shadow-2xl" />
                  <span className="font-black uppercase italic text-center text-slate-900 dark:text-white">{cleanTeamName(nextGame.hteam)}</span>
                </div>
                
                <div className="flex flex-col items-center gap-2">
                  <span className="text-4xl font-heading font-black text-slate-200 dark:text-slate-700 italic">VS</span>
                  <div className="px-4 py-1.5 text-white rounded-full text-[10px] font-black uppercase tracking-widest" style={{ backgroundColor: teamColors.primary }}>
                    {formatAFLDate(nextGame.date, { hour: '2-digit', minute: '2-digit' })} AWST
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{nextGame.venue}</span>
                </div>

                <div className="flex flex-col items-center gap-4 w-40">
                  <img src={getTeamLogoUrl(nextGame.ateam)} alt={nextGame.ateam} className="w-20 h-20 object-contain drop-shadow-2xl" />
                  <span className="font-black uppercase italic text-center text-slate-900 dark:text-white">{cleanTeamName(nextGame.ateam)}</span>
                </div>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-slate-400 font-black uppercase tracking-widest">No Upcoming Games</div>
            )}
          </div>
        </div>

        {/* Quick Stats - Small */}
        <div className="md:col-span-4 space-y-8">
          <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[3rem] p-8 text-white shadow-xl shadow-purple-200 dark:shadow-none relative overflow-hidden h-full">
            <div className="absolute -bottom-4 -right-4 opacity-20 rotate-12">
              <Target size={100} />
            </div>
            <div className="relative z-10 space-y-6">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] italic opacity-80">Accuracy Rating</h3>
              <div className="space-y-2">
                <p className="text-5xl font-heading font-black italic">
                  {userStats?.correctTips || 0} <span className="text-xl opacity-50">/ {games.filter(g => g.complete === 100).length}</span>
                </p>
                <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
                    style={{ width: `${(userStats?.correctTips || 0) / (games.filter(g => g.complete === 100).length || 1) * 100}%` }} 
                  />
                </div>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Keep it up, Champ!</p>
            </div>
          </div>
        </div>

        {/* Recent Results - Medium */}
        <div className="md:col-span-6 bg-white dark:bg-slate-800/50 rounded-[3rem] p-10 border-2 border-slate-100 dark:border-white/10 shadow-xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg">
              <Activity size={20} />
            </div>
            <h3 className="text-xl font-heading font-black uppercase italic text-slate-900 dark:text-white">Recent Results</h3>
          </div>
          <div className="space-y-4">
            {recentGames.map(game => (
              <div key={game.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-4 flex-1">
                  <img src={getTeamLogoUrl(game.hteam)} className="w-8 h-8 object-contain" alt="" />
                  <span className="text-xs font-black uppercase italic" style={{ color: game.winner === game.hteam ? teamColors.primary : '#94a3b8' }}>{game.hscore}</span>
                </div>
                <div className="px-3 py-1 bg-slate-200 dark:bg-slate-800 rounded-lg text-[8px] font-black text-slate-500 uppercase">Final</div>
                <div className="flex items-center gap-4 flex-1 justify-end">
                  <span className="text-xs font-black uppercase italic" style={{ color: game.winner === game.ateam ? teamColors.primary : '#94a3b8' }}>{game.ascore}</span>
                  <img src={getTeamLogoUrl(game.ateam)} className="w-8 h-8 object-contain" alt="" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Banter Preview - Medium */}
        <div className="md:col-span-6 bg-white dark:bg-slate-800/50 rounded-[3rem] p-10 border-2 border-slate-100 dark:border-white/10 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-lg">
                <MessageSquare size={20} />
              </div>
              <h3 className="text-xl font-heading font-black uppercase italic text-slate-900 dark:text-white">The Banter Board</h3>
            </div>
            <Link to="/banter" className="text-[10px] font-black uppercase tracking-widest text-amber-600 hover:underline">View All</Link>
          </div>
          
          <div className="space-y-4">
            <div className="p-5 bg-amber-50 dark:bg-amber-500/5 rounded-2xl border border-amber-100 dark:border-amber-500/10 italic">
              <p className="text-xs font-bold text-amber-900 dark:text-amber-200 leading-relaxed">
                "Adrian is looking dangerous at the top! Someone needs to take him down this round."
              </p>
              <div className="flex items-center gap-2 mt-3">
                <div className="w-5 h-5 rounded-full bg-amber-200" />
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-600">System Banter</span>
              </div>
            </div>
            <div className="p-5 bg-blue-50 dark:bg-blue-500/5 rounded-2xl border border-blue-100 dark:border-blue-500/10">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={14} className="text-blue-600" />
                <span className="text-[9px] font-black uppercase tracking-widest text-blue-600">League Rule</span>
              </div>
              <p className="text-[10px] font-bold text-blue-900 dark:text-blue-200 leading-relaxed uppercase tracking-tight">
                Missed a tip? You'll automatically get the <span className="text-blue-600 dark:text-blue-400">Away Team</span> for that match.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
