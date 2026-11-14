import assert from 'node:assert/strict';
import {
  createCurrentGamePatch,
  getGamePatchFromBuild,
  hasCurrentPatchMetadata,
  isCompleteCurrentPatchSnapshot,
  normalizeGamePatch
} from './lol-meta-patch.mjs';

const currentPatch = createCurrentGamePatch({
  dataDragonVersion: '16.22.1',
  realm: 'na',
  observedAt: '2026-11-14T00:00:00.000Z'
});

const currentSnapshot = {
  patch: '16.22',
  patchBuild: '16.22.1',
  patchSource: currentPatch.patchSource,
  coverage: { completeCoverage: true }
};

assert.equal(normalizeGamePatch('016.022'), '16.22');
assert.equal(normalizeGamePatch('16.22.1'), null);
assert.equal(getGamePatchFromBuild('16.22.1'), '16.22');
assert.equal(getGamePatchFromBuild('16.22'), '16.22');
assert.equal(getGamePatchFromBuild('30'), null);
assert.equal(hasCurrentPatchMetadata(currentSnapshot, currentPatch), true);
assert.equal(isCompleteCurrentPatchSnapshot(currentSnapshot, currentPatch), true);
assert.equal(hasCurrentPatchMetadata({ ...currentSnapshot, patch: '16.21' }, currentPatch), false);
assert.equal(hasCurrentPatchMetadata({ ...currentSnapshot, patchBuild: '16.21.1' }, currentPatch), false);
assert.equal(hasCurrentPatchMetadata({ ...currentSnapshot, patchSource: { ...currentPatch.patchSource, realm: 'kr' } }, currentPatch), false);
assert.equal(isCompleteCurrentPatchSnapshot({ ...currentSnapshot, coverage: { completeCoverage: false } }, currentPatch), false);

console.log('LoL meta patch contract verification passed. current=16.22 mismatchRejected=true incompleteRejected=true');
