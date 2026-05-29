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

export const demoLobbyChampionPoolsByRole: Record<PlayerInfo['mainRole'], string[]> = {
  TOP: ['Aatrox', 'Renekton', 'Gnar', 'Camille'],
  JUNGLE: ['LeeSin', 'Vi'],
  MID: ['Ahri', 'Zed', 'Syndra'],
  ADC: ['Jinx', 'Lucian', 'Caitlyn'],
  SUPPORT: ['Thresh', 'Nautilus']
};

export const validateDemoLobbyChampionPools = () => (
  Object.entries(demoLobbyChampionPoolsByRole).flatMap(([role, champions]) => (
    champions
      .filter((champion) => !canChampionPlayRole(champion, role as PlayerInfo['mainRole']))
      .map((champion) => `${champion} is not valid for ${role}`)
  ))
);
