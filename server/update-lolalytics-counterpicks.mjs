import fs from 'node:fs/promises';
import path from 'node:path';
import { lolMetaSnapshot } from './lol-meta-snapshot.mjs';

const DATA_DRAGON_VERSION = process.env.LOL_DATA_DRAGON_VERSION || '16.11.1';
const DATA_DRAGON_CHAMPIONS_URL = `https://ddragon.leagueoflegends.com/cdn/${DATA_DRAGON_VERSION}/data/en_US/champion.json`;
const DATABASE_PATH = path.resolve(process.cwd(), 'server/data/lol-counterpicks.json');
const ROLE_MATRIX_PATH = path.resolve(process.cwd(), 'src/services/gameData/champion-role-matrix.json');
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
  retries: Number.parseInt(process.env.LOLALYTICS_FETCH_RETRIES || '2', 10),
  retryDelayMs: Number.parseInt(process.env.LOLALYTICS_RETRY_DELAY_MS || '1200', 10),
  allRoles: process.argv.includes('--all-roles'),
  initOnly: process.argv.includes('--init-only'),
  force: process.argv.includes('--force'),
  coverageOnly: process.argv.includes('--coverage'),
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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36 SenseiGGMetaUpdater/2.0',
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

const fetchTextWithRetry = async (url, options) => {
  let lastError = null;

  for (let attempt = 0; attempt <= options.retries; attempt += 1) {
    try {
      return await fetchText(url, options.timeoutMs);
    } catch (error) {
      lastError = error;

      if (attempt < options.retries) {
        await sleep(options.retryDelayMs * (attempt + 1));
      }
    }
  }

  throw lastError;
};

const loadDataDragonChampions = async (timeoutMs) => {
  const raw = await fetchTextWithRetry(DATA_DRAGON_CHAMPIONS_URL, { ...DEFAULT_OPTIONS, timeoutMs });
  const parsed = JSON.parse(raw);

  return Object.values(parsed.data || {}).map((entry) => ({
    id: entry.id,
    key: entry.key,
    name: entry.name,
    slug: normalizeKey(entry.id)
  })).sort((left, right) => left.name.localeCompare(right.name));
};

const loadRoleMatrix = async () => readJsonFile(ROLE_MATRIX_PATH, []);

const findRoleMatrixEntry = (roleMatrix, championName) => roleMatrix.find((entry) => normalizeKey(entry.champion) === normalizeKey(championName));

const canChampionPlayRole = (roleMatrix, championName, role) => {
  const entry = findRoleMatrixEntry(roleMatrix, championName);

  if (!entry) {
    return false;
  }

  return [...(entry.primaryRoles || []), ...(entry.secondaryRoles || [])].includes(role);
};

