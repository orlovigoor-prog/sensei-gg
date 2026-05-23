import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface CompletedMatchSummary {
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  gameDurationSeconds: number | null;
  csPerMinute: number | null;
  kda: number;
  takedowns: number;
  endedAt: string;
}

export interface StructuredAiReview {
  strength: string;
  risk: string;
  nextFocus: string;
  evidence: string;
  source: 'provider' | 'local-server-fallback' | 'local-client-fallback';
  fullText: string;
}

interface GameState {
  isInGame: boolean;
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  gameTimeSeconds: number;
  aiAdvice: string;
  aiReview: StructuredAiReview | null;
  isLoadingAi: boolean;
  lastCompletedMatch: CompletedMatchSummary | null;
}

const initialState: GameState = {
  isInGame: false,
  championName: 'Не в игре',
  kills: 0,
  deaths: 0,
  assists: 0,
  cs: 0,
  gameTimeSeconds: 0,
  aiAdvice: 'Sensei GG готовит постматч-разбор. Во время активной игры приложение не дает live-команды, чтобы соответствовать политике Riot.',
  aiReview: null,
  isLoadingAi: false,
  lastCompletedMatch: null
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    startGame: (state, action: PayloadAction<string>) => {
      state.isInGame = true;
      state.championName = action.payload;
      state.kills = 0;
      state.deaths = 0;
      state.assists = 0;
      state.cs = 0;
      state.gameTimeSeconds = 0;
      state.aiAdvice = 'Матч начался. Sensei GG собирает данные для постматч-разбора.';
      state.aiReview = null;
    },
    mutateStats: (state, action: PayloadAction<{ kills: number; deaths: number; assists: number; cs: number; gameTimeSeconds?: number }>) => {
      state.kills = action.payload.kills;
      state.deaths = action.payload.deaths;
      state.assists = action.payload.assists;
      state.cs = action.payload.cs;
      if (typeof action.payload.gameTimeSeconds === 'number') {
        state.gameTimeSeconds = action.payload.gameTimeSeconds;
      }
    },
    endGame: (state) => {
      const gameDurationSeconds = state.gameTimeSeconds > 0 ? state.gameTimeSeconds : null;
      const csPerMinute = gameDurationSeconds && gameDurationSeconds >= 60
        ? Number((state.cs / (gameDurationSeconds / 60)).toFixed(1))
        : null;
      const kda = Number((((state.kills + state.assists) / Math.max(1, state.deaths))).toFixed(2));
      state.lastCompletedMatch = {
        championName: state.championName,
        kills: state.kills,
        deaths: state.deaths,
        assists: state.assists,
        cs: state.cs,
        gameDurationSeconds,
        csPerMinute,
        kda,
        takedowns: state.kills + state.assists,
        endedAt: new Date().toISOString()
      };
      state.isInGame = false;
      state.championName = 'Не в игре';
      state.gameTimeSeconds = 0;
      state.aiAdvice = 'Матч завершен. Можно открыть вкладку AI и получить постматч-разбор.';
      state.aiReview = null;
    },
    resetGame: (state) => {
      state.isInGame = false;
      state.championName = 'Не в игре';
      state.kills = 0;
      state.deaths = 0;
      state.assists = 0;
      state.cs = 0;
      state.gameTimeSeconds = 0;
      state.aiAdvice = 'Sensei GG готовит постматч-разбор. Во время активной игры приложение не дает live-команды, чтобы соответствовать политике Riot.';
      state.aiReview = null;
      state.isLoadingAi = false;
      state.lastCompletedMatch = null;
    },
    setAiLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoadingAi = action.payload;
      if (action.payload) {
        state.aiAdvice = 'Сэнсэй собирает безопасный постматч-разбор...';
        state.aiReview = null;
      }
    },
    setAiAdvice: (state, action: PayloadAction<string>) => {
      state.aiAdvice = action.payload;
      state.isLoadingAi = false;
    },
    setAiReview: (state, action: PayloadAction<StructuredAiReview>) => {
      state.aiReview = action.payload;
      state.aiAdvice = action.payload.fullText;
      state.isLoadingAi = false;
    }
  }
});

export const { startGame, mutateStats, endGame, resetGame, setAiLoading, setAiAdvice, setAiReview } = gameSlice.actions;
export default gameSlice.reducer;
