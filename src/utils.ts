
import { collection, doc, getDocs, setDoc, getDoc } from 'firebase/firestore';
import { Game, User, LadderEntry, ApplicationState, AFLLadderEntry, GameSettings } from './types.ts';
import { db } from './firebase';

export const SESSION_KEY = 'adrians_tipping_session';

export const isLocalMode = () => {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  return !apiKey || apiKey === 'your-api-key' || apiKey.trim() === '';
};

const USERS_STORAGE_KEY = 'adrians_tipping_users';
const SETTINGS_STORAGE_KEY = 'adrians_tipping_settings';

export const fetchGames = async (year: number): Promise<Game[]> => {
  try {
    const res = await fetch(`/api/squiggle/games?year=${year}`);
    const data = await res.json();
    return data.games;
  } catch (error) {
    console.error("Failed to fetch games from Squiggle API via proxy", error);
    return [];
  }
};

export const loadUsersFromDB = async (): Promise<User[]> => {
  if (isLocalMode()) {
    const local = localStorage.getItem(USERS_STORAGE_KEY);
    if (local) return JSON.parse(local);
    return getInitialUsers();
  }

  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const users = querySnapshot.docs.map(doc => doc.data() as User);
    if (users.length === 0) {
      return getInitialUsers();
    }
    return users;
  } catch (error) {
    console.error("Error loading users from Firestore: ", error);
    // Fallback to local storage even if not in local mode if Firestore fails
    const local = localStorage.getItem(USERS_STORAGE_KEY);
    if (local) return JSON.parse(local);
    return getInitialUsers();
  }
};

export const saveAllUsersToDB = async (users: User[]) => {
  // Always save to local storage as a backup
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

  if (isLocalMode()) return;

  try {
    for (const user of users) {
      await setDoc(doc(db, 'users', user.id), user);
    }
  } catch (error) {
    console.error("Error saving users to Firestore: ", error);
  }
};

export const loadGameSettings = async (): Promise<GameSettings> => {
  if (isLocalMode()) {
    const local = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (local) return JSON.parse(local);
    return { manualLocks: {} };
  }

  try {
    const docRef = doc(db, 'settings', 'global');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as GameSettings;
    }
    return { manualLocks: {} };
  } catch (error) {
    console.error("Error loading settings from Firestore: ", error);
    const local = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (local) return JSON.parse(local);
    return { manualLocks: {} };
  }
};

export const saveGameSettings = async (settings: GameSettings) => {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));

  if (isLocalMode()) return;

  try {
    await setDoc(doc(db, 'settings', 'global'), settings);
  } catch (error) {
    console.error("Error saving settings to Firestore: ", error);
  }
};

export const getInitialUsers = (): User[] => {
  const initialUsers = [
    { id: 'adrian', username: 'admin', password: 'password2026', name: 'Adrian', email: 'adrian@example.com', isAdmin: true, tips: {}, unlockedGames: {} },
    { id: 'mum', username: 'mum', password: 'password123', name: 'Mum', email: 'mum@example.com', isAdmin: false, tips: {}, unlockedGames: {} },
    { id: 'dad', username: 'dad', password: 'password123', name: 'Dad', email: 'dad@example.com', isAdmin: false, tips: {}, unlockedGames: {} },
    { id: 'buddy', username: 'buddy', password: 'password123', name: 'Buddy', email: 'buddy@example.com', isAdmin: false, tips: {}, unlockedGames: {} },
  ];
  // Fire and forget save
  saveAllUsersToDB(initialUsers).catch(console.error);
  return initialUsers;
};

export const cleanTeamName = (name: string): string => {
  const mapping: Record<string, string> = {
    "Brisbane Lions": "Brisbane", "Sydney Swans": "Sydney", "Greater Western Sydney": "GWS",
    "Gold Coast": "Gold Coast", "Western Bulldogs": "Western Bulldogs", "Adelaide Crows": "Adelaide",
    "West Coast Eagles": "West Coast", "Geelong Cats": "Geelong", "Fremantle Dockers": "Fremantle",
    "Collingwood Magpies": "Collingwood", "Richmond Tigers": "Richmond", "Essendon Bombers": "Essendon",
    "Carlton Blues": "Carlton", "Melbourne Demons": "Melbourne", "St Kilda Saints": "St Kilda",
    "North Melbourne Kangaroos": "North Melbourne", "Hawthorn Hawks": "Hawthorn", "Port Adelaide Power": "Port Adelaide"
  };
  return mapping[name] || name;
};

export const getTeamColors = (name: string) => {
  const clean = cleanTeamName(name);
  const colors: Record<string, { primary: string, secondary: string, text: string }> = {
    "Adelaide": { primary: "#002b5c", secondary: "#e21e31", text: "white" },
    "Brisbane": { primary: "#730033", secondary: "#fdb813", text: "white" },
    "Carlton": { primary: "#031a29", secondary: "#ffffff", text: "white" },
    "Collingwood": { primary: "#000000", secondary: "#ffffff", text: "white" },
    "Essendon": { primary: "#cc2031", secondary: "#000000", text: "white" },
    "Fremantle": { primary: "#2a1a54", secondary: "#ffffff", text: "white" },
    "Geelong": { primary: "#1c3c63", secondary: "#ffffff", text: "white" },
    "Gold Coast": { primary: "#e11b0a", secondary: "#ffd200", text: "white" },
    "GWS": { primary: "#f47920", secondary: "#313c42", text: "white" },
    "Hawthorn": { primary: "#4d2004", secondary: "#fbdb00", text: "white" },
    "Melbourne": { primary: "#051124", secondary: "#de1f2f", text: "white" },
    "North Melbourne": { primary: "#0038a8", secondary: "#ffffff", text: "white" },
    "Port Adelaide": { primary: "#000000", secondary: "#008aab", text: "white" },
    "Richmond": { primary: "#000000", secondary: "#fed102", text: "white" },
    "St Kilda": { primary: "#ed0f05", secondary: "#ffffff", text: "white" },
    "Sydney": { primary: "#ed171f", secondary: "#ffffff", text: "white" },
    "West Coast": { primary: "#002c73", secondary: "#f2a900", text: "white" },
    "Western Bulldogs": { primary: "#014896", secondary: "#c70130", text: "white" }
  };
  return colors[clean] || { primary: "#334155", secondary: "#64748b", text: "white" };
};

