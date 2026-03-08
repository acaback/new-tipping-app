export interface Game {
  id: number;
  year: number;
  round: number;
  roundname: string;
  hteam: string;
  ateam: string;
  hscore: number | null;
  ascore: number | null;
  winner: string | null;
  date: string;
  localtime: string;
  venue: string;
  complete: number;
}

export interface Tip {
  gameId: number;
  winner: string | null;
  margin: number | null;
}

export interface UserTips {
  [round: number]: Tip[];
}

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  email?: string;
  favoriteTeam?: string;
  isAdmin: boolean;
  tips: {
    [year: number]: UserTips;
  };
  unlockedGames: {
    [gameId: number]: boolean;
  };
}

export interface LadderEntry {
  userId: string;
  userName: string;
  points: number;
  totalMarginError: number;
  correctTips: number;
}

export interface GameSettings {
  manualLocks: { [gameId: number]: 'locked' | 'unlocked' | 'default' };
}

export interface ApplicationState {
  userId: string | null;
}

export interface AFLLadderEntry {
  rank: number;
  name: string;
  id: number;
  wins: number;
  losses: number;
  draws: number;
  percentage: number;
  points: number;
}