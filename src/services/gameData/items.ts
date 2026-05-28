import { dragonVersion } from './core';
import type { PlayerInfo } from '../../store/lobbySlice';
import { getChampionCatalogEntry } from './champions';

export interface ItemCatalogEntry {
  id: number;
  name: string;
  tags: string[];
  shortStats?: string[];
  passiveTitle?: string;
  passiveText?: string;
  totalCost?: number;
  combineCost?: number;
}

let remoteItemCatalogCache: Record<string, {
  name?: string;
  description?: string;
  plaintext?: string;
  gold?: { total?: number };
}> | null = null;
let remoteItemCatalogPromise: Promise<Record<string, {
  name?: string;
  description?: string;
  plaintext?: string;
  gold?: { total?: number };
}> | null> | null = null;

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

const parseRemoteItemDescription = (description?: string, plaintext?: string) => {
  const statsMatch = description?.match(/<stats>([\s\S]*?)<\/stats>/i);
  const shortStats = statsMatch
    ? stripItemMarkup(statsMatch[1]).split('\n').map((line) => line.trim()).filter(Boolean)
    : undefined;

  const passiveMatches = Array.from(description?.matchAll(/<passive>(.*?)<\/passive>([\s\S]*?)(?=<br\s*\/?>\s*<br\s*\/?>\s*<passive>|<\/mainText>|$)/gi) ?? []);
  const passiveBlocks = passiveMatches
    .map((match) => ({
      title: stripItemMarkup(match[1] || ''),
      text: stripItemMarkup(match[2] || '')
    }))
    .filter((entry) => entry.title || entry.text);

  const passiveTitle = passiveBlocks.length > 0
    ? passiveBlocks.map((entry) => entry.title).filter(Boolean).join(' / ') || undefined
    : undefined;

  const passiveText = passiveBlocks.length > 0
    ? passiveBlocks.map((entry) => entry.text).filter(Boolean).join('\n\n') || undefined
    : undefined;

  const plainTextFallback = stripItemMarkup(plaintext || description || '');

  return {
    shortStats: shortStats?.length ? shortStats : undefined,
    passiveTitle,
    passiveText: passiveText || undefined,
    plainTextFallback: plainTextFallback || undefined
  };
};

export interface ItemBuildTemplate {
  id: string;
  name: string;
  roles: PlayerInfo['mainRole'][];
  champions?: string[];
  tags: string[];
  items: number[];
}

