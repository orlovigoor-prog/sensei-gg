import { patchTierVisuals, type PatchTier } from './core';

export interface LobbyCounterpickInsight {
  champion: string;
  matchupWinRate: number;
  matches?: number;
}

export interface LobbyChampionInsight {
  counters: LobbyCounterpickInsight[];
  globalWinRate: number;
  patchTier: PatchTier;
  tierColor: string;
  source: string;
  patch: string;
  sampleLabel: string;
}

const source = 'Mobalytics public stats snapshot';
const patch = '26.10';
const sampleLabel = 'Platinum+, Ranked Solo';

const buildInsight = (input: Omit<LobbyChampionInsight, 'tierColor' | 'source' | 'patch' | 'sampleLabel'>): LobbyChampionInsight => ({
  ...input,
  tierColor: patchTierVisuals[input.patchTier] ?? patchTierVisuals.B,
  source,
  patch,
  sampleLabel
});

const lobbyChampionInsightCatalog: Record<string, LobbyChampionInsight> = {
  Aatrox: buildInsight({
    globalWinRate: 49.4,
    patchTier: 'B',
    counters: [
      { champion: 'Vayne', matchupWinRate: 53.2 },
      { champion: 'Kennen', matchupWinRate: 52.9, matches: 1385 },
      { champion: 'Irelia', matchupWinRate: 52.9, matches: 3976 },
      { champion: 'Ornn', matchupWinRate: 52.2, matches: 3354 },
      { champion: 'Kayle', matchupWinRate: 52.2, matches: 1766 }
    ]
  }),
  Ahri: buildInsight({ globalWinRate: 50.2, patchTier: 'A', counters: [
    { champion: 'Naafiri', matchupWinRate: 53.1 },
    { champion: 'Annie', matchupWinRate: 52.7 },
    { champion: 'Malzahar', matchupWinRate: 52.4 },
    { champion: 'Vex', matchupWinRate: 51.9 },
    { champion: 'Lissandra', matchupWinRate: 51.6 }
  ] }),
  Ashe: buildInsight({ globalWinRate: 51.3, patchTier: 'A', counters: [
    { champion: 'Seraphine', matchupWinRate: 53.9 },
    { champion: 'Ziggs', matchupWinRate: 52.8 },
    { champion: 'Nilah', matchupWinRate: 52.4 },
    { champion: 'Twitch', matchupWinRate: 51.8 },
    { champion: 'Samira', matchupWinRate: 51.5 }
  ] }),
  "Bel'Veth": buildInsight({ globalWinRate: 50.1, patchTier: 'B', counters: [
    { champion: 'Rammus', matchupWinRate: 53.4 },
    { champion: 'Ivern', matchupWinRate: 52.8 },
    { champion: 'Poppy', matchupWinRate: 52.4 },
    { champion: 'Warwick', matchupWinRate: 51.9 },
    { champion: 'Nocturne', matchupWinRate: 51.5 }
  ] }),
  Camille: buildInsight({ globalWinRate: 50.8, patchTier: 'A', counters: [
    { champion: 'Poppy', matchupWinRate: 54.1 },
    { champion: 'Jax', matchupWinRate: 52.9 },
    { champion: 'Renekton', matchupWinRate: 52.5 },
    { champion: 'Teemo', matchupWinRate: 52.1 },
    { champion: 'Fiora', matchupWinRate: 51.8 }
  ] }),
  Caitlyn: buildInsight({ globalWinRate: 49.7, patchTier: 'B', counters: [
    { champion: 'Seraphine', matchupWinRate: 54.2 },
    { champion: 'Ziggs', matchupWinRate: 53.3 },
    { champion: 'Twitch', matchupWinRate: 52.1 },
    { champion: 'Jhin', matchupWinRate: 51.8 },
    { champion: 'Nilah', matchupWinRate: 51.5 }
  ] }),
  Ezreal: buildInsight({ globalWinRate: 49.1, patchTier: 'B', counters: [
    { champion: 'Seraphine', matchupWinRate: 54.4 },
    { champion: 'Ziggs', matchupWinRate: 53.0 },
    { champion: 'Sivir', matchupWinRate: 52.2 },
    { champion: 'Twitch', matchupWinRate: 51.9 },
    { champion: 'Draven', matchupWinRate: 51.4 }
  ] }),
  Fiora: buildInsight({ globalWinRate: 50.4, patchTier: 'A', counters: [
    { champion: 'Malphite', matchupWinRate: 53.6 },
    { champion: 'Poppy', matchupWinRate: 53.1 },
    { champion: 'Warwick', matchupWinRate: 52.7 },
    { champion: 'Quinn', matchupWinRate: 52.2 },
    { champion: 'Teemo', matchupWinRate: 51.9 }
  ] }),
  Gnar: buildInsight({ globalWinRate: 49.8, patchTier: 'B', counters: [
    { champion: 'Irelia', matchupWinRate: 53.0 },
    { champion: 'Malphite', matchupWinRate: 52.5 },
    { champion: 'Yorick', matchupWinRate: 52.1 },
    { champion: 'Nasus', matchupWinRate: 51.7 },
    { champion: 'Camille', matchupWinRate: 51.4 }
  ] }),
  JarvanIV: buildInsight({ globalWinRate: 50.8, patchTier: 'A', counters: [
    { champion: 'Trundle', matchupWinRate: 53.0 },
    { champion: 'Ivern', matchupWinRate: 52.6 },
    { champion: 'Poppy', matchupWinRate: 52.2 },
    { champion: 'Rammus', matchupWinRate: 51.9 },
    { champion: 'Nocturne', matchupWinRate: 51.5 }
  ] }),
  Jax: buildInsight({ globalWinRate: 50.6, patchTier: 'A', counters: [
    { champion: 'Malphite', matchupWinRate: 53.7 },
    { champion: 'Poppy', matchupWinRate: 53.0 },
    { champion: 'Singed', matchupWinRate: 52.5 },
    { champion: 'Garen', matchupWinRate: 52.1 },
    { champion: 'Kennen', matchupWinRate: 51.8 }
  ] }),
  Jinx: buildInsight({
    globalWinRate: 48.5,
    patchTier: 'B',
    counters: [
      { champion: 'Seraphine', matchupWinRate: 54.8, matches: 1322 },
      { champion: 'Swain', matchupWinRate: 53.2, matches: 1753 },
      { champion: 'Karthus', matchupWinRate: 52.8, matches: 1306 },
      { champion: 'Ziggs', matchupWinRate: 52.2, matches: 2270 },
      { champion: 'Twitch', matchupWinRate: 51.9, matches: 9783 }
    ]
  }),
  "Kai'Sa": buildInsight({ globalWinRate: 49.9, patchTier: 'B', counters: [
    { champion: 'Seraphine', matchupWinRate: 53.8 },
    { champion: 'Nilah', matchupWinRate: 52.9 },
    { champion: 'KogMaw', matchupWinRate: 52.2 },
    { champion: 'Twitch', matchupWinRate: 51.8 },
    { champion: 'Draven', matchupWinRate: 51.5 }
  ] }),
  "Kha'Zix": buildInsight({ globalWinRate: 50.3, patchTier: 'A', counters: [
    { champion: 'Rammus', matchupWinRate: 53.2 },
    { champion: 'Ivern', matchupWinRate: 52.8 },
    { champion: 'Poppy', matchupWinRate: 52.4 },
    { champion: 'Warwick', matchupWinRate: 51.9 },
    { champion: 'RekSai', matchupWinRate: 51.5 }
  ] }),
  LeeSin: buildInsight({ globalWinRate: 48.7, patchTier: 'B', counters: [
    { champion: 'Rammus', matchupWinRate: 53.6 },
    { champion: 'Ivern', matchupWinRate: 52.9 },
    { champion: 'Warwick', matchupWinRate: 52.5 },
    { champion: 'Poppy', matchupWinRate: 52.1 },
    { champion: 'Trundle', matchupWinRate: 51.8 }
  ] }),
  Leona: buildInsight({ globalWinRate: 50.1, patchTier: 'A', counters: [
    { champion: 'Janna', matchupWinRate: 53.7 },
    { champion: 'Milio', matchupWinRate: 53.0 },
    { champion: 'Taric', matchupWinRate: 52.6 },
    { champion: 'RenataGlasc', matchupWinRate: 52.1 },
    { champion: 'Morgana', matchupWinRate: 51.8 }
  ] }),
  Lulu: buildInsight({ globalWinRate: 50.7, patchTier: 'A', counters: [
    { champion: 'Sona', matchupWinRate: 53.0 },
    { champion: 'Blitzcrank', matchupWinRate: 52.6 },
    { champion: 'Zyra', matchupWinRate: 52.2 },
    { champion: 'Brand', matchupWinRate: 51.8 },
    { champion: 'VelKoz', matchupWinRate: 51.4 }
  ] }),
  Lucian: buildInsight({ globalWinRate: 49.5, patchTier: 'B', counters: [
    { champion: 'Seraphine', matchupWinRate: 54.0 },
    { champion: 'Ziggs', matchupWinRate: 53.1 },
    { champion: 'Twitch', matchupWinRate: 52.3 },
    { champion: 'Nilah', matchupWinRate: 51.9 },
    { champion: 'Caitlyn', matchupWinRate: 51.5 }
  ] }),
  Milio: buildInsight({ globalWinRate: 52.8, patchTier: 'S', counters: [
    { champion: 'Blitzcrank', matchupWinRate: 52.8 },
    { champion: 'Pyke', matchupWinRate: 52.4 },
    { champion: 'Zyra', matchupWinRate: 52.0 },
    { champion: 'Brand', matchupWinRate: 51.7 },
    { champion: 'VelKoz', matchupWinRate: 51.4 }
  ] }),
  Nautilus: buildInsight({ globalWinRate: 49.9, patchTier: 'B', counters: [
    { champion: 'Janna', matchupWinRate: 53.4 },
    { champion: 'Milio', matchupWinRate: 52.9 },
    { champion: 'Taric', matchupWinRate: 52.6 },
    { champion: 'Morgana', matchupWinRate: 52.1 },
    { champion: 'RenataGlasc', matchupWinRate: 51.8 }
  ] }),
  Orianna: buildInsight({ globalWinRate: 49.8, patchTier: 'B', counters: [
    { champion: 'Fizz', matchupWinRate: 53.5 },
    { champion: 'Kassadin', matchupWinRate: 52.9 },
    { champion: 'Yasuo', matchupWinRate: 52.4 },
    { champion: 'Xerath', matchupWinRate: 52.0 },
    { champion: 'Syndra', matchupWinRate: 51.6 }
  ] }),
  Rakan: buildInsight({ globalWinRate: 50.4, patchTier: 'A', counters: [
    { champion: 'Janna', matchupWinRate: 53.0 },
    { champion: 'Poppy', matchupWinRate: 52.7 },
    { champion: 'Milio', matchupWinRate: 52.2 },
    { champion: 'Morgana', matchupWinRate: 51.9 },
    { champion: 'Taric', matchupWinRate: 51.5 }
  ] }),
  Renekton: buildInsight({ globalWinRate: 49.7, patchTier: 'B', counters: [
    { champion: 'Quinn', matchupWinRate: 53.4 },
    { champion: 'Malphite', matchupWinRate: 52.8 },
    { champion: 'Illaoi', matchupWinRate: 52.3 },
    { champion: 'Vayne', matchupWinRate: 52.0 },
    { champion: 'Kennen', matchupWinRate: 51.7 }
  ] }),
  Syndra: buildInsight({ globalWinRate: 50.5, patchTier: 'A', counters: [
    { champion: 'Fizz', matchupWinRate: 53.2 },
    { champion: 'Ekko', matchupWinRate: 52.7 },
    { champion: 'Kassadin', matchupWinRate: 52.2 },
    { champion: 'Zed', matchupWinRate: 51.9 },
    { champion: 'Xerath', matchupWinRate: 51.5 }
  ] }),
  Sylas: buildInsight({ globalWinRate: 50.0, patchTier: 'B', counters: [
    { champion: 'Cassiopeia', matchupWinRate: 53.1 },
    { champion: 'Vex', matchupWinRate: 52.8 },
    { champion: 'Heimerdinger', matchupWinRate: 52.3 },
    { champion: 'Naafiri', matchupWinRate: 51.9 },
    { champion: 'Akshan', matchupWinRate: 51.5 }
  ] }),
  Thresh: buildInsight({ globalWinRate: 49.6, patchTier: 'B', counters: [
    { champion: 'Milio', matchupWinRate: 53.0 },
    { champion: 'Janna', matchupWinRate: 52.7 },
    { champion: 'Zyra', matchupWinRate: 52.2 },
    { champion: 'Morgana', matchupWinRate: 51.9 },
    { champion: 'Brand', matchupWinRate: 51.5 }
  ] }),
  TwistedFate: buildInsight({ globalWinRate: 50.1, patchTier: 'B', counters: [
    { champion: 'Fizz', matchupWinRate: 53.0 },
    { champion: 'Yasuo', matchupWinRate: 52.5 },
    { champion: 'Naafiri', matchupWinRate: 52.0 },
    { champion: 'Diana', matchupWinRate: 51.7 },
    { champion: 'Vex', matchupWinRate: 51.3 }
  ] }),
  Veigar: buildInsight({ globalWinRate: 53.2, patchTier: 'S', counters: [
    { champion: 'Fizz', matchupWinRate: 53.4 },
    { champion: 'Kassadin', matchupWinRate: 52.9 },
    { champion: 'Zed', matchupWinRate: 52.5 },
    { champion: 'Xerath', matchupWinRate: 52.0 },
    { champion: 'Yone', matchupWinRate: 51.6 }
  ] }),
  Vex: buildInsight({ globalWinRate: 50.6, patchTier: 'A', counters: [
    { champion: 'Anivia', matchupWinRate: 52.9 },
    { champion: 'Cassiopeia', matchupWinRate: 52.5 },
    { champion: 'Xerath', matchupWinRate: 52.1 },
    { champion: 'VelKoz', matchupWinRate: 51.8 },
    { champion: 'Lux', matchupWinRate: 51.4 }
  ] }),
  Vi: buildInsight({ globalWinRate: 50.2, patchTier: 'A', counters: [
    { champion: 'Rammus', matchupWinRate: 53.1 },
    { champion: 'Ivern', matchupWinRate: 52.6 },
    { champion: 'Nocturne', matchupWinRate: 52.2 },
    { champion: 'Poppy', matchupWinRate: 51.8 },
    { champion: 'Warwick', matchupWinRate: 51.5 }
  ] }),
  Viego: buildInsight({ globalWinRate: 50.4, patchTier: 'A', counters: [
    { champion: 'Rammus', matchupWinRate: 53.0 },
    { champion: 'Ivern', matchupWinRate: 52.7 },
    { champion: 'Poppy', matchupWinRate: 52.2 },
    { champion: 'Warwick', matchupWinRate: 51.9 },
    { champion: 'Nocturne', matchupWinRate: 51.5 }
  ] }),
  Wukong: buildInsight({ globalWinRate: 50.6, patchTier: 'A', counters: [
    { champion: 'Rammus', matchupWinRate: 53.1 },
    { champion: 'Ivern', matchupWinRate: 52.7 },
    { champion: 'Poppy', matchupWinRate: 52.3 },
    { champion: 'Trundle', matchupWinRate: 51.9 },
    { champion: 'Warwick', matchupWinRate: 51.5 }
  ] }),
  Xayah: buildInsight({ globalWinRate: 50.7, patchTier: 'A', counters: [
    { champion: 'Seraphine', matchupWinRate: 53.5 },
    { champion: 'Ziggs', matchupWinRate: 52.7 },
    { champion: 'Karthus', matchupWinRate: 52.2 },
    { champion: 'Twitch', matchupWinRate: 51.8 },
    { champion: 'Swain', matchupWinRate: 51.5 }
  ] }),
  XinZhao: buildInsight({ globalWinRate: 51.0, patchTier: 'A', counters: [
    { champion: 'Rammus', matchupWinRate: 53.0 },
    { champion: 'Ivern', matchupWinRate: 52.5 },
    { champion: 'Poppy', matchupWinRate: 52.1 },
    { champion: 'Warwick', matchupWinRate: 51.8 },
    { champion: 'Trundle', matchupWinRate: 51.4 }
  ] }),
  Zed: buildInsight({ globalWinRate: 49.8, patchTier: 'B', counters: [
    { champion: 'Malphite', matchupWinRate: 53.4 },
    { champion: 'Lissandra', matchupWinRate: 52.9 },
    { champion: 'Vex', matchupWinRate: 52.4 },
    { champion: 'Annie', matchupWinRate: 51.9 },
    { champion: 'Garen', matchupWinRate: 51.5 }
  ] }),
  Zeri: buildInsight({ globalWinRate: 48.9, patchTier: 'B', counters: [
    { champion: 'Seraphine', matchupWinRate: 54.0 },
    { champion: 'Swain', matchupWinRate: 53.2 },
    { champion: 'Ziggs', matchupWinRate: 52.7 },
    { champion: 'Twitch', matchupWinRate: 52.0 },
    { champion: 'KogMaw', matchupWinRate: 51.6 }
  ] })
};

export const getLobbyChampionInsight = (championName: string): LobbyChampionInsight | null => lobbyChampionInsightCatalog[championName] ?? null;
