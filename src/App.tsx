
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { 
  Trophy, 
  LayoutDashboard, 
  Settings, 
  LogOut,
  ChevronRight,
  X,
  Minus,
  Maximize2,
  CloudLightning,
  ShieldCheck,
  User as UserIcon,
  ChevronLeft,
  Database,
  Printer,
  Sun,
  Moon,
  Zap,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Game, User, GameSettings } from './types.ts';
import { fetchGames, loadUsersFromDB, saveAllUsersToDB, saveSession, loadSession, isLocalMode, getTeamColors, loadGameSettings, saveGameSettings } from './utils.ts';
import TippingPage from './pages/Tipping.tsx';
import LadderPage from './pages/Ladder.tsx';
import AdminPage from './pages/Admin.tsx';
import ReportsPage from './pages/Reports.tsx';
import ProfilePage from './pages/Profile.tsx';
import DashboardPage from './pages/Dashboard.tsx';
import BanterPage from './pages/Banter.tsx';

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [gameSettings, setGameSettings] = useState<GameSettings>({ manualLocks: {} });
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [appReady, setAppReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const location = useLocation();
  const teamColors = currentUser?.favoriteTeam ? getTeamColors(currentUser.favoriteTeam) : { primary: '#2563eb', secondary: '#3b82f6', text: 'white' };

  useEffect(() => {
    const init = async () => {
      const data = await loadUsersFromDB();
      const session = loadSession();
      const settings = await loadGameSettings();
      setUsers(data);
      setGameSettings(settings);
      
      if (session.userId) {
        const found = data.find(u => u.id === session.userId);
        if (found) setCurrentUser(found);
      }
      const gameData = await fetchGames(2026);
      setGames(gameData);
      setAppReady(true);
    };
    init();
  }, []);

  useEffect(() => {
    if (!appReady) return;
    saveSession({ userId: currentUser?.id || null });
  }, [currentUser, appReady]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleUpdateUsers = async (updatedUsers: User[]) => {
    setSaving(true);
    setUsers(updatedUsers);
    await saveAllUsersToDB(updatedUsers);
    if (currentUser) {
      const refreshedUser = updatedUsers.find(u => u.id === currentUser.id);
      if (refreshedUser) setCurrentUser(refreshedUser);
    }
    setTimeout(() => setSaving(false), 800);
  };

  const handleUpdateSettings = async (updatedSettings: GameSettings) => {
    setSaving(true);
    setGameSettings(updatedSettings);
    await saveGameSettings(updatedSettings);
    setTimeout(() => setSaving(false), 800);
  };

  if (!appReady) {
    return (
      <div className="h-screen w-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center space-y-8">
        <CloudLightning className="text-blue-500 animate-pulse" size={64} />
        <div className="text-center space-y-4">
          <p className="text-slate-900 dark:text-white font-heading font-black uppercase tracking-[0.5em] text-xs italic">Syncing with Cloud</p>
          <div className="w-64 h-2 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden border border-slate-300 dark:border-white/10">
            <div className="h-full bg-blue-600 animate-[loading_2s_infinite_ease-in-out] shadow-[0_0_20px_rgba(37,99,235,0.6)]" />
          </div>
        </div>
        <style>{`@keyframes loading { 0% { width: 0%; } 50% { width: 70%; } 100% { width: 100%; } }`}</style>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="h-screen w-screen bg-white dark:bg-slate-950 flex flex-col overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-600/20 via-white to-white dark:from-blue-600/20 dark:via-slate-950 dark:to-slate-950" />
        <div className="h-12 bg-slate-100/40 dark:bg-black/40 border-b border-slate-200 dark:border-white/5 flex items-center justify-between px-6 shrink-0 z-10 backdrop-blur-md">
           <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
           </div>
           <span className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest italic">AFL Family Tipping • 2026 Edition</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
          <div className="max-w-5xl w-full space-y-16">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-28 h-28 rounded-[2.5rem] bg-blue-600 shadow-[0_0_60px_rgba(37,99,235,0.3)] mb-4 rotate-6 border-4 border-white/10 animate-float">
                <Trophy className="text-white" size={56} />
              </div>
              <h1 className="text-6xl md:text-9xl font-heading font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-[0.85]">
                ADRIAN'S <span className="text-blue-500 block md:inline">FAMILY</span>
              </h1>
              <p className="text-slate-500 dark:text-slate-500 font-black uppercase tracking-[0.8em] text-xs italic">Select Your Profile to Enter</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setCurrentUser(user)}
                  className="group relative bg-slate-100 dark:bg-white/5 border-2 border-slate-200 dark:border-white/5 p-8 rounded-[3.5rem] transition-all hover:bg-slate-200 dark:hover:bg-white/10 hover:scale-105 hover:border-blue-500/50 shadow-2xl"
                >
                  <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                      <div className="absolute -inset-2 bg-blue-600 rounded-full blur-2xl opacity-0 group-hover:opacity-40 transition-opacity" />
                      <img 
                        src={`https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(user.name)}`} 
                        alt={user.name} 
                        className="w-24 h-24 rounded-full border-4 border-white/5 group-hover:border-blue-500 transition-all duration-500 bg-slate-800 relative z-10"
                      />
                    </div>
                    <div className="text-center space-y-1">
                      <h3 className="text-xl font-heading font-black text-slate-900 dark:text-white group-hover:text-blue-400 transition-colors uppercase italic tracking-tight">{user.name}</h3>
                      {user.isAdmin && (
                        <div className="flex items-center justify-center gap-1.5 text-blue-500">
                          <ShieldCheck size={14} />
                          <span className="text-[9px] font-black uppercase tracking-widest">League Admin</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-white dark:bg-slate-950 flex flex-col overflow-hidden text-slate-600 dark:text-slate-300">
        {/* System Bar */}
        <div className="h-12 bg-slate-100 dark:bg-black border-b border-slate-200 dark:border-white/5 flex items-center justify-between px-6 shrink-0 z-50 print:hidden">
          <div className="flex items-center gap-6">
            <div className="flex gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{currentYear} Season Broadcast</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${saving ? 'bg-amber-500 animate-ping' : (isLocalMode() ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]' : 'bg-emerald-500')}`} />
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                {isLocalMode() ? 'Desktop Mode (LocalStorage)' : 'Cloud-Sync-Live'}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={toggleTheme} className="text-slate-700 hover:text-white cursor-pointer">
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <Minus size={16} className="text-slate-700 hover:text-white cursor-pointer" />
              <Maximize2 size={14} className="text-slate-700 hover:text-white cursor-pointer" />
              <X size={16} className="text-slate-700 hover:text-white cursor-pointer" />
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <nav className="w-80 bg-slate-50 dark:bg-slate-900/50 border-r border-slate-200 dark:border-white/5 flex flex-col shrink-0 backdrop-blur-3xl print:hidden">
            <div className="p-10">
              <div className="flex items-center gap-4 p-5 rounded-[2rem] bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-2xl">
                <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10" style={{ backgroundColor: teamColors.primary, boxShadow: `0 10px 20px ${teamColors.primary}40` }}>
                  <img src={`https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(currentUser.name)}`} alt={currentUser.name} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-heading font-black text-slate-900 dark:text-white truncate italic uppercase tracking-tight">{currentUser.name}</p>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] mt-0.5" style={{ color: teamColors.secondary }}>Arena Legend</p>
                </div>
              </div>
            </div>

            <div className="flex-1 px-6 space-y-2">
              <DesktopNavLink to="/" icon={<LayoutDashboard size={20} />} label="War Room" teamColors={teamColors} />
              <DesktopNavLink to="/tips" icon={<Zap size={20} />} label="Enter Tips" teamColors={teamColors} />
              <DesktopNavLink to="/ladder" icon={<Trophy size={20} />} label="Standings" teamColors={teamColors} />
              <DesktopNavLink to="/banter" icon={<MessageSquare size={20} />} label="Banter Board" teamColors={teamColors} />
              <DesktopNavLink to="/reports" icon={<Printer size={20} />} label="Print Results" teamColors={teamColors} />
              {currentUser.isAdmin && <DesktopNavLink to="/admin" icon={<Settings size={20} />} label="League Ops" teamColors={teamColors} />}
              <DesktopNavLink to="/profile" icon={<UserIcon size={20} />} label="My Profile" teamColors={teamColors} />
            </div>

            <div className="p-8 mt-auto border-t border-white/5 bg-black/40">
              <div className="space-y-4">
                <div className="w-full bg-slate-100 dark:bg-slate-800/50 text-blue-400 text-[10px] font-black uppercase tracking-widest px-5 py-4 rounded-2xl border-2 border-slate-200 dark:border-white/5 shadow-inner flex items-center justify-center gap-2 italic">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  2026 Season Active
                </div>
                <button onClick={() => setCurrentUser(null)} className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-2xl text-slate-500 dark:text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 transition-all group">
                  <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest italic">Exit Arena</span>
                </button>
              </div>
            </div>
          </nav>

          {/* Main Content Area */}
          <main className="flex-1 bg-slate-50 dark:bg-slate-900 overflow-y-auto relative text-slate-900 dark:text-slate-300 print:overflow-visible print:bg-white">
            <div className="p-12 md:p-16 print:p-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <Routes location={location}>
                    <Route path="/" element={<DashboardPage user={currentUser} users={users} games={games} year={currentYear} />} />
                    <Route path="/tips" element={<TippingPage user={currentUser} users={users} onUpdateUsers={handleUpdateUsers} games={games} year={currentYear} gameSettings={gameSettings} />} />
                    <Route path="/ladder" element={<LadderPage users={users} games={games} year={currentYear} />} />
                    <Route path="/banter" element={<BanterPage user={currentUser} />} />
                    <Route path="/reports" element={<ReportsPage users={users} games={games} year={currentYear} />} />
                    {currentUser.isAdmin && (
                      <Route path="/admin" element={<AdminPage users={users} onUpdateUsers={handleUpdateUsers} games={games} year={currentYear} gameSettings={gameSettings} onUpdateSettings={handleUpdateSettings} />} />
                    )}
                    <Route path="/profile" element={<ProfilePage user={currentUser} users={users} onUpdateUsers={handleUpdateUsers} games={games} year={currentYear} />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
  );
};

const DesktopNavLink: React.FC<{ to: string; icon: React.ReactNode; label: string; teamColors: any }> = ({ to, icon, label, teamColors }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link 
      to={to} 
      className={`flex items-center gap-5 px-6 py-4.5 rounded-[1.5rem] transition-all font-heading font-black text-xs uppercase tracking-[0.2em] italic ${
        isActive 
          ? 'text-white shadow-xl' 
          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/5 dark:hover:text-slate-200'
      }`}
      style={isActive ? { backgroundColor: teamColors.primary, boxShadow: `0 10px 30px -5px ${teamColors.primary}60` } : {}}
    >
      {icon}
      {label}
    </Link>
  );
};

export default App;