const getRoleMatrixRolesForChampion = (roleMatrix, championName) => {
  const entry = findRoleMatrixEntry(roleMatrix, championName);

  return entry ? [...new Set([...(entry.primaryRoles || []), ...(entry.secondaryRoles || [])])] : [];
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
  const gamesBySlug = new Map();
  const linkPattern = /\/lol\/[^/]+\/vs\/([a-z0-9]+)\/build\/[^\]]*?([0-9][0-9,]*)\s+Games/gi;
  let linkMatch;

  while ((linkMatch = linkPattern.exec(text))) {
    gamesBySlug.set(linkMatch[1], parseNumber(linkMatch[2]));
  }

  const counters = [];
  const championPattern = championName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  const counterNamePattern = "([A-Za-z0-9'.&\\s-]+?)";
  const detailPattern = new RegExp(`${championPattern}\\s+wins\\s+against\\s+${counterNamePattern}\\s+([0-9]+(?:\\.[0-9]+)?)%\\s+of\\s+the\\s+time\\s+which\\s+is\\s+([0-9.-]+)%\\s*(?:lower|higher|different)\\s+against\\s+[^.]+?After\\s+normalising\\s+both\\s+champions\\s+win\\s+rates\\s+${championPattern}\\s+wins\\s+against\\s+${counterNamePattern}\\s+([0-9.-]+)%\\s*(?:less|more|different)\\s+[^.]+?The\\s+average\\s+opponent\\s+winrate\\s+against\\s+${counterNamePattern}\\s+is\\s+([0-9]+(?:\\.[0-9]+)?)%`, 'gi');
  const addCounter = ({ counterChampion, targetChampionWinRate, delta1, delta2, allChampsWinRateVsCounter, matches }) => {
    const slug = normalizeKey(counterChampion);

    if (!targetChampionWinRate || (matches !== null && matches < minGames) || counters.some((counter) => counter.slug === slug)) {
      return;
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
  };
  let detailMatch;

  while ((detailMatch = detailPattern.exec(text)) && counters.length < maxCounters) {
    const counterChampion = detailMatch[1].trim();
    const targetChampionWinRate = toPercent(detailMatch[2]);
    const delta1 = toPercent(detailMatch[3]);
    const delta2 = toPercent(detailMatch[5]);
    const allChampsWinRateVsCounter = toPercent(detailMatch[7]);
    const matches = gamesBySlug.get(normalizeKey(counterChampion)) ?? null;

    addCounter({
      champion: counterChampion,
      counterChampion,
      targetChampionWinRate,
      allChampsWinRateVsCounter,
      delta1,
      delta2,
      matches
    });
  }

  const compactHtml = html.replace(/<!--[\s\S]*?-->/g, ' ').replace(/\s+/g, ' ');
  const cardPattern = /<div class="h-\[20px\][\s\S]*?>([^<]+)<\/div>[\s\S]*?<span class="text-green-300">([0-9]+(?:\.[0-9]+)?)%<\/span>[\s\S]*?<span class="text-yellow-400">([0-9.-]+)%<\/span>[\s\S]*?<span class="text-yellow-100">([0-9.-]+)%<\/span>[\s\S]*?<span class="text-green-500">([0-9]+(?:\.[0-9]+)?)%<\/span>/gi;
  let cardMatch;

  while ((cardMatch = cardPattern.exec(compactHtml)) && counters.length < maxCounters) {
    const counterChampion = cardMatch[1].trim();
    const matchesPattern = new RegExp(`${counterChampion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]{0,1600}?([0-9][0-9,]*)\\s+Games`, 'i');
    const matches = parseNumber(compactHtml.slice(Math.max(0, cardMatch.index - 400), cardMatch.index + 1800).match(matchesPattern)?.[1]) ?? null;

    addCounter({
      counterChampion,
      targetChampionWinRate: toPercent(cardMatch[2]),
      delta1: toPercent(cardMatch[3]),
      delta2: toPercent(cardMatch[4]),
      allChampsWinRateVsCounter: toPercent(cardMatch[5]),
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

const parseLolalyticsBuildMetrics = (html, championName, role) => {
  const text = stripHtml(html);
  const lane = LOLALYTICS_LANE_BY_ROLE[role];
  const championPattern = championName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  const winRateMatch = text.match(new RegExp(`${championPattern}\\s+${lane}\\s+has\\s+a\\s+([0-9]+(?:\\.[0-9]+)?)%\\s+win\\s+rate`, 'i'))
    || text.match(/\b([0-9]+(?:\.[0-9]+)?)%\s+Win\s+Rate\b/i);
  const gamesMatch = text.match(/Ban\s+Rate\s+([0-9][0-9,]*)\s+Games/i)
    || text.match(/\b([0-9][0-9,]*)\s+Games\s+(?:\[[^\]]+\]\([^)]*\/build\/|Highest\s+Win\s+Build|Skill\s+Priority)/i);

  return {
    globalWinRate: winRateMatch ? toPercent(winRateMatch[1]) : null,
    overallMatches: gamesMatch ? parseNumber(gamesMatch[1]) : null
  };
};

const filterRoleAwareCounters = (roleMatrix, counters, role) => (counters || []).filter((counter) => canChampionPlayRole(roleMatrix, counter.champion, role));

const buildCounterUrl = (championSlug, role, options) => {
  const lane = LOLALYTICS_LANE_BY_ROLE[role];
  const params = new URLSearchParams({ lane, vslane: lane, tier: options.rank, patch: options.patch });
  return `https://lolalytics.com/lol/${championSlug}/counters/?${params.toString()}`;
};

const buildChampionBuildUrl = (championSlug, role, options) => {
  const lane = LOLALYTICS_LANE_BY_ROLE[role];
  const params = new URLSearchParams({ lane, tier: options.rank, patch: options.patch });
  return `https://lolalytics.com/lol/${championSlug}/build/?${params.toString()}`;
};

const buildCoverageReport = (database, roleMatrix) => {
  const roleRows = [];
  const missingRoleRows = [];
  const missingGlobalWinRateRows = [];

  roleMatrix.forEach((entry) => {
    [...new Set([...(entry.primaryRoles || []), ...(entry.secondaryRoles || [])])].forEach((role) => {
      const championEntry = Object.entries(database.champions || {}).find(([candidateName, candidateEntry]) => (
        normalizeKey(candidateName) === normalizeKey(entry.champion) || normalizeKey(candidateEntry?.slug) === normalizeKey(entry.champion)
      ))?.[1];
      const roleEntry = championEntry?.roles?.[role];
      const counters = roleEntry?.counters;

      if (Array.isArray(counters) && counters.length > 0) {
        roleRows.push(`${entry.champion}:${role}`);

        if (!Number.isFinite(roleEntry.globalWinRate)) {
          missingGlobalWinRateRows.push(`${entry.champion}:${role}`);
        }
      } else {
        missingRoleRows.push(`${entry.champion}:${role}`);
      }
    });
  });

  return {
    championEntities: Object.keys(database.champions || {}).length,
    roleMatrixChampions: roleMatrix.length,
    filledRoleRows: roleRows.length,
    missingRoleRows: missingRoleRows.length,
    missingGlobalWinRateRows: missingGlobalWinRateRows.length,
    missingGlobalWinRateRowsSample: missingGlobalWinRateRows.slice(0, 40),
    missingRoleRowsSample: missingRoleRows.slice(0, 40)
  };
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
    championsFile: parseArgValue('--champions-file'),
    limit: Number.parseInt(parseArgValue('--limit') || '0', 10)
  };
  const database = await readJsonFile(DATABASE_PATH, buildEmptyDatabase());
  const roleMatrix = await loadRoleMatrix();
  const championCatalog = await loadDataDragonChampions(options.timeoutMs);

  database.champions ||= {};
  ensureChampionEntities(database, championCatalog);
  database.defaultRankBracket = options.rank;
  database.defaultPatchWindow = options.patch;
  database.updatedAt = new Date().toISOString();

  if (options.coverageOnly) {
    console.log(JSON.stringify(buildCoverageReport(database, roleMatrix), null, 2));
    return;
  }

  if (options.initOnly) {
    if (!options.dryRun) {
      await writeJsonFile(DATABASE_PATH, database);
    }
    console.log(`Initialized ${championCatalog.length} champion entities. initOnly=true dryRun=${options.dryRun}`);
    return;
  }

  const requestedChampionKeys = options.championsFile
    ? (await fs.readFile(path.resolve(process.cwd(), options.championsFile), 'utf8')).split(/\r?\n/).map((line) => normalizeKey(line)).filter(Boolean)
    : [];
  const selectedChampions = championCatalog
    .filter((champion) => (
      (!options.champion || normalizeKey(champion.name) === normalizeKey(options.champion) || champion.slug === normalizeKey(options.champion))
      && (requestedChampionKeys.length === 0 || requestedChampionKeys.includes(normalizeKey(champion.name)) || requestedChampionKeys.includes(champion.slug))
    ))
    .slice(0, options.limit > 0 ? options.limit : undefined);
  const failures = [];
  let updatedRows = 0;

  for (const champion of selectedChampions) {
    const roles = (options.role ? [options.role] : options.allRoles ? getRoleMatrixRolesForChampion(roleMatrix, champion.name) : getSnapshotRolesForChampion(champion.name))
      .filter((role) => ROLES.includes(role) && canChampionPlayRole(roleMatrix, champion.name, role));

    for (const role of roles) {
      try {
        const existingRoleEntry = database.champions[champion.name]?.roles?.[role];
        if (!options.force && existingRoleEntry?.globalWinRate && Array.isArray(existingRoleEntry.counters) && existingRoleEntry.counters.length > 0) {
          console.log(`Skipped ${champion.name} ${role}: already has global winrate and counters. Use --force to refresh.`);
          continue;
        }

        const buildHtml = await fetchTextWithRetry(buildChampionBuildUrl(champion.slug, role, options), options);
        const buildMetrics = parseLolalyticsBuildMetrics(buildHtml, champion.name, role);
        let parsed = {
          sampleLabel: existingRoleEntry?.sampleLabel || `Emerald+, Ranked Solo/Duo, ${options.patch === '30' ? 'last 30 days' : `patch ${options.patch}`}`,
          averageTierWinRate: existingRoleEntry?.averageTierWinRate ?? null,
          parseWarning: null
        };
        let roleAwareCounters = filterRoleAwareCounters(roleMatrix, existingRoleEntry?.counters || [], role);

        if (options.force || roleAwareCounters.length === 0) {
          const url = buildCounterUrl(champion.slug, role, options);
          const html = await fetchTextWithRetry(url, options);
          parsed = parseLolalyticsCounters(html, champion.name, options.minGames, options.maxCounters);
          roleAwareCounters = filterRoleAwareCounters(roleMatrix, parsed.counters, role);
        }

        if (roleAwareCounters.length === 0) {
          failures.push({ champion: champion.name, role, reason: parsed.parseWarning || 'No role-aware counter rows parsed' });
          continue;
        }

        if (!Number.isFinite(buildMetrics.globalWinRate)) {
          failures.push({ champion: champion.name, role, reason: 'No reliable global winrate parsed from build page' });
          continue;
        }

        database.champions[champion.name].roles ||= {};
        database.champions[champion.name].roles[role] = {
          rankBracket: options.rank,
          patchWindow: options.patch,
          sampleLabel: parsed.sampleLabel,
          globalWinRate: buildMetrics.globalWinRate,
          overallMatches: buildMetrics.overallMatches,
          averageTierWinRate: parsed.averageTierWinRate,
          sourceUpdatedAt: new Date().toISOString(),
          counters: roleAwareCounters
        };
        updatedRows += 1;
        console.log(`Updated ${champion.name} ${role}: ${roleAwareCounters.length} counters, WR ${buildMetrics.globalWinRate}%`);
      } catch (error) {
        failures.push({ champion: champion.name, role, reason: error instanceof Error ? error.message : String(error) });
      }
    }
  }

  database.lastUpdaterRun = {
    updatedAt: new Date().toISOString(),
    options,
    updatedRows,
    failures,
    coverage: buildCoverageReport(database, roleMatrix)
  };

  if (!options.dryRun) {
    await writeJsonFile(DATABASE_PATH, database);
  }

  failures.slice(0, 25).forEach((failure) => {
    console.warn(`Failed ${failure.champion} ${failure.role}: ${failure.reason}`);
  });
  console.log(`Lolalytics counterpick update finished. champions=${selectedChampions.length} updatedRows=${updatedRows} failures=${failures.length} dryRun=${options.dryRun}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
