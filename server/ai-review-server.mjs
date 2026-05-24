import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const loadEnvFile = () => {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    return;
  }

  const raw = fs.readFileSync(envPath, 'utf8').replace(/^\uFEFF/, '');
  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) {
      return;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!key || process.env[key] !== undefined) {
      return;
    }

    process.env[key] = value;
  });
};

loadEnvFile();

const PORT = Number.parseInt(process.env.AI_REVIEW_PORT || '8787', 10);
const HOST = process.env.AI_REVIEW_HOST || '127.0.0.1';
const API_KEY = process.env.AI_PROVIDER_API_KEY || '';
const API_URL = process.env.AI_PROVIDER_URL || 'https://api.deepseek.com/chat/completions';
const MODEL = process.env.AI_PROVIDER_MODEL || 'deepseek-chat';
const OPENROUTER_API_KEY = process.env.AI_OPENROUTER_API_KEY || '';
const OPENROUTER_URL = process.env.AI_OPENROUTER_URL || 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = process.env.AI_OPENROUTER_MODEL || 'deepseek/deepseek-v4-flash:free';
const SUBSCRIPTION_PROVIDER = process.env.SUBSCRIPTION_PROVIDER || 'overwolf-tebex';
const SUBSCRIPTION_STORE_ID = process.env.OVERWOLF_SUBSCRIPTION_STORE_ID || '';
const SUBSCRIPTION_PREMIUM_PLAN_ID = Number.parseInt(process.env.OVERWOLF_SUBSCRIPTION_PREMIUM_PLAN_ID || '0', 10);
const SUBSCRIPTION_DEV_PLAN = process.env.SUBSCRIPTION_DEV_PLAN === 'premium' ? 'premium' : 'free';

const subscriptionDevState = {
  plan: SUBSCRIPTION_DEV_PLAN,
  scenario: 'env-default',
  updatedAt: new Date().toISOString()
};

const premiumCapabilitiesDevState = {
  progressionSyncReady: false,
  weeklyReportsSyncReady: false,
  scenario: 'env-default',
  updatedAt: new Date().toISOString()
};

const accountLinkageDevState = {
  syncReady: false,
  scenario: 'env-default',
  updatedAt: new Date().toISOString()
};

const getEffectiveAccountLinkageDevState = () => ({
  syncReady: Boolean(accountLinkageDevState.syncReady),
  scenario: isNonEmptyString(accountLinkageDevState.scenario) ? accountLinkageDevState.scenario.trim() : 'manual',
  updatedAt: accountLinkageDevState.updatedAt
});

const getAccountLinkageFoundationState = () => ({
  identityProvider: 'overwolf-user-profile',
  configured: true,
  syncReady: getEffectiveAccountLinkageDevState().syncReady,
  requiredForPremiumPersistence: true,
  scopes: {
    aiHistory: true,
    progression: true,
    weeklyReports: true
  },
  devState: getEffectiveAccountLinkageDevState(),
  notes: [
    'Premium persistence should be attached to a stable Overwolf user identity before production rollout.',
    'Current local foundation does not persist premium history or reports across authenticated accounts.',
    'Future production sync should link premium data to the authenticated Overwolf profile and entitlement state.'
  ]
});

const getAiHistoryFoundationState = () => ({
  persistence: 'local-client-foundation',
  syncReady: false,
  premiumRequired: true,
  notes: [
    'AI review history is currently stored locally on the client as a premium-ready foundation.',
    'Server-side sync and account-linked history are not enabled yet.',
    'Future production history should be attached to an authenticated Overwolf user identity.'
  ]
});

const getEffectivePremiumCapabilitiesDevState = () => ({
  progressionSyncReady: Boolean(premiumCapabilitiesDevState.progressionSyncReady),
  weeklyReportsSyncReady: Boolean(premiumCapabilitiesDevState.weeklyReportsSyncReady),
  scenario: isNonEmptyString(premiumCapabilitiesDevState.scenario) ? premiumCapabilitiesDevState.scenario.trim() : 'manual',
  updatedAt: premiumCapabilitiesDevState.updatedAt
});

