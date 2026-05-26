// Riot API / LCU helpers used by the client UI.
const LCU_API_BASE = 'http://127.0.0.1:2999';

export interface Summoner {
  id: string;
  accountId: string;
  puuid: string;
  name: string;
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
}

export interface RankedStats {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  hotStreak: boolean;
  veteran: boolean;
  freshBlood: boolean;
  inactive: boolean;
}

export interface Match {
  metadata: {
    matchId: string;
    participants: string[];
  };
  info: {
    gameDuration: number;
    gameMode: string;
    gameType: string;
    participants: MatchParticipant[];
  };
}

export interface MatchParticipant {
  puuid: string;
  summonerName: string;
  championName: string;
  teamPosition: string;
  kills: number;
  deaths: number;
  assists: number;
  totalMinionsKilled: number;
  win: boolean;
  items: number[];
  spell1Id: number;
  spell2Id: number;
}

export interface ChampionInfo {
  id: string;
  key: string;
  name: string;
  title: string;
  image: {
    full: string;
    sprite: string;
    group: string;
    x: number;
    y: number;
    w: number;
    h: number;
  };
  spells: ChampionSpell[];
  passive: ChampionPassive;
}

export interface ChampionSpell {
  id: string;
  name: string;
  description: string;
  tooltip: string;
  image: {
    full: string;
    sprite: string;
    group: string;
    x: number;
    y: number;
    w: number;
    h: number;
  };
  maxrank: number;
  cooldown: number[];
  cost: number[];
  range: number[];
}

export interface ChampionPassive {
  name: string;
  description: string;
  image: {
    full: string;
    sprite: string;
    group: string;
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

// LCU WebSocket для работы с клиентом LoL
export class LcuService {
  constructor() {
    this.init();
  }

  private async init() {
    try {
      const response = await fetch('http://127.0.0.1:2999/liveclientdata/allgamedata');
      if (response.ok) {
        console.log('LCU API доступен');
      }
    } catch {
      console.log('LCU API недоступен, клиент может быть закрыт');
    }
  }

  async getCurrentGame(): Promise<unknown | null> {
    try {
      const response = await fetch(`${LCU_API_BASE}/liveclientdata/allgamedata`);
      if (!response.ok) throw new Error('No game in progress');
      return await response.json();
    } catch {
      return null;
    }
  }

  getChampionIcon(championId: number | string): string {
    return `https://ddragon.leagueoflegends.com/cdn/14.10.1/img/champion/${championId}.png`;
  }

  getChampionSpellIcon(championId: number | string, spellIndex: number): string {
    return `https://ddragon.leagueoflegends.com/cdn/14.10.1/img/spell/${championId}SP${spellIndex + 1}.png`;
  }

  getPassiveIcon(championId: number | string): string {
    return `https://ddragon.leagueoflegends.com/cdn/14.10.1/img/passive/${championId}_Passive.png`;
  }

  getSummonerSpellIcon(spellId: number): string {
    const spellNames: Record<number, string> = {
      1: 'Cleanse',
      3: 'Ghost',
      4: 'Flash',
      6: 'Teleport',
      7: 'Heal',
      11: 'Smite',
      12: 'Exhaust',
      14: 'Ignite',
      21: 'Barrier'
    };
    const name = spellNames[spellId] || 'Flash';
    return `https://ddragon.leagueoflegends.com/cdn/14.10.1/img/spell/Summoner${name}.png`;
  }

  async getChampionData(championId: string): Promise<ChampionInfo | null> {
    try {
      const response = await fetch(
        `https://ddragon.leagueoflegends.com/cdn/14.10.1/data/en_US/champion/${championId}.json`
      );
      
      if (!response.ok) return null;
      const data = await response.json();
      return Object.values(data.data)[0] as ChampionInfo;
    } catch (error) {
      console.error('Error fetching champion data:', error);
      return null;
    }
  }

  async getAllChampions(): Promise<Record<string, ChampionInfo>> {
    try {
      const response = await fetch(
        'https://ddragon.leagueoflegends.com/cdn/14.10.1/data/en_US/champion.json'
      );
      
      if (!response.ok) return {};
      const data = await response.json();
      return data.data as Record<string, ChampionInfo>;
    } catch (error) {
      console.error('Error fetching all champions:', error);
      return {};
    }
  }
}

export const lcuService = new LcuService();
