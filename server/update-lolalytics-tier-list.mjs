import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { fetchCurrentGamePatch, hasCurrentPatchMetadata, normalizeGamePatch } from './lol-meta-patch.mjs';

const SNAPSHOT_PATH = path.resolve(process.cwd(), 'server/lol-meta-snapshot.mjs');
const ROLE_MATRIX_PATH = path.resolve(process.cwd(), 'src/services/gameData/champion-role-matrix.json');
const ROLES = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];
const LOLALYTICS_LANE_BY_ROLE = {
  TOP: 'top',
  JUNGLE: 'jungle',
  MID: 'middle',
  ADC: 'bottom',
  SUPPORT: 'support'
};
const ROLE_BY_LOLALYTICS_LANE = Object.fromEntries(Object.entries(LOLALYTICS_LANE_BY_ROLE).map(([role, lane]) => [lane, role]));
const KNOWN_TIERS = new Set(['S+', 'S', 'S-', 'A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-']);
const MIN_SOURCE_ROWS_PER_ROLE = 50;

const DEFAULT_OPTIONS = {
  rank: process.env.LOLALYTICS_RANK || 'all',
  patch: null,
  riotRealm: process.env.LOL_META_RIOT_REALM || 'na',
  timeoutMs: Number.parseInt(process.env.LOLALYTICS_FETCH_TIMEOUT_MS || '15000', 10),
  retries: Number.parseInt(process.env.LOLALYTICS_FETCH_RETRIES || '2', 10),
  retryDelayMs: Number.parseInt(process.env.LOLALYTICS_RETRY_DELAY_MS || '1200', 10),
  coverageOnly: process.argv.includes('--coverage'),
  dryRun: process.argv.includes('--dry-run'),
  requireComplete: process.argv.includes('--require-complete')
};

const normalizeKey = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const decodeHtml = (value) => String(value || '')
  .replace(/&amp;/g, '&')
  .replace(/&#x27;|&#39;|&apos;/g, "'")
  .replace(/&quot;/g, '"')
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
  .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));

const stripHtml = (html) => decodeHtml(html
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim());

const readJsonFile = async (filePath) => JSON.parse(await fs.readFile(filePath, 'utf8'));

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

const getRoleMatrixRolesForChampion = (entry) => [...new Set([...(entry.primaryRoles || []), ...(entry.secondaryRoles || [])])]
  .filter((role) => ROLES.includes(role));

const findRoleMatrixEntry = (roleMatrix, championName) => roleMatrix.find((entry) => normalizeKey(entry.champion) === normalizeKey(championName));

const canChampionPlayRole = (roleMatrix, championName, role) => {
  const entry = findRoleMatrixEntry(roleMatrix, championName);
  return Boolean(entry && getRoleMatrixRolesForChampion(entry).includes(role));
};

const buildTierListUrl = (role, options) => {
  const lane = LOLALYTICS_LANE_BY_ROLE[role];
  const params = new URLSearchParams({ lane, tier: options.rank, patch: options.patch, view: 'grid' });
  return `https://lolalytics.com/lol/tierlist/?${params.toString()}`;
};

const getLolalyticsPatchFromHtml = (html) => {
  const patchMatch = stripHtml(html).match(/(?:League of Legends )?Patch\s+(\d+\.\d+)/i);
  return normalizeGamePatch(patchMatch?.[1]);
};

const assertLolalyticsPatch = (html, expectedPatch, sourceLabel) => {
  const receivedPatch = getLolalyticsPatchFromHtml(html);

  if (receivedPatch !== expectedPatch) {
    throw new Error(`${sourceLabel} returned patch ${receivedPatch || 'missing'}; expected ${expectedPatch}.`);
  }
};

