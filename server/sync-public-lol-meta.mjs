import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { fetchCurrentGamePatch, isCompleteCurrentPatchSnapshot } from './lol-meta-patch.mjs';

const ROOT = process.cwd();
const DEFAULT_PATHS = {
  tierSnapshot: path.resolve(ROOT, 'server/lol-meta-snapshot.mjs'),
  counterpicks: path.resolve(ROOT, 'server/data/lol-counterpicks.json'),
  publicTierSnapshot: path.resolve(ROOT, 'public/meta/tier-list.json'),
  publicCounterpicks: path.resolve(ROOT, 'public/meta/counterpicks.json')
};

let tierSnapshotRevision = 0;

const readTierSnapshot = async (filePath) => {
  tierSnapshotRevision += 1;
  const moduleUrl = `${pathToFileURL(filePath).href}?public-meta-sync=${tierSnapshotRevision}`;
  const { lolMetaSnapshot } = await import(moduleUrl);
  return lolMetaSnapshot;
};

const readJsonFile = async (filePath) => JSON.parse(await fs.readFile(filePath, 'utf8'));

const hasMatchingSnapshotIdentity = (tierSnapshot, counterpickSnapshot) => (
  tierSnapshot?.game === 'league-of-legends'
  && counterpickSnapshot?.game === 'league-of-legends'
  && tierSnapshot?.queue === 'ranked-solo-duo'
  && counterpickSnapshot?.queue === 'ranked-solo-duo'
  && tierSnapshot?.rankBracket === 'all'
  && counterpickSnapshot?.defaultRankBracket === 'all'
  && tierSnapshot?.patch === counterpickSnapshot?.patch
  && tierSnapshot?.patchBuild === counterpickSnapshot?.patchBuild
  && tierSnapshot?.patchSource?.provider === counterpickSnapshot?.patchSource?.provider
  && tierSnapshot?.patchSource?.realm === counterpickSnapshot?.patchSource?.realm
  && tierSnapshot?.patchSource?.url === counterpickSnapshot?.patchSource?.url
);

const copyFileIfChanged = async (sourcePath, destinationPath) => {
  const source = await fs.readFile(sourcePath);
  const destination = await fs.readFile(destinationPath).catch((error) => (
    error?.code === 'ENOENT' ? null : Promise.reject(error)
  ));

  if (destination?.equals(source)) {
    return false;
  }

  await fs.mkdir(path.dirname(destinationPath), { recursive: true });
  await fs.copyFile(sourcePath, destinationPath);
  return true;
};

const writeJsonIfChanged = async (destinationPath, value) => {
  const nextContents = Buffer.from(`${JSON.stringify(value, null, 2)}\n`, 'utf8');
  const currentContents = await fs.readFile(destinationPath).catch((error) => (
    error?.code === 'ENOENT' ? null : Promise.reject(error)
  ));

  if (currentContents?.equals(nextContents)) {
    return false;
  }

  await fs.mkdir(path.dirname(destinationPath), { recursive: true });
  await fs.writeFile(destinationPath, nextContents);
  return true;
};

export const syncPublicLolMetaSnapshots = async ({
  currentGamePatch,
  paths = DEFAULT_PATHS
} = {}) => {
  if (!currentGamePatch) {
    throw new Error('A current Riot Data Dragon patch is required before publishing public meta snapshots.');
  }

  const [tierSnapshot, counterpickSnapshot] = await Promise.all([
    readTierSnapshot(paths.tierSnapshot),
    readJsonFile(paths.counterpicks)
  ]);

  if (!isCompleteCurrentPatchSnapshot(tierSnapshot, currentGamePatch)
    || !isCompleteCurrentPatchSnapshot(counterpickSnapshot, currentGamePatch)
    || !hasMatchingSnapshotIdentity(tierSnapshot, counterpickSnapshot)) {
    throw new Error(`Refusing to publish incomplete or mismatched LoL meta snapshots for ${currentGamePatch.gamePatch}.`);
  }

  const [tierSnapshotChanged, counterpicksChanged] = await Promise.all([
    writeJsonIfChanged(paths.publicTierSnapshot, tierSnapshot),
    copyFileIfChanged(paths.counterpicks, paths.publicCounterpicks)
  ]);

  return {
    changed: tierSnapshotChanged || counterpicksChanged,
    tierSnapshotChanged,
    counterpicksChanged,
    patch: currentGamePatch.gamePatch,
    build: currentGamePatch.dataDragonVersion
  };
};

const isExecutedDirectly = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isExecutedDirectly) {
  const riotRealm = process.env.LOL_META_RIOT_REALM || 'na';
  const currentGamePatch = await fetchCurrentGamePatch({ realm: riotRealm });
  const result = await syncPublicLolMetaSnapshots({ currentGamePatch });
  console.log(`Public LoL meta snapshots synced. patch=${result.patch} build=${result.build} changed=${result.changed}`);
}
