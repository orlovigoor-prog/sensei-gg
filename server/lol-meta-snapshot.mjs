export const lolMetaSnapshot = {
  version: 1,
  game: 'league-of-legends',
  queue: 'ranked-solo',
  rankBracket: 'diamond2-plus',
  rankLabel: 'Diamond 2+ / High Elo',
  patch: '26.10',
  updatedAt: '2026-05-26T00:00:00.000Z',
  source: {
    provider: 'mobalytics-high-elo-tier-list',
    url: 'https://mobalytics.gg/lol/tier-list/high-elo',
    note: 'Internal backend snapshot. Do not render this label in the client UI.'
  },
  roles: {
    TOP: {
      tiers: {
        S: ['Malphite', 'Gangplank', 'Aatrox', 'Shen', 'Irelia', 'Fiora', 'Zaahen', 'Jax', 'Ambessa', 'Riven'],
        A: ['Darius', 'Garen', "K'Sante", 'Sett', 'Camille', 'Olaf', 'Vayne', 'Kayle', 'Yasuo', 'Kennen', 'Sion', 'Gnar', 'Akali', 'Yone', 'Gragas', 'Ornn', 'Renekton', 'Jayce'],
        B: ['Dr. Mundo', 'Poppy', 'Rumble', 'Urgot', 'Kled', 'Vladimir', 'Mordekaiser', 'Singed', 'Tryndamere', 'Gwen', 'Pantheon', 'Aurora', 'Varus', "Cho'Gath", 'Wukong', 'Volibear']
      }
    },
    JUNGLE: {
      tiers: {
        S: ['Hecarim', 'Kindred', 'Viego', 'Nocturne', 'Jarvan IV', 'Talon', 'Naafiri', 'Graves', "Rek'Sai", 'Shyvana', 'Lee Sin'],
        A: ['Nunu & Willump', 'Master Yi', 'Kayn', 'Nidalee', 'Evelynn', 'Rengar', 'Ivern', "Kha'Zix", 'Ekko', 'Shaco', 'Xin Zhao', 'Zaahen', 'Sylas', "Bel'Veth", 'Elise', 'Fiddlesticks', 'Wukong', 'Briar'],
        B: ['Diana', 'Dr. Mundo', 'Warwick', 'Vi', 'Zed', 'Udyr', 'Aatrox', 'Zac', 'Gwen', 'Taliyah', 'Karthus', 'Qiyana', 'Volibear', 'Lillia']
      }
    },
    MID: {
      tiers: {
        S: ['Ahri', 'Zed', 'Twisted Fate', 'Yasuo', 'Katarina', 'Zoe', 'Lissandra', 'Akali', 'LeBlanc', 'Viktor', 'Qiyana', 'Fizz'],
        A: ['Diana', 'Akshan', 'Aurelion Sol', 'Syndra', 'Kassadin', 'Orianna', 'Anivia', 'Vladimir', 'Naafiri', 'Tryndamere', 'Irelia', 'Cassiopeia', 'Ekko', 'Malzahar', 'Sylas', 'Hwei', 'Mel', 'Xerath'],
        B: ['Annie', 'Lux', 'Vex', 'Ryze', 'Talon', 'Veigar', 'Azir', 'Taliyah', "Vel'Koz", 'Aurora', 'Yone', 'Galio']
      }
    },
    ADC: {
      tiers: {
        S: ['Ashe', 'Caitlyn', 'Smolder', 'Jinx'],
        A: ['Miss Fortune', 'Sivir', 'Ezreal', 'Vayne', 'Xayah', 'Yasuo', 'Aphelios', 'Samira', 'Draven', "Kai'Sa", 'Twitch', 'Jhin', 'Yunara', 'Lucian', 'Tristana', 'Zeri', 'Senna'],
        B: ['Corki', "Kog'Maw", 'Seraphine', 'Nilah', 'Kalista', 'Swain', 'Varus', 'Ziggs', 'Mel']
      }
    },
    SUPPORT: {
      tiers: {
        S: ['Pyke', 'Seraphine', 'Braum', 'Thresh', 'Karma', 'Bard', 'Nautilus', 'Senna', 'Nami'],
        A: ['Soraka', 'Leona', 'Milio', 'Rakan', 'Zilean', 'Rell', 'Blitzcrank', 'Janna', 'Sona', 'Lulu'],
        B: ['Lux', 'Poppy', 'Yuumi', 'Tahm Kench', 'Morgana', 'Neeko', 'Renata Glasc', 'Taric', "Vel'Koz", 'Alistar', 'Zyra', 'Elise', 'Maokai', 'Xerath']
      }
    }
  },
  matchups: {
    'platinum-plus': {
      TOP: {
        Aatrox: {
          globalWinRate: 49.4,
          overallMatches: null,
          counters: [
            { champion: 'Vayne', matchupWinRate: 53.2 },
            { champion: 'Kennen', matchupWinRate: 52.9, matches: 1385 },
            { champion: 'Irelia', matchupWinRate: 52.9, matches: 3976 },
            { champion: 'Ornn', matchupWinRate: 52.2, matches: 3354 },
            { champion: 'Kayle', matchupWinRate: 52.2, matches: 1766 }
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

