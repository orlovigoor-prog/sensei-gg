import type { PlayerInfo } from '../../store/lobbySlice';

export const mockCounterPool = [
  'Malphite',
  'Poppy',
  'Irelia',
  'Jax',
  'Renekton',
  'Trundle',
  'Rammus',
  'Morgana',
  'Brand',
  'Nautilus',
  'Lissandra',
  'Vex',
  'Cassiopeia',
  'Leona',
  'Zyra'
] as const;

export type ScenarioStyle = 'lane-bully' | 'scaling-carry' | 'playmaker' | 'teamfight-anchor' | 'utility';

export interface ChampionScenario {
  id: string;
  role: PlayerInfo['mainRole'];
  label: string;
  style: ScenarioStyle;
  champions: [string, string];
  reviewFocus: string;
  pressurePattern: string;
  buildTemplateId: string;
}

export const championScenarioCatalog: Record<PlayerInfo['mainRole'], ChampionScenario[]> = {
  TOP: [
    {
      id: 'top-lane-bully',
      role: 'TOP',
      label: 'Линия через ранний приоритет',
      style: 'lane-bully',
      champions: ['Renekton', 'Aatrox'],
      reviewFocus: 'важно быстро конвертировать сильную линию в плейты, wave-control и первый Herald setup',
      pressurePattern: 'сценарий ожидает давление до 14 минуты, а не пассивный скейл',
      buildTemplateId: 'top-bruiser-snowball'
    },
    {
      id: 'top-scaling-carry',
      role: 'TOP',
      label: 'Сайд-керри через 2-3 предмета',
      style: 'scaling-carry',
      champions: ['Camille', 'Fiora'],
      reviewFocus: 'матч читается через чистый side pressure, economy и осторожность до power-spike',
      pressurePattern: 'сценарий ожидает рост ценности к мидгейму и наказание за лишние смерти на сайде',
      buildTemplateId: 'top-duelist-scaling'
    },
    {
      id: 'top-teamfight-anchor',
      role: 'TOP',
      label: 'Фронтлайн и вход в тимфайт',
      style: 'teamfight-anchor',
      champions: ['Gnar', 'Jax'],
      reviewFocus: 'ценность строится вокруг тайминга первого входа и контроля пространства в драках',
      pressurePattern: 'сценарий ожидает либо полезный фронтлайн, либо стабильный threat в extended fight',
      buildTemplateId: 'top-teamfight-anchor'
    }
  ],
  JUNGLE: [
    {
      id: 'jungle-playmaker',
      role: 'JUNGLE',
      label: 'Ранний темп и розыгрыши по линиям',
      style: 'playmaker',
      champions: ['LeeSin', 'Vi'],
      reviewFocus: 'разбор должен смотреть на ранние окна, first move и конвертацию gank pressure в объекты',
      pressurePattern: 'сценарий ожидает активную карту, а не afk full clear без причины',
      buildTemplateId: 'jungle-playmaker'
    },
    {
      id: 'jungle-teamfight-anchor',
      role: 'JUNGLE',
      label: 'Инициация под командную драку',
      style: 'teamfight-anchor',
      champions: ['JarvanIV', 'Wukong'],
      reviewFocus: 'ценность идет через quality engage, timing around objectives и follow-up команды',
      pressurePattern: 'сценарий ожидает надежный старт драки и контроль river fights',
      buildTemplateId: 'jungle-teamfight-engage'
    },
    {
      id: 'jungle-scaling-carry',
      role: 'JUNGLE',
      label: 'Скейл через ресурсы леса',
      style: 'scaling-carry',
      champions: ['Viego', 'XinZhao'],
      reviewFocus: 'разбор должен учитывать gold curve, reset timing и наказание за потерю темпа перед objectives',
      pressurePattern: 'сценарий ожидает рост влияния после 1-2 completed items',
      buildTemplateId: 'jungle-carry-skirmish'
    }
  ],
  MID: [
    {
      id: 'mid-lane-bully',
      role: 'MID',
      label: 'Приоритет линии и burst threat',
      style: 'lane-bully',
      champions: ['Syndra', 'Vex'],
      reviewFocus: 'сильный мид должен давать lane control и первым двигаться в river fights',
      pressurePattern: 'сценарий ожидает приоритет линии и раннюю угрозу соло-ошибок врага',
      buildTemplateId: 'mid-burst-priority'
    },
    {
      id: 'mid-playmaker',
      role: 'MID',
      label: 'Пики для активных входов',
      style: 'playmaker',
      champions: ['Ahri', 'Sylas'],
      reviewFocus: 'ценность матча определяется качеством roam windows и синхроном с лесом',
      pressurePattern: 'сценарий ожидает proactive map plays, а не только static laning',
      buildTemplateId: 'mid-playmaker'
    },
    {
      id: 'mid-utility',
      role: 'MID',
      label: 'Темп команды через utility mid',
      style: 'utility',
      champions: ['Orianna', 'TwistedFate'],
      reviewFocus: 'разбор должен смотреть на качество move-first решений и how well champion amplified team plays',
      pressurePattern: 'сценарий ожидает ценность через setup, tempo и map coordination',
      buildTemplateId: 'mid-utility-control'
    }
  ],
  ADC: [
    {
      id: 'adc-lane-bully',
      role: 'ADC',
      label: 'Сильная bot lane до first base',
      style: 'lane-bully',
      champions: ['Lucian', 'Caitlyn'],
      reviewFocus: 'важно реализовать push, plate pressure и не терять tempo после выигранной линии',
      pressurePattern: 'сценарий ожидает доминирование линии и ранний контроль волны',
      buildTemplateId: 'adc-lane-bully'
    },
    {
      id: 'adc-scaling-carry',
      role: 'ADC',
      label: 'Гиперкерри на позднюю игру',
      style: 'scaling-carry',
      champions: ['Jinx', 'Zeri'],
      reviewFocus: 'разбор должен учитывать сохранение экономики, позиционку и выход на 2-3 item spike',
      pressurePattern: 'сценарий ожидает, что пик оживает через золото и аккуратные тимфайты',
      buildTemplateId: 'adc-hypercarry'
    },
    {
      id: 'adc-playmaker',
      role: 'ADC',
      label: 'Мобильный carry для драк',
      style: 'playmaker',
      champions: ["Kai'Sa", 'Xayah'],
      reviewFocus: 'матч читается через тайминг входа в драку, target selection и punish windows',
      pressurePattern: 'сценарий ожидает активный follow-up и самостоятельные combat windows',
      buildTemplateId: 'adc-mobile-carry'
    }
  ],
  SUPPORT: [
    {
      id: 'support-playmaker',
      role: 'SUPPORT',
      label: 'Инициация и early skirmish',
      style: 'playmaker',
      champions: ['Nautilus', 'Leona'],
      reviewFocus: 'разбор должен смотреть на quality engage, timing по vision и punish overstep',
      pressurePattern: 'сценарий ожидает активный контроль темпа снизу и на river setup',
      buildTemplateId: 'support-engage'
    },
    {
      id: 'support-teamfight-anchor',
      role: 'SUPPORT',
      label: 'Командный front-to-back setup',
      style: 'teamfight-anchor',
      champions: ['Thresh', 'Rakan'],
      reviewFocus: 'ценность идет через first contact, peel-or-engage choice и качество follow-up',
      pressurePattern: 'сценарий ожидает, что support задает структуру драки, а не просто присутствует',
      buildTemplateId: 'support-teamfight-utility'
    },
    {
      id: 'support-utility',
      role: 'SUPPORT',
      label: 'Сейв и усиление carry',
      style: 'utility',
      champions: ['Lulu', 'Milio'],
      reviewFocus: 'разбор должен оценивать tempo через peel, spacing и сохранение главного carry живым',
      pressurePattern: 'сценарий ожидает ценность через защиту, re-engage и качество utility spells',
      buildTemplateId: 'support-enchanter'
    }
  ]
};

export const getChampionScenariosByRole = (role: PlayerInfo['mainRole']) => championScenarioCatalog[role];

export const getChampionScenarioByChampion = (championName: string, role?: PlayerInfo['mainRole']) => {
  if (role) {
    return championScenarioCatalog[role].find((scenario) => scenario.champions.includes(championName));
  }

  return Object.values(championScenarioCatalog)
    .flat()
    .find((scenario) => scenario.champions.includes(championName));
};
