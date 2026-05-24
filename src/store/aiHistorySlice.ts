import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AiHistoryFoundationHydrationPayload } from '../services/aiHistoryFoundation';
import type { AiReviewHistoryEntry } from '../services/aiReviewHistoryStorage';

export interface AiHistoryState {
  entries: AiReviewHistoryEntry[];
  configured: boolean;
  persistence: string | null;
  syncReady: boolean;
  premiumRequired: boolean;
  hydratedAt: string | null;
}

const initialState: AiHistoryState = {
  entries: [],
  configured: false,
  persistence: null,
  syncReady: false,
  premiumRequired: true,
  hydratedAt: null
};

const aiHistorySlice = createSlice({
  name: 'aiHistory',
  initialState,
  reducers: {
    hydrateAiHistoryEntries: (state, action: PayloadAction<AiReviewHistoryEntry[]>) => {
      state.entries = action.payload;
      state.hydratedAt = new Date().toISOString();
    },
    appendAiHistoryEntry: (state, action: PayloadAction<AiReviewHistoryEntry>) => {
      state.entries = [action.payload, ...state.entries.filter((entry) => entry.id !== action.payload.id)].slice(0, 30);
      state.hydratedAt = new Date().toISOString();
    },
    hydrateAiHistoryFoundation: (state, action: PayloadAction<AiHistoryFoundationHydrationPayload>) => {
      state.configured = action.payload.configured;
      state.persistence = action.payload.persistence;
      state.syncReady = action.payload.syncReady;
      state.premiumRequired = action.payload.premiumRequired;
    },
    clearAiHistoryState: () => ({
      ...initialState
    })
  }
});

export const {
  hydrateAiHistoryEntries,
  appendAiHistoryEntry,
  hydrateAiHistoryFoundation,
  clearAiHistoryState
} = aiHistorySlice.actions;

export default aiHistorySlice.reducer;