const getPremiumCapabilitiesFoundationState = () => ({
  progression: {
    configured: true,
    persistence: 'local-client-foundation',
    syncReady: getEffectivePremiumCapabilitiesDevState().progressionSyncReady,
    premiumRequired: true
  },
  weeklyReports: {
    configured: true,
    persistence: 'local-client-foundation',
    syncReady: getEffectivePremiumCapabilitiesDevState().weeklyReportsSyncReady,
    premiumRequired: true
  },
  devState: getEffectivePremiumCapabilitiesDevState(),
  notes: [
    'Premium progression insights currently use local foundation scaffolding only.',
    'Weekly reports currently use local foundation scaffolding only.',
    'Production sync should be attached to authenticated Overwolf subscription identity before release.'
  ]
});

const buildSubscriptionEntitlements = (plan) => ({
  plan,
  features: {
    fullAiReview: true,
    unlimitedAiReviews: plan === 'premium',
    aiHistory: plan === 'premium',
    progressionInsights: plan === 'premium',
    weeklyReports: plan === 'premium'
  }
});

const getEffectiveSubscriptionDevState = () => ({
  plan: subscriptionDevState.plan === 'premium' ? 'premium' : 'free',
  scenario: isNonEmptyString(subscriptionDevState.scenario) ? subscriptionDevState.scenario.trim() : 'manual',
  updatedAt: subscriptionDevState.updatedAt
});

const getSubscriptionFoundationState = () => ({
  provider: SUBSCRIPTION_PROVIDER,
  integrationReady: Boolean(SUBSCRIPTION_STORE_ID) && Number.isFinite(SUBSCRIPTION_PREMIUM_PLAN_ID) && SUBSCRIPTION_PREMIUM_PLAN_ID > 0,
  storeIdConfigured: Boolean(SUBSCRIPTION_STORE_ID),
  premiumPlanConfigured: Number.isFinite(SUBSCRIPTION_PREMIUM_PLAN_ID) && SUBSCRIPTION_PREMIUM_PLAN_ID > 0,
  storeId: SUBSCRIPTION_STORE_ID || null,
  premiumPlanId: Number.isFinite(SUBSCRIPTION_PREMIUM_PLAN_ID) && SUBSCRIPTION_PREMIUM_PLAN_ID > 0 ? SUBSCRIPTION_PREMIUM_PLAN_ID : null,
  devPlan: getEffectiveSubscriptionDevState().plan,
  devScenario: getEffectiveSubscriptionDevState().scenario,
  devStateUpdatedAt: getEffectiveSubscriptionDevState().updatedAt,
  entitlements: buildSubscriptionEntitlements(getEffectiveSubscriptionDevState().plan),
  notes: [
    'Sensei GG plans to use the official Overwolf App Subscriptions API backed by Tebex.',
    'Client purchase and active-plan checks should use Overwolf session token flow.',
    'This local server currently exposes configuration and entitlement scaffolding for future integration.'
  ]
});

const getSubscriptionDiagnosticsState = () => ({
  provider: SUBSCRIPTION_PROVIDER,
  integrationReady: Boolean(SUBSCRIPTION_STORE_ID) && Number.isFinite(SUBSCRIPTION_PREMIUM_PLAN_ID) && SUBSCRIPTION_PREMIUM_PLAN_ID > 0,
  storeIdConfigured: Boolean(SUBSCRIPTION_STORE_ID),
  premiumPlanConfigured: Number.isFinite(SUBSCRIPTION_PREMIUM_PLAN_ID) && SUBSCRIPTION_PREMIUM_PLAN_ID > 0,
  storeId: SUBSCRIPTION_STORE_ID || null,
  premiumPlanId: Number.isFinite(SUBSCRIPTION_PREMIUM_PLAN_ID) && SUBSCRIPTION_PREMIUM_PLAN_ID > 0 ? SUBSCRIPTION_PREMIUM_PLAN_ID : null,
  devState: getEffectiveSubscriptionDevState(),
  entitlements: buildSubscriptionEntitlements(getEffectiveSubscriptionDevState().plan),
  overwolfTestReadiness: {
    manifestProfileApiRequired: true,
    storeConfigReady: Boolean(SUBSCRIPTION_STORE_ID),
    premiumPlanReady: Number.isFinite(SUBSCRIPTION_PREMIUM_PLAN_ID) && SUBSCRIPTION_PREMIUM_PLAN_ID > 0,
    localScenarioSwitchingAvailable: true
  },
  notes: [
    'Sensei GG plans to use the official Overwolf App Subscriptions API backed by Tebex.',
    'Client purchase and active-plan checks should use Overwolf session token flow.',
    'This local server currently exposes configuration and entitlement scaffolding for future integration.',
    'Use POST /api/subscription/dev-state to switch local free/premium scenarios before real Overwolf store tests.'
  ]
});

