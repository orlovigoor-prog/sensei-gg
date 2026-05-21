import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface CompletedMatchSummary {
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  endedAt: string;
}

interface GameState {
  isInGame: boolean;
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  aiAdvice: string;
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
  aiAdvice: 'Sensei GG готовит постматч-разбор. Во время активной игры приложение не дает live-команды, чтобы соответствовать политике Riot.',
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
      state.aiAdvice = 'Матч начался. Sensei GG собирает данные для постматч-разбора.';
    },
    mutateStats: (state, action: PayloadAction<{ kills: number; deaths: number; assists: number; cs: number }>) => {
      state.kills = action.payload.kills;
      state.deaths = action.payload.deaths;
      state.assists = action.payload.assists;
      state.cs = action.payload.cs;
    },
    endGame: (state) => {
      state.lastCompletedMatch = {
        championName: state.championName,
        kills: state.kills,
        deaths: state.deaths,
        assists: state.assists,
        cs: state.cs,
        endedAt: new Date().toISOString()
      };
      state.isInGame = false;
      state.championName = 'Не в игре';
      state.aiAdvice = 'Матч завершен. Можно открыть вкладку AI и получить постматч-разбор.';
    },
    setAiLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoadingAi = action.payload;
      if (action.payload) {
        state.aiAdvice = 'Сэнсэй собирает безопасный постматч-разбор...';
      }
    },
    setAiAdvice: (state, action: PayloadAction<string>) => {
      state.aiAdvice = action.payload;
      state.isLoadingAi = false;
    }
  }
});

export const { startGame, mutateStats, endGame, setAiLoading, setAiAdvice } = gameSlice.actions;
export default gameSlice.reducer;
