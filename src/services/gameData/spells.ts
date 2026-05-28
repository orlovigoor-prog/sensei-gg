import { dragonVersion } from './core';

export const summonerSpellPool = [4, 7, 14, 11, 12, 3, 6, 21, 1, 32] as const;

const summonerSpellIconNames: Record<number, string> = {
  1: 'Boost',
  3: 'Exhaust',
  4: 'Flash',
  6: 'Haste',
  7: 'Heal',
  11: 'Smite',
  12: 'Teleport',
  13: 'Mana',
  14: 'Dot',
  21: 'Barrier',
  32: 'Snowball'
};

const summonerSpellLabels: Record<number, string> = {
  1: 'Очищение',
  3: 'Изнурение',
  4: 'Скачок',
  6: 'Призрак',
  7: 'Исцеление',
  11: 'Кара',
  12: 'Телепорт',
  13: 'Ясность',
  14: 'Воспламенение',
  21: 'Барьер',
  32: 'Снежок'
};

export const getSummonerSpellIconUrl = (spellId: number) => {
  const iconName = summonerSpellIconNames[spellId] ?? 'Flash';
  return `https://ddragon.leagueoflegends.com/cdn/${dragonVersion}/img/spell/Summoner${iconName}.png`;
};

export const getSummonerSpellLabel = (spellId: number) => summonerSpellLabels[spellId] ?? `Summoner spell ${spellId}`;

export const getDefaultSummonerSpells = (role?: string, championName?: string): number[] => {
  if (role === 'JUNGLE') {
    return [4, 11];
  }

  if (championName === 'Yuumi') {
    return [7, 14];
  }

  if (role === 'ADC' || role === 'SUPPORT') {
    return [4, 7];
  }

  if (role === 'TOP') {
    return [4, 12];
  }

  return [4, 14];
};
