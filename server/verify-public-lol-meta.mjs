import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { fetchCurrentGamePatch, isCompleteCurrentPatchSnapshot } from './lol-meta-patch.mjs';

const ROOT = process.cwd();
const paths = {
  tierSnapshot: path.resolve(ROOT, 'server/lol-meta-snapshot.mjs'),
  counterpicks: path.resolve(ROOT, 'server/data/lol-counterpicks.json'),
  publicTierSnapshot: path.resolve(ROOT, 'public/meta/tier-list.json'),
  publicCounterpicks: path.resolve(ROOT, 'public/meta/counterpicks.json')
};

const [sourceCounterpickContents, publicTierContents, publicCounterpickContents] = await Promise.all([
  fs.readFile(paths.counterpicks),
  fs.readFile(paths.publicTierSnapshot),
  fs.readFile(paths.publicCounterpicks)
]);

assert.deepEqual(publicCounterpickContents, sourceCounterpickContents, 'public counterpick snapshot must be an exact server-generated copy');

const { lolMetaSnapshot } = await import(`${pathToFileURL(paths.tierSnapshot).href}?verify=${Date.now()}`);
const publicTierSnapshot = JSON.parse(publicTierContents.toString('utf8'));
const publicCounterpickSnapshot = JSON.parse(publicCounterpickContents.toString('utf8'));
const currentGamePatch = await fetchCurrentGamePatch({ realm: process.env.LOL_META_RIOT_REALM || 'na' });

assert.deepEqual(publicTierSnapshot, lolMetaSnapshot, 'public tier snapshot must be an exact server-generated copy');
assert.equal(isCompleteCurrentPatchSnapshot(publicTierSnapshot, currentGamePatch), true, 'public tier snapshot must be complete for the current Riot patch');
assert.equal(isCompleteCurrentPatchSnapshot(publicCounterpickSnapshot, currentGamePatch), true, 'public counterpick snapshot must be complete for the current Riot patch');
assert.equal(publicTierSnapshot.rankBracket, 'all');
assert.equal(publicCounterpickSnapshot.defaultRankBracket, 'all');
assert.equal(publicTierSnapshot.queue, 'ranked-solo-duo');
assert.equal(publicCounterpickSnapshot.queue, 'ranked-solo-duo');

console.log(`Public LoL meta verification passed. patch=${currentGamePatch.gamePatch} build=${currentGamePatch.dataDragonVersion}`);
