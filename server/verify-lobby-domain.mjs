import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ROLE_MATRIX_PATH = path.resolve(ROOT, 'src/services/gameData/champion-role-matrix.json');
const COUNTERPICK_DATABASE_PATH = path.resolve(ROOT, 'server/data/lol-counterpicks.json');
const LANE_ORDER = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];
const DEMO_LOBBY_POOLS = {
  TOP: ['Aatrox', 'Renekton', 'Gnar', 'Camille'],
  JUNGLE: ['LeeSin', 'Vi'],
  MID: ['Ahri', 'Zed', 'Syndra'],
  ADC: ['Jinx', 'Lucian', 'Caitlyn'],
  SUPPORT: ['Thresh', 'Nautilus']
};

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const normalizeKey = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

const roleMatrix = readJson(ROLE_MATRIX_PATH);
const counterpickDatabase = readJson(COUNTERPICK_DATABASE_PATH);
const roleEntryByChampion = new Map(roleMatrix.map((entry) => [entry.champion, entry]));

const errors = [];

for (const role of LANE_ORDER) {
  const champions = DEMO_LOBBY_POOLS[role] || [];

  if (champions.length === 0) {
    errors.push(`Demo pool for ${role} is empty.`);
    continue;
  }

  for (const champion of champions) {
    const roleEntry = roleEntryByChampion.get(champion);

    if (!roleEntry) {
      errors.push(`${champion} is missing from champion-role-matrix.json.`);
      continue;
    }

    const allowedRoles = [...(roleEntry.primaryRoles || []), ...(roleEntry.secondaryRoles || [])];
    if (!allowedRoles.includes(role)) {
      errors.push(`${champion} is in ${role} demo pool but allowed roles are ${allowedRoles.join(', ') || 'none'}.`);
    }

    const [, counterpickChampionEntry] = Object.entries(counterpickDatabase.champions || {}).find(([candidateName, candidateEntry]) => (
      normalizeKey(candidateName) === normalizeKey(champion) || normalizeKey(candidateEntry?.slug) === normalizeKey(champion)
    )) ?? [];
    const counters = counterpickChampionEntry?.roles?.[role]?.counters;

    if (!Array.isArray(counters) || counters.length === 0) {
      errors.push(`${champion} ${role} has no counterpick rows in lol-counterpicks.json.`);
    }
  }
}

for (let run = 0; run < 1000; run += 1) {
  const allyRoles = [...LANE_ORDER];
  const enemyRoles = [...LANE_ORDER];

  if (new Set(allyRoles).size !== LANE_ORDER.length || new Set(enemyRoles).size !== LANE_ORDER.length) {
    errors.push(`Generated lobby run ${run} does not contain exactly one player per role.`);
    break;
  }
}

if (errors.length > 0) {
  console.error('Lobby domain verification failed:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Lobby domain verification passed. roles=${LANE_ORDER.length} demoChampions=${Object.values(DEMO_LOBBY_POOLS).flat().length}`);
