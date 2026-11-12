import {
  dataDragonLocale,
  getDataDragonAssetUrl,
  getDataDragonDataUrl
} from './core';
import { getChampionCatalogEntry } from './champions';

export interface DataDragonImage {
  full: string;
  sprite?: string;
  group?: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
}

export interface DataDragonChampionSummary {
  id: string;
  key: string;
  name: string;
  title: string;
  blurb?: string;
  tags: string[];
  image: DataDragonImage;
}

export interface DataDragonChampionSpell {
  id: string;
  name: string;
  description: string;
  tooltip?: string;
  image: DataDragonImage;
  maxrank?: number;
  cooldown?: number[];
  cost?: number[];
  range?: number[];
}

export interface DataDragonChampionDetail extends DataDragonChampionSummary {
  partype?: string;
  passive: {
    name: string;
    description: string;
    image: DataDragonImage;
  };
  spells: DataDragonChampionSpell[];
}

export interface DataDragonItemRecord {
  name: string;
  description: string;
  plaintext?: string;
  image: DataDragonImage;
  gold: {
    base?: number;
    total?: number;
    sell?: number;
    purchasable?: boolean;
  };
  tags?: string[];
  maps?: Record<string, boolean>;
  stats?: Record<string, number>;
  from?: string[];
  into?: string[];
}

interface DataDragonCatalogResponse<T> {
  version: string;
  data: Record<string, T>;
}

let championSummaryCache: Record<string, DataDragonChampionSummary> | null = null;
let championSummaryPromise: Promise<Record<string, DataDragonChampionSummary> | null> | null = null;
const championDetailCache = new Map<string, DataDragonChampionDetail | null>();
const championDetailPromises = new Map<string, Promise<DataDragonChampionDetail | null>>();
let itemRecordCache: Record<string, DataDragonItemRecord> | null = null;
let itemRecordPromise: Promise<Record<string, DataDragonItemRecord> | null> | null = null;

const fetchDataDragonJson = async <T>(path: string): Promise<T | null> => {
  try {
    const response = await fetch(getDataDragonDataUrl(path));

    if (!response.ok) {
      return null;
    }

    return await response.json() as T;
  } catch {
    return null;
  }
};

export const getChampionImageUrl = (imageFull: string) => getDataDragonAssetUrl(`champion/${imageFull}`);
export const getChampionSpellImageUrl = (imageFull: string) => getDataDragonAssetUrl(`spell/${imageFull}`);
export const getChampionPassiveImageUrl = (imageFull: string) => getDataDragonAssetUrl(`passive/${imageFull}`);
export const getItemImageUrl = (imageFull: string) => getDataDragonAssetUrl(`item/${imageFull}`);

export const loadChampionSummaries = async (): Promise<Record<string, DataDragonChampionSummary> | null> => {
  if (championSummaryCache) {
    return championSummaryCache;
  }

  if (!championSummaryPromise) {
    championSummaryPromise = fetchDataDragonJson<DataDragonCatalogResponse<DataDragonChampionSummary>>('champion.json')
      .then((payload) => {
        championSummaryCache = payload?.data ?? null;
        return championSummaryCache;
      })
      .finally(() => {
        championSummaryPromise = null;
      });
  }

  return championSummaryPromise;
};

export const loadChampionDetail = async (championName: string): Promise<DataDragonChampionDetail | null> => {
  const champion = getChampionCatalogEntry(championName);
  const championId = champion?.id ?? championName.trim();

  if (!championId) {
    return null;
  }

  if (championDetailCache.has(championId)) {
    return championDetailCache.get(championId) ?? null;
  }

  const existingRequest = championDetailPromises.get(championId);
  if (existingRequest) {
    return existingRequest;
  }

  const request = fetchDataDragonJson<DataDragonCatalogResponse<DataDragonChampionDetail>>(`champion/${championId}.json`)
    .then((payload) => payload?.data?.[championId] ?? null)
    .then((detail) => {
      championDetailCache.set(championId, detail);
      return detail;
    })
    .finally(() => {
      championDetailPromises.delete(championId);
    });

  championDetailPromises.set(championId, request);
  return request;
};

export const loadItemRecords = async (): Promise<Record<string, DataDragonItemRecord> | null> => {
  if (itemRecordCache) {
    return itemRecordCache;
  }

  if (!itemRecordPromise) {
    itemRecordPromise = fetchDataDragonJson<DataDragonCatalogResponse<DataDragonItemRecord>>('item.json')
      .then((payload) => {
        itemRecordCache = payload?.data ?? null;
        return itemRecordCache;
      })
      .finally(() => {
        itemRecordPromise = null;
      });
  }

  return itemRecordPromise;
};

export const dataDragonReferenceLocale = dataDragonLocale;
