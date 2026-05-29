export const lolMetaSnapshot = {
  version: 1,
  game: 'league-of-legends',
  queue: 'ranked-solo-duo',
  rankBracket: 'emerald_plus',
  rankLabel: 'Emerald+',
  patch: '30',
  updatedAt: '2026-05-29T00:00:00.000Z',
  source: {
    provider: 'lolalytics-tier-list',
    url: 'https://lolalytics.com/lol/tierlist/?tier=emerald_plus&patch=30',
    note: 'Internal backend snapshot. Do not render this label in the client UI.'
  },
  roles: {
    TOP: {
      tiers: {
        S: ['Olaf', 'Garen', 'Irelia', 'Riven', 'Singed', 'Gangplank', 'Vladimir', 'Yone', 'Anivia', 'Shen'],
        A: ['Camille', 'Aatrox', 'Fiora', 'Malphite', 'Jax', 'Gnar', 'Renekton', 'Rumble', 'Ornn', 'Kayle', 'Kennen', 'Akshan'],
        B: ['Dr. Mundo', 'Poppy', 'Urgot', 'Kled', 'Mordekaiser', 'Tryndamere', 'Gwen', 'Pantheon', 'Aurora', "Cho'Gath", 'Volibear', 'Gragas']
      }
    },
    JUNGLE: {
      tiers: {
        S: ['Lee Sin', "Rek'Sai", 'Naafiri', 'Nocturne', 'Kayn', 'Master Yi', 'Talon', 'Xin Zhao'],
        A: ['Jarvan IV', "Bel'Veth", 'Nidalee', 'Nunu & Willump', 'Viego', 'Graves', 'Hecarim', 'Kindred', 'Ivern', "Kha'Zix", 'Ekko', 'Elise'],
        B: ['Fiddlesticks', 'Wukong', 'Briar', 'Diana', 'Warwick', 'Vi', 'Udyr', 'Zac', 'Taliyah', 'Karthus', 'Volibear', 'Lillia']
      }
    },
    MID: {
      tiers: {
        S: ['Naafiri', 'Vladimir', 'Zed', 'Ahri', 'Xerath', 'Katarina', 'Twisted Fate', 'Fizz'],
        A: ['Ekko', 'Viktor', 'Annie', 'Singed', 'Talon', 'Akshan', 'Syndra', 'Orianna', 'Anivia', 'Cassiopeia', 'Sylas', 'Hwei'],
        B: ['LeBlanc', 'Lissandra', 'Akali', 'Diana', 'Aurelion Sol', 'Kassadin', 'Irelia', 'Malzahar', 'Vex', 'Ryze', 'Veigar', 'Azir', 'Taliyah', "Vel'Koz", 'Aurora', 'Yone', 'Galio']
      }
    },
    ADC: {
      tiers: {
        S: ['Smolder', 'Karthus', 'Seraphine', 'Jinx'],
        A: ['Ashe', 'Senna', 'Yasuo', 'Samira', 'Swain', 'Caitlyn', 'Lucian', 'Ezreal', 'Xayah', "Kai'Sa", 'Jhin', 'Draven'],
        B: ['Miss Fortune', 'Sivir', 'Vayne', 'Aphelios', 'Twitch', 'Tristana', 'Zeri', 'Corki', "Kog'Maw", 'Nilah', 'Kalista', 'Varus', 'Ziggs']
      }
    },
    SUPPORT: {
      tiers: {
        S: ['Senna', 'Seraphine', 'Thresh', 'Bard', 'Rell', 'Nami', 'Janna', 'Soraka'],
        A: ['Karma', 'Pyke', 'Sona', 'Milio', 'Leona', 'Elise', 'Lulu', 'Blitzcrank', 'Rakan', 'Nautilus'],
        B: ['Zilean', 'Braum', 'Lux', 'Poppy', 'Yuumi', 'Tahm Kench', 'Morgana', 'Neeko', 'Renata Glasc', 'Taric', "Vel'Koz", 'Alistar', 'Zyra', 'Maokai', 'Xerath']
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
