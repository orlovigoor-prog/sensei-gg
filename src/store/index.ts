import { configureStore } from '@reduxjs/toolkit';
import gameReducer from './gameSlice';
import lobbyReducer from './lobbySlice';
import subscriptionReducer from './subscriptionSlice';
import aiHistoryReducer from './aiHistorySlice';
import { saveSubscriptionState } from '../services/subscriptionStorage';

export const store = configureStore({
  reducer: {
    game: gameReducer,
    lobby: lobbyReducer,
    subscription: subscriptionReducer,
    aiHistory: aiHistoryReducer,
  },
});

store.subscribe(() => {
  const { subscription } = store.getState();

  saveSubscriptionState({
    plan: subscription.plan,
    source: subscription.source,
    aiReviewsUsedThisWeek: subscription.aiReviewsUsedThisWeek,
    aiReviewWeeklyLimit: subscription.aiReviewWeeklyLimit,
    usageWindowStartedAt: subscription.usageWindowStartedAt,
    hasUnlimitedAiReviews: subscription.hasUnlimitedAiReviews,
    hasAiHistoryAccess: subscription.hasAiHistoryAccess,
    hasProgressionAccess: subscription.hasProgressionAccess,
    hasWeeklyReports: subscription.hasWeeklyReports
  });
});

type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;

export type { RootState, AppDispatch };
