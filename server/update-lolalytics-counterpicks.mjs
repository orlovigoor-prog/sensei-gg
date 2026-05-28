import fs from 'node:fs/promises';
import path from 'node:path';
import { lolMetaSnapshot } from './lol-meta-snapshot.mjs';

const DATA_DRAGON_VERSION = process.env.LOL_DATA_DRAGON_VERSION || '14.10.1';
const DATA_DRAGON_CHAMPIONS_URL = `https://ddragon.leagueoflegends.com/cdn/${DATA_DRAGON_VERSION}/data/en_US/champion.json`;
const DATABASE_PATH = path.resolve(process.cwd(), 'server/data/lol-counterpicks.json');
const ROLES = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];
const LOLALYTICS_LANE_BY_ROLE = {
  TOP: 'top',
  JUNGLE: 'jungle',
  MID: 'middle',
  ADC: 'bottom',
  SUPPORT: 'support'
};

const DEFAULT_OPTIONS = {
  rank: process.env.LOLALYTICS_RANK || 'emerald_plus',
  patch: process.env.LOLALYTICS_PATCH || '30',
  minGames: Number.parseInt(process.env.LOLALYTICS_MIN_GAMES || '100', 10),
  maxCounters: Number.parseInt(process.env.LOLALYTICS_MAX_COUNTERS || '8', 10),
  timeoutMs: Number.parseInt(process.env.LOLALYTICS_FETCH_TIMEOUT_MS || '15000', 10),
  allRoles: process.argv.includes('--all-roles'),
  initOnly: process.argv.includes('--init-only'),
  dryRun: process.argv.includes('--dry-run')
};

const normalizeKey = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

const toPercent = (value) => {
  const parsed = Number.parseFloat(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : null;
};

const parseNumber = (value) => {
  const parsed = Number.parseInt(String(value).replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const readJsonFile = async (filePath, fallback) => {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return fallback;
    }
    throw error;
  }
};

const writeJsonFile = async (filePath, value) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};

const fetchText = async (url, timeoutMs) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 SenseiGGMetaUpdater/1.0',
        Accept: 'text/html,application/json;q=0.9,*/*;q=0.8'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
};

const loadDataDragonChampions = async (timeoutMs) => {
  const raw = await fetchText(DATA_DRAGON_CHAMPIONS_URL, timeoutMs);
  const parsed = JSON.parse(raw);

  return Object.values(parsed.data || {}).map((entry) => ({
    id: entry.id,
    key: entry.key,
    name: entry.name,
    slug: normalizeKey(entry.id)
  })).sort((left, right) => left.name.localeCompare(right.name));
};

const buildEmptyDatabase = () => ({
  version: 1,
  game: 'league-of-legends',
  queue: 'ranked-solo-duo',
  defaultRankBracket: DEFAULT_OPTIONS.rank,
  defaultPatchWindow: DEFAULT_OPTIONS.patch,
  updatedAt: new Date().toISOString(),
  source: {
    provider: 'lolalytics',
    baseUrl: 'https://lolalytics.com/lol',
    mode: 'backend-snapshot',
    refreshCadence: 'weekly',
    note: 'Internal backend counterpick database. Do not render this label in the client UI. Runtime client scraping is intentionally disabled.'
  },
  coverage: {
    championCatalog: 'data-dragon',
    championEntities: 'all-known-champions-on-last-refresh',
    matchupRows: 'sparse-until-weekly-updater-populates-each-role'
  },
  champions: {}
});

const ensureChampionEntities = (database, championCatalog) => {
  championCatalog.forEach((champion) => {
    database.champions[champion.name] = {
      slug: champion.slug,
      dataDragonId: champion.id,
      dataDragonKey: champion.key,
      roles: database.champions[champion.name]?.roles || {},
      ...database.champions[champion.name]
    };
  });
};

const getSnapshotRolesForChampion = (championName) => {
  const normalizedChampion = normalizeKey(championName);
  return ROLES.filter((role) => {
    const roleSnapshot = lolMetaSnapshot.roles[role];
    return Object.values(roleSnapshot?.tiers || {}).some((champions) => champions.some((candidate) => normalizeKey(candidate) === normalizedChampion));
  });
};

const stripHtml = (html) => html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&#x27;|&apos;/g, "'")
  .replace(/&quot;/g, '"')
  .replace(/\s+/g, ' ')
  .trim();