const getFoundationDiagnosticsState = () => {
  const subscription = getSubscriptionDiagnosticsState();
  const aiHistory = getAiHistoryFoundationState();
  const premiumCapabilities = getPremiumCapabilitiesFoundationState();
  const accountLinkage = getAccountLinkageFoundationState();

  return {
    subscription,
    aiHistory,
    premiumCapabilities,
    accountLinkage,
    readiness: {
      subscriptionReady: Boolean(subscription.integrationReady),
      accountLinkageSyncReady: Boolean(accountLinkage.syncReady),
      aiHistorySyncReady: Boolean(aiHistory.syncReady),
      progressionSyncReady: Boolean(premiumCapabilities.progression.syncReady),
      weeklyReportsSyncReady: Boolean(premiumCapabilities.weeklyReports.syncReady)
    },
    notes: [
      'This endpoint aggregates local foundation readiness for future Overwolf subscription test sessions.',
      'Subscription integration readiness depends on real store and premium plan configuration.',
      'Account-linked persistence requires authenticated Overwolf identity wiring before production sync can be enabled.',
      'AI history, progression, and weekly reports remain local foundation scaffolding until production sync is implemented.'
    ]
  };
};

const foundationScenarioFixtures = {
  'free-baseline': {
    plan: 'free',
    progressionSyncReady: false,
    weeklyReportsSyncReady: false,
    accountLinkageSyncReady: false,
    scenario: 'free-baseline'
  },
  'premium-local-ready': {
    plan: 'premium',
    progressionSyncReady: true,
    weeklyReportsSyncReady: true,
    accountLinkageSyncReady: false,
    scenario: 'premium-local-ready'
  },
  'premium-account-linked': {
    plan: 'premium',
    progressionSyncReady: true,
    weeklyReportsSyncReady: true,
    accountLinkageSyncReady: true,
    scenario: 'premium-account-linked'
  },
  'premium-partial-sync': {
    plan: 'premium',
    progressionSyncReady: true,
    weeklyReportsSyncReady: false,
    accountLinkageSyncReady: true,
    scenario: 'premium-partial-sync'
  }
};

const getFoundationScenarioFixtureCatalog = () => ({
  fixtures: Object.entries(foundationScenarioFixtures).map(([name, value]) => ({
    name,
    plan: value.plan,
    progressionSyncReady: value.progressionSyncReady,
    weeklyReportsSyncReady: value.weeklyReportsSyncReady,
    accountLinkageSyncReady: value.accountLinkageSyncReady,
    scenario: value.scenario
  })),
  notes: [
    'Named fixtures are intended for local Overwolf subscription test sessions.',
    'Fixtures only affect local foundation scaffolding and do not represent live store state.'
  ]
});

const applyFoundationScenarioFixture = (body) => {
  const presetName = isNonEmptyString(body?.preset) ? body.preset.trim() : null;
  const preset = presetName && Object.prototype.hasOwnProperty.call(foundationScenarioFixtures, presetName)
    ? foundationScenarioFixtures[presetName]
    : null;
  const source = preset ?? body;
  const resolvedPlan = source?.plan === 'premium' ? 'premium' : 'free';
  const scenario = isNonEmptyString(source?.scenario) ? source.scenario.trim() : 'fixture-override';
  const updatedAt = new Date().toISOString();

  subscriptionDevState.plan = resolvedPlan;
  subscriptionDevState.scenario = scenario;
  subscriptionDevState.updatedAt = updatedAt;

  premiumCapabilitiesDevState.progressionSyncReady = source?.progressionSyncReady === true;
  premiumCapabilitiesDevState.weeklyReportsSyncReady = source?.weeklyReportsSyncReady === true;
  premiumCapabilitiesDevState.scenario = scenario;
  premiumCapabilitiesDevState.updatedAt = updatedAt;

  accountLinkageDevState.syncReady = source?.accountLinkageSyncReady === true;
  accountLinkageDevState.scenario = scenario;
  accountLinkageDevState.updatedAt = updatedAt;

  return {
    ok: true,
    preset: presetName,
    scenario,
    plan: resolvedPlan,
    progressionSyncReady: premiumCapabilitiesDevState.progressionSyncReady,
    weeklyReportsSyncReady: premiumCapabilitiesDevState.weeklyReportsSyncReady,
    accountLinkageSyncReady: accountLinkageDevState.syncReady,
    updatedAt,
    diagnostics: getFoundationDiagnosticsState()
  };
};

