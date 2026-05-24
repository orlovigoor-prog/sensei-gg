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

export interface ItemBuildTemplate {
  id: string;
  name: string;
  roles: PlayerInfo['mainRole'][];
  champions?: string[];
  tags: string[];
  items: number[];
}

export const itemCatalog: ItemCatalogEntry[] = [
  { id: 2065, name: 'Shurelya', tags: ['support', 'utility'], shortStats: ['55 силы умений', '125% базового восстановления маны', '8% скорости передвижения'], passiveTitle: 'Воодушевление', passiveText: 'Усиливает союзников всплеском скорости передвижения, помогая начать драку или выйти из нее.', totalCost: 2200, combineCost: 650 },
  { id: 3031, name: 'Infinity Edge', tags: ['crit', 'marksman'], shortStats: ['80 силы атаки', '25% шанса критического удара'], passiveTitle: 'Совершенство', passiveText: 'Критические удары наносят заметно больше урона и усиливают поздний темп стрелка.', totalCost: 3400, combineCost: 625 },
  { id: 3047, name: 'Plated Steelcaps', tags: ['boots', 'armor'], shortStats: ['25 брони', '45 скорости передвижения'], passiveTitle: 'Бронированный шаг', passiveText: 'Снижает входящий урон от автоатак и помогает переживать физический pressure.', totalCost: 1200, combineCost: 500 },
  { id: 3065, name: 'Spirit Visage', tags: ['tank', 'mr'], shortStats: ['400 здоровья', '50 сопротивления магии', '10 ускорения умений'], passiveTitle: 'Безграничная vitality', passiveText: 'Усиливает лечение, щиты и восстановление, делая фронтлайн заметно живучее.', totalCost: 2900, combineCost: 800 },
  { id: 3075, name: 'Thornmail', tags: ['tank', 'anti-heal'], shortStats: ['350 здоровья', '75 брони'], passiveTitle: 'Шипованная броня', passiveText: 'Возвращает часть физического урона в ближнем бою и режет вражеское лечение.', totalCost: 2450, combineCost: 350 },
  { id: 3078, name: 'Trinity Force', tags: ['fighter', 'carry'], shortStats: ['36 силы атаки', '30% скорости атаки', '333 здоровья'], passiveTitle: 'Spellblade', passiveText: 'После применения умения следующая автоатака наносит усиленный физический урон и помогает разгонять темп.', totalCost: 3333, combineCost: 733 },
  { id: 3089, name: 'Rabadon', tags: ['mage', 'ap'], shortStats: ['140 силы умений'], passiveTitle: 'Магический apex', passiveText: 'Резко увеличивает общий AP и превращает любой следующий spell rotation в серьезную угрозу.', totalCost: 3600, combineCost: 1050 },
  { id: 3094, name: 'Rapid Firecannon', tags: ['crit', 'marksman'], shortStats: ['35% скорости атаки', '25% шанса критического удара', '4% скорости передвижения'], passiveTitle: 'Наэлектризованный выстрел', passiveText: 'Периодически дает увеличенную дальность атаки и дополнительный магический урон по цели.', totalCost: 2600, combineCost: 600 },
  { id: 3107, name: 'Redemption', tags: ['support', 'utility'], shortStats: ['200 здоровья', '15 ускорения умений', '100% базового восстановления маны'], passiveTitle: 'Искупление', passiveText: 'Позволяет исцелить союзников по области и стабилизировать затяжную драку или осаду.', totalCost: 2300, combineCost: 500 },
  { id: 3110, name: 'Frozen Heart', tags: ['tank', 'armor'], shortStats: ['70 брони', '400 маны', '20 ускорения умений'], passiveTitle: 'Ледяное поле', passiveText: 'Снижает скорость атаки врагов рядом и режет эффективность физического DPS.', totalCost: 2500, combineCost: 500 },
  { id: 3153, name: 'Blade of the Ruined King', tags: ['fighter', 'duelist'], shortStats: ['40 силы атаки', '25% скорости атаки', '10% вампиризма'], passiveTitle: 'Похищение сущности', passiveText: 'Автоатаки наносят дополнительный урон от текущего здоровья цели и помогают выигрывать длинные дуэли.', totalCost: 3200, combineCost: 525 },
  { id: 3190, name: 'Locket', tags: ['support', 'tank'], shortStats: ['200 здоровья', '30 брони', '30 сопротивления магии'], passiveTitle: 'Защитная аура', passiveText: 'Дает команде щит по области и усиливает переживаемость в момент вражеского engage.', totalCost: 2200, combineCost: 400 },
  { id: 3508, name: 'Essence Reaver', tags: ['crit', 'marksman'], shortStats: ['65 силы атаки', '25% шанса критического удара', '20 ускорения умений'], passiveTitle: 'Чародейский клинок', passiveText: 'Следующая автоатака после умения наносит бонусный урон и возвращает ману при попадании.', totalCost: 3050, combineCost: 500 },
  { id: 4645, name: 'Shadowflame', tags: ['mage', 'burst'], shortStats: ['120 силы умений', '12 магического пробивания'], passiveTitle: 'Теневое прожигание', passiveText: 'Усиливает burst по хрупким целям и помогает быстрее пробивать слабую магическую защиту.', totalCost: 3200, combineCost: 850 },
  { id: 6333, name: 'Deaths Dance', tags: ['fighter', 'survivability'], shortStats: ['60 силы атаки', '15 ускорения умений', '50 брони'], passiveTitle: 'Презрение к боли', passiveText: 'Часть полученного урона откладывается во времени, а убийства помогают быстро стабилизировать HP.', totalCost: 3300, combineCost: 525 },
  { id: 6617, name: 'Moonstone', tags: ['support', 'healing'], shortStats: ['30 силы умений', '200 здоровья', '20 ускорения умений'], passiveTitle: 'Свет луны', passiveText: 'В затяжной драке постепенно усиливает лечение и щиты по союзникам.', totalCost: 2200, combineCost: 550 },
  { id: 6653, name: 'Liandry', tags: ['mage', 'burn'], shortStats: ['90 силы умений', '300 здоровья', '15 ускорения умений'], passiveTitle: 'Мучительное пламя', passiveText: 'Умения поджигают цель и особенно хорошо работают в длинных драках против плотных frontlines.', totalCost: 3000, combineCost: 800 },
  { id: 6655, name: 'Luden', tags: ['mage', 'burst'], shortStats: ['95 силы умений', '25 ускорения умений', '4% скорости передвижения'], passiveTitle: 'Эхо темпа', passiveText: 'Дает сильный мгновенный burst и дополнительную мобильность после попаданий умениями.', totalCost: 2900, combineCost: 600 },
  { id: 6665, name: 'JakSho', tags: ['tank', 'durability'], shortStats: ['350 здоровья', '45 брони', '45 сопротивления магии'], passiveTitle: 'Неумолимое поглощение', passiveText: 'Чем дольше длится бой, тем плотнее становится владелец, постепенно наращивая стойкость.', totalCost: 3200, combineCost: 700 },
  { id: 6672, name: 'Kraken Slayer', tags: ['marksman', 'carry'], shortStats: ['45 силы атаки', '40% скорости атаки', '4% скорости передвижения'], passiveTitle: 'Третий выстрел', passiveText: 'Каждая третья атака наносит дополнительный урон, ускоряя распил front-to-back драк.', totalCost: 3100, combineCost: 400 }
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

export const getItemIconUrl = (itemId: number) => `https://ddragon.leagueoflegends.com/cdn/${dragonVersion}/img/item/${itemId}.png`;