const parseLolalyticsCounters = (html, championName, minGames, maxCounters) => {
  const text = stripHtml(html);
  const averageMatch = text.match(/Average\s+[^:]+\s+Win\s+Rate:\s*([0-9]+(?:\.[0-9]+)?)%/i);
  const counterPattern = /#\s+([^#]+?)\s+##\s+[^#]+?\s+([A-Za-z'.\s]+?)\s+wins\s+against\s+([^0-9]+?)\s+([0-9]+(?:\.[0-9]+)?)%\s+of\s+the\s+time\s+which\s+is\s+([0-9.-]+)%\s*(?:lower|higher|different)\s+against\s+[^.]+?After\s+normalising\s+both\s+champions\s+win\s+rates\s+[A-Za-z'.\s]+?\s+wins\s+against\s+[^0-9]+?\s+([0-9.-]+)%\s*(?:less|more|different)\s+[^.]+?The\s+average\s+opponent\s+winrate\s+against\s+[^0-9]+?\s+is\s+([0-9]+(?:\.[0-9]+)?)%/gi;
  const gamesBySlug = new Map();
  const linkPattern = /\/lol\/[^/]+\/vs\/([a-z0-9]+)\/build\/[^\]]*?([0-9][0-9,]*)\s+Games/gi;
  let linkMatch;

  while ((linkMatch = linkPattern.exec(text))) {
    gamesBySlug.set(linkMatch[1], parseNumber(linkMatch[2]));
  }

  const counters = [];
  let match;

  while ((match = counterPattern.exec(text)) && counters.length < maxCounters) {
    const counterChampion = match[1].trim();
    const targetChampionWinRate = toPercent(match[4]);
    const delta1 = toPercent(match[5]);
    const delta2 = toPercent(match[6]);
    const allChampsWinRateVsCounter = toPercent(match[7]);
    const slug = normalizeKey(counterChampion);
    const matches = gamesBySlug.get(slug) ?? null;

    if (!targetChampionWinRate || (matches !== null && matches < minGames)) {
      continue;
    }

    counters.push({
      champion: counterChampion,
      slug,
      targetChampionWinRate,
      matchupWinRate: Math.round((100 - targetChampionWinRate) * 100) / 100,
      allChampsWinRateVsCounter,
      delta1,
      delta2,
      matches
    });
  }

  return {
    sampleLabel: `Emerald+, Ranked Solo/Duo, ${DEFAULT_OPTIONS.patch === '30' ? 'last 30 days' : `patch ${DEFAULT_OPTIONS.patch}`}`,
    averageTierWinRate: averageMatch ? toPercent(averageMatch[1]) : null,
    counters,
    parseWarning: counters.length === 0 ? `No counter rows parsed for ${championName}` : null
  };
};

const buildCounterUrl = (championSlug, role, options) => {
  const lane = LOLALYTICS_LANE_BY_ROLE[role];
  const params = new URLSearchParams({ lane, vslane: lane, tier: options.rank, patch: options.patch });
  return `https://lolalytics.com/lol/${championSlug}/counters/?${params.toString()}`;
};

const parseArgValue = (name) => {
  const prefix = `${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) || null;
};

const main = async () => {
  const options = {
    ...DEFAULT_OPTIONS,
    champion: parseArgValue('--champion'),
    role: parseArgValue('--role')?.toUpperCase() || null,
    limit: Number.parseInt(parseArgValue('--limit') || '0', 10)
  };
  const database = await readJsonFile(DATABASE_PATH, buildEmptyDatabase());
  const championCatalog = await loadDataDragonChampions(options.timeoutMs);

  database.champions ||= {};
  ensureChampionEntities(database, championCatalog);
  database.defaultRankBracket = options.rank;
  database.defaultPatchWindow = options.patch;
  database.updatedAt = new Date().toISOString();

  if (options.initOnly) {
    if (!options.dryRun) {
      await writeJsonFile(DATABASE_PATH, database);
    }
    console.log(`Initialized ${championCatalog.length} champion entities. initOnly=true dryRun=${options.dryRun}`);
    return;
  }

  const selectedChampions = championCatalog
    .filter((champion) => !options.champion || normalizeKey(champion.name) === normalizeKey(options.champion) || champion.slug === normalizeKey(options.champion))
    .slice(0, options.limit > 0 ? options.limit : undefined);
  const failures = [];
  let updatedRows = 0;

  for (const champion of selectedChampions) {
    const roles = options.role ? [options.role] : options.allRoles ? ROLES : getSnapshotRolesForChampion(champion.name);

    for (const role of roles) {
      try {
        const url = buildCounterUrl(champion.slug, role, options);
        const html = await fetchText(url, options.timeoutMs);
        const parsed = parseLolalyticsCounters(html, champion.name, options.minGames, options.maxCounters);

        if (parsed.counters.length === 0) {
          failures.push({ champion: champion.name, role, reason: parsed.parseWarning || 'No counters parsed' });
          continue;
        }

        database.champions[champion.name].roles ||= {};
        database.champions[champion.name].roles[role] = {
          rankBracket: options.rank,
          patchWindow: options.patch,
          sampleLabel: parsed.sampleLabel,
          averageTierWinRate: parsed.averageTierWinRate,
          sourceUpdatedAt: new Date().toISOString(),
          counters: parsed.counters
        };
        updatedRows += 1;
        console.log(`Updated ${champion.name} ${role}: ${parsed.counters.length} counters`);
      } catch (error) {
        failures.push({ champion: champion.name, role, reason: error instanceof Error ? error.message : String(error) });
      }
    }
  }

  database.lastUpdaterRun = {
    updatedAt: new Date().toISOString(),
    options,
    updatedRows,
    failures
  };

  if (!options.dryRun) {
    await writeJsonFile(DATABASE_PATH, database);
  }

  console.log(`Lolalytics counterpick update finished. champions=${selectedChampions.length} updatedRows=${updatedRows} failures=${failures.length} dryRun=${options.dryRun}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

