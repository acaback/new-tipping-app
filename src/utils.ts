
import { collection, doc, getDocs, setDoc, getDoc, writeBatch, getDocsFromServer, query } from 'firebase/firestore';
import { Game, User, LadderEntry, ApplicationState, AFLLadderEntry, GameSettings } from './types.ts';
import { auth, db } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const SESSION_KEY = 'adrians_tipping_session';

import firebaseConfig from '../firebase-applet-config.json';

export const isLocalMode = () => {
  return !firebaseConfig.apiKey || firebaseConfig.apiKey === 'your-api-key' || firebaseConfig.apiKey.trim() === '';
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
    const querySnapshot = await getDocsFromServer(collection(db, 'users'));
    const users = querySnapshot.docs.map(doc => doc.data() as User);
    if (users.length === 0) {
      return getInitialUsers();
    }
    return users;
  } catch (error) {
    console.warn("Firestore loadUsersFromDB failed, falling back to local/initial users", error);
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
    const batch = writeBatch(db);
    users.forEach(user => {
      const userRef = doc(db, 'users', user.id);
      batch.set(userRef, user);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'users');
  }
};

export const restoreData = async (users: User[], settings: GameSettings) => {
  // 1. Update local storage immediately
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));

  if (isLocalMode()) return;

  try {
    const batch = writeBatch(db);
    const snapshot = await getDocsFromServer(collection(db, 'users'));
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    users.forEach((user) => {
      const userRef = doc(db, 'users', user.id);
      batch.set(userRef, user);
    });
    const settingsRef = doc(db, 'settings', 'global');
    batch.set(settingsRef, settings);
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'restore');
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
    console.warn("Firestore loadGameSettings failed, falling back to local/default", error);
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
    handleFirestoreError(error, OperationType.WRITE, 'settings/global');
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
  const clean = cleanTeamName(name);
  const mapping: Record<string, string> = {
    "Adelaide": "ADL",
    "Brisbane": "BRL",
    "Carlton": "CAR",
    "Collingwood": "COL",
    "Essendon": "ESS",
    "Fremantle": "FRE",
    "Geelong": "GEE",
    "Gold Coast": "GCS",
    "GWS": "GWS",
    "Hawthorn": "HAW",
    "Melbourne": "MEL",
    "North Melbourne": "NMFC",
    "Port Adelaide": "PTA",
    "Richmond": "RIC",
    "St Kilda": "STK",
    "Sydney": "SYD",
    "West Coast": "WCE",
    "Western Bulldogs": "WBD"
  };
  const code = mapping[clean];
  if (code) {
    return `https://s.afl.com.au/static-resources/aflc/static/images/logos/afl/club-logos/${code}.png`;
  }
  return `https://squiggle.com.au/images/teams/AFL.png`;
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

export const exportData = (users: User[], settings: GameSettings) => {
  const data = {
    users,
    settings,
    exportedAt: new Date().toISOString(),
    version: '1.0'
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tipping_backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const importData = async (file: File): Promise<{ users: User[], settings: GameSettings } | null> => {
  try {
    console.log("Starting file import for:", file.name);
    const text = await file.text();
    const data = JSON.parse(text);
    
    if (data && data.users && Array.isArray(data.users)) {
      console.log("Import data validated successfully. Users count:", data.users.length);
      return {
        users: data.users,
        settings: data.settings || { manualLocks: {} }
      };
    }
    
    console.warn("Import data validation failed: missing users array or invalid structure", data);
    return null;
  } catch (error) {
    console.error("Failed to parse backup file:", error);
    return null;
  }
};

export const AFL_TEAMS = [
  "Adelaide", "Brisbane Lions", "Carlton", "Collingwood", "Essendon", "Fremantle",
  "Geelong", "Gold Coast", "Greater Western Sydney", "Hawthorn", "Melbourne", "North Melbourne",
  "Port Adelaide", "Richmond", "St Kilda", "Sydney", "West Coast", "Western Bulldogs"
];

export const calculateAFLLadder = (games: Game[]): AFLLadderEntry[] => {
  const teams: Record<string, { wins: number, losses: number, draws: number, for: number, against: number, name: string }> = {};

  // Initialize all 18 teams using standardized names
  AFL_TEAMS.forEach(name => {
    teams[name] = { wins: 0, losses: 0, draws: 0, for: 0, against: 0, name };
  });

  games.forEach(g => {
    // Include games that have started (complete > 0)
    if (g.complete > 0) {
      // Normalize names using cleanTeamName for robust matching
      const hteamClean = cleanTeamName(g.hteam);
      const ateamClean = cleanTeamName(g.ateam);
      
      const hteam = AFL_TEAMS.find(t => cleanTeamName(t) === hteamClean) || g.hteam;
      const ateam = AFL_TEAMS.find(t => cleanTeamName(t) === ateamClean) || g.ateam;

      if (!teams[hteam]) teams[hteam] = { wins: 0, losses: 0, draws: 0, for: 0, against: 0, name: hteam };
      if (!teams[ateam]) teams[ateam] = { wins: 0, losses: 0, draws: 0, for: 0, against: 0, name: ateam };

      const hscore = g.hscore || 0;
      const ascore = g.ascore || 0;

      teams[hteam].for += hscore;
      teams[hteam].against += ascore;
      teams[ateam].for += ascore;
      teams[ateam].against += hscore;

      // Only count wins/losses/draws for completed games
      if (g.complete === 100) {
        if (hscore > ascore) {
          teams[hteam].wins++;
          teams[ateam].losses++;
        } else if (ascore > hscore) {
          teams[ateam].wins++;
          teams[hteam].losses++;
        } else {
          teams[hteam].draws++;
          teams[ateam].draws++;
        }
      }
    }
  });

  const ladder: AFLLadderEntry[] = Object.values(teams).map(t => {
    const points = (t.wins * 4) + (t.draws * 2);
    // AFL percentage: (For / Against) * 100
    const percentage = t.against === 0 ? (t.for > 0 ? 999.9 : 0) : (t.for / t.against) * 100;
    return {
      id: 0,
      name: t.name,
      rank: 0,
      wins: t.wins,
      losses: t.losses,
      draws: t.draws,
      points,
      percentage,
      logo: getTeamLogoUrl(t.name)
    };
  });

  return ladder.sort((a, b) => {
    // 1. Points
    if (b.points !== a.points) return b.points - a.points;
    // 2. Percentage
    if (Math.abs(b.percentage - a.percentage) > 0.001) return b.percentage - a.percentage;
    // 3. Points For (as a secondary tie-breaker)
    const teamA = teams[a.name];
    const teamB = teams[b.name];
    if (teamB && teamA && teamB.for !== teamA.for) return teamB.for - teamA.for;
    // 4. Alphabetical
    return a.name.localeCompare(b.name);
  }).map((t, i) => ({ ...t, rank: i + 1 }));
};

export const fetchAFLLadder = async (year: number): Promise<AFLLadderEntry[]> => {
  try {
    const res = await fetch(`/api/squiggle/ladder?year=${year}`);
    const data = await res.json();
    
    const mapTeam = (team: any) => ({
      ...team,
      name: team.team || team.name,
      id: team.teamid || team.id,
      rank: team.rank || team.position || 0,
      wins: team.wins || 0,
      losses: team.losses || 0,
      draws: team.draws || 0,
      points: team.pts || team.points || 0,
      percentage: parseFloat(team.percentage) || 0,
      logo: getTeamLogoUrl(team.team || team.name)
    });

    if (data.ladder) {
      return data.ladder.map(mapTeam);
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch AFL ladder from Squiggle API via proxy", error);
    return [];
  }
};
