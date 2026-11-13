import type { PlayerInfo } from '../../store/lobbySlice';
import roleMatrixData from './champion-role-matrix.json';

export type ChampionRoleConfidence = 'primary' | 'secondary';

export interface ChampionRoleMatrixEntry {
  champion: string;
  primaryRoles: PlayerInfo['mainRole'][];
  secondaryRoles?: PlayerInfo['mainRole'][];
  note?: string;
}

export const championRoleMatrix = roleMatrixData as ChampionRoleMatrixEntry[];

const normalizeChampionRoleKey = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

export const getChampionRoleEntry = (championName: string) => {
  const normalizedChampion = normalizeChampionRoleKey(championName);

  return championRoleMatrix.find((entry) => normalizeChampionRoleKey(entry.champion) === normalizedChampion);
};

export const canChampionPlayRole = (championName: string, role: PlayerInfo['mainRole']) => {
  const entry = getChampionRoleEntry(championName);

  if (!entry) {
    return false;
  }

  return entry.primaryRoles.includes(role) || Boolean(entry.secondaryRoles?.includes(role));
};

export const getChampionsForRole = (role: PlayerInfo['mainRole'], confidence: ChampionRoleConfidence = 'primary') => (
  championRoleMatrix
    .filter((entry) => confidence === 'primary'
      ? entry.primaryRoles.includes(role)
      : entry.primaryRoles.includes(role) || Boolean(entry.secondaryRoles?.includes(role)))
    .map((entry) => entry.champion)
);