export const itemCatalog: ItemCatalogEntry[] = [
  { id: 1001, name: 'Ботинки', tags: ['boots', 'movement'], shortStats: ['25 скорости передвижения'], passiveTitle: 'Лёгкий шаг', passiveText: 'Базовые ботинки для раннего темпа, ротаций и более безопасной линии.', totalCost: 300, combineCost: 300 },
  { id: 1011, name: 'Пояс великана', tags: ['health', 'component'], shortStats: ['350 здоровья'], passiveTitle: 'Запас прочности', passiveText: 'Простой компонент на выживаемость для плотного входа в драку и более стабильных разменов.', totalCost: 900, combineCost: 500 },
  { id: 1053, name: 'Вампирский скипетр', tags: ['lifesteal', 'component'], shortStats: ['15 силы атаки', '7% вампиризма'], passiveTitle: 'Поддержание линии', passiveText: 'Даёт раннее восстановление от автоатак и делает линию заметно комфортнее.', totalCost: 900, combineCost: 550 },
  { id: 1057, name: 'Плащ негатрона', tags: ['mr', 'component'], shortStats: ['50 сопротивления магии'], passiveTitle: 'Антимагия', passiveText: 'Хороший ранний ответ против взрывного магического урона и давления со стороны AP-чемпионов.', totalCost: 850, combineCost: 400 },
  { id: 1086, name: 'Длинный меч', tags: ['attack', 'component'], shortStats: ['10 силы атаки'], passiveTitle: 'Ранний урон', passiveText: 'Базовый компонент стрелка и бойца для усиления размена и добивания целей.', totalCost: 350, combineCost: 350 },
  { id: 2065, name: 'Шурелия', tags: ['support', 'utility'], shortStats: ['55 силы умений', '125% базового восстановления маны', '8% скорости передвижения'], passiveTitle: 'Воодушевление', passiveText: 'Усиливает союзников всплеском скорости передвижения, помогая начать драку или выйти из неё.', totalCost: 2200, combineCost: 650 },
  { id: 2003, name: 'Зелье здоровья', tags: ['consumable', 'lane'], shortStats: ['Восстанавливает здоровье со временем'], passiveTitle: 'Подхил линии', passiveText: 'Помогает пережить ранние размены и остаться на линии дольше без потери темпа.', totalCost: 50, combineCost: 50 },
  { id: 3031, name: 'Грань бесконечности', tags: ['crit', 'marksman'], shortStats: ['80 силы атаки', '25% шанса критического удара'], passiveTitle: 'Совершенство', passiveText: 'Критические удары наносят заметно больше урона и усиливают поздний темп стрелка.', totalCost: 3400, combineCost: 625 },
  { id: 3036, name: 'Почтение лорда Доминика', tags: ['crit', 'armor-pen'], shortStats: ['35 силы атаки', '40% пробивания брони', '25% шанса критического удара'], passiveTitle: 'Пробитие фронтлайна', passiveText: 'Сильно повышает урон по плотным целям и помогает стрелку не проседать против танков.', totalCost: 3000, combineCost: 700 },
  { id: 3046, name: 'Призрачный танцор', tags: ['crit', 'attack-speed'], shortStats: ['60% скорости атаки', '25% шанса критического удара', '8% скорости передвижения'], passiveTitle: 'Дуэльный ритм', passiveText: 'Даёт высокий стабильный урон в секунду и помогает лучше держать позицию в длинной драке.', totalCost: 2650, combineCost: 400 },
  { id: 3047, name: 'Бронированные стальные накладки', tags: ['boots', 'armor'], shortStats: ['25 брони', '45 скорости передвижения'], passiveTitle: 'Бронированный шаг', passiveText: 'Снижает входящий урон от автоатак и помогает переживать физическое давление.', totalCost: 1200, combineCost: 500 },
  { id: 3065, name: 'Лик духа', tags: ['tank', 'mr'], shortStats: ['400 здоровья', '50 сопротивления магии', '10 ускорения умений'], passiveTitle: 'Безграничная живучесть', passiveText: 'Усиливает лечение, щиты и восстановление, делая фронтлайн заметно живучее.', totalCost: 2900, combineCost: 800 },
  { id: 3072, name: 'Кровопийца', tags: ['marksman', 'lifesteal'], shortStats: ['80 силы атаки', '15% вампиризма'], passiveTitle: 'Щит от избыточного лечения', passiveText: 'Даёт мощное восстановление и помогает стрелку пережить резкий входящий урон в поздней драке.', totalCost: 3400, combineCost: 900 },
  { id: 3075, name: 'Терновый доспех', tags: ['tank', 'anti-heal'], shortStats: ['350 здоровья', '75 брони'], passiveTitle: 'Шипованная броня', passiveText: 'Возвращает часть физического урона в ближнем бою и режет вражеское лечение.', totalCost: 2450, combineCost: 350 },
  { id: 3078, name: 'Тройственная сила', tags: ['fighter', 'carry'], shortStats: ['36 силы атаки', '30% скорости атаки', '333 здоровья'], passiveTitle: 'Чародейский клинок', passiveText: 'После применения умения следующая автоатака наносит усиленный физический урон и помогает разгонять темп.', totalCost: 3333, combineCost: 733 },
  { id: 3089, name: 'Смертельная шляпа Рабадона', tags: ['mage', 'ap'], shortStats: ['140 силы умений'], passiveTitle: 'Пик могущества', passiveText: 'Резко увеличивает общую силу умений и превращает следующую серию заклинаний в серьёзную угрозу.', totalCost: 3600, combineCost: 1050 },
  { id: 3094, name: 'Скорострельная пушка', tags: ['crit', 'marksman'], shortStats: ['35% скорости атаки', '25% шанса критического удара', '4% скорости передвижения'], passiveTitle: 'Наэлектризованный выстрел', passiveText: 'Периодически даёт увеличенную дальность атаки и дополнительный магический урон по цели.', totalCost: 2600, combineCost: 600 },
  { id: 3124, name: 'Клинок ярости Гинсу', tags: ['attack-speed', 'hybrid'], shortStats: ['35 силы атаки', '35 силы умений', '25% скорости атаки'], passiveTitle: 'Разгон автоатак', passiveText: 'Постепенно усиливает урон через частые атаки и отлично раскрывает сборки через эффекты при попадании.', totalCost: 3000, combineCost: 600 },
  { id: 3107, name: 'Искупление', tags: ['support', 'utility'], shortStats: ['200 здоровья', '15 ускорения умений', '100% базового восстановления маны'], passiveTitle: 'Искупление', passiveText: 'Позволяет исцелить союзников по области и стабилизировать затяжную драку или осаду.', totalCost: 2300, combineCost: 500 },
  { id: 3110, name: 'Ледяное сердце', tags: ['tank', 'armor'], shortStats: ['70 брони', '400 маны', '20 ускорения умений'], passiveTitle: 'Ледяное поле', passiveText: 'Снижает скорость атаки врагов рядом и режет эффективность физического урона в секунду.', totalCost: 2500, combineCost: 500 },
  { id: 3143, name: 'Предзнаменование Рандуина', tags: ['tank', 'armor'], shortStats: ['350 здоровья', '75 брони'], passiveTitle: 'Срез критов', passiveText: 'Уменьшает взрывной урон от критующих керри и помогает фронтлайну переживать вход в драку.', totalCost: 2700, combineCost: 700 },
  { id: 3153, name: 'Клинок падшего короля', tags: ['fighter', 'duelist'], shortStats: ['40 силы атаки', '25% скорости атаки', '10% вампиризма'], passiveTitle: 'Похищение сущности', passiveText: 'Автоатаки наносят дополнительный урон от текущего здоровья цели и помогают выигрывать длинные дуэли.', totalCost: 3200, combineCost: 525 },
  { id: 3190, name: 'Медальон железных солари', tags: ['support', 'tank'], shortStats: ['200 здоровья', '30 брони', '30 сопротивления магии'], passiveTitle: 'Защитная аура', passiveText: 'Даёт команде щит по области и усиливает выживаемость в момент вражеской инициации.', totalCost: 2200, combineCost: 400 },
  { id: 3302, name: 'Терминус', tags: ['marksman', 'on-hit'], shortStats: ['35 силы атаки', '30% скорости атаки'], passiveTitle: 'Двойная грань', passiveText: 'Даёт урон при попадании и постепенно переключает профиль урона, помогая вскрывать разные типы целей.', totalCost: 3000, combineCost: 700 },
  { id: 3340, name: 'Скрытый тотем', tags: ['trinket', 'vision'], shortStats: ['Ставит невидимый вард на обзор'], passiveTitle: 'Контроль карты', passiveText: 'Базовый обзор для защиты линии, контроля реки и безопасных ротаций.', totalCost: 0, combineCost: 0 },
  { id: 3363, name: 'Дальнозоркость', tags: ['trinket', 'vision'], shortStats: ['Ставит дальний обзор'], passiveTitle: 'Дальний чек', passiveText: 'Позволяет безопасно проверять тёмные зоны карты перед заходом на объект или опасной проверкой кустов.', totalCost: 0, combineCost: 0 },
  { id: 3364, name: 'Оракул', tags: ['trinket', 'vision'], shortStats: ['Раскрывает и отключает вражеские варды'], passiveTitle: 'Снятие обзора', passiveText: 'Ключевой инструмент для зачистки обзора перед дракой, пушем или подготовкой к объектам.', totalCost: 0, combineCost: 0 },
  { id: 3508, name: 'Похититель сущности', tags: ['crit', 'marksman'], shortStats: ['65 силы атаки', '25% шанса критического удара', '20 ускорения умений'], passiveTitle: 'Чародейский клинок', passiveText: 'Следующая автоатака после умения наносит бонусный урон и возвращает ману при попадании.', totalCost: 3050, combineCost: 500 },
  { id: 4645, name: 'Теневое пламя', tags: ['mage', 'burst'], shortStats: ['120 силы умений', '12 магического пробивания'], passiveTitle: 'Теневое прожигание', passiveText: 'Усиливает взрывной урон по хрупким целям и помогает быстрее пробивать слабую магическую защиту.', totalCost: 3200, combineCost: 850 },
  { id: 6333, name: 'Танец смерти', tags: ['fighter', 'survivability'], shortStats: ['60 силы атаки', '15 ускорения умений', '40 брони'], passiveTitle: 'Игнорирование боли / Неповиновение', passiveText: 'Часть входящего урона наносится не сразу, а в течение нескольких секунд. Добивание вражеского чемпиона после нанесённого урона отменяет оставшийся отложенный урон и восстанавливает здоровье.', totalCost: 3200, combineCost: 525 },
  { id: 6617, name: 'Лунный камень', tags: ['support', 'healing'], shortStats: ['30 силы умений', '200 здоровья', '20 ускорения умений'], passiveTitle: 'Свет луны', passiveText: 'В затяжной драке постепенно усиливает лечение и щиты по союзникам.', totalCost: 2200, combineCost: 550 },
  { id: 6653, name: 'Мучения Лиандри', tags: ['mage', 'burn'], shortStats: ['90 силы умений', '300 здоровья', '15 ускорения умений'], passiveTitle: 'Мучительное пламя', passiveText: 'Умения поджигают цель и особенно хорошо работают в длинных драках против плотного фронтлайна.', totalCost: 3000, combineCost: 800 },
  { id: 6655, name: 'Люден', tags: ['mage', 'burst'], shortStats: ['95 силы умений', '25 ускорения умений', '4% скорости передвижения'], passiveTitle: 'Эхо темпа', passiveText: 'Даёт сильный мгновенный урон и дополнительную мобильность после попаданий умениями.', totalCost: 2900, combineCost: 600 },
  { id: 6665, name: 'Жак\'Шо Многоликий', tags: ['tank', 'durability'], shortStats: ['350 здоровья', '45 брони', '45 сопротивления магии'], passiveTitle: 'Неумолимое поглощение', passiveText: 'Чем дольше длится бой, тем плотнее становится владелец, постепенно наращивая стойкость.', totalCost: 3200, combineCost: 700 },
  { id: 6672, name: 'Убийца кракенов', tags: ['marksman', 'carry'], shortStats: ['45 силы атаки', '40% скорости атаки', '4% скорости передвижения'], passiveTitle: 'Третий выстрел', passiveText: 'Каждая третья атака наносит дополнительный урон, ускоряя разбор фронтлайна в затяжной драке.', totalCost: 3100, combineCost: 400 }
];

