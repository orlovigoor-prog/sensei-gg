import type { PlayerInfo } from '../../store/lobbySlice';
import { getChampionCatalogEntry } from './champions';
import { loadItemRecords, type DataDragonItemRecord } from './dataDragon';
import { getDataDragonAssetUrl } from './core';

export interface ItemEffectBlock {
  title?: string;
  text: string;
}

export interface ItemCatalogEntry {
  id: number;
  name: string;
  tags: string[];
  shortStats?: string[];
  description?: string;
  effectBlocks?: ItemEffectBlock[];
  passiveTitle?: string;
  passiveText?: string;
  baseCost?: number;
  totalCost?: number;
  combineCost?: number;
  sellCost?: number;
  purchasable?: boolean;
  maps?: Record<string, boolean>;
  from?: string[];
  into?: string[];
}

export interface DemoItemLoadoutTemplate {
  id: string;
  name: string;
  roles: PlayerInfo['mainRole'][];
  champions?: string[];
  items: number[];
}

const itemTooltipCache = new Map<number, ItemCatalogEntry>();

const stripItemMarkup = (value: string) => value
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<li>/gi, '• ')
  .replace(/<\/li>/gi, '\n')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&#39;/g, "'")
  .replace(/&quot;/g, '"')
  .replace(/&amp;/g, '&')
  .replace(/[ \t]+\n/g, '\n')
  .replace(/\n[ \t]+/g, '\n')
  .replace(/[ \t]{2,}/g, ' ')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

const parseItemDescription = (description = '') => {
  const statsMatch = description.match(/<stats>([\s\S]*?)<\/stats>/i);
  const shortStats = statsMatch
    ? stripItemMarkup(statsMatch[1]).split('\n').map((line) => line.trim()).filter(Boolean)
    : undefined;
  const withoutStats = description.replace(/<stats>[\s\S]*?<\/stats>/gi, '');
  const effectBlocks = withoutStats
    .split(/<br\s*\/?>\s*<br\s*\/?>/gi)
    .reduce<ItemEffectBlock[]>((blocks, block) => {
      const titleMatch = block.match(/<(?:passive|active|unique|rules)>(.*?)<\/(?:passive|active|unique|rules)>/i);
      const title = titleMatch ? stripItemMarkup(titleMatch[1]) : undefined;
      const text = stripItemMarkup(block.replace(/<(?:passive|active|unique|rules)>.*?<\/(?:passive|active|unique|rules)>/i, ''));
      return text ? [...blocks, { title, text }] : blocks;
    }, []);
  const firstPassive = effectBlocks.find((block) => block.title);

  return {
    shortStats: shortStats?.length ? shortStats : undefined,
    description: stripItemMarkup(description) || undefined,
    effectBlocks: effectBlocks.length ? effectBlocks : undefined,
    passiveTitle: firstPassive?.title,
    passiveText: firstPassive?.text
  };
};

const normalizeItemRecord = (id: number, item: DataDragonItemRecord): ItemCatalogEntry => {
  const parsed = parseItemDescription(item.description);
  const baseCost = item.gold?.base;
  const totalCost = item.gold?.total;

  return {
    id,
    name: item.name,
    tags: item.tags ?? [],
    ...parsed,
    baseCost,
    totalCost,
    combineCost: typeof baseCost === 'number' && typeof totalCost === 'number' ? totalCost - baseCost : undefined,
    sellCost: item.gold?.sell,
    purchasable: item.gold?.purchasable,
    maps: item.maps,
    from: item.from,
    into: item.into
  };
};

export const demoItemLoadoutTemplates: DemoItemLoadoutTemplate[] = [
  { id: 'top-bruiser', name: 'Демо-набор бойца', roles: ['TOP'], champions: ['Renekton', 'Aatrox'], items: [3078, 3047, 3153, 6333, 3075] },
  { id: 'top-duelist', name: 'Демо-набор дуэлянта', roles: ['TOP'], champions: ['Camille', 'Fiora', 'Jax'], items: [3078, 3153, 6333, 3047, 3065] },
  { id: 'top-frontline', name: 'Демо-набор фронтлайна', roles: ['TOP'], items: [3047, 3110, 6665, 3065, 3075] },
  { id: 'jungle-fighter', name: 'Демо-набор лесника', roles: ['JUNGLE'], champions: ['Lee Sin', 'Vi', 'Viego', 'Xin Zhao', 'Jarvan IV', 'Wukong'], items: [3078, 3153, 6333, 3047, 3065] },
  { id: 'jungle-frontline', name: 'Демо-набор лесного фронтлайна', roles: ['JUNGLE'], items: [3047, 3110, 6665, 3075, 3065] },
  { id: 'mid-mage', name: 'Демо-набор мага', roles: ['MID'], champions: ['Syndra', 'Vex', 'Ahri', 'Sylas', 'Orianna', 'Twisted Fate'], items: [6655, 4645, 3089, 3047, 3107] },
  { id: 'mid-default', name: 'Демо-набор мидера', roles: ['MID'], items: [6653, 3089, 3107, 3047, 2065] },
  { id: 'adc-marksman', name: 'Демо-набор стрелка', roles: ['ADC'], items: [6672, 3508, 3031, 3094, 3047] },
  { id: 'support-engage', name: 'Демо-набор саппорта', roles: ['SUPPORT'], champions: ['Nautilus', 'Leona', 'Thresh', 'Rakan'], items: [3190, 2065, 3107, 3047, 3110] },
  { id: 'support-enchanter', name: 'Демо-набор энчантера', roles: ['SUPPORT'], items: [6617, 2065, 3107, 3190, 3047] }
];

const championMatchesTemplate = (championName: string, template: DemoItemLoadoutTemplate) => {
  const championId = getChampionCatalogEntry(championName)?.id;
  return template.champions?.some((candidate) => getChampionCatalogEntry(candidate)?.id === championId) ?? false;
};

export const getDemoItemLoadout = (championName: string, role?: PlayerInfo['mainRole']) => {
  const roleTemplates = role
    ? demoItemLoadoutTemplates.filter((template) => template.roles.includes(role))
    : demoItemLoadoutTemplates;

  return roleTemplates.find((template) => championMatchesTemplate(championName, template))
    ?? roleTemplates[0]
    ?? null;
};

export const getItemCatalogEntry = (itemId: number) => itemTooltipCache.get(itemId);

export const resolveItemTooltipEntry = async (itemId: number): Promise<ItemCatalogEntry | null> => {
  const cachedItem = itemTooltipCache.get(itemId);
  if (cachedItem) {
    return cachedItem;
  }

  const catalog = await loadItemRecords();
  const record = catalog?.[String(itemId)];

  if (!record?.name) {
    return null;
  }

  const normalizedItem = normalizeItemRecord(itemId, record);
  itemTooltipCache.set(itemId, normalizedItem);
  return normalizedItem;
};

export const getItemIconUrl = (itemId: number) => getDataDragonAssetUrl(`item/${itemId}.png`);
