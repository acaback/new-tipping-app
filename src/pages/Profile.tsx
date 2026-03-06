import React, { useState, useMemo } from 'react';
import { User, Game, UserTips, Tip } from '../types';
import { User as UserIcon, Save, BarChart2, History } from 'lucide-react';

interface ProfilePageProps {
  user: User;
  users: User[];
  onUpdateUsers: (users: User[]) => void;
  games: Game[];
  year: number;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, users, onUpdateUsers, games, year }) => {
  const [name, setName] = useState(user.name);
  const [favoriteTeam, setFavoriteTeam] = useState(user.favoriteTeam || '');

  const teams = [
    "Adelaide", "Brisbane", "Carlton", "Collingwood", "Essendon", "Fremantle", 
    "Geelong", "Gold Coast", "GWS", "Hawthorn", "Melbourne", "North Melbourne", 
    "Port Adelaide", "Richmond", "St Kilda", "Sydney", "West Coast", "Western Bulldogs"
  ];

  const stats = useMemo(() => {
    const userTips: UserTips = user.tips[year] || {};
    let totalTips = 0;
    let correctTips = 0;

    Object.values(userTips).forEach((roundTips: Tip[]) => {
      roundTips.forEach((tip: Tip) => {
        const game = games.find(g => g.id === tip.gameId);
        if (game && game.complete === 100) {
          totalTips++;
          if (tip.winner === game.winner) {
            correctTips++;
          }
        }
      });
    });

    const winRate = totalTips > 0 ? (correctTips / totalTips) * 100 : 0;
    return { totalTips, correctTips, winRate };
  }, [user, games, year]);

  const roundHistory = useMemo(() => {
    const userTipsByRound: UserTips = user.tips[year] || {};
    const rounds = [...new Set(games.map(g => g.round))].sort((a: number, b: number) => a - b);

    const history = rounds.map((roundNum: number) => {
        const gamesInRound = games.filter(g => g.round === roundNum && g.complete === 100);
        if (gamesInRound.length === 0) return null;

        const tipsForRound = userTipsByRound[roundNum] || [];
        
        let correctTips = 0;
        let marginError = null;

        gamesInRound.forEach((game, idx) => {
            const tip = tipsForRound.find(t => t.gameId === game.id);
            if (tip) {
                if (tip.winner === game.winner) {
                    correctTips++;
                }

                if (idx === 0 && tip.margin !== null && game.hscore !== null && game.ascore !== null) {
                    const actualMargin = Math.abs(game.hscore - game.ascore);
                    marginError = Math.abs(tip.margin - actualMargin);
                }
            }
        });
        
        return {
            round: roundNum,
            correctTips,
            totalGames: gamesInRound.length,
            marginError,
        };
    }).filter((r): r is { round: number; correctTips: number; totalGames: number; marginError: number | null } => r !== null);

    return history;
  }, [user, games, year]);

  const handleSaveChanges = () => {
    if (name.trim() === '') {
      alert('Name cannot be empty.');
      return;
    }
    const updatedUsers = users.map(u => 
      u.id === user.id ? { ...u, name: name.trim(), favoriteTeam } : u
    );
    onUpdateUsers(updatedUsers);
    alert('Profile updated successfully!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 p-3 rounded-[1.5rem] shadow-xl shadow-blue-200 dark:shadow-blue-900/50 rotate-3">
          <UserIcon className="text-white" size={28} />
        </div>
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">My Profile</h2>
          <p className="text-slate-400 dark:text-slate-500 font-black uppercase text-[10px] tracking-widest leading-none mt-1">Manage your identity and view stats</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-800/50 p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-white/10 shadow-sm space-y-6">
          <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-3 uppercase italic text-sm tracking-tight">
            Edit Your Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-2">Display Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-2 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-black outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-inner text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-2">Favorite Team</label>
              <select 
                value={favoriteTeam}
                onChange={(e) => setFavoriteTeam(e.target.value)}
                className="w-full mt-2 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-black outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-inner text-slate-900 dark:text-white"
              >
                <option value="">Select a team</option>
                {teams.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </div>
            <button 
              onClick={handleSaveChanges}
              className="w-full bg-slate-900 dark:bg-blue-600 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-blue-600 dark:hover:bg-blue-500 active:scale-95 transition-all shadow-2xl shadow-slate-200 dark:shadow-blue-900/50 flex items-center justify-center gap-3 group"
            >
              <Save size={16} />
              Save Changes
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/50 p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-white/10 shadow-sm space-y-6">
          <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-3 uppercase italic text-sm tracking-tight">
            <BarChart2 size={20} className="text-blue-500" />
            Season Statistics
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border-2 border-slate-100 dark:border-white/10">
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Tips (Completed Games)</span>
              <span className="font-black text-lg text-slate-900 dark:text-white">{stats.totalTips}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border-2 border-slate-100 dark:border-white/10">
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Correct Tips</span>
              <span className="font-black text-lg text-emerald-600 dark:text-emerald-400">{stats.correctTips}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border-2 border-slate-100 dark:border-white/10">
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Win Rate</span>
              <span className="font-black text-lg text-blue-600 dark:text-blue-400">{stats.winRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 bg-white dark:bg-slate-800/50 p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-white/10 shadow-sm space-y-6">
          <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-3 uppercase italic text-sm tracking-tight">
            <History size={20} className="text-blue-500" />
            Tipping History ({year})
          </h3>
          <div className="overflow-x-auto -mx-8">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-slate-100 dark:border-white/10">
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Round</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Score</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Margin Error</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-50 dark:divide-white/10">
                {roundHistory.length > 0 ? (
                  roundHistory.map(item => (
                    <tr key={item.round}>
                      <td className="px-8 py-4 font-black text-slate-900 dark:text-white">Round {item.round}</td>
                      <td className="px-8 py-4 font-black text-slate-600 dark:text-slate-300 text-center tabular-nums">{item.correctTips} / {item.totalGames}</td>
                      <td className="px-8 py-4 font-black text-slate-600 dark:text-slate-300 text-center tabular-nums">
                        {item.marginError !== null ? `${item.marginError} pts` : 'N/A'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-8 py-12 text-center text-slate-400 dark:text-slate-500 italic text-sm">
                      No tipping history for completed rounds yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
