import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface GameState {
  isInGame: boolean;
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  aiAdvice: string;
  isLoadingAi: boolean;
}

const initialState: GameState = {
  isInGame: false,
  championName: 'Не в игре',
  kills: 0,
  deaths: 0,
  assists: 0,
  cs: 0,
  aiAdvice: 'Ожидание начала матча для анализа Сэнсэем...',
  isLoadingAi: false
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
    },
    mutateStats: (state, action: PayloadAction<{ kills: number; deaths: number; assists: number; cs: number }>) => {
      state.kills = action.payload.kills;
      state.deaths = action.payload.deaths;
      state.assists = action.payload.assists;
      state.cs = action.payload.cs;
    },
    endGame: (state) => {
      state.isInGame = false;
      state.championName = 'Не в игре';
      state.aiAdvice = 'Матч завершен. Ждем следующей игры...';
    },
    setAiLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoadingAi = action.payload;
      if (action.payload) {
        state.aiAdvice = "Сэнсэй внимательно изучает таблицу счета...";
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