const resetFoundationScenarioFixture = () => {
  const updatedAt = new Date().toISOString();

  subscriptionDevState.plan = SUBSCRIPTION_DEV_PLAN;
  subscriptionDevState.scenario = 'env-default';
  subscriptionDevState.updatedAt = updatedAt;

  premiumCapabilitiesDevState.progressionSyncReady = false;
  premiumCapabilitiesDevState.weeklyReportsSyncReady = false;
  premiumCapabilitiesDevState.scenario = 'env-default';
  premiumCapabilitiesDevState.updatedAt = updatedAt;

  accountLinkageDevState.syncReady = false;
  accountLinkageDevState.scenario = 'env-default';
  accountLinkageDevState.updatedAt = updatedAt;

  return {
    ok: true,
    scenario: 'env-default',
    plan: getEffectiveSubscriptionDevState().plan,
    progressionSyncReady: false,
    weeklyReportsSyncReady: false,
    accountLinkageSyncReady: false,
    updatedAt,
    diagnostics: getFoundationDiagnosticsState()
  };
};

const formatStructuredReview = ({ strength, risk, nextFocus, evidence }) => ({
  strength: strength.startsWith('Сильная сторона:') ? strength : `Сильная сторона: ${strength}`,
  risk: risk.startsWith('Главный риск:') ? risk : `Главный риск: ${risk}`,
  nextFocus: nextFocus.startsWith('Фокус на следующую игру:') ? nextFocus : `Фокус на следующую игру: ${nextFocus}`,
  evidence: evidence.startsWith('Факты матча:') ? evidence : `Факты матча: ${evidence}`
});

const reviewToText = (review) => [review.strength, review.risk, review.nextFocus, review.evidence].filter(Boolean).join('\n');

const formatDuration = (seconds) => {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }

  const totalSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const normalizeJsonCandidate = (value) => {
  if (!isNonEmptyString(value)) {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed.startsWith('```')) {
    const codeBlockMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    if (codeBlockMatch?.[1]) {
      return codeBlockMatch[1].trim();
    }
  }

  return trimmed;
};

const extractJsonObject = (value) => {
  const normalized = normalizeJsonCandidate(value);
  if (!normalized) {
    return null;
  }

  const firstBrace = normalized.indexOf('{');
  const lastBrace = normalized.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  return normalized.slice(firstBrace, lastBrace + 1);
};

const parseProviderReview = (rawContent) => {
  const jsonCandidate = extractJsonObject(rawContent);
  if (!jsonCandidate) {
    throw new Error('Provider did not return a JSON object');
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonCandidate);
  } catch (error) {
    throw new Error('Provider returned invalid JSON');
  }

  const strength = isNonEmptyString(parsed?.strength) ? parsed.strength.trim() : '';
  const risk = isNonEmptyString(parsed?.risk) ? parsed.risk.trim() : '';
  const nextFocus = isNonEmptyString(parsed?.nextFocus) ? parsed.nextFocus.trim() : '';
  const evidence = isNonEmptyString(parsed?.evidence) ? parsed.evidence.trim() : '';

  if (!strength || !risk || !nextFocus || !evidence) {
    throw new Error('Provider JSON is missing one or more required review fields');
  }

  return formatStructuredReview({ strength, risk, nextFocus, evidence });
};

const unsupportedClaimPatterns = [
  /после\s+\d+\s*мин/i,
  /до\s+\d+\s*мин/i,
  /позиц/i,
  /лейт/i,
  /поздн/i,
  /ранн/i,
  /объект/i,
  /дракон/i,
  /барон/i,
  /визи/i,
  /вард/i,
  /тауэр|башн/i,
  /роум/i,
  /макро/i
];

const hasUnsupportedClaim = (text) => {
  if (!isNonEmptyString(text)) {
    return false;
  }

  return unsupportedClaimPatterns.some((pattern) => pattern.test(text));
};

