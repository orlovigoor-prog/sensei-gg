import { canLookupPlayer } from './playerPrivacyPolicy';
import type { PlayerPrivacyPolicyInput } from './playerPrivacyPolicy';

export interface SenseiSearchPlayerCommandDetail extends PlayerPrivacyPolicyInput {
  summonerName: string;
  targetRegion: string;
}

export const SENSEI_SEARCH_PLAYER_EVENT = 'sensei-search-player';
export const SENSEI_PREMIUM_UNLOCK_REQUEST_EVENT = 'sensei-premium-unlock-request';
export const SENSEI_PREMIUM_UNLOCK_RESET_EVENT = 'sensei-premium-unlock-reset';

export const dispatchSearchPlayerCommand = (detail: SenseiSearchPlayerCommandDetail) => {
  if (!canLookupPlayer(detail)) {
    return false;
  }

  window.dispatchEvent(new CustomEvent<SenseiSearchPlayerCommandDetail>(SENSEI_SEARCH_PLAYER_EVENT, { detail }));
  return true;
};

export const dispatchPremiumUnlockRequest = () => {
  window.dispatchEvent(new Event(SENSEI_PREMIUM_UNLOCK_REQUEST_EVENT));
};

export const dispatchPremiumUnlockReset = () => {
  window.dispatchEvent(new Event(SENSEI_PREMIUM_UNLOCK_RESET_EVENT));
};
