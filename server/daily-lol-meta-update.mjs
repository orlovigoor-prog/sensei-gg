import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { fetchCurrentGamePatch, isCompleteCurrentPatchSnapshot } from './lol-meta-patch.mjs';
import { syncPublicLolMetaSnapshots } from './sync-public-lol-meta.mjs';

const ROOT = process.cwd();
const DEFAULT_RIOT_REALM = process.env.LOL_META_RIOT_REALM || 'na';
const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_PATHS = {
  config: path.resolve(ROOT, 'game-data.config.json'),
  tierSnapshot: path.resolve(ROOT, 'server/lol-meta-snapshot.mjs'),
  counterpicks: path.resolve(ROOT, 'server/data/lol-counterpicks.json')
};

let tierSnapshotRevision = 0;

const parseArgValue = (name) => {
  const prefix = `${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) || null;
};

const readJsonFile = async (filePath) => JSON.parse(await fs.readFile(filePath, 'utf8'));

const readTierSnapshot = async (filePath) => {
  tierSnapshotRevision += 1;
  const moduleUrl = `${pathToFileURL(filePath).href}?daily-meta-update=${tierSnapshotRevision}`;
  const { lolMetaSnapshot } = await import(moduleUrl);
  return lolMetaSnapshot;
};

const readCurrentState = async (paths = DEFAULT_PATHS) => {
  const [config, tierSnapshot, counterpickDatabase] = await Promise.all([
    readJsonFile(paths.config),
    readTierSnapshot(paths.tierSnapshot),
    readJsonFile(paths.counterpicks)
  ]);

  return { config, tierSnapshot, counterpickDatabase };
};

export const hasCompleteCurrentBuildSnapshot = (snapshot, currentGamePatch) => (
  isCompleteCurrentPatchSnapshot(snapshot, currentGamePatch)
  && snapshot?.patchBuild === currentGamePatch?.dataDragonVersion
);

export const createDailyMetaUpdateDecision = ({
  config,
  tierSnapshot,
  counterpickDatabase,
  currentGamePatch,
  force = false
}) => {
  const staticDataCurrent = config?.dataDragonVersion === currentGamePatch?.dataDragonVersion;
  const tierSnapshotCurrent = hasCompleteCurrentBuildSnapshot(tierSnapshot, currentGamePatch);
  const counterpickSnapshotCurrent = hasCompleteCurrentBuildSnapshot(counterpickDatabase, currentGamePatch);
  const reasons = [];

  if (!staticDataCurrent) {
    reasons.push('data-dragon-build');
  }

  if (!tierSnapshotCurrent) {
    reasons.push('tier-snapshot');
  }

  if (!counterpickSnapshotCurrent) {
    reasons.push('counterpick-snapshot');
  }

  if (force && reasons.length === 0) {
    reasons.push('forced');
  }

  return {
    shouldUpdate: reasons.length > 0,
    staticDataCurrent,
    tierSnapshotCurrent,
    counterpickSnapshotCurrent,
    reasons
  };
};

export const assertCompleteDailyMetaState = ({
  config,
  tierSnapshot,
  counterpickDatabase,
  currentGamePatch
}) => {
  const decision = createDailyMetaUpdateDecision({
    config,
    tierSnapshot,
    counterpickDatabase,
    currentGamePatch
  });

  if (decision.shouldUpdate) {
    throw new Error(`Refreshed LoL meta data is not publishable: ${decision.reasons.join(', ')}.`);
  }

  return decision;
};

const fetchJson = async (url, timeoutMs, fetchImpl) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`${url} returned HTTP ${response.status}.`);
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
};

export const assertDataDragonReleaseAvailable = async ({
  version,
  locale,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  fetchImpl = fetch
}) => {
  if (!/^\d+\.\d+\.\d+$/.test(String(version || ''))) {
    throw new Error(`Riot realm returned an invalid Data Dragon build: ${version || 'missing'}.`);
  }

  if (typeof locale !== 'string' || !/^[a-z]{2}_[A-Z]{2}$/.test(locale)) {
    throw new Error(`Game-data configuration contains an invalid Data Dragon locale: ${locale || 'missing'}.`);
  }

  const baseUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/data`;
  const [championPayload, championDetailPayload, itemPayload] = await Promise.all([
    fetchJson(`${baseUrl}/en_US/champion.json`, timeoutMs, fetchImpl),
    fetchJson(`${baseUrl}/${locale}/champion/Aatrox.json`, timeoutMs, fetchImpl),
    fetchJson(`${baseUrl}/${locale}/item.json`, timeoutMs, fetchImpl)
  ]);
  const championCount = Object.keys(championPayload?.data || {}).length;
  const itemCount = Object.keys(itemPayload?.data || {}).length;
  const aatrox = championDetailPayload?.data?.Aatrox;

  if (championCount < 160) {
    throw new Error(`Data Dragon ${version} champion catalog is incomplete (${championCount} entries).`);
  }

  if (itemCount < 100) {
    throw new Error(`Data Dragon ${version} item catalog is incomplete (${itemCount} entries).`);
  }

  if (!aatrox?.name || !aatrox?.passive?.image?.full || !Array.isArray(aatrox.spells) || aatrox.spells.length < 4) {
    throw new Error(`Data Dragon ${version} localized champion details are incomplete.`);
  }

  return { championCount, itemCount };
};

const writeJsonAtomically = async (filePath, value) => {
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  await fs.writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await fs.rename(temporaryPath, filePath);
};

