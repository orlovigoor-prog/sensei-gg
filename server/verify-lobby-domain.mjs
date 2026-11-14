import fs from 'node:fs';
import path from 'node:path';
import { fetchCurrentGamePatch, isCompleteCurrentPatchSnapshot } from './lol-meta-patch.mjs';
import { lolMetaSnapshot } from './lol-meta-snapshot.mjs';

const ROOT = process.cwd();
const ROLE_MATRIX_PATH = path.resolve(ROOT, 'src/services/gameData/champion-role-matrix.json');
const COUNTERPICK_DATABASE_PATH = path.resolve(ROOT, 'server/data/lol-counterpicks.json');
const LANE_ORDER = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];
const MIN_RELIABLE_COUNTER_SAMPLE = 500;
const MIN_COUNTER_ROWS = 5;
const REQUIRED_COUNTER_RANK = 'all';
const MIN_TIER_SOURCE_ROWS_PER_ROLE = 50;

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const normalizeKey = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

const roleMatrix = readJson(ROLE_MATRIX_PATH);
const counterpickDatabase = readJson(COUNTERPICK_DATABASE_PATH);
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
const tierRows = new Set();
const currentGamePatch = await fetchCurrentGamePatch({ realm: process.env.LOL_META_RIOT_REALM || 'na' });
const tierSnapshotAvailable = isCompleteCurrentPatchSnapshot(lolMetaSnapshot, currentGamePatch);
const counterpickSnapshotAvailable = isCompleteCurrentPatchSnapshot(counterpickDatabase, currentGamePatch);

if (!tierSnapshotAvailable) {
  warnings.push(`Tierlist snapshot is unavailable for current patch ${currentGamePatch.gamePatch}; runtime must render tiers as —.`);
}

if (!counterpickSnapshotAvailable) {
  warnings.push(`Counterpick snapshot is unavailable for current patch ${currentGamePatch.gamePatch}; runtime must hide counterpicks.`);
}

if (tierSnapshotAvailable) {
  if (lolMetaSnapshot.rankBracket !== REQUIRED_COUNTER_RANK) {
    errors.push(`Tierlist metadata must use rank=${REQUIRED_COUNTER_RANK}.`);
  }

  for (const role of LANE_ORDER) {
    const roleSnapshot = lolMetaSnapshot.roles?.[role];
    const tiers = roleSnapshot?.tiers || {};

    if (!Number.isInteger(roleSnapshot?.sourceRows) || roleSnapshot.sourceRows < MIN_TIER_SOURCE_ROWS_PER_ROLE) {
      errors.push(`Tierlist ${role} has incomplete source coverage (${roleSnapshot?.sourceRows || 'missing'} rows; expected at least ${MIN_TIER_SOURCE_ROWS_PER_ROLE}).`);
    }

    for (const [tier, champions] of Object.entries(tiers)) {
      if (!Array.isArray(champions)) {
        errors.push(`Tierlist ${role} ${tier} is not an array.`);
        continue;
      }

      for (const champion of champions) {
        const tierRowKey = `${normalizeKey(champion)}:${role}`;

        if (tierRows.has(tierRowKey)) {
          errors.push(`Tierlist champion ${champion} is duplicated for ${role}.`);
          continue;
        }

        tierRows.add(tierRowKey);

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

  if (lolMetaSnapshot.coverage?.completeCoverage !== true) {
    errors.push('Tierlist snapshot coverage is not complete.');
  }
}

if (counterpickSnapshotAvailable && counterpickDatabase.defaultRankBracket !== REQUIRED_COUNTER_RANK) {
  errors.push(`Counterpick database defaultRankBracket is ${counterpickDatabase.defaultRankBracket || 'missing'}; expected ${REQUIRED_COUNTER_RANK}.`);
}

for (const [champion, championEntry] of counterpickSnapshotAvailable ? Object.entries(counterpickDatabase.champions || {}) : []) {
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

    if (roleSnapshot?.rankBracket !== REQUIRED_COUNTER_RANK) {
      errors.push(`${champion} ${role} has rankBracket ${roleSnapshot?.rankBracket || 'missing'}; expected ${REQUIRED_COUNTER_RANK}.`);
    }

    if (roleSnapshot?.patch !== currentGamePatch.gamePatch) {
      errors.push(`${champion} ${role} has patch ${roleSnapshot?.patch || 'missing'}; expected ${currentGamePatch.gamePatch}.`);
    }

    if (counters.length > MIN_COUNTER_ROWS) {
      warnings.push(`${champion} ${role} has ${counters.length} counter rows; runtime will display the first ${MIN_COUNTER_ROWS}.`);
    } else if (counters.length < MIN_COUNTER_ROWS) {
      errors.push(`${champion} ${role} has ${counters.length} counter rows; expected exactly ${MIN_COUNTER_ROWS}.`);
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
        warnings.push(`${champion} ${role} counter ${counter.champion} is outside the configured role matrix and will not be shown.`);
      }

      if (!isFiniteNumber(counter.matchupWinRate)) {
        errors.push(`${champion} ${role} counter ${counter.champion} has non-finite matchupWinRate.`);
      }

      if (isFiniteNumber(counter.targetChampionWinRate) && Math.abs(counter.matchupWinRate - (100 - counter.targetChampionWinRate)) > 0.01) {
        errors.push(`${champion} ${role} counter ${counter.champion} does not use inverse target win rate.`);
      }

      if (counter.matches !== undefined && counter.matches !== null && !isFiniteNumber(counter.matches)) {
        errors.push(`${champion} ${role} counter ${counter.champion} has non-finite matches.`);
      }
    }
  }
}

const simulationCandidatesByRole = Object.fromEntries(LANE_ORDER.map((role) => [
  role,
  roleMatrix
    .filter((entry) => canChampionPlayRole(entry.champion, role))
    .map((entry) => entry.champion)
]));

for (const role of LANE_ORDER) {
  if (simulationCandidatesByRole[role].length < 2) {
    errors.push(`Simulation catalog for ${role} needs at least two role-valid champions.`);
  }
}

const simulationSlots = [...LANE_ORDER, ...LANE_ORDER].sort((left, right) => (
  simulationCandidatesByRole[left].length - simulationCandidatesByRole[right].length
));
const canSelectUniqueSimulationLobby = (slotIndex = 0, selectedChampions = new Set()) => {
  if (slotIndex === simulationSlots.length) {
    return true;
  }

  const role = simulationSlots[slotIndex];
  return simulationCandidatesByRole[role].some((champion) => {
    const championKey = normalizeKey(champion);
    if (selectedChampions.has(championKey)) {
      return false;
    }

    selectedChampions.add(championKey);
    const canCompleteLobby = canSelectUniqueSimulationLobby(slotIndex + 1, selectedChampions);
    selectedChampions.delete(championKey);
    return canCompleteLobby;
  });
};

if (!canSelectUniqueSimulationLobby()) {
  errors.push('Simulation catalog cannot produce ten unique role-valid champions for a 5x5 lobby.');
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

console.log(`Lobby domain verification passed. patch=${currentGamePatch.gamePatch} tierSnapshotAvailable=${tierSnapshotAvailable} counterpickSnapshotAvailable=${counterpickSnapshotAvailable} roles=${LANE_ORDER.length} simulationChampions=${new Set(Object.values(simulationCandidatesByRole).flat().map(normalizeKey)).size} tierlistRoles=${tierSnapshotAvailable ? Object.keys(lolMetaSnapshot.roles || {}).length : 0}`);