export const itemBuildTemplates: ItemBuildTemplate[] = [
  {
    id: 'top-bruiser-snowball',
    name: 'Сноубол брузер',
    roles: ['TOP'],
    champions: ['Renekton', 'Aatrox'],
    tags: ['fighter', 'lane-bully'],
    items: [3078, 3047, 3153, 6333, 3075]
  },
  {
    id: 'top-duelist-scaling',
    name: 'Сайд через дуэль',
    roles: ['TOP'],
    champions: ['Camille', 'Fiora', 'Jax'],
    tags: ['carry', 'duelist', 'scaling'],
    items: [3078, 3153, 6333, 3047, 3065]
  },
  {
    id: 'top-teamfight-anchor',
    name: 'Фронтлайн для драки',
    roles: ['TOP'],
    champions: ['Gnar'],
    tags: ['teamfight', 'tank'],
    items: [3047, 3110, 6665, 3065, 3075]
  },
  {
    id: 'jungle-playmaker',
    name: 'Ранний темп',
    roles: ['JUNGLE'],
    champions: ['LeeSin', 'Vi'],
    tags: ['playmaker', 'fighter'],
    items: [3078, 3153, 6333, 3047, 3065]
  },
  {
    id: 'jungle-teamfight-engage',
    name: 'Вход под тимфайт',
    roles: ['JUNGLE'],
    champions: ['JarvanIV', 'Wukong'],
    tags: ['engage', 'teamfight'],
    items: [3047, 3110, 6665, 3075, 3065]
  },
  {
    id: 'jungle-carry-skirmish',
    name: 'Скермиш-керри',
    roles: ['JUNGLE'],
    champions: ['Viego', 'XinZhao'],
    tags: ['carry', 'skirmisher'],
    items: [3153, 3078, 6333, 3047, 3065]
  },
  {
    id: 'mid-burst-priority',
    name: 'Приоритет через burst',
    roles: ['MID'],
    champions: ['Syndra', 'Vex'],
    tags: ['burst', 'lane-bully'],
    items: [6655, 4645, 3089, 3047, 3107]
  },
  {
    id: 'mid-playmaker',
    name: 'Роум и розыгрыш',
    roles: ['MID'],
    champions: ['Ahri', 'Sylas'],
    tags: ['playmaker', 'skirmisher'],
    items: [6655, 4645, 3089, 3047, 3153]
  },
  {
    id: 'mid-utility-control',
    name: 'Контроль и utility',
    roles: ['MID'],
    champions: ['Orianna', 'TwistedFate'],
    tags: ['utility', 'control'],
    items: [6653, 3089, 3107, 3047, 2065]
  },
  {
    id: 'adc-lane-bully',
    name: 'Линия через pressure',
    roles: ['ADC'],
    champions: ['Lucian', 'Caitlyn'],
    tags: ['marksman', 'lane-bully'],
    items: [6672, 3508, 3031, 3094, 3047]
  },
  {
    id: 'adc-hypercarry',
    name: 'Поздний керри',
    roles: ['ADC'],
    champions: ['Jinx', 'Zeri'],
    tags: ['marksman', 'scaling'],
    items: [6672, 3031, 3094, 3508, 3047]
  },
  {
    id: 'adc-mobile-carry',
    name: 'Мобильный урон',
    roles: ['ADC'],
    champions: ["Kai'Sa", 'Xayah', 'Ezreal', 'Ashe'],
    tags: ['marksman', 'playmaker'],
    items: [6672, 3508, 3094, 3031, 3047]
  },
  {
    id: 'support-engage',
    name: 'Инициация и давление',
    roles: ['SUPPORT'],
    champions: ['Nautilus', 'Leona'],
    tags: ['support', 'engage'],
    items: [3190, 3110, 3047, 3075, 3107]
  },
  {
    id: 'support-teamfight-utility',
    name: 'Командная защита',
    roles: ['SUPPORT'],
    champions: ['Thresh', 'Rakan'],
    tags: ['support', 'utility', 'playmaker'],
    items: [3190, 2065, 3107, 3047, 3110]
  },
  {
    id: 'support-enchanter',
    name: 'Усиление керри',
    roles: ['SUPPORT'],
    champions: ['Lulu', 'Milio'],
    tags: ['support', 'utility', 'enchanter'],
    items: [6617, 2065, 3107, 3190, 3047]
  }
];

