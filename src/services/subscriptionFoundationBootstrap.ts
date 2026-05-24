import type { AppDispatch } from '../store';
import { bindSubscriptionRuntimeRefresh, bindSubscriptionWindowEvents } from './subscriptionEventBindings';

interface BootstrapSubscriptionFoundationOptions {
  dispatch: AppDispatch;
  syncSubscriptionState: () => Promise<void>;
  runPremiumUnlockFlow: () => Promise<void>;
  resetPurchaseFlowState: () => { type: string };
}

export const bootstrapSubscriptionFoundation = ({
  dispatch,
  syncSubscriptionState,
  runPremiumUnlockFlow,
  resetPurchaseFlowState
}: BootstrapSubscriptionFoundationOptions) => {
  let disposed = false;

  syncSubscriptionState().catch((error) => {
    if (disposed) {
      return;
    }

    console.warn('Failed to sync subscription foundation state', error);
  });

  const unsubscribeSubscriptionRefresh = bindSubscriptionRuntimeRefresh({ syncSubscriptionState });
  const unsubscribeWindowEvents = bindSubscriptionWindowEvents({
    dispatch,
    runPremiumUnlockFlow,
    resetPurchaseFlowState
  });

  return () => {
    disposed = true;
    unsubscribeSubscriptionRefresh();
    unsubscribeWindowEvents();
  };
};

