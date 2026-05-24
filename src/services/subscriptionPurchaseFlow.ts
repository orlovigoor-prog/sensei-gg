import type { AppDispatch } from '../store';
import { completePurchaseFlow, failPurchaseFlow, startPurchaseFlow } from '../store/subscriptionSlice';
import { openPremiumSubscriptionPurchase, waitForSubscriptionChange } from './overwolfSubscriptionActions';

interface RunSubscriptionPurchaseFlowOptions {
  dispatch: AppDispatch;
  syncSubscriptionState: () => Promise<void>;
}

export const runSubscriptionPurchaseFlow = async ({
  dispatch,
  syncSubscriptionState
}: RunSubscriptionPurchaseFlowOptions) => {
  dispatch(startPurchaseFlow());

  try {
    const purchaseResult = await openPremiumSubscriptionPurchase();

    if (!purchaseResult.started) {
      dispatch(failPurchaseFlow(`Purchase flow unavailable: ${purchaseResult.reason}`));
      return;
    }

    const waitResult = await waitForSubscriptionChange();

    await syncSubscriptionState();

    if (waitResult.changed) {
      dispatch(completePurchaseFlow());
      return;
    }

    dispatch(failPurchaseFlow('Timed out while waiting for subscription confirmation'));
  } catch (error) {
    dispatch(failPurchaseFlow(error instanceof Error ? error.message : 'Unknown purchase flow error'));
  }
};

