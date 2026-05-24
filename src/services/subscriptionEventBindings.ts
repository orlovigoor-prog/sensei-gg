import type { AppDispatch } from '../store';
import { SENSEI_PREMIUM_UNLOCK_REQUEST_EVENT, SENSEI_PREMIUM_UNLOCK_RESET_EVENT } from './appCommands';
import { subscribeToSubscriptionChanges } from './overwolfSubscriptionActions';

interface BindSubscriptionRuntimeRefreshOptions {
  syncSubscriptionState: () => Promise<void>;
}

interface BindSubscriptionWindowEventsOptions {
  dispatch: AppDispatch;
  runPremiumUnlockFlow: () => Promise<void>;
  resetPurchaseFlowState: () => { type: string };
}

export const bindSubscriptionRuntimeRefresh = ({
  syncSubscriptionState
}: BindSubscriptionRuntimeRefreshOptions) => {
  return subscribeToSubscriptionChanges(() => {
    syncSubscriptionState().catch((error) => {
      console.warn('Failed to refresh subscription foundation state after subscription change', error);
    });
  });
};

export const bindSubscriptionWindowEvents = ({
  dispatch,
  runPremiumUnlockFlow,
  resetPurchaseFlowState
}: BindSubscriptionWindowEventsOptions) => {
  const handlePremiumUnlockRequest = () => {
    runPremiumUnlockFlow().catch((error) => {
      console.warn('Premium unlock flow failed', error);
    });
  };

  const handlePremiumUnlockReset = () => {
    dispatch(resetPurchaseFlowState());
  };

  window.addEventListener(SENSEI_PREMIUM_UNLOCK_REQUEST_EVENT, handlePremiumUnlockRequest);
  window.addEventListener(SENSEI_PREMIUM_UNLOCK_RESET_EVENT, handlePremiumUnlockReset);

  return () => {
    window.removeEventListener(SENSEI_PREMIUM_UNLOCK_REQUEST_EVENT, handlePremiumUnlockRequest);
    window.removeEventListener(SENSEI_PREMIUM_UNLOCK_RESET_EVENT, handlePremiumUnlockReset);
  };
};