const countSharedTags = (left: string[], right: string[]) => left.filter((tag) => right.includes(tag)).length;

export const getItemBuildTemplate = (templateId: string) => itemBuildTemplates.find((template) => template.id === templateId);

export const getRecommendedItemBuild = (championName: string, role?: PlayerInfo['mainRole']) => {
  const champion = getChampionCatalogEntry(championName);
  const championTags = champion?.tags ?? [];

  const matchingTemplates = itemBuildTemplates.filter((template) => {
    if (template.champions?.includes(championName)) {
      return true;
    }

    if (role && !template.roles.includes(role)) {
      return false;
    }

    return countSharedTags(template.tags, championTags) > 0;
  });

  return matchingTemplates.sort((left, right) => {
    const leftChampionMatch = left.champions?.includes(championName) ? 2 : 0;
    const rightChampionMatch = right.champions?.includes(championName) ? 2 : 0;
    const leftScore = leftChampionMatch + countSharedTags(left.tags, championTags);
    const rightScore = rightChampionMatch + countSharedTags(right.tags, championTags);
    return rightScore - leftScore;
  })[0] ?? null;
};

export const getItemCatalogEntry = (itemId: number) => itemCatalog.find((entry) => entry.id === itemId);

const loadRemoteItemCatalog = async () => {
  if (remoteItemCatalogCache) {
    return remoteItemCatalogCache;
  }

  if (!remoteItemCatalogPromise) {
    remoteItemCatalogPromise = fetch(`https://ddragon.leagueoflegends.com/cdn/${dragonVersion}/data/ru_RU/item.json`)
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }

        const payload = await response.json() as {
          data?: Record<string, {
            name?: string;
            description?: string;
            plaintext?: string;
            gold?: { total?: number };
          }>;
        };

        remoteItemCatalogCache = payload.data ?? null;
        return remoteItemCatalogCache;
      })
      .catch(() => null)
      .finally(() => {
        remoteItemCatalogPromise = null;
      });
  }

  return remoteItemCatalogPromise;
};