const updateDataDragonConfig = async (filePath, currentConfig, dataDragonVersion) => {
  if (currentConfig.dataDragonVersion === dataDragonVersion) {
    return false;
  }

  await writeJsonAtomically(filePath, {
    ...currentConfig,
    dataDragonVersion
  });
  return true;
};

const getNpmCommand = () => (process.platform === 'win32' ? 'npm.cmd' : 'npm');

export const createRefreshCommands = ({
  riotRealm,
  nodeCommand = process.execPath,
  npmCommand = getNpmCommand()
}) => [
  {
    label: 'tier-list refresh',
    command: nodeCommand,
    args: ['server/update-lolalytics-tier-list.mjs', '--require-complete', `--riot-realm=${riotRealm}`]
  },
  {
    label: 'tier-list coverage',
    command: nodeCommand,
    args: ['server/update-lolalytics-tier-list.mjs', '--coverage', `--riot-realm=${riotRealm}`]
  },
  {
    label: 'counterpick refresh',
    command: nodeCommand,
    args: ['server/update-lolalytics-counterpicks.mjs', '--all-roles', '--force', '--require-complete', `--riot-realm=${riotRealm}`]
  },
  {
    label: 'counterpick coverage',
    command: nodeCommand,
    args: ['server/update-lolalytics-counterpicks.mjs', '--coverage', `--riot-realm=${riotRealm}`]
  },
  { label: 'game-data verification', command: nodeCommand, args: ['server/verify-game-data.mjs'] },
  { label: 'meta patch contract verification', command: nodeCommand, args: ['server/verify-meta-patch-contract.mjs'] },
  { label: 'daily updater verification', command: nodeCommand, args: ['server/verify-daily-lol-meta-update.mjs'] },
  { label: 'lobby domain verification', command: nodeCommand, args: ['server/verify-lobby-domain.mjs'] },
  { label: 'lint', command: npmCommand, args: ['run', 'lint'] },
  { label: 'production build', command: npmCommand, args: ['run', 'build'] }
];

const runProcess = async ({ label, command, args }) => new Promise((resolve, reject) => {
  console.log(`Running ${label}: ${command} ${args.join(' ')}`);
  const child = spawn(command, args, {
    cwd: ROOT,
    env: process.env,
    stdio: 'inherit'
  });

  child.once('error', (error) => reject(new Error(`${label} could not start: ${error.message}`)));
  child.once('exit', (code, signal) => {
    if (code === 0) {
      resolve();
      return;
    }

    reject(new Error(`${label} failed with ${signal ? `signal ${signal}` : `exit code ${code}`}.`));
  });
});

export const runDailyMetaUpdate = async ({
  riotRealm = DEFAULT_RIOT_REALM,
  force = false,
  dryRun = false,
  paths = DEFAULT_PATHS,
  resolveCurrentGamePatch = fetchCurrentGamePatch,
  fetchImpl = fetch,
  loadState = readCurrentState,
  updateConfig = updateDataDragonConfig,
  runCommand = runProcess,
  createCommands = createRefreshCommands,
  assertDataDragonAvailable = assertDataDragonReleaseAvailable,
  syncPublicMeta = syncPublicLolMetaSnapshots
} = {}) => {
  const currentGamePatch = await resolveCurrentGamePatch({ realm: riotRealm });
  const state = await loadState(paths);
  const decision = createDailyMetaUpdateDecision({
    ...state,
    currentGamePatch,
    force
  });

  if (!decision.shouldUpdate) {
    return {
      status: 'unchanged',
      changed: false,
      currentGamePatch,
      decision
    };
  }

  if (dryRun) {
    return {
      status: 'update-required',
      changed: false,
      currentGamePatch,
      decision
    };
  }

  const dataDragonAvailability = await assertDataDragonAvailable({
    version: currentGamePatch.dataDragonVersion,
    locale: state.config?.locale,
    fetchImpl
  });
  const configChanged = await updateConfig(paths.config, state.config, currentGamePatch.dataDragonVersion);

  for (const command of createCommands({ riotRealm })) {
    await runCommand(command);
  }

  const refreshedState = await loadState(paths);
  const finalDecision = assertCompleteDailyMetaState({
    ...refreshedState,
    currentGamePatch
  });
  const publicMetaSync = await syncPublicMeta({ currentGamePatch });

  return {
    status: 'updated',
    changed: true,
    currentGamePatch,
    decision,
    finalDecision,
    configChanged,
    dataDragonAvailability,
    publicMetaSync
  };
};

const writeGitHubOutput = async (result) => {
  const outputPath = process.env.GITHUB_OUTPUT;

  if (!outputPath) {
    return;
  }

  await fs.appendFile(outputPath, [
    `changed=${result.changed}`,
    `status=${result.status}`,
    `patch=${result.currentGamePatch.gamePatch}`,
    `build=${result.currentGamePatch.dataDragonVersion}`
  ].join('\n').concat('\n'));
};

const isExecutedDirectly = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isExecutedDirectly) {
  const dryRun = process.argv.includes('--dry-run');
  const force = process.argv.includes('--force');
  const riotRealm = parseArgValue('--riot-realm') || DEFAULT_RIOT_REALM;

  runDailyMetaUpdate({ riotRealm, force, dryRun })
    .then(async (result) => {
      console.log(JSON.stringify({
        status: result.status,
        changed: result.changed,
        patch: result.currentGamePatch.gamePatch,
        build: result.currentGamePatch.dataDragonVersion,
        reasons: result.decision.reasons,
        configChanged: result.configChanged ?? false
      }, null, 2));
      await writeGitHubOutput(result);
    })
    .catch((error) => {
      console.error(`Daily LoL meta update failed: ${error.message}`);
      process.exitCode = 1;
    });
}
