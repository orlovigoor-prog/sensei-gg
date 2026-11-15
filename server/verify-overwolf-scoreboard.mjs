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

const {
  extractLiveClientScoreboardSnapshot,
  normalizeLiveClientRoster,
  normalizeLiveClientScoreboard
} = module.exports;

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

const roster = normalizeLiveClientRoster({
  activePlayer: snapshot.activePlayer,
  allPlayers: snapshot.allPlayers
});

assert.ok(roster, 'Expected a valid 5×5 live-client roster.');
assert.equal(roster.localSummonerName, 'Order 1');
assert.equal(roster.allies.length, 5);
assert.deepEqual(Object.keys(roster.allies[0]).sort(), [
  'championName',
  'mainRole',
  'runes',
  'summonerName',
  'summonerSpells'
]);
assert.equal('tier' in roster.allies[0], false);
assert.equal('winRate' in roster.allies[0], false);
assert.equal('mastery' in roster.allies[0], false);
assert.equal('recentMatches' in roster.allies[0], false);

const incompleteScoreboard = normalizeLiveClientScoreboard({
  activePlayer: { active_player: { summonerName: 'Order 1' } },
  allPlayers: { all_players: allPlayers.slice(0, 9) }
});

assert.equal(incompleteScoreboard, null, 'Incomplete teams must not produce a partial scoreboard.');

const incompleteRoster = normalizeLiveClientRoster({
  activePlayer: { active_player: { summonerName: 'Order 1' } },
  allPlayers: { all_players: allPlayers.slice(0, 9) }
});
assert.equal(incompleteRoster, null, 'Incomplete teams must not produce a partial roster.');

const duplicateRolePlayers = allPlayers.map((player) => ({ ...player }));
duplicateRolePlayers[1].position = 'TOP';
assert.equal(normalizeLiveClientRoster({
  activePlayer: { active_player: { summonerName: 'Order 1' } },
  allPlayers: { all_players: duplicateRolePlayers }
}), null, 'Duplicate roles must not produce a roster.');

const missingRolePlayers = allPlayers.map((player) => ({ ...player }));
delete missingRolePlayers[2].position;
assert.equal(normalizeLiveClientRoster({
  activePlayer: { active_player: { summonerName: 'Order 1' } },
  allPlayers: { all_players: missingRolePlayers }
}), null, 'Missing roles must not produce a roster.');

assert.equal(normalizeLiveClientRoster({
  activePlayer: { active_player: { summonerName: 'Unknown local player' } },
  allPlayers: { all_players: allPlayers }
}), null, 'A missing local player must not produce a roster.');

console.log('Overwolf scoreboard verification passed: wrapped JSON, strict 5×5 roster validation, role coverage, local-player validation, trinket slot, and unknown gold/result.');
