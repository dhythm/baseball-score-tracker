export type Player = {
  id: string;
  name: string;
  number: string;
  position: string;
  type: "pitcher" | "batter" | "both";
};

export type Team = {
  id: string;
  name: string;
  players: Player[];
};

export type AtBatResult =
  | "安打"
  | "二塁打"
  | "三塁打"
  | "本塁打"
  | "四球"
  | "死球"
  | "犠打"
  | "犠飛"
  | "失策"
  | "フィールダーチョイス"
  | "三振"
  | "ゴロアウト"
  | "フライアウト"
  | "ライナーアウト";

export type AtBat = {
  id: string;
  batterId: string;
  pitcherId: string;
  result: AtBatResult;
  inning: number;
  outs: number;
  isTopInning: boolean;
  timestamp: number;
};

export type Game = {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homePitcherId: string;
  awayPitcherId: string;
  currentInning: number;
  isTopInning: boolean;
  outs: number;
  homeScore: number;
  awayScore: number;
  atBats: AtBat[];
  startTime: number;
  endTime: number | null;
  isComplete: boolean;
  currentBatterIndex: {
    home: number;
    away: number;
  };
};

export class Storage {
  private storage: typeof localStorage | typeof sessionStorage;
  private readonly TEAMS_KEY = "baseball-teams";
  private readonly GAMES_KEY = "baseball-games";

  constructor(type: 'local' | 'session' = 'local') {
    this.storage = type === 'local' ? localStorage : sessionStorage;
  }

  get<T>(key: string): T | null {
    const item = this.storage.getItem(key);
    if (!item) return null;
    try {
      return JSON.parse(item) as T;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    this.storage.setItem(key, JSON.stringify(value));
  }

  remove(key: string): void {
    this.storage.removeItem(key);
  }

  clear(): void {
    this.storage.clear();
  }

  getTeams(): Team[] {
    return this.get<Team[]>(this.TEAMS_KEY) ?? [];
  }

  setTeams(teams: Team[]): void {
    this.set(this.TEAMS_KEY, teams);
  }

  getGames(): Game[] {
    return this.get<Game[]>(this.GAMES_KEY) ?? [];
  }

  setGames(games: Game[]): void {
    this.set(this.GAMES_KEY, games);
  }
} 