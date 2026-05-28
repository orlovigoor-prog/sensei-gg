export interface RuneLoadout {
  keystoneId?: number | null;
  primaryStyleId?: number | null;
  secondaryStyleId?: number | null;
}

const runeStyleIconPaths: Record<number, string> = {
  8000: 'Styles/7201_Precision.png',
  8100: 'Styles/7200_Domination.png',
  8200: 'Styles/7202_Sorcery.png',
  8300: 'Styles/7203_Whimsy.png',
  8400: 'Styles/7204_Resolve.png'
};

const runeStyleLabels: Record<number, string> = {
  8000: 'Точность',
  8100: 'Доминирование',
  8200: 'Колдовство',
  8300: 'Вдохновение',
  8400: 'Храбрость'
};

const keystoneIconPaths: Record<number, string> = {
  8005: 'Styles/Precision/PressTheAttack/PressTheAttack.png',
  8008: 'Styles/Precision/LethalTempo/LethalTempoTemp.png',
  8021: 'Styles/Precision/FleetFootwork/FleetFootwork.png',
  8010: 'Styles/Precision/Conqueror/Conqueror.png',
  8112: 'Styles/Domination/Electrocute/Electrocute.png',
  8124: 'Styles/Domination/Predator/Predator.png',
  8128: 'Styles/Domination/DarkHarvest/DarkHarvest.png',
  9923: 'Styles/Domination/HailOfBlades/HailOfBlades.png',
  8214: 'Styles/Sorcery/SummonAery/SummonAery.png',
  8229: 'Styles/Sorcery/ArcaneComet/ArcaneComet.png',
  8230: 'Styles/Sorcery/PhaseRush/PhaseRush.png',
  8351: 'Styles/Inspiration/GlacialAugment/GlacialAugment.png',
  8360: 'Styles/Inspiration/UnsealedSpellbook/UnsealedSpellbook.png',
  8369: 'Styles/Inspiration/FirstStrike/FirstStrike.png',
  8437: 'Styles/Resolve/GraspOfTheUndying/GraspOfTheUndying.png',
  8439: 'Styles/Resolve/VeteranAftershock/VeteranAftershock.png',
  8465: 'Styles/Resolve/Guardian/Guardian.png'
};

const keystoneLabels: Record<number, string> = {
  8005: 'Решительное наступление',
  8008: 'Смертельный темп',
  8021: 'Искусное лавирование',
  8010: 'Завоеватель',
  8112: 'Казнь электричеством',
  8124: 'Хищник',
  8128: 'Темная жатва',
  9923: 'Град клинков',
  8214: 'Призыв Пушинки',
  8229: 'Магическая комета',
  8230: 'Фазовый рывок',
  8351: 'Ледяное наращивание',
  8360: 'Раскрытая книга заклинаний',
  8369: 'Первый удар',
  8437: 'Хватка нежити',
  8439: 'Дрожь земли',
  8465: 'Страж'
};

const runeCdnBaseUrl = 'https://ddragon.leagueoflegends.com/cdn/img/perk-images';

export const getRuneStyleIconUrl = (styleId?: number | null) => {
  const iconPath = styleId ? runeStyleIconPaths[styleId] : undefined;
  return iconPath ? `${runeCdnBaseUrl}/${iconPath}` : null;
};

export const getRuneStyleLabel = (styleId?: number | null) => styleId ? runeStyleLabels[styleId] ?? `Ветка рун ${styleId}` : 'Ветка рун';

export const getKeystoneIconUrl = (keystoneId?: number | null, fallbackStyleId?: number | null) => {
  const iconPath = keystoneId ? keystoneIconPaths[keystoneId] : undefined;
  return iconPath ? `${runeCdnBaseUrl}/${iconPath}` : getRuneStyleIconUrl(fallbackStyleId);
};

export const getKeystoneLabel = (keystoneId?: number | null, fallbackStyleId?: number | null) => (
  keystoneId ? keystoneLabels[keystoneId] ?? `Ключевая руна ${keystoneId}` : getRuneStyleLabel(fallbackStyleId)
);

export const getDefaultRuneLoadout = (role?: string, championName?: string): RuneLoadout => {
  if (role === 'JUNGLE') {
    return { keystoneId: 8010, primaryStyleId: 8000, secondaryStyleId: 8100 };
  }

  if (role === 'ADC' || championName === 'Jinx' || championName === "Kai'Sa" || championName === 'Lucian') {
    return { keystoneId: 8021, primaryStyleId: 8000, secondaryStyleId: 8300 };
  }

  if (role === 'SUPPORT') {
    return { keystoneId: 8465, primaryStyleId: 8400, secondaryStyleId: 8300 };
  }

  if (role === 'MID') {
    return { keystoneId: 8112, primaryStyleId: 8100, secondaryStyleId: 8200 };
  }

  return { keystoneId: 8010, primaryStyleId: 8000, secondaryStyleId: 8400 };
};
