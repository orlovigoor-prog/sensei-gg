import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = process.cwd();
const sourcePath = path.resolve(root, 'src/services/overwolfScoreboard.ts');
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

const { extractLiveClientScoreboardSnapshot, normalizeLiveClientScoreboard } = module.exports;

const roles = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'];
const createPlayer = (team, index) => ({
  championName: team === 'ORDER' ? `OrderChampion${index + 1}` : `ChaosChampion${index + 1}`,
  summonerName: `${team === 'ORDER' ? 'Order' : 'Chaos'} ${index + 1}`,
  team,
  position: roles[index],
  scores: {
    kills: index + 1,
    deaths: index,
    assists: index + 3,
    creepScore: 120 + index,
    wardScore: 10 + index
  },
  items: [
    { itemID: 3000 + index, slot: 0 },
    { itemID: 3100 + index, slot: 1 },
    { itemID: 3364, slot: 6 }
  ],
  summonerSpells: {
    summonerSpellOne: { displayName: 'Flash' },
    summonerSpellTwo: { displayName: index === 1 ? 'Smite' : 'Teleport' }
  },
  runes: {
    keystone: { id: 8010 },
    primaryRuneTree: { id: 8000 },
    secondaryRuneTree: { id: 8100 }
  }
});

const allPlayers = [
  ...Array.from({ length: 5 }, (_, index) => createPlayer('ORDER', index)),
  ...Array.from({ length: 5 }, (_, index) => createPlayer('CHAOS', index))
];
const snapshot = extractLiveClientScoreboardSnapshot(JSON.stringify({
  active_player: JSON.stringify({ active_player: { summonerName: 'Order 1' } }),
  all_players: JSON.stringify({ all_players: JSON.stringify(allPlayers) })
}));
const scoreboard = normalizeLiveClientScoreboard({
  activePlayer: snapshot.activePlayer,
  allPlayers: snapshot.allPlayers
});

assert.ok(scoreboard, 'Expected a valid 5×5 live-client scoreboard.');
assert.equal(scoreboard.source, 'overwolf-live-client-data');
assert.equal(scoreboard.allies.length, 5);
assert.equal(scoreboard.enemies.length, 5);
assert.equal(scoreboard.allies[0].role, 'TOP');
assert.equal(scoreboard.allies[1].role, 'JUNGLE');
assert.deepEqual(scoreboard.allies[0].items, [3000, 3100]);
assert.equal(scoreboard.allies[0].trinketId, 3364);
assert.deepEqual(scoreboard.allies[1].summonerSpells, [4, 11]);
assert.equal(scoreboard.allies[0].goldEarned, undefined);
assert.equal(scoreboard.allies[0].result, undefined);

const incompleteScoreboard = normalizeLiveClientScoreboard({
  activePlayer: { active_player: { summonerName: 'Order 1' } },
  allPlayers: { all_players: allPlayers.slice(0, 9) }
});

assert.equal(incompleteScoreboard, null, 'Incomplete teams must not produce a partial scoreboard.');
console.log('Overwolf scoreboard verification passed: wrapped JSON, 5×5 validation, trinket slot, and unknown gold/result.');
