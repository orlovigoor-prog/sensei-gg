// Types shared by the client profile UI and the server-backed Riot API adapter.
// Static champion and item reference data lives in services/gameData/Data Dragon.
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
