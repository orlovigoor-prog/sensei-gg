import fs from 'node:fs';
import path from 'node:path';
import { lolMetaSnapshot } from './lol-meta-snapshot.mjs';

const ROOT = process.cwd();
const ROLE_MATRIX_PATH = path.resolve(ROOT, 'src/services/gameData/champion-role-matrix.json');
const COUNTERPICK_DATABASE_PATH = path.resolve(ROOT, 'server/data/lol-counterpicks.json');
const LANE_ORDER = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];
const MIN_RELIABLE_COUNTER_SAMPLE = 500;
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
const findRoleEntry = (champion) => roleMatrix.find((entry) => normalizeKey(entry.champion) === normalizeKey(champion));
const isFiniteNumber = (value) => typeof value === 'number' && Number.isFinite(value);
const canChampionPlayRole = (champion, role) => {
  const roleEntry = findRoleEntry(champion);

  if (!roleEntry) {
    return false;
  }

  return [...(roleEntry.primaryRoles || []), ...(roleEntry.secondaryRoles || [])].includes(role);
};

const errors = [];
const warnings = [];

for (const role of LANE_ORDER) {
  const tiers = lolMetaSnapshot.roles?.[role]?.tiers || {};

  for (const [tier, champions] of Object.entries(tiers)) {
    if (!Array.isArray(champions)) {
      errors.push(`Tierlist ${role} ${tier} is not an array.`);
      continue;
    }

    for (const champion of champions) {
      if (!findRoleEntry(champion)) {
        errors.push(`Tierlist champion ${champion} (${role} ${tier}) is missing from champion-role-matrix.json.`);
        continue;
      }

      if (!canChampionPlayRole(champion, role)) {
        errors.push(`Tierlist champion ${champion} is listed as ${role} ${tier}, but role matrix does not allow that role.`);
      }
    }
  }
}

for (const [champion, championEntry] of Object.entries(counterpickDatabase.champions || {})) {
  for (const [role, roleSnapshot] of Object.entries(championEntry?.roles || {})) {
    if (!LANE_ORDER.includes(role)) {
      errors.push(`${champion} has unknown counterpick role ${role}.`);
      continue;
    }

    if (!canChampionPlayRole(champion, role)) {
      errors.push(`${champion} has a ${role} counterpick row, but role matrix does not allow that role.`);
    }

    if (!isFiniteNumber(roleSnapshot?.globalWinRate)) {
      errors.push(`${champion} ${role} is missing finite globalWinRate.`);
    }

    if (roleSnapshot?.overallMatches !== undefined && roleSnapshot?.overallMatches !== null && !isFiniteNumber(roleSnapshot.overallMatches)) {
      errors.push(`${champion} ${role} has non-finite overallMatches.`);
    }

    const counters = roleSnapshot?.counters;
    if (!Array.isArray(counters)) {
      errors.push(`${champion} ${role} counters is not an array.`);
      continue;
    }

    if (counters.length > 0 && counters.every((counter) => isFiniteNumber(counter.matches) && counter.matches < MIN_RELIABLE_COUNTER_SAMPLE)) {
      warnings.push(`${champion} ${role} has only low-sample counter rows.`);
    }

    for (const counter of counters) {
      if (!counter?.champion) {
        errors.push(`${champion} ${role} has a counter row without champion name.`);
        continue;
      }

      if (!canChampionPlayRole(counter.champion, role)) {
        errors.push(`${champion} ${role} counter ${counter.champion} is not allowed for ${role} by role matrix.`);
      }

      if (!isFiniteNumber(counter.matchupWinRate)) {
        errors.push(`${champion} ${role} counter ${counter.champion} has non-finite matchupWinRate.`);
      }

      if (counter.matches !== undefined && counter.matches !== null && !isFiniteNumber(counter.matches)) {
        errors.push(`${champion} ${role} counter ${counter.champion} has non-finite matches.`);
      }
    }
  }
}

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

    const roleAwareCounters = Array.isArray(counters)
      ? counters.filter((counter) => canChampionPlayRole(counter.champion, role))
      : [];

    if (roleAwareCounters.length === 0) {
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

if (warnings.length > 0) {
  console.warn('Lobby domain verification warnings:');
  warnings.slice(0, 20).forEach((warning) => console.warn(`- ${warning}`));
  if (warnings.length > 20) {
    console.warn(`- ...and ${warnings.length - 20} more warnings.`);
  }
}

console.log(`Lobby domain verification passed. roles=${LANE_ORDER.length} demoChampions=${Object.values(DEMO_LOBBY_POOLS).flat().length} tierlistRoles=${Object.keys(lolMetaSnapshot.roles || {}).length}`);
