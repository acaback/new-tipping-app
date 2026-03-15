
import React, { useState, useRef } from 'react';
import { User, Game, GameSettings } from '../types.ts';
import { formatAFLDate, isGameLocked } from '../utils.ts';
import { 
  Unlock, 
  Lock, 
  ShieldCheck, 
  UserPlus, 
  AlertCircle, 
  Trash2, 
  X, 
  Check, 
  Users, 
  Eraser, 
  LayoutGrid, 
  Hammer, 
  ChevronRight,
  Mail,
  Database,
  BarChart3,
  TrendingUp,
  PieChart,
  Upload,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import { generateLadder, getTeamLogoUrl, cleanTeamName, exportData, importData } from '../utils.ts';


interface AdminPageProps {
  users: User[];
  onUpdateUsers: (users: User[]) => void;
  games: Game[];
  year: number;
  gameSettings: GameSettings;
  onUpdateSettings: (settings: GameSettings) => void;
  onRestoreData: (users: User[], settings: GameSettings) => Promise<void>;
}

type TabType = 'users' | 'games' | 'stats' | 'system';

const AdminPage: React.FC<AdminPageProps> = ({ users, onUpdateUsers, games, year, gameSettings, onUpdateSettings, onRestoreData }) => {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [selectedUserId, setSelectedUserId] = useState<string>(users.length > 0 ? users[0].id : '');
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('password123');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearTipsId, setConfirmClearTipsId] = useState<string | null>(null);
  const [overrideUser, setOverrideUser] = useState<string>(users.length > 0 ? users[0].id : '');
  const [overrideRound, setOverrideRound] = useState<number>(1);
  const [overrideGame, setOverrideGame] = useState<number | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSendingReminders, setIsSendingReminders] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [reminderResult, setReminderResult] = useState<{success: boolean, message: string} | null>(null);
  const [lockRound, setLockRound] = useState<number>(games.find(g => g.complete < 100)?.round || 1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>, isEditing: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) { // 1MB limit
      alert("Image too large. Please select an image under 1MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (isEditing && editingUser) {
        setEditingUser({ ...editingUser, avatar: base64String });
      } else {
        // We'll store the pending avatar in a state if needed, 
        // but for now let's just use a simple approach
        setPendingAvatar(base64String);
      }
    };
    reader.readAsDataURL(file);
  };

  const [pendingAvatar, setPendingAvatar] = useState<string | undefined>(undefined);

  const handleAddUser = () => {
    if (!newUserName.trim() || !newUserUsername.trim()) return;
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username: newUserUsername.toLowerCase().trim(),
      password: newUserPassword,
      name: newUserName,
      email: '',
      avatar: pendingAvatar,
      isAdmin: false,
      tips: {},
      unlockedGames: {}
    };
    onUpdateUsers([...users, newUser]);
    setNewUserName('');
    setNewUserUsername('');
    setNewUserPassword('password123');
    setPendingAvatar(undefined);
  };

  const handleOverrideTip = (team: string) => {
    if (!overrideGame) return;

    const newUsers = users.map(u => {
      if (u.id === overrideUser) {
        const yearTips = u.tips[year] || {};
        const roundTips = yearTips[overrideRound] || [];
        const tipIndex = roundTips.findIndex(t => t.gameId === overrideGame);

        if (tipIndex > -1) {
          roundTips[tipIndex].winner = team;
        } else {
          roundTips.push({ gameId: overrideGame, winner: team, margin: null });
        }

        return {
          ...u,
          tips: {
            ...u.tips,
            [year]: {
              ...yearTips,
              [overrideRound]: roundTips
            }
          }
        };
      }
      return u;
    });

    onUpdateUsers(newUsers);
  };

  const toggleGameLock = (gameId: number) => {
    const targetUser = users.find(u => u.id === selectedUserId);
    if (!targetUser) return;

    const newUsers = users.map(u => {
      if (u.id === targetUser.id) {
        const currentlyUnlocked = u.unlockedGames[gameId] || false;
        return {
          ...u,
          unlockedGames: {
            ...u.unlockedGames,
            [gameId]: !currentlyUnlocked
          }
        };
      }
      return u;
    });

    onUpdateUsers(newUsers);
  };

  const toggleGlobalLock = (gameId: number, status: 'locked' | 'unlocked' | 'default') => {
    const newSettings: GameSettings = {
      ...gameSettings,
      manualLocks: {
        ...gameSettings.manualLocks,
        [gameId]: status
      }
    };
    onUpdateSettings(newSettings);
  };

  const handleClearTips = (id: string) => {
    const newUsers = users.map(u => {
      if (u.id === id) {
        return {
          ...u,
          tips: {
            ...u.tips,
            [year]: {} 
          }
        };
      }
      return u;
    });
    onUpdateUsers(newUsers);
    setConfirmClearTipsId(null);
  };

  const handleSendReminders = async () => {
    setIsSendingReminders(true);
    setReminderResult(null);

    try {
      const response = await fetch('/api/send-reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          users,
          games,
          year,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setReminderResult({ success: true, message: data.message || 'Reminders sent successfully!' });
      } else {
        setReminderResult({ success: false, message: data.error || 'Failed to send reminders.' });
      }
    } catch (error) {
      setReminderResult({ success: false, message: 'An error occurred.' });
    }

    setIsSendingReminders(false);
  };

  const confirmDeleteUser = (id: string) => {
    const userToDelete = users.find(u => u.id === id);
    if (!userToDelete) return;

    if (userToDelete.id === 'adrian') {
      alert("System Architecture Lock: Adrian's profile cannot be removed.");
      setConfirmDeleteId(null);
      return;
    }
    
    const filteredUsers = users.filter(u => u.id !== id);
    onUpdateUsers(filteredUsers);
    
    if (selectedUserId === id && filteredUsers.length > 0) {
      setSelectedUserId(filteredUsers[0].id);
    }
    setConfirmDeleteId(null);
  };

  

  const upcomingGames = games
    .filter(g => new Date() > new Date(g.date) && g.complete !== 100)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-3 rounded-[1.5rem] shadow-xl shadow-blue-200 dark:shadow-blue-900/50 rotate-3">
            <ShieldCheck className="text-white" size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Control Panel</h2>
            <p className="text-slate-400 dark:text-slate-500 font-black uppercase text-[10px] tracking-widest leading-none mt-1">League Management Console</p>
          </div>
        </div>

        <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-2 rounded-[2rem] border-2 border-slate-100 dark:border-white/10 overflow-x-auto">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-3 px-6 py-3 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all whitespace-nowrap ${
              activeTab === 'users' 
              ? 'bg-white dark:bg-slate-950 text-blue-600 shadow-xl' 
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-white'
            }`}
          >
            <Users size={16} />
            Players
          </button>
          <button
            onClick={() => setActiveTab('games')}
            className={`flex items-center gap-3 px-6 py-3 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all whitespace-nowrap ${
              activeTab === 'games' 
              ? 'bg-white dark:bg-slate-950 text-blue-600 shadow-xl' 
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-white'
            }`}
          >
            <Hammer size={16} />
            Overrides
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-3 px-6 py-3 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all whitespace-nowrap ${
              activeTab === 'stats' 
              ? 'bg-white dark:bg-slate-950 text-blue-600 shadow-xl' 
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-white'
            }`}
          >
            <BarChart3 size={16} />
            Stats
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`flex items-center gap-3 px-6 py-3 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all whitespace-nowrap ${
              activeTab === 'system' 
              ? 'bg-white dark:bg-slate-950 text-blue-600 shadow-xl' 
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-white'
            }`}
          >
            <Database size={16} />
            System
          </button>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
        {activeTab === 'users' && (
          <div className="grid md:grid-cols-12 gap-10">
            <div className="md:col-span-4 space-y-8">
              <div className="bg-white dark:bg-slate-800/50 p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-white/10 shadow-sm space-y-6">
                <div className="space-y-1">
                  <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-3 uppercase italic text-sm tracking-tight">
                    <UserPlus size={20} className="text-blue-500" />
                    Register Player
                  </h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Enroll a new family member</p>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-4 py-2">
                    <div className="relative group/avatar">
                      <div className="w-24 h-24 rounded-[2rem] bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-white/10 flex items-center justify-center overflow-hidden shadow-inner">
                        {pendingAvatar ? (
                          <img src={pendingAvatar} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <img src={`https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(newUserName || 'default')}`} alt="Default" className="w-full h-full object-cover opacity-50" />
                        )}
                      </div>
                      <div className="absolute -bottom-2 -right-2 flex gap-1">
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="p-2 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all"
                          title="Upload Photo"
                        >
                          <Upload size={14} />
                        </button>
                        <button 
                          onClick={() => setPendingAvatar(undefined)}
                          className="p-2 bg-slate-800 text-white rounded-xl shadow-lg hover:bg-slate-900 transition-all"
                          title="Use Default"
                        >
                          <Sparkles size={14} />
                        </button>
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => handleAvatarUpload(e)}
                      />
                    </div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Profile Picture</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-2">Display Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Uncle John" 
                      className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-black outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-inner text-slate-900 dark:text-white"
                      value={newUserName}
                      onChange={(e) => {
                        setNewUserName(e.target.value);
                        // Auto-generate username for internal use
                        setNewUserUsername(e.target.value.toLowerCase().replace(/\s+/g, ''));
                      }}
                    />
                  </div>
                  <button 
                    onClick={handleAddUser}
                    className="w-full bg-slate-900 dark:bg-blue-600 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-blue-600 dark:hover:bg-blue-500 active:scale-95 transition-all shadow-2xl shadow-slate-200 dark:shadow-blue-900/50 flex items-center justify-center gap-3 group"
                  >
                    Confirm Entry
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white space-y-6 shadow-2xl shadow-blue-200 border-4 border-white/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -translate-y-1/2 translate-x-1/2" />
                <h3 className="font-black italic uppercase text-base tracking-tight flex items-center gap-3 relative z-10">
                  <LayoutGrid size={22} />
                  League Pulse
                </h3>
                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-center border-b border-white/10 pb-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Season</span>
                    <span className="font-black text-lg">{year}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/10 pb-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Active Roster</span>
                    <span className="font-black text-lg">{users.length} Players</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Server Health</span>
                    <span className="flex items-center gap-2 font-black text-emerald-300">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      OPTIMAL
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-8">
              <div className="bg-white dark:bg-slate-800/50 p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-white/10 shadow-sm space-y-8">
                <div className="flex items-center justify-between border-b-2 border-slate-50 pb-6">
                  <div className="space-y-1">
                    <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-3 uppercase italic text-base tracking-tight">
                      <Users size={22} className="text-blue-500" />
                      Player Database
                    </h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Roster Management</p>
                  </div>
                  <div className="bg-slate-900 dark:bg-blue-600 text-white px-5 py-2 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 dark:shadow-blue-900/50 rotate-1">
                    {users.length} Enrolled
                  </div>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4">
                    {users.map(u => {
                      const isAdrian = u.id === 'adrian';
                      const isConfirmingDelete = confirmDeleteId === u.id;
                      const isConfirmingClear = confirmClearTipsId === u.id;
                      const isEditing = editingUser?.id === u.id;
                      
                      const userLadderEntry = generateLadder(users, games, year).find(l => l.userId === u.id);
                      const totalTips = Object.values(u.tips[year] || {}).reduce((acc: number, roundTips: any) => acc + (Array.isArray(roundTips) ? roundTips.filter((t: any) => t.winner !== null).length : 0), 0);

                      return (
                        <div key={u.id} className={`group relative p-6 rounded-[2rem] border-2 transition-all duration-500 ${isConfirmingDelete || isConfirmingClear ? 'border-rose-500 bg-rose-50 dark:bg-rose-500/10 ring-8 ring-rose-50 dark:ring-rose-500/20 scale-105 z-20' : 'border-slate-50 dark:border-white/5 bg-slate-50/30 dark:bg-slate-900/30 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-white dark:hover:bg-slate-800 hover:shadow-2xl hover:shadow-slate-200 dark:hover:shadow-none'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-700 border-2 border-slate-100 dark:border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-lg group-hover:rotate-3 transition-transform duration-500">
                                <img src={u.avatar || `https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(u.name)}`} alt={u.name} className="w-full h-full object-cover" />
                              </div>
                              <div className="min-w-0">
                                <p className={`text-base font-black truncate uppercase tracking-tighter italic ${isConfirmingDelete || isConfirmingClear ? 'text-rose-900' : 'text-slate-900 dark:text-white'}`}>{u.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{userLadderEntry?.points || 0} Pts • {totalTips} Tips</span>
                                </div>
                              </div>
                            </div>

                          <div className="flex items-center gap-2">
                            {isConfirmingClear ? (
                              <div className="flex items-center gap-1.5 animate-in zoom-in duration-300">
                                <button 
                                  onClick={() => handleClearTips(u.id)}
                                  className="p-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors shadow-lg shadow-amber-200"
                                >
                                  <Check size={16} />
                                </button>
                                <button 
                                  onClick={() => setConfirmClearTipsId(null)}
                                  className="p-3 bg-white dark:bg-slate-700 text-slate-400 dark:text-slate-300 rounded-xl border-2 border-slate-100 dark:border-white/10"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ) : isConfirmingDelete ? (
                              <div className="flex items-center gap-1.5 animate-in zoom-in duration-300">
                                <button 
                                  onClick={() => confirmDeleteUser(u.id)}
                                  className="p-3 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200"
                                >
                                  <Check size={16} />
                                </button>
                                <button 
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="p-3 bg-white dark:bg-slate-700 text-slate-400 dark:text-slate-300 rounded-xl border-2 border-slate-100 dark:border-white/10"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                                <button 
                                  onClick={() => setEditingUser(u)}
                                  className="p-3 text-slate-300 dark:text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-2xl transition-all"
                                  title="Edit Player"
                                >
                                  <Hammer size={18} />
                                </button>
                                <button 
                                  onClick={() => { setConfirmClearTipsId(u.id); setConfirmDeleteId(null); }}
                                  className="p-3 text-slate-300 dark:text-slate-500 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-2xl transition-all"
                                  title="Reset Progress"
                                >
                                  <Eraser size={18} />
                                </button>
                                {!isAdrian && (
                                  <button 
                                    onClick={() => { setConfirmDeleteId(u.id); setConfirmClearTipsId(null); }}
                                    className="p-3 text-slate-300 dark:text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-2xl transition-all"
                                    title="Eject Player"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        {isEditing && (
                          <div className="mt-4 space-y-4 animate-in fade-in duration-300 p-4 bg-white dark:bg-slate-800 rounded-2xl border-2 border-blue-500/20 shadow-xl">
                            <div className="flex flex-col items-center gap-4 py-2">
                              <div className="relative group/avatar">
                                <div className="w-20 h-20 rounded-[1.5rem] bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-white/10 flex items-center justify-center overflow-hidden shadow-inner">
                                  <img src={editingUser.avatar || `https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(editingUser.name)}`} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                                <div className="absolute -bottom-2 -right-2 flex gap-1">
                                  <button 
                                    onClick={() => editFileInputRef.current?.click()}
                                    className="p-1.5 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-all"
                                    title="Upload Photo"
                                  >
                                    <Upload size={12} />
                                  </button>
                                  <button 
                                    onClick={() => setEditingUser({ ...editingUser, avatar: undefined })}
                                    className="p-1.5 bg-slate-800 text-white rounded-lg shadow-lg hover:bg-slate-900 transition-all"
                                    title="Use Default"
                                  >
                                    <Sparkles size={12} />
                                  </button>
                                </div>
                                <input 
                                  type="file" 
                                  ref={editFileInputRef} 
                                  className="hidden" 
                                  accept="image/*"
                                  onChange={(e) => handleAvatarUpload(e, true)}
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Display Name</label>
                              <input 
                                type="text" 
                                value={editingUser.name}
                                onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-black outline-none focus:border-blue-500"
                              />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                              <button onClick={() => setEditingUser(null)} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-700">Cancel</button>
                              <button onClick={() => {
                                const newUsers = users.map(user => user.id === editingUser.id ? editingUser : user);
                                onUpdateUsers(newUsers);
                                setEditingUser(null);
                              }} className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-white bg-blue-600 rounded-xl shadow-lg shadow-blue-200 dark:shadow-blue-900/50">Save Changes</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'games' && (
          <div className="grid md:grid-cols-12 gap-10">
            <div className="md:col-span-5">
              <div className="bg-white dark:bg-slate-800/50 p-10 rounded-[3rem] border-2 border-slate-100 dark:border-white/10 shadow-sm space-y-8">
                <div className="space-y-2">
                  <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-3 uppercase italic text-base tracking-tight">
                    <Unlock size={22} className="text-blue-500" />
                    Admin Bypass
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-bold leading-relaxed uppercase tracking-widest opacity-80">
                    Grant manual access for missed kickoff deadlines.
                  </p>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] px-1">Select Active Contender</label>
                    <div className="grid grid-cols-2 gap-3">
                      {users.map(u => (
                        <button
                          key={u.id}
                          onClick={() => setSelectedUserId(u.id)}
                          className={`px-5 py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all border-2 ${
                            selectedUserId === u.id 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-2xl shadow-blue-100 dark:shadow-blue-900/50 -translate-y-1' 
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-50 dark:border-slate-700 text-slate-400 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-200 dark:hover:border-blue-500'
                          }`}
                        >
                          {u.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedUserId && (
                    <div className="space-y-3 pt-4">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] px-1">Individual Bypass (Round {lockRound})</label>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                        {games.filter(g => g.round === lockRound).map(g => {
                          const isUnlocked = users.find(u => u.id === selectedUserId)?.unlockedGames[g.id];
                          return (
                            <button
                              key={g.id}
                              onClick={() => toggleGameLock(g.id)}
                              className={`w-full flex items-center justify-between p-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                                isUnlocked 
                                ? 'bg-emerald-500 border-emerald-500 text-white' 
                                : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-white/5 text-slate-400'
                              }`}
                            >
                              <span className="truncate mr-2">{g.hteam} v {g.ateam}</span>
                              {isUnlocked ? <Unlock size={12} /> : <Lock size={12} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-amber-50 dark:bg-amber-500/10 border-l-8 border-amber-400 p-6 rounded-r-3xl">
                  <div className="flex gap-4">
                    <AlertCircle className="text-amber-500 shrink-0" size={24} />
                    <div>
                      <p className="text-xs font-black text-amber-900 dark:text-amber-300 uppercase tracking-widest">Protocol Warning</p>
                      <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold mt-1 uppercase leading-relaxed tracking-tight">Bypassing locks creates unfair advantages. Ensure the family agrees to this override!</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800/50 p-10 rounded-[3rem] border-2 border-slate-100 dark:border-white/10 shadow-sm space-y-8 mt-10">
                <div className="space-y-2">
                  <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-3 uppercase italic text-base tracking-tight">
                    <Hammer size={22} className="text-blue-500" />
                    Manual Tip Correction
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-bold leading-relaxed uppercase tracking-widest opacity-80">
                    Directly edit a player's tip for any game.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] px-1">Player</label>
                      <select 
                        value={overrideUser} 
                        onChange={(e) => setOverrideUser(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-black outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-inner mt-2 text-slate-900 dark:text-white"
                      >
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] px-1">Round</label>
                      <select 
                        value={overrideRound} 
                        onChange={(e) => { setOverrideRound(parseInt(e.target.value)); setOverrideGame(null); }}
                        className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-black outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-inner mt-2 text-slate-900 dark:text-white"
                      >
                        {Array.from(new Set(games.map(g => g.round))).map(r => <option key={r} value={r}>Round {r}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] px-1">Game</label>
                    <select 
                      value={overrideGame || ''} 
                      onChange={(e) => setOverrideGame(parseInt(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-black outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-inner mt-2 text-slate-900 dark:text-white"
                    >
                      <option value="" disabled>Select a game</option>
                      {games.filter(g => g.round === overrideRound).map(g => <option key={g.id} value={g.id}>{g.hteam} vs {g.ateam}</option>)}
                    </select>
                  </div>

                  {overrideGame && (
                    <div className="pt-4">
                      <p className="text-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] px-1 mb-3">Set Winner</p>
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => handleOverrideTip(games.find(g => g.id === overrideGame)?.hteam || '')}
                          className="bg-slate-900 dark:bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 dark:hover:bg-blue-500 transition-all"
                        >
                          {games.find(g => g.id === overrideGame)?.hteam}
                        </button>
                        <button 
                          onClick={() => handleOverrideTip(games.find(g => g.id === overrideGame)?.ateam || '')}
                          className="bg-slate-900 dark:bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 dark:hover:bg-blue-500 transition-all"
                        >
                          {games.find(g => g.id === overrideGame)?.ateam}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

            <div className="md:col-span-7">
              <div className="bg-white dark:bg-slate-800/50 p-10 rounded-[3rem] border-2 border-slate-100 dark:border-white/10 shadow-sm min-h-[500px] flex flex-col">
                <div className="flex items-center justify-between border-b-2 border-slate-50 pb-8 mb-8">
                   <div className="space-y-1">
                    <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-3 uppercase italic text-base tracking-tight">
                      <Lock size={22} className="text-slate-300 dark:text-slate-500" />
                      Global Game Locks
                    </h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Override kickoff deadlines</p>
                   </div>
                  <select 
                    value={lockRound} 
                    onChange={(e) => setLockRound(parseInt(e.target.value))}
                    className="bg-blue-600 text-white px-5 py-2 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 dark:shadow-blue-900/50 outline-none"
                  >
                    {Array.from(new Set(games.map(g => g.round))).map(r => <option key={r} value={r}>Round {r}</option>)}
                  </select>
                </div>

                <div className="flex-grow space-y-4 overflow-y-auto max-h-[600px] pr-3 custom-scrollbar">
                  {games.filter(g => g.round === lockRound).map(game => {
                    const currentStatus = gameSettings.manualLocks[game.id] || 'default';
                    const isActuallyLocked = isGameLocked(game, users[0], gameSettings); // Just a reference check

                    return (
                      <div key={game.id} className="group flex flex-col p-6 rounded-[2rem] border-2 border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-2xl hover:shadow-slate-200 dark:hover:shadow-none transition-all duration-500 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-5">
                            <div className="bg-slate-900 dark:bg-slate-700 p-3 rounded-2xl shadow-xl group-hover:rotate-6 transition-transform">
                               <div className="flex flex-col items-center justify-center w-8 h-8 font-black text-[11px] text-blue-400">
                                  {game.hteam[0]}{game.ateam[0]}
                               </div>
                            </div>
                            <div>
                              <div className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight italic">{game.hteam} <span className="text-slate-300 dark:text-slate-500">vs</span> {game.ateam}</div>
                              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mt-1">
                                {formatAFLDate(game.date, { weekday: 'short', day: 'numeric', month: 'short' })} @ {formatAFLDate(game.date, { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${isActuallyLocked ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {isActuallyLocked ? 'Currently Locked' : 'Currently Open'}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <button 
                            onClick={() => toggleGlobalLock(game.id, 'default')}
                            className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${currentStatus === 'default' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-slate-200'}`}
                          >
                            Auto (Time)
                          </button>
                          <button 
                            onClick={() => toggleGlobalLock(game.id, 'locked')}
                            className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${currentStatus === 'locked' ? 'bg-rose-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-slate-200'}`}
                          >
                            Force Lock
                          </button>
                          <button 
                            onClick={() => toggleGlobalLock(game.id, 'unlocked')}
                            className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${currentStatus === 'unlocked' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-slate-200'}`}
                          >
                            Force Open
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-10">
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-slate-800/50 p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-white/10 shadow-sm text-center space-y-2">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Avg. Points / Player</p>
                <div className="text-4xl font-heading font-black text-blue-600 italic">
                  {(generateLadder(users, games, year).reduce((acc, l) => acc + l.points, 0) / (users.length || 1)).toFixed(1)}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800/50 p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-white/10 shadow-sm text-center space-y-2">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Tips Cast</p>
                <div className="text-4xl font-heading font-black text-slate-900 dark:text-white italic">
                  {users.reduce((acc, u) => acc + Object.values(u.tips[year] || {}).reduce((sum: number, rt: any) => sum + (Array.isArray(rt) ? rt.filter((t: any) => t.winner !== null).length : 0), 0), 0)}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800/50 p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-white/10 shadow-sm text-center space-y-2">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Games Completed</p>
                <div className="text-4xl font-heading font-black text-emerald-500 italic">
                  {games.filter(g => g.complete === 100).length}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800/50 p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-white/10 shadow-sm text-center space-y-2">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Most Accurate</p>
                <div className="text-2xl font-heading font-black text-amber-500 italic truncate px-2">
                  {generateLadder(users, games, year)[0]?.userName || 'N/A'}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800/50 p-10 rounded-[3rem] border-2 border-slate-100 dark:border-white/10 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <TrendingUp size={24} className="text-blue-500" />
                <h3 className="text-xl font-heading font-black uppercase italic text-slate-900 dark:text-white">Round Participation</h3>
              </div>
              <div className="space-y-4">
                {Array.from(new Set(games.map(g => g.round))).sort((a, b) => (b as number) - (a as number)).map(round => {
                  const playersTipped = users.filter(u => ((u.tips[year] as any)?.[round as number]?.length || 0) > 0).length;
                  const percentage = (playersTipped / (users.length || 1)) * 100;
                  return (
                    <div key={round} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <span className="text-xs font-black text-slate-900 dark:text-white uppercase italic">Round {round}</span>
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{playersTipped} / {users.length} Players</span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-200 dark:border-white/5">
                        <div 
                          className="h-full bg-blue-600 transition-all duration-1000" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800/50 p-10 rounded-[3rem] border-2 border-slate-100 dark:border-white/10 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <PieChart size={24} className="text-blue-500" />
                <h3 className="text-xl font-heading font-black uppercase italic text-slate-900 dark:text-white">Most Tipped Teams (Current Round)</h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                {(() => {
                  const currentRound = games.find(g => g.complete < 100)?.round || 1;
                  const teamCounts: { [team: string]: number } = {};
                  users.forEach(u => {
                    const roundTips = u.tips[year]?.[currentRound] || [];
                    roundTips.forEach(t => {
                      if (t.winner) {
                        teamCounts[t.winner] = (teamCounts[t.winner] || 0) + 1;
                      }
                    });
                  });
                  const sortedTeams = Object.entries(teamCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
                  
                  return sortedTeams.length > 0 ? sortedTeams.map(([team, count]) => (
                    <div key={team} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5">
                      <div className="flex items-center gap-4">
                        <img src={getTeamLogoUrl(team)} className="w-10 h-10 object-contain" alt="" />
                        <span className="font-black uppercase italic text-slate-900 dark:text-white">{cleanTeamName(team)}</span>
                      </div>
                      <div className="text-xl font-heading font-black text-blue-600 italic">{count}</div>
                    </div>
                  )) : (
                    <div className="col-span-2 text-center py-10 text-slate-400 font-black uppercase tracking-widest italic">No tips cast for the current round yet.</div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-8">
            <div className="bg-white dark:bg-slate-800/50 p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-white/10 shadow-sm space-y-6">
              <div className="space-y-1">
                <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-3 uppercase italic text-sm tracking-tight">
                  <Mail size={20} className="text-blue-500" />
                  Tipping Reminders
                </h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Send an email to all players who have not completed their tips for the upcoming round.</p>
              </div>
              <button
                  onClick={handleSendReminders}
                  disabled={isSendingReminders}
                  className="w-full bg-slate-900 dark:bg-blue-600 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-blue-600 dark:hover:bg-blue-500 active:scale-95 transition-all shadow-2xl shadow-slate-200 dark:shadow-blue-900/50 flex items-center justify-center gap-3 group disabled:opacity-50"
              >
                  {isSendingReminders ? 'Sending...' : 'Send Reminders'}
              </button>
              {reminderResult && (
                  <p className={`text-xs mt-2 text-center italic ${reminderResult.success ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {reminderResult.message}
                  </p>
              )}
            </div>

            <div className="bg-white dark:bg-slate-800/50 p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-white/10 shadow-sm space-y-6">
              <div className="space-y-1">
                <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-3 uppercase italic text-sm tracking-tight">
                  <Database size={20} className="text-blue-500" />
                  Data Management (Backup & Restore)
                </h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Download a copy of all league data or restore from a previous backup.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => exportData(users, gameSettings)}
                  className="bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-600 transition-all flex items-center justify-center gap-2"
                >
                  <TrendingUp size={14} className="rotate-180" />
                  Export Data
                </button>
                <button
                  onClick={() => {
                    setIsSelecting(true);
                    importFileInputRef.current?.click();
                    // Fallback to reset state if picker is cancelled
                    const handleFocus = () => {
                      window.removeEventListener('focus', handleFocus);
                      setTimeout(() => setIsSelecting(false), 1000);
                    };
                    window.addEventListener('focus', handleFocus);
                  }}
                  disabled={isImporting || isSelecting}
                  className="bg-blue-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200 dark:shadow-blue-900/50 disabled:opacity-50"
                >
                  <Upload size={14} className={isImporting || isSelecting ? 'animate-bounce' : ''} />
                  {isImporting || isSelecting ? 'Processing...' : 'Import Data'}
                </button>
                <input
                  type="file"
                  ref={importFileInputRef}
                  className="hidden"
                  accept=".json"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    setIsImporting(true);
                    try {
                      console.log("File selected for import:", file.name);
                      // Small delay to ensure the UI updates to "Processing..." before any blocking calls
                      await new Promise(resolve => setTimeout(resolve, 100));
                      
                      const data = await importData(file);
                      if (data) {
                        console.log("Data parsed, asking for confirmation...");
                        if (confirm('Are you sure you want to restore? This will overwrite all current data.')) {
                          console.log("Confirmation received. Performing clean restore...");
                          await onRestoreData(data.users, data.settings);
                          console.log("Restore complete. Reloading...");
                          alert('Data restored successfully! The page will now refresh.');
                          window.location.reload();
                        } else {
                          console.log("Import cancelled by user.");
                        }
                      } else {
                        alert('Failed to restore data. The backup file appears to be invalid or corrupted. Please check the console for details.');
                      }
                    } catch (error) {
                      console.error("Import error in AdminPage:", error);
                      alert('An unexpected error occurred during the import process. Check the console for details.');
                    } finally {
                      setIsImporting(false);
                      e.target.value = '';
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}

        
      </div>
    </div>
  );
};

export default AdminPage;