const parseTierListRows = (html, requestedRole, roleMatrix) => {
  const rows = [];
  let sourceRows = 0;
  const addRow = (cardHtml) => {
    const championName = decodeHtml(cardHtml.match(/<img\b[^>]*\bchamp(?:x46|280)\/[^\"]+"[^>]*\balt="([^"]+)"/i)?.[1] || '');
    const lane = cardHtml.match(/lane27\/([a-z]+)\.webp/i)?.[1]?.toLowerCase();
    const rowRole = lane ? ROLE_BY_LOLALYTICS_LANE[lane] : null;
    const tier = stripHtml(cardHtml).match(/(?:^|\s)(S[+-]?|A[+-]?|B[+-]?|C[+-]?|D[+-]?)(?=\s|$)/)?.[1] || null;

    if (!championName || rowRole !== requestedRole || !tier || !KNOWN_TIERS.has(tier)) {
      return;
    }

    sourceRows += 1;
    const matrixEntry = findRoleMatrixEntry(roleMatrix, championName);

    if (matrixEntry && canChampionPlayRole(roleMatrix, matrixEntry.champion, requestedRole)) {
      rows.push({ champion: matrixEntry.champion, tier });
    }
  };
  const rowMarker = 'class="flex h-[52px]';
  let searchFrom = 0;

  while (searchFrom < html.length) {
    const start = html.indexOf(rowMarker, searchFrom);

    if (start === -1) {
      break;
    }

    const nextStart = html.indexOf(rowMarker, start + rowMarker.length);
    const rowHtml = html.slice(start, nextStart === -1 ? html.length : nextStart);
    searchFrom = nextStart === -1 ? html.length : nextStart;
    addRow(rowHtml);
  }

  const gridCardPattern = /<a href="\/lol\/[^/]+\/build\/\?[^\"]*"[^>]*>([\s\S]*?)<\/a>/gi;
  let gridCardMatch;

  while ((gridCardMatch = gridCardPattern.exec(html))) {
    addRow(gridCardMatch[1]);
  }

  return { rows, sourceRows };
};

const buildCoverageReport = (snapshot, roleMatrix, options) => {
  const foundTierRows = new Map();
  const duplicateTierRows = [];
  const invalidTierRows = [];
  const incompleteSourceRoles = [];
  const emptyPublishedRoles = [];

  ROLES.forEach((role) => {
    const roleSnapshot = snapshot?.roles?.[role];
    const tiers = roleSnapshot?.tiers || {};
    const sourceRows = roleSnapshot?.sourceRows;

    if (!Number.isInteger(sourceRows) || sourceRows < MIN_SOURCE_ROWS_PER_ROLE) {
      incompleteSourceRoles.push(`${role}:${Number.isInteger(sourceRows) ? sourceRows : 'missing'}`);
    }

    let rolePublishedRows = 0;

    Object.entries(tiers).forEach(([tier, champions]) => {
      if (!KNOWN_TIERS.has(tier) || !Array.isArray(champions)) {
        invalidTierRows.push(`${role}:${tier}`);
        return;
      }

      champions.forEach((champion) => {
        const key = `${normalizeKey(champion)}:${role}`;

        if (!canChampionPlayRole(roleMatrix, champion, role)) {
          invalidTierRows.push(`${champion}:${role}`);
          return;
        }

        if (foundTierRows.has(key)) {
          duplicateTierRows.push(`${champion}:${role}`);
          return;
        }

        foundTierRows.set(key, tier);
        rolePublishedRows += 1;
      });
    });

    if (rolePublishedRows === 0) {
      emptyPublishedRoles.push(role);
    }
  });

  const metadataValid = snapshot?.rankBracket === options.rank && hasCurrentPatchMetadata(snapshot, options.currentGamePatch);

  return {
    expectedRoles: ROLES.length,
    filledRoles: ROLES.filter((role) => Object.values(snapshot?.roles?.[role]?.tiers || {}).some((champions) => Array.isArray(champions) && champions.length > 0)).length,
    publishedRoleRows: foundTierRows.size,
    incompleteSourceRoles: incompleteSourceRoles.length,
    emptyPublishedRoles: emptyPublishedRoles.length,
    duplicateTierRows: duplicateTierRows.length,
    invalidTierRows: invalidTierRows.length,
    metadataValid,
    completeCoverage: metadataValid && incompleteSourceRoles.length === 0 && emptyPublishedRoles.length === 0 && duplicateTierRows.length === 0 && invalidTierRows.length === 0,
    incompleteSourceRolesSample: incompleteSourceRoles.slice(0, 40),
    emptyPublishedRolesSample: emptyPublishedRoles.slice(0, 40),
    duplicateTierRowsSample: duplicateTierRows.slice(0, 40),
    invalidTierRowsSample: invalidTierRows.slice(0, 40)
  };
};

const loadSnapshot = async () => {
  const snapshotUrl = `${pathToFileURL(SNAPSHOT_PATH).href}?updated=${Date.now()}`;
  const { lolMetaSnapshot } = await import(snapshotUrl);
  return lolMetaSnapshot;
};

const writeSnapshot = async (snapshot) => {
  const moduleContents = `export const lolMetaSnapshot = ${JSON.stringify(snapshot, null, 2)};\n`;
  await fs.writeFile(SNAPSHOT_PATH, moduleContents, 'utf8');
};

const parseArgValue = (name) => {
  const prefix = `${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) || null;
};

const main = async () => {
  const requestedPatch = parseArgValue('--patch');
  const currentGamePatch = await fetchCurrentGamePatch({
    realm: parseArgValue('--riot-realm') || DEFAULT_OPTIONS.riotRealm,
    timeoutMs: DEFAULT_OPTIONS.timeoutMs
  });

  if (requestedPatch && normalizeGamePatch(requestedPatch) !== currentGamePatch.gamePatch) {
    throw new Error(`Requested patch ${requestedPatch} does not match the current Riot game patch ${currentGamePatch.gamePatch}.`);
  }

  const options = {
    ...DEFAULT_OPTIONS,
    rank: parseArgValue('--rank') || DEFAULT_OPTIONS.rank,
    patch: currentGamePatch.gamePatch,
    patchBuild: currentGamePatch.dataDragonVersion,
    patchSource: currentGamePatch.patchSource,
    currentGamePatch
  };
  const roleMatrix = await readJsonFile(ROLE_MATRIX_PATH);

  if (options.coverageOnly) {
    const snapshot = await loadSnapshot();
    console.log(JSON.stringify(buildCoverageReport(snapshot, roleMatrix, options), null, 2));
    return;
  }

  if (options.rank !== 'all') {
    throw new Error('Tier-list updater requires rank=all.');
  }

  const roleRows = new Map(ROLES.map((role) => [role, { sourceRows: 0, tiers: new Map() }]));

  for (const role of ROLES) {
    const html = await fetchTextWithRetry(buildTierListUrl(role, options), options);
    assertLolalyticsPatch(html, options.patch, `Lolalytics tier list ${role}`);
    const parsed = parseTierListRows(html, role, roleMatrix);

    parsed.rows.forEach(({ champion, tier }) => {
      roleRows.get(role).tiers.set(champion, tier);
    });
    roleRows.get(role).sourceRows = parsed.sourceRows;
    console.log(`Parsed ${role}: ${parsed.rows.length} role-valid rows from ${parsed.sourceRows} source rows.`);
  }

  const roles = Object.fromEntries(ROLES.map((role) => {
    const tiers = {};

    roleRows.get(role).tiers.forEach((tier, champion) => {
      tiers[tier] ||= [];
      tiers[tier].push(champion);
    });
    Object.values(tiers).forEach((champions) => champions.sort((left, right) => left.localeCompare(right)));
    return [role, { sourceRows: roleRows.get(role).sourceRows, tiers }];
  }));
  const snapshot = {
    version: 3,
    game: 'league-of-legends',
    queue: 'ranked-solo-duo',
    rankBracket: options.rank,
    rankLabel: 'All ranks',
    patch: options.patch,
    patchBuild: options.patchBuild,
    patchSource: options.patchSource,
    updatedAt: new Date().toISOString(),
    source: {
      provider: 'lolalytics-tier-list',
      url: `https://lolalytics.com/lol/tierlist/?tier=all&patch=${options.patch}&view=grid`,
      mode: 'backend-snapshot',
      refreshStrategy: 'per-game-patch',
      note: 'Internal backend tier-list snapshot. Do not render this label in the client UI. Runtime client scraping is intentionally disabled.'
    },
    roles
  };
  snapshot.coverage = buildCoverageReport(snapshot, roleMatrix, options);

  if (options.requireComplete && !snapshot.coverage.completeCoverage) {
    throw new Error(`Tier-list coverage gate failed: incompleteSourceRoles=${snapshot.coverage.incompleteSourceRoles} emptyPublishedRoles=${snapshot.coverage.emptyPublishedRoles} duplicate=${snapshot.coverage.duplicateTierRows} invalid=${snapshot.coverage.invalidTierRows} metadataValid=${snapshot.coverage.metadataValid}`);
  }

  if (!options.dryRun) {
    await writeSnapshot(snapshot);
  }

  console.log(`Lolalytics tier-list update finished. roles=${snapshot.coverage.filledRoles}/${snapshot.coverage.expectedRoles} publishedRows=${snapshot.coverage.publishedRoleRows} complete=${snapshot.coverage.completeCoverage} dryRun=${options.dryRun}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
