import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export type PlayerRankTier = 'IRON' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'EMERALD' | 'DIAMOND' | 'MASTER' | 'GRANDMASTER' | 'CHALLENGER';
export type PlayerRole = 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT';

export interface PlayerRecentMatch {
  result: 'W' | 'L';
  champion: string;
  kda: string;
  k: number;
  d: number;
  a: number;
  cs?: number;
  goldEarned?: number;
  visionScore?: number;
  items?: number[];
  trinketId?: number;
  gameType?: 'RANKED' | 'NORMAL';
  summonerSpells?: number[];
  runes?: {
    keystoneId?: number | null;
    primaryStyleId?: number | null;
    secondaryStyleId?: number | null;
  };
}

export interface CompletedScoreboardPlayer {
  summonerName: string;
  championName: string;
  role?: PlayerRole;
  result?: 'W' | 'L';
  kills?: number;
  deaths?: number;
  assists?: number;
  cs?: number;
  goldEarned?: number;
  visionScore?: number;
  items?: number[];
  trinketId?: number;
  summonerSpells?: number[];
  runes?: {
    keystoneId?: number | null;
    primaryStyleId?: number | null;
    secondaryStyleId?: number | null;
  };
}

export interface CompletedMatchScoreboard {
  allies: CompletedScoreboardPlayer[];
  enemies: CompletedScoreboardPlayer[];
  localSummonerName: string;
  source: 'overwolf-live-client-data';
}

export interface LiveRoster {
  allies: PlayerInfo[];
  enemies: PlayerInfo[];
  localSummonerName: string;
  source: 'overwolf-live-client-data';
}

export interface PlayerInfo {
  summonerName: string;
  championName?: string;
  rank?: string;
  tier?: PlayerRankTier;
  lp?: number;
  wins?: number;
  losses?: number;
  winRate?: number;
  mainRole: PlayerRole;
  championMastery?: number;
  championPoints?: number;
  isPro?: boolean;
  summonerSpells?: number[];
  runes?: {
    keystoneId?: number | null;
    primaryStyleId?: number | null;
    secondaryStyleId?: number | null;
  };
  recentMatches?: PlayerRecentMatch[];
}

export type GameMode = 'RANKED_FLEX_SR' | 'RANKED_SOLO_5x5' | 'NORMAL_5x5_BLIND' | 'NORMAL_5x5_DRAFT' | 'ARAM';
export type LobbyPhase = 'champ-select' | 'loading' | 'in-game' | 'post-game';

interface LobbyState {
  isInLobby: boolean;
  gameMode: GameMode;
  players: {
    allies: PlayerInfo[];
    enemies: PlayerInfo[];
  };
  selectedChampion: string | null;
  pickOrder: string[];
  loading: boolean;
  phase: LobbyPhase;
  partyMembers: string[];
  localSummonerName: string | null;
  completedScoreboard: CompletedMatchScoreboard | null;
}

const initialState: LobbyState = {
  isInLobby: false,
  gameMode: 'NORMAL_5x5_DRAFT',
  players: {
    allies: [],
    enemies: []
  },
  selectedChampion: null,
  pickOrder: [],
  loading: false,
  phase: 'champ-select',
  partyMembers: [],
  localSummonerName: null,
  completedScoreboard: null
};

const lobbySlice = createSlice({
  name: 'lobby',
  initialState,
  reducers: {
    setLobby: (state, action: PayloadAction<{
      gameMode: GameMode;
      allies: PlayerInfo[];
      enemies: PlayerInfo[];
      phase?: LobbyPhase;
      partyMembers?: string[];
      localSummonerName?: string;
    }>) => {
      state.isInLobby = true;
      state.gameMode = action.payload.gameMode;
      state.players.allies = action.payload.allies;
      state.players.enemies = action.payload.enemies;
      state.phase = action.payload.phase || 'champ-select';
      state.partyMembers = action.payload.partyMembers || [];
      state.localSummonerName = action.payload.localSummonerName || null;
      state.completedScoreboard = null;
    },
    setSelectedChampion: (state, action: PayloadAction<string>) => {
      state.selectedChampion = action.payload;
    },
    setPickOrder: (state, action: PayloadAction<string[]>) => {
      state.pickOrder = action.payload;
    },
    setLobbyPhase: (state, action: PayloadAction<LobbyPhase>) => {
      state.phase = action.payload;
      if (action.payload === 'loading' || action.payload === 'in-game') {
        state.completedScoreboard = null;
      }
    },
    setPartyMembers: (state, action: PayloadAction<string[]>) => {
      state.partyMembers = action.payload;
    },
    syncLobbyLifecycle: (state, action: PayloadAction<{
      phase: LobbyPhase;
      isInLobby?: boolean;
      gameMode?: GameMode;
      partyMembers?: string[];
      localSummonerName?: string;
    }>) => {
      state.phase = action.payload.phase;
      if (action.payload.isInLobby !== undefined) {
        state.isInLobby = action.payload.isInLobby;
      }
      if (action.payload.gameMode) {
        state.gameMode = action.payload.gameMode;
      }
      if (action.payload.partyMembers) {
        state.partyMembers = action.payload.partyMembers;
      }
      if (action.payload.localSummonerName !== undefined) {
        state.localSummonerName = action.payload.localSummonerName;
      }
      if (action.payload.phase === 'loading' || action.payload.phase === 'in-game') {
        state.completedScoreboard = null;
      }
    },
    setCompletedScoreboard: (state, action: PayloadAction<CompletedMatchScoreboard>) => {
      state.completedScoreboard = action.payload;
    },
    syncLiveRoster: (state, action: PayloadAction<LiveRoster>) => {
      state.isInLobby = true;
      state.players.allies = action.payload.allies;
      state.players.enemies = action.payload.enemies;
      state.localSummonerName = action.payload.localSummonerName;
      state.partyMembers = [];
    },
    clearLiveRoster: (state) => {
      state.players.allies = [];
      state.players.enemies = [];
      state.localSummonerName = null;
      state.partyMembers = [];
    },
    updatePlayerStats: (state, action: PayloadAction<{ 
      team: 'allies' | 'enemies';
      summonerName: string;
      stats: Partial<Pick<PlayerInfo, 'championMastery' | 'recentMatches'>>;
    }>) => {
      const team = action.payload.team;
      const summonerName = action.payload.summonerName;
      const stats = action.payload.stats;
      
      const player = state.players[team].find(p => p.summonerName === summonerName);
      if (player) {
        if (stats.championMastery !== undefined) player.championMastery = stats.championMastery;
        if (stats.recentMatches) player.recentMatches = stats.recentMatches;
      }
    },
    clearLobby: (state) => {
      state.isInLobby = false;
      state.players.allies = [];
      state.players.enemies = [];
      state.selectedChampion = null;
      state.pickOrder = [];
      state.phase = 'champ-select';
      state.partyMembers = [];
      state.localSummonerName = null;
      state.completedScoreboard = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    }
  }
});

export const { 
  setLobby, 
  setSelectedChampion, 
  setPickOrder, 
  setLobbyPhase,
  setPartyMembers,
  syncLobbyLifecycle,
  setCompletedScoreboard,
  syncLiveRoster,
  clearLiveRoster,
  updatePlayerStats, 
  clearLobby,
  setLoading 
} = lobbySlice.actions;

export default lobbySlice.reducer;
