import { configureStore } from '@reduxjs/toolkit';
import gameReducer from './gameSlice';
import lobbyReducer from './lobbySlice';

export const store = configureStore({
  reducer: {
    game: gameReducer,
    lobby: lobbyReducer,
  },
});

type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;

export type { RootState, AppDispatch };