const guardProviderReview = (providerReview, fallbackReview) => {
  const strength = hasUnsupportedClaim(providerReview.strength) ? fallbackReview.strength : providerReview.strength;
  const risk = hasUnsupportedClaim(providerReview.risk) ? fallbackReview.risk : providerReview.risk;
  const nextFocus = hasUnsupportedClaim(providerReview.nextFocus) ? fallbackReview.nextFocus : providerReview.nextFocus;
  const evidence = hasUnsupportedClaim(providerReview.evidence) ? fallbackReview.evidence : providerReview.evidence;

  return formatStructuredReview({ strength, risk, nextFocus, evidence });
};

const sendJson = (res, statusCode, body) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(body));
};

const readJsonBody = async (req) => {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : null;
};

const createFallbackAnalysis = (payload) => {
  const match = payload?.match || {};
  const context = payload?.context || {};
  const championName = match.championName || 'Твой чемпион';
  const kills = Number(match.kills || 0);
  const deaths = Number(match.deaths || 0);
  const assists = Number(match.assists || 0);
  const cs = Number(match.cs || 0);
  const takedowns = Number(match.takedowns || kills + assists || 0);
  const kda = Number(match.kda || 0);
  const csPerMinute = Number.isFinite(Number(match.csPerMinute)) ? Number(match.csPerMinute) : null;
  const gameDurationSeconds = Number.isFinite(Number(match.gameDurationSeconds)) ? Number(match.gameDurationSeconds) : null;
  const durationLabel = typeof match.gameDurationLabel === 'string' && match.gameDurationLabel.trim().length > 0
    ? match.gameDurationLabel
    : formatDuration(gameDurationSeconds);
  const allyAverageWinRate = Number.isFinite(Number(context.allyAverageWinRate)) ? Number(context.allyAverageWinRate) : null;
  const enemyAverageWinRate = Number.isFinite(Number(context.enemyAverageWinRate)) ? Number(context.enemyAverageWinRate) : null;
  const delta = Number.isFinite(Number(context.delta)) ? Number(context.delta) : null;
  const highDeaths = deaths >= 7;
  const veryHighDeaths = deaths >= 10;
  const lowFarm = cs < 150;
  const strongFarm = cs >= 190;
  const teamPlay = assists >= kills;
  const carryTempo = kills >= 8 && deaths <= 4;
  const lowImpact = kills + assists <= 8;
  const longGame = (gameDurationSeconds ?? 0) >= 1800;
  const weakCsPerMinute = csPerMinute !== null && csPerMinute < 6;
  const strongCsPerMinute = csPerMinute !== null && csPerMinute >= 7;

  const strength = carryTempo
    ? `на ${championName} ты дал сильный личный темп и не развалил игру лишними смертями`
    : strongFarm && strongCsPerMinute && !highDeaths
      ? `на ${championName} ты сохранил экономику и не отдал игру частыми ошибками`
      : teamPlay && kda >= 3
      ? 'ты держался ближе к командной игре и не выпадал из общих розыгрышей'
      : kda >= 2.5
        ? 'ты удержал матч в playable-состоянии и не провалился по всем базовым метрикам сразу'
        : `на ${championName} у тебя был потенциал для большего давления, если снизить хаос в разменах`;

  const risk = veryHighDeaths
    ? 'слишком много смертей ломали любой накопленный перевес и постоянно сбрасывали темп'
    : weakCsPerMinute && longGame
      ? 'для такой длительности матча темп по фарму был слишком низким, поэтому золото приходило слишком неровно'
      : highDeaths
        ? 'частые смерти забирали у тебя право первым приходить на следующую волну или объект'
      : lowFarm && lowImpact
        ? 'ты дал мало золота и мало влияния одновременно, поэтому матч прошел без стабильной точки опоры'
    : lowFarm
      ? 'просадка по фарму обрезала темп к середине игры'
      : !teamPlay
        ? 'слишком много игры шло через личные входы, а не через синхрон с командой'
      : 'не хватило более чистой конвертации удачных эпизодов в устойчивое преимущество';

  const focus = veryHighDeaths
    ? 'в следующей игре обрежь риск: до 14 минуты входи только в очевидные драки с численным преимуществом или первым контролем.'
    : weakCsPerMinute
      ? 'в следующей игре держи ориентир не только на общий CS, но и на темп в минуту: не выпадай из фарма после каждой стычки.'
      : lowFarm
        ? 'в следующей игре добирай спокойный фарм между стычками, чтобы не проседать по золоту к mid game.'
      : !teamPlay
        ? 'в следующей игре привязывай свои входы к позиции саппорта или лесника, а не начинай размен первым без продолжения.'
      : 'в следующей игре после удачного файта сразу переводи темп в волну, башню или объект.';

  const teamContext = allyAverageWinRate !== null && enemyAverageWinRate !== null
    ? `По лобби ваша команда входила примерно с ${allyAverageWinRate}% среднего WR против ${enemyAverageWinRate}% у соперника${delta !== null && Math.abs(delta) >= 4 ? `, разница была около ${Math.abs(delta)} п.п.` : ''}.`
    : null;

  return formatStructuredReview({
    strength: `${strength}.`,
    risk: `${risk}.`,
    nextFocus: focus,
    evidence: `${championName}, ${kills}/${deaths}/${assists}, ${cs} CS, KDA ${kda.toFixed(1)}${csPerMinute !== null ? `, ${csPerMinute.toFixed(1)} CS/мин` : ''}${durationLabel ? `, длительность ${durationLabel}` : ''}, takedowns ${takedowns}.${teamContext ? ` ${teamContext}` : ''}`
  });
};

