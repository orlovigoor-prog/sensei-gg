import { syncPremiumFoundation } from './premiumFoundationSync';
import type { AppDispatch } from '../store';
import type { SubscriptionPurchaseFlowSnapshot } from './subscriptionRuntimeState';

interface SyncSubscriptionRuntimeOptions {
  dispatch: AppDispatch;
  purchaseFlow: SubscriptionPurchaseFlowSnapshot;
}

export const syncSubscriptionRuntime = async ({
  dispatch,
  purchaseFlow
}: SyncSubscriptionRuntimeOptions) => {
  await syncPremiumFoundation({
    dispatch,
    purchaseFlow
  });
};