export const getTeamLogoUrl = (name: string) => {
  const mapping: Record<string, string> = {
    "Adelaide": "Adelaide", "Brisbane": "Brisbane", "Carlton": "Carlton",
    "Collingwood": "Collingwood", "Essendon": "Essendon", "Fremantle": "Fremantle", "Geelong": "Geelong",
    "Gold Coast": "GoldCoast", "GWS": "GWS", "Hawthorn": "Hawthorn",
    "Melbourne": "Melbourne", "North Melbourne": "NorthMelbourne", "Port Adelaide": "PortAdelaide",
    "Richmond": "Richmond", "St Kilda": "StKilda", "Sydney": "Sydney",
    "West Coast": "WestCoast", "Western Bulldogs": "Bulldogs"
  };
  return `https://squiggle.com.au/images/teams/${mapping[cleanTeamName(name)] || 'AFL'}.png`;
};

export const saveSession = (state: ApplicationState) => localStorage.setItem(SESSION_KEY, JSON.stringify(state));
export const loadSession = (): ApplicationState => {
  const s = localStorage.getItem(SESSION_KEY);
  return s ? JSON.parse(s) : { userId: null };
};

export const calculateScores = (user: User, games: Game[], year: number) => {
  let points = 0, totalMarginError = 0, correctTips = 0;
  const tips = user.tips[year] || {};
  
  games.forEach(g => {
    if (g.complete === 100) {
      const roundTips = tips[g.round] || [];
      let tip = roundTips.find(t => t.gameId === g.id);
      
      // Automatic Away Team Awarding: 
      // If no tip exists and the game has started (is locked), award the away team.
      // Note: we use the away team as the fallback winner.
      const effectiveWinner = tip?.winner || g.ateam;
      
      if (effectiveWinner === g.winner) { 
        points++; 
        correctTips++; 
      }
      
      const roundGames = games.filter(rg => rg.round === g.round).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      if (roundGames[0].id === g.id) {
        // For the margin game (first game of round), if tip exists use it, otherwise margin error is based on 0 margin if no tip
        const effectiveMargin = tip && typeof tip.margin === 'number' ? tip.margin : 0;
        totalMarginError += Math.abs(effectiveMargin - Math.abs((g.hscore||0)-(g.ascore||0)));
      }
    }
  });
  return { points, totalMarginError, correctTips };
};

export const generateLadder = (users: User[], games: Game[], year: number): LadderEntry[] => {
  return users.map(u => {
    const s = calculateScores(u, games, year);
    return { userId: u.id, userName: u.name, ...s };
  }).sort((a,b) => b.points - a.points || a.totalMarginError - b.totalMarginError);
};

export const isGameLocked = (game: Game, user: User, settings?: GameSettings) => {
  // 1. Check manual global locks first
  if (settings?.manualLocks?.[game.id]) {
    const lockStatus = settings.manualLocks[game.id];
    if (lockStatus === 'locked') return true;
    if (lockStatus === 'unlocked') return false;
  }

  // 2. Check per-user override (legacy/individual bypass)
  if (user.unlockedGames[game.id]) return false;

  // 3. Default time-based logic
  const dateWithoutOffset = game.date.replace(' ', 'T');
  const tempDate = new Date(dateWithoutOffset);
  const month = tempDate.getMonth(); // 0-11
  // DST in Australia: Oct (9) to April (3). 
  // AFL season is mostly Mar-Sept. Mar/Apr and Oct are transition months.
  // For simplicity and 99% accuracy for AFL:
  const isDST = month >= 9 || month <= 3; 
  const offset = isDST ? '+11:00' : '+10:00';
  
  const gameDate = new Date(game.date.includes('+') || game.date.includes('Z') ? game.date : dateWithoutOffset + offset);
  return new Date() > gameDate;
};

export const formatAFLDate = (dateStr: string, options: Intl.DateTimeFormatOptions = {}) => {
  // Squiggle 'date' is in AEST/AEDT. 
  const dateWithoutOffset = dateStr.replace(' ', 'T');
  const tempDate = new Date(dateWithoutOffset);
  const month = tempDate.getMonth();
  const isDST = month >= 9 || month <= 3;
  const offset = isDST ? '+11:00' : '+10:00';

  const normalized = dateStr.includes('+') || dateStr.includes('Z') ? dateStr : dateWithoutOffset + offset;
  return new Date(normalized).toLocaleString('en-AU', {
    ...options,
    // Removed fixed Perth timezone to respect user's local time
  });
};

export const fetchAFLLadder = async (year: number): Promise<AFLLadderEntry[]> => {
  try {
    const res = await fetch(`/api/squiggle/ladder?year=${year}`);
    const data = await res.json();
    if (data.ladder) {
      return data.ladder.map((team: any) => ({
        ...team,
        id: team.teamid || team.id,
        percentage: parseFloat(team.percentage),
      }));
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch AFL ladder from Squiggle API via proxy", error);
    return [];
  }
};