const buildPrompt = (payload) => ([
  'Ты coaching-модуль Sensei GG для League of Legends.',
  'Твоя задача: сделать краткий post-game review только по фактам из payload.',
  'Не выдумывай тайминги, объекты, урон, варды, lineup facts или hidden context, если их нет в payload.',
  'Никаких live-callouts и команд во время матча.',
  'Верни только JSON объект на русском языке без markdown.',
  'Поля JSON: strength, risk, nextFocus, evidence.',
  'strength должно начинаться с: Сильная сторона:',
  'risk должно начинаться с: Главный риск:',
  'nextFocus должно начинаться с: Фокус на следующую игру:',
  'evidence должно начинаться с: Факты матча:',
  'Если в payload есть csPerMinute, gameDurationSeconds, gameDurationLabel, takedowns или context.delta, используй их в разборе, но только по делу.',
  'Если данных мало, прямо оставайся в рамках того, что есть, и не достраивай скрытые причины.',
  'Тон: конкретный, спокойный, полезный, как у хорошего тренера без пафоса.',
  'Пиши так, чтобы игрок понял, что именно у него получилось и что исправить в следующей игре.',
  'Избегай общих фраз вроде "нужно играть лучше", "старайся аккуратнее" или "будь внимательнее" без опоры на конкретную метрику из payload.',
  'Если делаешь вывод, привязывай его к данным: KDA, смертям, CS, CS/мин, длительности, takedowns или разнице среднего WR по лобби.',
  'nextFocus должен быть одним конкретным и исполнимым фокусом на следующую игру, а не общим пожеланием.',
  'Не используй слова вроде "возможно", "наверное" или длинные оговорки. Либо опирайся на payload, либо не говори этого.',
  '',
  `Payload: ${JSON.stringify(payload)}`
].join('\n'));

const buildProviderMessages = (payload) => ([
  {
    role: 'system',
    content: 'Ты выдаешь только безопасный, factual и coaching-oriented post-game review для Sensei GG. Нельзя придумывать детали вне payload.'
  },
  {
    role: 'user',
    content: buildPrompt(payload)
  }
]);

const requestChatCompletion = async ({ url, apiKey, model, payload, extraHeaders = {} }) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...extraHeaders
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      messages: buildProviderMessages(payload)
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Provider error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const analysis = data?.choices?.[0]?.message?.content;

  if (typeof analysis !== 'string' || analysis.trim().length === 0) {
    throw new Error('Provider returned empty analysis');
  }

  return parseProviderReview(analysis);
};

const requestProviderReview = async (payload) => {
  return requestChatCompletion({
    url: API_URL,
    apiKey: API_KEY,
    model: MODEL,
    payload
  });
};