export const resolveItemTooltipEntry = async (itemId: number): Promise<ItemCatalogEntry | null> => {
  const localEntry = getItemCatalogEntry(itemId);

  const remoteCatalog = await loadRemoteItemCatalog();
  const remoteEntry = remoteCatalog?.[String(itemId)];

  if (remoteEntry?.name) {
    const parsedDescription = parseRemoteItemDescription(remoteEntry.description, remoteEntry.plaintext);

    return {
      id: itemId,
      name: remoteEntry.name,
      tags: localEntry?.tags ?? ['remote-catalog'],
      shortStats: parsedDescription.shortStats ?? localEntry?.shortStats ?? (parsedDescription.plainTextFallback ? [parsedDescription.plainTextFallback] : undefined),
      passiveTitle: parsedDescription.passiveTitle ?? localEntry?.passiveTitle,
      passiveText: parsedDescription.passiveText ?? localEntry?.passiveText ?? parsedDescription.plainTextFallback,
      totalCost: typeof remoteEntry.gold?.total === 'number' ? remoteEntry.gold.total : localEntry?.totalCost,
      combineCost: localEntry?.combineCost
    };
  }

  if (localEntry) {
    return localEntry;
  }

  return null;
};

export const getItemIconUrl = (itemId: number) => `https://ddragon.leagueoflegends.com/cdn/${dragonVersion}/img/item/${itemId}.png`;
