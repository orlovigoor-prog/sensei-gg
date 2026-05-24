import type { PlayerInfo } from '../../store/lobbySlice';
import { dragonVersion } from './core';

export interface ChampionCatalogEntry {
  name: string;
  assetKey: string;
  primaryRole: PlayerInfo['mainRole'];
  tags: string[];
}

export const championAssetMap: Record<string, string> = {
  "Kai'Sa": 'Kaisa',
  KaiSa: 'Kaisa',
  "Kha'Zix": 'Khazix',
  "Vel'Koz": 'Velkoz',
  "Bel'Veth": 'Belveth',
  "Cho'Gath": 'Chogath',
  "Rek'Sai": 'RekSai',
  "Kog'Maw": 'KogMaw',
  "Nunu & Willump": 'Nunu',
  LeBlanc: 'Leblanc',
  Wukong: 'MonkeyKing'
};

export const championCatalog: ChampionCatalogEntry[] = [
  { name: 'Aatrox', assetKey: 'Aatrox', primaryRole: 'TOP', tags: ['fighter', 'lane-bully'] },
  { name: 'Ahri', assetKey: 'Ahri', primaryRole: 'MID', tags: ['mage', 'playmaker'] },
  { name: 'Ashe', assetKey: 'Ashe', primaryRole: 'ADC', tags: ['utility', 'marksman'] },
  { name: "Bel'Veth", assetKey: 'Belveth', primaryRole: 'JUNGLE', tags: ['carry', 'skirmisher'] },
  { name: 'Camille', assetKey: 'Camille', primaryRole: 'TOP', tags: ['carry', 'splitpush'] },
  { name: 'Caitlyn', assetKey: 'Caitlyn', primaryRole: 'ADC', tags: ['lane-bully', 'marksman'] },
  { name: 'Ezreal', assetKey: 'Ezreal', primaryRole: 'ADC', tags: ['poke', 'marksman'] },
  { name: 'Fiora', assetKey: 'Fiora', primaryRole: 'TOP', tags: ['carry', 'duelist'] },
  { name: 'Gnar', assetKey: 'Gnar', primaryRole: 'TOP', tags: ['teamfight', 'ranged'] },
  { name: 'JarvanIV', assetKey: 'JarvanIV', primaryRole: 'JUNGLE', tags: ['engage', 'teamfight'] },
  { name: 'Jax', assetKey: 'Jax', primaryRole: 'TOP', tags: ['scaling', 'duelist'] },
  { name: 'Jinx', assetKey: 'Jinx', primaryRole: 'ADC', tags: ['scaling', 'marksman'] },
  { name: "Kai'Sa", assetKey: 'Kaisa', primaryRole: 'ADC', tags: ['playmaker', 'marksman'] },
  { name: "Kha'Zix", assetKey: 'Khazix', primaryRole: 'JUNGLE', tags: ['assassin', 'skirmisher'] },
  { name: 'LeeSin', assetKey: 'LeeSin', primaryRole: 'JUNGLE', tags: ['playmaker', 'early-game'] },
  { name: 'Leona', assetKey: 'Leona', primaryRole: 'SUPPORT', tags: ['engage', 'tank'] },
  { name: 'Lulu', assetKey: 'Lulu', primaryRole: 'SUPPORT', tags: ['utility', 'enchanter'] },
  { name: 'Lucian', assetKey: 'Lucian', primaryRole: 'ADC', tags: ['lane-bully', 'marksman'] },
  { name: 'Milio', assetKey: 'Milio', primaryRole: 'SUPPORT', tags: ['utility', 'enchanter'] },
  { name: 'Nautilus', assetKey: 'Nautilus', primaryRole: 'SUPPORT', tags: ['engage', 'tank'] },
  { name: 'Orianna', assetKey: 'Orianna', primaryRole: 'MID', tags: ['control', 'utility'] },
  { name: 'Rakan', assetKey: 'Rakan', primaryRole: 'SUPPORT', tags: ['engage', 'playmaker'] },
  { name: 'Renekton', assetKey: 'Renekton', primaryRole: 'TOP', tags: ['lane-bully', 'fighter'] },
  { name: 'Syndra', assetKey: 'Syndra', primaryRole: 'MID', tags: ['burst', 'lane-bully'] },
  { name: 'Sylas', assetKey: 'Sylas', primaryRole: 'MID', tags: ['playmaker', 'skirmisher'] },
  { name: 'Thresh', assetKey: 'Thresh', primaryRole: 'SUPPORT', tags: ['engage', 'utility'] },
  { name: 'TwistedFate', assetKey: 'TwistedFate', primaryRole: 'MID', tags: ['utility', 'map-play'] },
  { name: 'Veigar', assetKey: 'Veigar', primaryRole: 'MID', tags: ['scaling', 'burst'] },
  { name: 'Vex', assetKey: 'Vex', primaryRole: 'MID', tags: ['burst', 'playmaker'] },
  { name: 'Vi', assetKey: 'Vi', primaryRole: 'JUNGLE', tags: ['engage', 'playmaker'] },
  { name: 'Viego', assetKey: 'Viego', primaryRole: 'JUNGLE', tags: ['carry', 'skirmisher'] },
  { name: 'Wukong', assetKey: 'MonkeyKing', primaryRole: 'JUNGLE', tags: ['engage', 'teamfight'] },
  { name: 'Xayah', assetKey: 'Xayah', primaryRole: 'ADC', tags: ['playmaker', 'marksman'] },
  { name: 'XinZhao', assetKey: 'XinZhao', primaryRole: 'JUNGLE', tags: ['fighter', 'early-game'] },
  { name: 'Zed', assetKey: 'Zed', primaryRole: 'MID', tags: ['assassin', 'playmaker'] },
  { name: 'Zeri', assetKey: 'Zeri', primaryRole: 'ADC', tags: ['scaling', 'marksman'] }
];

export const getChampionAssetKey = (championName: string) => championAssetMap[championName] ?? championName.replace(/[^A-Za-z0-9]/g, '');

export const getChampionCatalogEntry = (championName: string) => championCatalog.find((entry) => entry.name === championName);

export const getChampionIconUrl = (championName: string) => `https://ddragon.leagueoflegends.com/cdn/${dragonVersion}/img/champion/${getChampionAssetKey(championName)}.png`;
