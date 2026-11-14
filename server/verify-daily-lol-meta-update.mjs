import assert from 'node:assert/strict';
import { createCurrentGamePatch } from './lol-meta-patch.mjs';
import {
  assertCompleteDailyMetaState,
  createDailyMetaUpdateDecision,
  hasCompleteCurrentBuildSnapshot,
  runDailyMetaUpdate
} from './daily-lol-meta-update.mjs';

const currentGamePatch = createCurrentGamePatch({
  dataDragonVersion: '16.22.1',
  realm: 'na',
  observedAt: '2026-11-14T00:00:00.000Z'
});
const currentSnapshot = {
  patch: '16.22',
  patchBuild: '16.22.1',
  patchSource: currentGamePatch.patchSource,
  coverage: { completeCoverage: true }
};
const currentState = {
  config: { dataDragonVersion: '16.22.1', locale: 'ru_RU' },
  tierSnapshot: currentSnapshot,
  counterpickDatabase: currentSnapshot,
  currentGamePatch
};

const unchanged = createDailyMetaUpdateDecision(currentState);
assert.equal(unchanged.shouldUpdate, false);
assert.deepEqual(unchanged.reasons, []);
assert.equal(unchanged.staticDataCurrent, true);
assert.equal(unchanged.tierSnapshotCurrent, true);
assert.equal(unchanged.counterpickSnapshotCurrent, true);

const changedBuild = createDailyMetaUpdateDecision({
  ...currentState,
  currentGamePatch: createCurrentGamePatch({
    dataDragonVersion: '16.22.2',
    realm: 'na',
    observedAt: '2026-11-14T00:00:00.000Z'
  })
});
assert.equal(changedBuild.shouldUpdate, true);
assert.deepEqual(changedBuild.reasons, ['data-dragon-build', 'tier-snapshot', 'counterpick-snapshot']);

const newPatch = createCurrentGamePatch({
  dataDragonVersion: '16.23.1',
  realm: 'na',
  observedAt: '2026-11-14T00:00:00.000Z'
});
const incompleteNewPatchState = {
  ...currentState,
  currentGamePatch: newPatch,
  config: { ...currentState.config, dataDragonVersion: newPatch.dataDragonVersion },
  tierSnapshot: { ...currentSnapshot, coverage: { completeCoverage: false } },
  counterpickDatabase: { ...currentSnapshot, coverage: { completeCoverage: false } }
};
const incompleteNewPatch = createDailyMetaUpdateDecision(incompleteNewPatchState);
assert.equal(incompleteNewPatch.shouldUpdate, true);
assert.equal(incompleteNewPatch.tierSnapshotCurrent, false);
assert.equal(incompleteNewPatch.counterpickSnapshotCurrent, false);
assert.equal(hasCompleteCurrentBuildSnapshot(incompleteNewPatchState.tierSnapshot, newPatch), false);
assert.throws(() => assertCompleteDailyMetaState(incompleteNewPatchState), /not publishable/);

const forcedRefresh = createDailyMetaUpdateDecision({ ...currentState, force: true });
assert.equal(forcedRefresh.shouldUpdate, true);
assert.deepEqual(forcedRefresh.reasons, ['forced']);

let unchangedStateReads = 0;
let unchangedConfigWrites = 0;
let unchangedMetaCommands = 0;
const unchangedResult = await runDailyMetaUpdate({
  resolveCurrentGamePatch: async () => currentGamePatch,
  loadState: async () => {
    unchangedStateReads += 1;
    return currentState;
  },
  updateConfig: async () => {
    unchangedConfigWrites += 1;
  },
  runCommand: async () => {
    unchangedMetaCommands += 1;
  },
  createCommands: () => [{ label: 'must not run' }],
  assertDataDragonAvailable: async () => {
    throw new Error('Data Dragon must not be requested for an unchanged build.');
  }
});
assert.equal(unchangedResult.status, 'unchanged');
assert.equal(unchangedStateReads, 1);
assert.equal(unchangedConfigWrites, 0);
assert.equal(unchangedMetaCommands, 0);

const changedBuildPatch = createCurrentGamePatch({
  dataDragonVersion: '16.22.2',
  realm: 'na',
  observedAt: '2026-11-14T00:00:00.000Z'
});
const changedBuildSnapshot = {
  ...currentSnapshot,
  patchBuild: changedBuildPatch.dataDragonVersion,
  patchSource: changedBuildPatch.patchSource
};
const initialChangedBuildState = currentState;
const refreshedChangedBuildState = {
  config: { ...currentState.config, dataDragonVersion: changedBuildPatch.dataDragonVersion },
  tierSnapshot: changedBuildSnapshot,
  counterpickDatabase: changedBuildSnapshot
};
const changedBuildStates = [initialChangedBuildState, refreshedChangedBuildState];
const changedBuildCommands = [];
const changedBuildConfigWrites = [];
const changedBuildResult = await runDailyMetaUpdate({
  resolveCurrentGamePatch: async () => changedBuildPatch,
  loadState: async () => changedBuildStates.shift(),
  updateConfig: async (_configPath, config, version) => {
    changedBuildConfigWrites.push({ config, version });
    return true;
  },
  runCommand: async (command) => {
    changedBuildCommands.push(command.label);
  },
  createCommands: () => [{ label: 'tier refresh' }, { label: 'counterpick refresh' }],
  assertDataDragonAvailable: async ({ version, locale }) => ({ version, locale, championCount: 170, itemCount: 200 })
});
assert.equal(changedBuildResult.status, 'updated');
assert.equal(changedBuildResult.configChanged, true);
assert.deepEqual(changedBuildCommands, ['tier refresh', 'counterpick refresh']);
assert.deepEqual(changedBuildConfigWrites, [{ config: currentState.config, version: '16.22.2' }]);

const incompleteNewPatchSnapshot = {
  ...currentSnapshot,
  patch: newPatch.gamePatch,
  patchBuild: newPatch.dataDragonVersion,
  patchSource: newPatch.patchSource,
  coverage: { completeCoverage: false }
};
const incompleteStates = [
  {
    config: { ...currentState.config, dataDragonVersion: newPatch.dataDragonVersion },
    tierSnapshot: currentSnapshot,
    counterpickDatabase: currentSnapshot
  },
  {
    config: { ...currentState.config, dataDragonVersion: newPatch.dataDragonVersion },
    tierSnapshot: incompleteNewPatchSnapshot,
    counterpickDatabase: incompleteNewPatchSnapshot
  }
];
let incompletePublicationReached = false;
await assert.rejects(
  runDailyMetaUpdate({
    resolveCurrentGamePatch: async () => newPatch,
    loadState: async () => incompleteStates.shift(),
    updateConfig: async () => false,
    runCommand: async () => {},
    createCommands: () => [],
    assertDataDragonAvailable: async () => ({ championCount: 170, itemCount: 200 })
  }).then(() => {
    incompletePublicationReached = true;
  }),
  /not publishable/
);
assert.equal(incompletePublicationReached, false);

console.log('Daily LoL meta update verification passed. unchangedNoop=true buildRefresh=true incompletePatchRejected=true');
