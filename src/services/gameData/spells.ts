import { dragonVersion } from './core';

export const summonerSpellPool = [4, 7, 14, 11, 12, 3, 6, 21, 1, 32] as const;

export const getSummonerSpellIconUrl = (spellId: number) => `https://ddragon.leagueoflegends.com/cdn/${dragonVersion}/img/spell/Summoner${spellId}.png`;
