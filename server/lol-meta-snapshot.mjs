export const lolMetaSnapshot = {
  version: 1,
  game: 'league-of-legends',
  queue: 'ranked-solo-duo',
  rankBracket: 'all',
  rankLabel: 'All ranks',
  patch: '30',
  updatedAt: '2026-05-30T00:00:00.000Z',
  source: {
    provider: 'lolalytics-tier-list',
    url: 'https://lolalytics.com/lol/tierlist/?tier=all&patch=30',
    note: 'Internal backend snapshot. Do not render this label in the client UI.'
  },
  roles: {
    TOP: {
      tiers: {
        S: ['Naafiri', 'Zed', 'Garen', 'Xin Zhao', 'Yone', 'Singed', 'Viktor', 'Olaf', "Rek'Sai", 'Irelia', 'Sion'],
        A: ['Shen', 'Teemo', 'Gangplank', 'Kayle', 'Aurelion Sol', 'Lissandra', 'Zoe', 'Cassiopeia', 'Qiyana'],
        B: []
      }
    },
    JUNGLE: {
      tiers: {
        S: ['Naafiri', 'Xin Zhao', 'Kayn', 'Jarvan IV', 'Nocturne', "Rek'Sai", 'Master Yi', 'Rammus'],
        A: ['Darius', 'Shen', 'Fizz', 'Jax', "Cho'Gath", 'Zaahen', 'Tryndamere', 'Briar', 'Sion', 'Aatrox', 'Shyvana'],
        B: ['Taliyah']
      }
    },
    MID: {
      tiers: {
        S: ['Naafiri', 'Xin Zhao', 'Vladimir', 'Ahri', 'Fizz', 'Riven', 'Garen', 'Xerath', 'Viktor', 'Ekko', 'Veigar'],
        A: ['Lux', 'Swain', 'Aurelion Sol', 'Sion', 'Diana', 'Singed', 'Pantheon', 'Twisted Fate', 'Tryndamere'],
        B: []
      }
    },
    ADC: {
      tiers: {
        S: ['Smolder', 'Jinx', 'Katarina', 'Seraphine', 'Karthus'],
        A: ['Senna', 'Vladimir', 'Swain', 'Ashe', 'Yasuo', 'Veigar', 'Xerath', 'Aurelion Sol'],
        B: ['Brand', 'Fiora', 'Cassiopeia', 'Samira', "Vel'Koz", 'Hwei', 'Lux']
      }
    },
    SUPPORT: {
      tiers: {
        S: ['Senna', 'Seraphine', 'Thresh', 'Rell', 'Soraka', 'Nami', 'Janna', 'Sona', 'Milio'],
        A: ['Elise', 'Bard', "Vel'Koz", 'Leona', 'Brand', 'Lux', 'Xerath', 'Taric', 'Zilean', 'Zyra', 'Nidalee'],
        B: []
      }
    }
  },
  matchups: {
    'platinum-plus': {
      TOP: {
        Aatrox: {
          globalWinRate: 49.5,
          overallMatches: 156679,
          sourcePatch: '16.10',
          sampleLabel: 'Emerald+, Ranked Solo',
          counters: [
            { champion: 'Singed', matchupWinRate: 55.6, matches: 2401 },
            { champion: 'Kled', matchupWinRate: 54.0, matches: 1338 },
            { champion: 'Malphite', matchupWinRate: 53.4, matches: 5413 },
            { champion: 'Vayne', matchupWinRate: 53.3, matches: 2923 },
            { champion: 'Kennen', matchupWinRate: 52.9, matches: 1385 },
            { champion: 'Irelia', matchupWinRate: 52.9, matches: 3976 }
          ]
        }
      },
      MID: {
        Ahri: {
          globalWinRate: 49.4,
          overallMatches: 2413,
          sourcePatch: '16.11',
          sampleLabel: 'Platinum+, Ranked Solo',
          counters: [
            { champion: 'Morgana', matchupWinRate: 77.8, matches: 9 },
            { champion: "Vel'Koz", matchupWinRate: 70.0, matches: 10 },
            { champion: 'Brand', matchupWinRate: 64.3, matches: 14 },
            { champion: 'Sylas', matchupWinRate: 63.9, matches: 133 },
            { champion: 'Ryze', matchupWinRate: 60.9, matches: 46 }
          ]
        }
      },
      ADC: {
        Jinx: {
          globalWinRate: 48.5,
          overallMatches: 319204,
          counters: [
            { champion: 'Seraphine', matchupWinRate: 54.8, matches: 1322 },
            { champion: 'Swain', matchupWinRate: 53.2, matches: 1753 },
            { champion: 'Karthus', matchupWinRate: 52.8, matches: 1306 },
            { champion: 'Ziggs', matchupWinRate: 52.2, matches: 2270 },
            { champion: 'Twitch', matchupWinRate: 51.9, matches: 9783 }
          ]
        }
      }
    }
  }
};
