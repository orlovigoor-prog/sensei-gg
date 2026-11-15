import type { GameMode } from '../store/lobbySlice';

export interface PlayerPrivacyPolicyInput {
  gameMode: GameMode;
  reviewMode?: boolean;
  isAlly: boolean;
  summonerName: string;
  localSummonerName?: string | null;
  partyMembers?: string[];
}

export interface PlayerDisplayNameInput extends PlayerPrivacyPolicyInput {
  index: number;
}

const normalizeName = (value: string | null | undefined) => value?.trim().toLocaleLowerCase() ?? '';

const namesMatch = (left: string | null | undefined, right: string | null | undefined) => {
  const normalizedLeft = normalizeName(left);
  return normalizedLeft.length > 0 && normalizedLeft === normalizeName(right);
};

export const isRankedSoloDuo = (gameMode: GameMode) => gameMode === 'RANKED_SOLO_5x5';

export const canRevealPlayerIdentity = ({
  gameMode,
  reviewMode = false,
  isAlly,
  summonerName,
  localSummonerName,
  partyMembers = []
}: PlayerPrivacyPolicyInput) => {
  if (reviewMode || !isRankedSoloDuo(gameMode)) {
    return true;
  }

  if (namesMatch(summonerName, localSummonerName)) {
    return true;
  }

  return isAlly && partyMembers.some((partyMember) => namesMatch(summonerName, partyMember));
};

export const canLookupPlayer = (input: PlayerPrivacyPolicyInput) => canRevealPlayerIdentity(input);

export const getPlayerDisplayName = (input: PlayerDisplayNameInput) => {
  if (canRevealPlayerIdentity(input)) {
    return input.summonerName;
  }

  return `${input.isAlly ? 'Ally' : 'Enemy'} ${input.index + 1}`;
};
