import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = process.cwd();
const sourcePath = path.resolve(root, 'src/services/playerPrivacyPolicy.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2023,
    module: ts.ModuleKind.CommonJS
  },
  fileName: sourcePath
});
const module = { exports: {} };

new Function('exports', 'module', compiled.outputText)(module.exports, module);

const {
  canLookupPlayer,
  canRevealPlayerIdentity,
  getPlayerDisplayName,
  isRankedSoloDuo
} = module.exports;

const soloDuoContext = {
  gameMode: 'RANKED_SOLO_5x5',
  localSummonerName: 'Local Player',
  partyMembers: ['Party Ally']
};

assert.equal(isRankedSoloDuo(soloDuoContext.gameMode), true);
assert.equal(canRevealPlayerIdentity({ ...soloDuoContext, isAlly: true, summonerName: 'local player' }), true);
assert.equal(canLookupPlayer({ ...soloDuoContext, isAlly: true, summonerName: 'PARTY ALLY' }), true);
assert.equal(canRevealPlayerIdentity({ ...soloDuoContext, isAlly: true, summonerName: 'Random Ally' }), false);
assert.equal(canLookupPlayer({ ...soloDuoContext, isAlly: false, summonerName: 'Enemy One' }), false);
assert.equal(getPlayerDisplayName({ ...soloDuoContext, isAlly: true, summonerName: 'Random Ally', index: 2 }), 'Ally 3');
assert.equal(getPlayerDisplayName({ ...soloDuoContext, isAlly: false, summonerName: 'Enemy One', index: 1 }), 'Enemy 2');
assert.equal(canRevealPlayerIdentity({ ...soloDuoContext, reviewMode: true, isAlly: false, summonerName: 'Enemy One' }), true);
assert.equal(canLookupPlayer({
  gameMode: 'NORMAL',
  isAlly: false,
  summonerName: 'Enemy One'
}), true);

console.log('Player privacy verification passed: Solo/Duo masks non-party players, allows the local player and party, and preserves explicitly marked review/non-Solo-Duo behavior.');