const requestOpenRouterReview = async (payload) => {
  return requestChatCompletion({
    url: OPENROUTER_URL,
    apiKey: OPENROUTER_API_KEY,
    model: OPENROUTER_MODEL,
    payload,
    extraHeaders: {
      'HTTP-Referer': 'https://github.com/orlovigoor-prog/sensei-gg',
      'X-Title': 'Sensei GG'
    }
  });
};

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    sendJson(res, 404, { error: 'Not found' });
    return;
  }

  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    sendJson(res, 200, {
      ok: true,
      providerConfigured: Boolean(API_KEY),
      model: MODEL,
      openRouterConfigured: Boolean(OPENROUTER_API_KEY),
      openRouterModel: OPENROUTER_MODEL,
      subscriptions: {
        provider: SUBSCRIPTION_PROVIDER,
        storeIdConfigured: Boolean(SUBSCRIPTION_STORE_ID),
        premiumPlanConfigured: Number.isFinite(SUBSCRIPTION_PREMIUM_PLAN_ID) && SUBSCRIPTION_PREMIUM_PLAN_ID > 0,
        devPlan: getEffectiveSubscriptionDevState().plan,
        devScenario: getEffectiveSubscriptionDevState().scenario
      },
      aiHistory: {
        persistence: getAiHistoryFoundationState().persistence,
        syncReady: getAiHistoryFoundationState().syncReady,
        premiumRequired: getAiHistoryFoundationState().premiumRequired
      },
      premiumCapabilities: {
        progressionSyncReady: getEffectivePremiumCapabilitiesDevState().progressionSyncReady,
        weeklyReportsSyncReady: getEffectivePremiumCapabilitiesDevState().weeklyReportsSyncReady,
        scenario: getEffectivePremiumCapabilitiesDevState().scenario
      }
    });
    return;
  }

  if (req.method === 'GET' && req.url === '/api/subscription/config') {
    sendJson(res, 200, getSubscriptionFoundationState());
    return;
  }

  if (req.method === 'GET' && req.url === '/api/subscription/entitlements') {
    sendJson(res, 200, {
      ok: true,
      source: 'local-dev-foundation',
      ...buildSubscriptionEntitlements(getEffectiveSubscriptionDevState().plan)
    });
    return;
  }

  if (req.method === 'GET' && req.url === '/api/subscription/dev-state') {
    sendJson(res, 200, {
      ok: true,
      ...getEffectiveSubscriptionDevState(),
      entitlements: buildSubscriptionEntitlements(getEffectiveSubscriptionDevState().plan)
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/api/subscription/dev-state') {
    try {
      const body = await readJsonBody(req);
      const plan = body?.plan === 'premium' ? 'premium' : 'free';
      const scenario = isNonEmptyString(body?.scenario) ? body.scenario.trim() : 'manual-override';

      subscriptionDevState.plan = plan;
      subscriptionDevState.scenario = scenario;
      subscriptionDevState.updatedAt = new Date().toISOString();

      sendJson(res, 200, {
        ok: true,
        ...getEffectiveSubscriptionDevState(),
        entitlements: buildSubscriptionEntitlements(getEffectiveSubscriptionDevState().plan)
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid dev subscription state payload';
      sendJson(res, 400, { ok: false, error: message });
    }
    return;
  }

  if (req.method === 'DELETE' && req.url === '/api/subscription/dev-state') {
    subscriptionDevState.plan = SUBSCRIPTION_DEV_PLAN;
    subscriptionDevState.scenario = 'env-default';
    subscriptionDevState.updatedAt = new Date().toISOString();

    sendJson(res, 200, {
      ok: true,
      ...getEffectiveSubscriptionDevState(),
      entitlements: buildSubscriptionEntitlements(getEffectiveSubscriptionDevState().plan)
    });
    return;
  }

  if (req.method === 'GET' && req.url === '/api/subscription/diagnostics') {
    sendJson(res, 200, {
      ok: true,
      ...getSubscriptionDiagnosticsState()
    });
    return;
  }

  if (req.method === 'GET' && req.url === '/api/subscription/foundation-diagnostics') {
    sendJson(res, 200, {
      ok: true,
      ...getFoundationDiagnosticsState()
    });
    return;
  }

  if (req.method === 'GET' && req.url === '/api/subscription/foundation-fixtures') {
    sendJson(res, 200, {
      ok: true,
      ...getFoundationScenarioFixtureCatalog()
    });
    return;
  }

  if (req.method === 'GET' && req.url === '/api/premium-persistence/config') {
    sendJson(res, 200, {
      ok: true,
      ...getAccountLinkageFoundationState()
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/api/subscription/foundation-fixture') {
    try {
      const body = await readJsonBody(req);
      sendJson(res, 200, applyFoundationScenarioFixture(body));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid foundation fixture payload';
      sendJson(res, 400, { ok: false, error: message });
    }
    return;
  }

  if (req.method === 'DELETE' && req.url === '/api/subscription/foundation-fixture') {
    sendJson(res, 200, resetFoundationScenarioFixture());
    return;
  }

  if (req.method === 'GET' && req.url === '/api/review-history/config') {
    sendJson(res, 200, {
      ok: true,
      ...getAiHistoryFoundationState()
    });
    return;
  }

  if (req.method === 'GET' && req.url === '/api/premium-capabilities/config') {
    sendJson(res, 200, {
      ok: true,
      ...getPremiumCapabilitiesFoundationState()
    });
    return;
  }

  if (req.method === 'GET' && req.url === '/api/premium-capabilities/dev-state') {
    sendJson(res, 200, {
      ok: true,
      ...getEffectivePremiumCapabilitiesDevState()
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/api/premium-capabilities/dev-state') {
    try {
      const body = await readJsonBody(req);

      premiumCapabilitiesDevState.progressionSyncReady = body?.progressionSyncReady === true;
      premiumCapabilitiesDevState.weeklyReportsSyncReady = body?.weeklyReportsSyncReady === true;
      premiumCapabilitiesDevState.scenario = isNonEmptyString(body?.scenario) ? body.scenario.trim() : 'manual-override';
      premiumCapabilitiesDevState.updatedAt = new Date().toISOString();

      sendJson(res, 200, {
        ok: true,
        ...getEffectivePremiumCapabilitiesDevState()
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid premium capabilities dev state payload';
      sendJson(res, 400, { ok: false, error: message });
    }
    return;
  }

  if (req.method === 'DELETE' && req.url === '/api/premium-capabilities/dev-state') {
    premiumCapabilitiesDevState.progressionSyncReady = false;
    premiumCapabilitiesDevState.weeklyReportsSyncReady = false;
    premiumCapabilitiesDevState.scenario = 'env-default';
    premiumCapabilitiesDevState.updatedAt = new Date().toISOString();

    sendJson(res, 200, {
      ok: true,
      ...getEffectivePremiumCapabilitiesDevState()
    });
    return;
  }

  if (req.method !== 'POST' || req.url !== '/api/review') {
    sendJson(res, 404, { error: 'Not found' });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const payload = body?.payload;

    if (!payload?.match) {
      sendJson(res, 400, { error: 'Missing payload.match' });
      return;
    }

    const fallbackReview = createFallbackAnalysis(payload);
    let review = fallbackReview;
    let source = 'local-server-fallback';

    if (API_KEY) {
      try {
        const providerReview = await requestProviderReview(payload);
        review = guardProviderReview(providerReview, fallbackReview);
        source = 'provider';
      } catch (error) {
        console.warn('Primary provider failed, trying OpenRouter backup:', error);

        if (OPENROUTER_API_KEY) {
          try {
            const openRouterReview = await requestOpenRouterReview(payload);
            review = guardProviderReview(openRouterReview, fallbackReview);
            source = 'provider';
          } catch (openRouterError) {
            console.warn('OpenRouter backup failed, fallback to local server review:', openRouterError);
          }
        }
      }
    } else if (OPENROUTER_API_KEY) {
      try {
        const openRouterReview = await requestOpenRouterReview(payload);
        review = guardProviderReview(openRouterReview, fallbackReview);
        source = 'provider';
      } catch (error) {
        console.warn('OpenRouter backup failed, fallback to local server review:', error);
      }
    }

    sendJson(res, 200, {
      review,
      analysis: reviewToText(review),
      source
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    sendJson(res, 500, { error: message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Sensei AI review server listening on http://${HOST}:${PORT}`);
  console.log(`Primary provider configured: ${API_KEY ? 'yes' : 'no'}`);
  console.log(`OpenRouter backup configured: ${OPENROUTER_API_KEY ? 'yes' : 'no'}`);
  console.log(`Subscription provider: ${SUBSCRIPTION_PROVIDER}`);
  console.log(`Subscription store configured: ${SUBSCRIPTION_STORE_ID ? 'yes' : 'no'}`);
  console.log(`Premium plan configured: ${Number.isFinite(SUBSCRIPTION_PREMIUM_PLAN_ID) && SUBSCRIPTION_PREMIUM_PLAN_ID > 0 ? 'yes' : 'no'}`);
  console.log(`Subscription dev plan: ${SUBSCRIPTION_DEV_PLAN}`);
});
