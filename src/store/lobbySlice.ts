import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface PlayerInfo {
  summonerName: string;
  rank: string;
  tier: 'IRON' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'EMERALD' | 'DIAMOND' | 'MASTER' | 'GRANDMASTER' | 'CHALLENGER';
  lp: number;
  wins: number;
  losses: number;
  winRate: number;
  mainRole: 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT';
  championMastery: number;
  championPoints: number;
  isPro: boolean;
  recentMatches: {
    result: 'W' | 'L';
    champion: string;
    kda: string;
    k: number;
    d: number;
    a: number;
    gameType?: 'RANKED' | 'NORMAL';
  }[];
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
  partyMembers: []
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
    }>) => {
      state.isInLobby = true;
      state.gameMode = action.payload.gameMode;
      state.players.allies = action.payload.allies;
      state.players.enemies = action.payload.enemies;
      state.phase = action.payload.phase || 'champ-select';
      state.partyMembers = action.payload.partyMembers || [];
    },
    setSelectedChampion: (state, action: PayloadAction<string>) => {
      state.selectedChampion = action.payload;
    },
    setPickOrder: (state, action: PayloadAction<string[]>) => {
      state.pickOrder = action.payload;
    },
    setLobbyPhase: (state, action: PayloadAction<LobbyPhase>) => {
      state.phase = action.payload;
    },
    setPartyMembers: (state, action: PayloadAction<string[]>) => {
      state.partyMembers = action.payload;
    },
    syncLobbyLifecycle: (state, action: PayloadAction<{
      phase: LobbyPhase;
      isInLobby?: boolean;
      gameMode?: GameMode;
      partyMembers?: string[];
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
  updatePlayerStats, 
  clearLobby,
  setLoading 
} = lobbySlice.actions;

export default lobbySlice.reducer;
