import fs from 'node:fs/promises';
import path from 'node:path';
import { DATA_DRAGON_LOCALE, DATA_DRAGON_VERSION } from './game-data-config.mjs';

const projectPath = (...segments) => path.resolve(process.cwd(), ...segments);
const normalizeChampionKey = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

const fetchJson = async (url) => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}`);
  }

  return response.json();
};

const getItemIdsFromDemoLoadouts = (source) => {
  const ids = new Set();
  const templatePattern = /items:\s*\[([^\]]*)\]/g;

  for (const match of source.matchAll(templatePattern)) {
    for (const id of match[1].match(/\d+/g) ?? []) {
      ids.add(Number(id));
    }
  }

  return [...ids];
};

const main = async () => {
  const config = JSON.parse(await fs.readFile(projectPath('game-data.config.json'), 'utf8'));
  const [championPayload, championDetailPayload, itemPayload, counterpickPayload, championSource, itemSource] = await Promise.all([
    fetchJson(`https://ddragon.leagueoflegends.com/cdn/${DATA_DRAGON_VERSION}/data/en_US/champion.json`),
    fetchJson(`https://ddragon.leagueoflegends.com/cdn/${DATA_DRAGON_VERSION}/data/${DATA_DRAGON_LOCALE}/champion/Aatrox.json`),
    fetchJson(`https://ddragon.leagueoflegends.com/cdn/${DATA_DRAGON_VERSION}/data/${DATA_DRAGON_LOCALE}/item.json`),
    fs.readFile(projectPath('server/data/lol-counterpicks.json'), 'utf8').then(JSON.parse),
    fs.readFile(projectPath('src/services/gameData/champions.ts'), 'utf8'),
    fs.readFile(projectPath('src/services/gameData/items.ts'), 'utf8')
  ]);

  if (config.dataDragonVersion !== DATA_DRAGON_VERSION || config.locale !== DATA_DRAGON_LOCALE) {
    throw new Error('Client and server Data Dragon configurations are not aligned.');
  }

  const champions = Object.values(championPayload.data ?? {});
  if (champions.length < 160) {
    throw new Error(`Expected a full champion catalog, received ${champions.length} entries.`);
  }

  const aatrox = championDetailPayload.data?.Aatrox;
  if (!aatrox?.name || !aatrox?.passive?.image?.full || !Array.isArray(aatrox.spells) || aatrox.spells.length < 4 || !aatrox.spells.every((spell) => spell.name && spell.description && spell.image?.full)) {
    throw new Error('Localized champion detail payload is incomplete.');
  }

  const knownChampionKeys = new Set(champions.flatMap((champion) => [
    normalizeChampionKey(champion.id),
    normalizeChampionKey(champion.name)
  ]));
  const localChampionIds = new Set(Array.from(championSource.matchAll(/\{ id: '([^']+)'/g), ([, id]) => id));
  const officialChampionIds = new Set(champions.map((champion) => champion.id));
  const missingLocalChampionIds = [...officialChampionIds].filter((championId) => !localChampionIds.has(championId));
  const unknownLocalChampionIds = [...localChampionIds].filter((championId) => !officialChampionIds.has(championId));

  if (missingLocalChampionIds.length > 0 || unknownLocalChampionIds.length > 0) {
    throw new Error(`Champion index differs from Data Dragon. Missing: ${missingLocalChampionIds.join(', ') || 'none'}; unknown: ${unknownLocalChampionIds.join(', ') || 'none'}`);
  }

  const counterpickNames = new Set();

  for (const [championName, championData] of Object.entries(counterpickPayload.champions ?? {})) {
    counterpickNames.add(championName);

    for (const roleData of Object.values(championData.roles ?? {})) {
      for (const counter of roleData.counters ?? []) {
        counterpickNames.add(counter.champion);
      }
    }
  }

  const missingChampions = [...counterpickNames].filter((name) => !knownChampionKeys.has(normalizeChampionKey(name)));
  if (missingChampions.length > 0) {
    throw new Error(`Counterpick catalog contains unknown champions: ${missingChampions.join(', ')}`);
  }

  const demoItemIds = getItemIdsFromDemoLoadouts(itemSource);
  const missingItems = demoItemIds.filter((itemId) => !itemPayload.data?.[String(itemId)]?.name);
  if (missingItems.length > 0) {
    throw new Error(`Demo loadouts contain unknown item IDs: ${missingItems.join(', ')}`);
  }

  console.log(`Game data verified: patch ${DATA_DRAGON_VERSION}, ${champions.length} champions, ${counterpickNames.size} counterpick names, ${demoItemIds.length} demo item IDs.`);
};

main().catch((error) => {
  console.error(`Game data verification failed: ${error.message}`);
  process.exitCode = 1;
});
