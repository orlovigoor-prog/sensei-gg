import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { buildFoundationTestCaseCatalog, buildMatrixAssertions } from './foundation-test-case-catalog.mjs';
import { lolMetaSnapshot } from './lol-meta-snapshot.mjs';
import {
  accountSessionScenarioFixtures,
  foundationScenarioFixtures,
  foundationOrchestrationFixtures,
  foundationSyncMatrixFixtures
} from './foundation-test-case-fixtures.mjs';

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
const COUNTERPICK_DATABASE_PATH = path.resolve(process.cwd(), 'server/data/lol-counterpicks.json');
const CHAMPION_ROLE_MATRIX_PATH = path.resolve(process.cwd(), 'src/services/gameData/champion-role-matrix.json');
const API_KEY = process.env.AI_PROVIDER_API_KEY || '';
const API_URL = process.env.AI_PROVIDER_URL || 'https://api.deepseek.com/chat/completions';
const MODEL = process.env.AI_PROVIDER_MODEL || 'deepseek-chat';
const OPENROUTER_API_KEY = process.env.AI_OPENROUTER_API_KEY || '';
const OPENROUTER_URL = process.env.AI_OPENROUTER_URL || 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = process.env.AI_OPENROUTER_MODEL || 'deepseek/deepseek-v4-flash:free';
const RIOT_API_KEY = process.env.RIOT_API_KEY || '';
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

const accountSessionDevState = {
  authenticated: false,
  sessionTokenReady: false,
  accountId: null,
  scenario: 'env-default',
  updatedAt: new Date().toISOString()
};

const getEffectiveAccountSessionDevState = () => ({
  authenticated: Boolean(accountSessionDevState.authenticated),
  sessionTokenReady: Boolean(accountSessionDevState.sessionTokenReady),
  accountId: isNonEmptyString(accountSessionDevState.accountId) ? accountSessionDevState.accountId.trim() : null,
  scenario: isNonEmptyString(accountSessionDevState.scenario) ? accountSessionDevState.scenario.trim() : 'manual',
  updatedAt: accountSessionDevState.updatedAt
});

const getAccountSessionFoundationState = () => ({
  provider: 'overwolf-profile-session',
  configured: true,
  authenticated: getEffectiveAccountSessionDevState().authenticated,
  sessionTokenReady: getEffectiveAccountSessionDevState().sessionTokenReady,
  accountId: getEffectiveAccountSessionDevState().accountId,
  accountLinked: Boolean(getEffectiveAccountSessionDevState().authenticated && getEffectiveAccountSessionDevState().accountId),
  devState: getEffectiveAccountSessionDevState(),
  notes: [
    'Future production subscription sync should use authenticated Overwolf session identity.',
    'Session token generation and account lookup are represented here as local foundation scaffolding only.',
    'Premium persistence should not be treated as production-ready until authenticated identity and stable account linkage are both available.'
  ]
});

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
  const accountSession = getAccountSessionFoundationState();
  const aiHistory = getAiHistoryFoundationState();
  const premiumCapabilities = getPremiumCapabilitiesFoundationState();
  const accountLinkage = getAccountLinkageFoundationState();

  return {
    subscription,
    accountSession,
    aiHistory,
    premiumCapabilities,
    accountLinkage,
    readiness: {
      subscriptionReady: Boolean(subscription.integrationReady),
      identityAuthenticated: Boolean(accountSession.authenticated),
      sessionTokenReady: Boolean(accountSession.sessionTokenReady),
      accountIdPresent: Boolean(accountSession.accountId),
      accountLinkageSyncReady: Boolean(accountLinkage.syncReady),
      aiHistorySyncReady: Boolean(aiHistory.syncReady),
      progressionSyncReady: Boolean(premiumCapabilities.progression.syncReady),
      weeklyReportsSyncReady: Boolean(premiumCapabilities.weeklyReports.syncReady)
    },
    notes: [
      'This endpoint aggregates local foundation readiness for future Overwolf subscription test sessions.',
      'Subscription integration readiness depends on real store and premium plan configuration.',
      'Identity/session readiness depends on authenticated Overwolf profile state and session token availability.',
      'Account-linked persistence requires authenticated Overwolf identity wiring before production sync can be enabled.',
      'AI history, progression, and weekly reports remain local foundation scaffolding until production sync is implemented.'
    ]
  };
};

const getAccountSessionScenarioFixtureCatalog = () => ({
  fixtures: Object.entries(accountSessionScenarioFixtures).map(([name, value]) => ({
    name,
    authenticated: value.authenticated,
    sessionTokenReady: value.sessionTokenReady,
    accountId: value.accountId,
    scenario: value.scenario
  })),
  notes: [
    'Named identity/session presets are intended for local Overwolf subscription test preparation.',
    'Presets only affect local foundation scaffolding and do not represent a live Overwolf session.'
  ]
});

const applyAccountSessionScenarioFixture = (body) => {
  const presetName = isNonEmptyString(body?.preset) ? body.preset.trim() : null;
  const preset = presetName && Object.prototype.hasOwnProperty.call(accountSessionScenarioFixtures, presetName)
    ? accountSessionScenarioFixtures[presetName]
    : null;
  const source = preset ?? body;
  const updatedAt = new Date().toISOString();

  accountSessionDevState.authenticated = source?.authenticated === true;
  accountSessionDevState.sessionTokenReady = source?.sessionTokenReady === true;
  accountSessionDevState.accountId = isNonEmptyString(source?.accountId) ? source.accountId.trim() : null;
  accountSessionDevState.scenario = isNonEmptyString(source?.scenario) ? source.scenario.trim() : 'manual-override';
  accountSessionDevState.updatedAt = updatedAt;

  return {
    ok: true,
    preset: presetName,
    ...getEffectiveAccountSessionDevState()
  };
};

const getFoundationScenarioFixtureCatalog = () => ({
  fixtures: Object.entries(foundationScenarioFixtures).map(([name, value]) => ({
    name,
    plan: value.plan,
    progressionSyncReady: value.progressionSyncReady,
    weeklyReportsSyncReady: value.weeklyReportsSyncReady,
    accountLinkageSyncReady: value.accountLinkageSyncReady,
    identityAuthenticated: value.identityAuthenticated,
    sessionTokenReady: value.sessionTokenReady,
    accountId: value.accountId,
    scenario: value.scenario
  })),
  notes: [
    'Named fixtures are intended for local Overwolf subscription test sessions.',
    'Fixtures only affect local foundation scaffolding and do not represent live store state.'
  ]
});

const getFoundationOrchestrationFixtureCatalog = () => ({
  fixtures: Object.entries(foundationOrchestrationFixtures).map(([name, value]) => ({
    name,
    foundationPreset: value.foundationPreset,
    accountSessionPreset: value.accountSessionPreset,
    overrides: value.overrides ?? null,
    scenario: value.scenario
  })),
  notes: [
    'Orchestration presets apply multiple local foundation layers in one request.',
    'These scenarios are intended for backend/service preparation before future Overwolf subscription test sessions.'
  ]
});

const getFoundationSyncMatrixCatalog = () => ({
  fixtures: Object.entries(foundationSyncMatrixFixtures).map(([name, value]) => ({
    name,
    plan: value.plan,
    stage: value.stage,
    authenticated: value.authenticated,
    sessionTokenReady: value.sessionTokenReady,
    accountId: value.accountId,
    accountLinkageSyncReady: value.accountLinkageSyncReady,
    progressionSyncReady: value.progressionSyncReady,
    weeklyReportsSyncReady: value.weeklyReportsSyncReady,
    expectedReadiness: value.expectedReadiness,
    blockingReason: value.blockingReason,
    scenario: value.scenario
  })),
  notes: [
    'Sync matrix presets expose step-by-step readiness combinations for future automated Overwolf subscription tests.',
    'Each matrix entry updates only local foundation scaffolding and does not represent a live subscription backend state.'
  ]
});

const getFoundationTestCaseCatalog = () => {
  return buildFoundationTestCaseCatalog({
    foundationScenarioFixtures,
    foundationSyncMatrixFixtures,
    foundationOrchestrationFixtures,
    accountSessionScenarioFixtures
  });
};

const applyFoundationScenarioFixture = (body) => {
  const presetName = isNonEmptyString(body?.preset) ? body.preset.trim() : null;
  const preset = presetName && Object.prototype.hasOwnProperty.call(foundationScenarioFixtures, presetName)
    ? foundationScenarioFixtures[presetName]
    : null;
  const source = preset ? { ...preset, ...body } : body;
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

  accountSessionDevState.authenticated = source?.identityAuthenticated === true;
  accountSessionDevState.sessionTokenReady = source?.sessionTokenReady === true;
  accountSessionDevState.accountId = isNonEmptyString(source?.accountId) ? source.accountId.trim() : null;
  accountSessionDevState.scenario = scenario;
  accountSessionDevState.updatedAt = updatedAt;

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
    identityAuthenticated: accountSessionDevState.authenticated,
    sessionTokenReady: accountSessionDevState.sessionTokenReady,
    accountId: accountSessionDevState.accountId,
    updatedAt,
    diagnostics: getFoundationDiagnosticsState()
  };
};

const applyFoundationOrchestrationFixture = (body) => {
  const orchestrationName = isNonEmptyString(body?.orchestration) ? body.orchestration.trim() : null;
  const orchestration = orchestrationName && Object.prototype.hasOwnProperty.call(foundationOrchestrationFixtures, orchestrationName)
    ? foundationOrchestrationFixtures[orchestrationName]
    : null;

  if (!orchestration) {
    return {
      ok: false,
      error: 'Unknown foundation orchestration preset'
    };
  }

  const scenario = isNonEmptyString(body?.scenario) ? body.scenario.trim() : orchestration.scenario;
  const overrides = orchestration.overrides ?? null;

  const foundationResult = applyFoundationScenarioFixture({
    preset: orchestration.foundationPreset,
    accountLinkageSyncReady: overrides?.accountLinkageSyncReady,
    progressionSyncReady: overrides?.progressionSyncReady,
    weeklyReportsSyncReady: overrides?.weeklyReportsSyncReady,
    scenario
  });

  const accountSessionResult = applyAccountSessionScenarioFixture({
    preset: orchestration.accountSessionPreset,
    scenario
  });

  accountLinkageDevState.scenario = scenario;
  accountLinkageDevState.updatedAt = accountSessionResult.updatedAt;
  premiumCapabilitiesDevState.scenario = scenario;
  premiumCapabilitiesDevState.updatedAt = accountSessionResult.updatedAt;
  subscriptionDevState.scenario = scenario;
  subscriptionDevState.updatedAt = accountSessionResult.updatedAt;

  return {
    ok: true,
    orchestration: orchestrationName,
    foundationPreset: orchestration.foundationPreset,
    accountSessionPreset: orchestration.accountSessionPreset,
    scenario,
    plan: foundationResult.plan,
    progressionSyncReady: foundationResult.progressionSyncReady,
    weeklyReportsSyncReady: foundationResult.weeklyReportsSyncReady,
    accountLinkageSyncReady: foundationResult.accountLinkageSyncReady,
    identityAuthenticated: accountSessionResult.authenticated,
    sessionTokenReady: accountSessionResult.sessionTokenReady,
    accountId: accountSessionResult.accountId,
    updatedAt: accountSessionResult.updatedAt,
    diagnostics: getFoundationDiagnosticsState()
  };
};

const applyFoundationSyncMatrixFixture = (body) => {
  const matrixName = isNonEmptyString(body?.matrix) ? body.matrix.trim() : null;
  const matrixFixture = matrixName && Object.prototype.hasOwnProperty.call(foundationSyncMatrixFixtures, matrixName)
    ? foundationSyncMatrixFixtures[matrixName]
    : null;

  if (!matrixFixture) {
    return {
      ok: false,
      error: 'Unknown foundation sync matrix preset'
    };
  }

  const scenario = isNonEmptyString(body?.scenario) ? body.scenario.trim() : matrixFixture.scenario;
  const updatedAt = new Date().toISOString();

  subscriptionDevState.plan = matrixFixture.plan === 'premium' ? 'premium' : 'free';
  subscriptionDevState.scenario = scenario;
  subscriptionDevState.updatedAt = updatedAt;

  accountSessionDevState.authenticated = matrixFixture.authenticated === true;
  accountSessionDevState.sessionTokenReady = matrixFixture.sessionTokenReady === true;
  accountSessionDevState.accountId = isNonEmptyString(matrixFixture.accountId) ? matrixFixture.accountId.trim() : null;
  accountSessionDevState.scenario = scenario;
  accountSessionDevState.updatedAt = updatedAt;

  accountLinkageDevState.syncReady = matrixFixture.accountLinkageSyncReady === true;
  accountLinkageDevState.scenario = scenario;
  accountLinkageDevState.updatedAt = updatedAt;

  premiumCapabilitiesDevState.progressionSyncReady = matrixFixture.progressionSyncReady === true;
  premiumCapabilitiesDevState.weeklyReportsSyncReady = matrixFixture.weeklyReportsSyncReady === true;
  premiumCapabilitiesDevState.scenario = scenario;
  premiumCapabilitiesDevState.updatedAt = updatedAt;

  return {
    ok: true,
    matrix: matrixName,
    stage: matrixFixture.stage,
    scenario,
    plan: subscriptionDevState.plan,
    authenticated: accountSessionDevState.authenticated,
    sessionTokenReady: accountSessionDevState.sessionTokenReady,
    accountId: accountSessionDevState.accountId,
    accountLinkageSyncReady: accountLinkageDevState.syncReady,
    progressionSyncReady: premiumCapabilitiesDevState.progressionSyncReady,
    weeklyReportsSyncReady: premiumCapabilitiesDevState.weeklyReportsSyncReady,
    expectedReadiness: matrixFixture.expectedReadiness,
    blockingReason: matrixFixture.blockingReason,
    testAssertions: buildMatrixAssertions(matrixFixture),
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

  accountSessionDevState.authenticated = false;
  accountSessionDevState.sessionTokenReady = false;
  accountSessionDevState.accountId = null;
  accountSessionDevState.scenario = 'env-default';
  accountSessionDevState.updatedAt = updatedAt;

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
    identityAuthenticated: false,
    sessionTokenReady: false,
    accountId: null,
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

const formatGold = (value) => {
  if (!Number.isFinite(value) || value < 0) {
    return null;
  }

  return `${Math.round(value).toLocaleString('en-US')} G`;
};

let championIdNameMapCache = null;
let championIdNameMapCacheExpiresAt = 0;

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const normalizeMetaKey = (value) => isNonEmptyString(value) ? value.trim().toLowerCase().replace(/[^a-z0-9]/g, '') : '';

const roleAliases = {
  TOP: 'TOP',
  JUNGLE: 'JUNGLE',
  JG: 'JUNGLE',
  MID: 'MID',
  MIDDLE: 'MID',
  BOT: 'ADC',
  BOTTOM: 'ADC',
  ADC: 'ADC',
  SUPPORT: 'SUPPORT',
  SUP: 'SUPPORT',
  UTILITY: 'SUPPORT'
};

const normalizeMetaRole = (value) => {
  if (!isNonEmptyString(value)) {
    return null;
  }

  return roleAliases[value.trim().toUpperCase()] ?? null;
};

const findSnapshotChampionName = (championName, role) => {
  const normalizedChampion = normalizeMetaKey(championName);
  const roleSnapshot = lolMetaSnapshot.roles[role];

  if (!normalizedChampion || !roleSnapshot) {
    return null;
  }

  for (const champions of Object.values(roleSnapshot.tiers)) {
    const match = champions.find((candidate) => normalizeMetaKey(candidate) === normalizedChampion);
    if (match) {
      return match;
    }
  }

  return null;
};

const findSnapshotTier = (championName, role) => {
  const normalizedChampion = normalizeMetaKey(championName);
  const roleSnapshot = lolMetaSnapshot.roles[role];

  if (!normalizedChampion || !roleSnapshot) {
    return null;
  }

  for (const [tier, champions] of Object.entries(roleSnapshot.tiers)) {
    if (champions.some((candidate) => normalizeMetaKey(candidate) === normalizedChampion)) {
      return tier;
    }
  }

  return null;
};

const getSnapshotMatchup = (championName, role, rankBracket) => {
  const counterpickMatchup = getCounterpickDatabaseMatchup(championName, role, rankBracket);
  if (counterpickMatchup) {
    return counterpickMatchup;
  }

  const rankMatchups = lolMetaSnapshot.matchups[rankBracket] ?? lolMetaSnapshot.matchups['platinum-plus'];
  const roleMatchups = rankMatchups?.[role];
  const normalizedChampion = normalizeMetaKey(championName);

  if (!roleMatchups || !normalizedChampion) {
    return null;
  }

  const [, matchup] = Object.entries(roleMatchups).find(([candidate]) => normalizeMetaKey(candidate) === normalizedChampion) ?? [];
  return matchup ?? null;
};

const loadCounterpickDatabase = () => {
  try {
    return JSON.parse(fs.readFileSync(COUNTERPICK_DATABASE_PATH, 'utf8'));
  } catch {
    return null;
  }
};

const loadChampionRoleMatrix = () => {
  try {
    return JSON.parse(fs.readFileSync(CHAMPION_ROLE_MATRIX_PATH, 'utf8'));
  } catch {
    return [];
  }
};

const canChampionPlayMetaRole = (championName, role) => {
  const normalizedChampion = normalizeMetaKey(championName);
  const entry = loadChampionRoleMatrix().find((candidate) => normalizeMetaKey(candidate?.champion) === normalizedChampion);

  if (!entry) {
    return false;
  }

  return [...(entry.primaryRoles || []), ...(entry.secondaryRoles || [])].includes(role);
};

const normalizeRankBracketForCounterpicks = (rankBracket) => {
  const normalized = String(rankBracket || '').trim().toLowerCase().replace(/-/g, '_');

  if (normalized === 'platinum_plus' || normalized === 'platinumplus') {
    return 'platinum_plus';
  }

  if (normalized === 'diamond2_plus' || normalized === 'diamond2plus' || normalized === 'diamond_plus' || normalized === 'diamondplus') {
    return 'diamond_plus';
  }

  if (normalized === 'emerald_plus' || normalized === 'emeraldplus') {
    return 'emerald_plus';
  }

  return normalized || 'emerald_plus';
};

const getCounterpickDatabaseMatchup = (championName, role, rankBracket) => {
  const database = loadCounterpickDatabase();
  const normalizedChampion = normalizeMetaKey(championName);
  const normalizedRank = normalizeRankBracketForCounterpicks(rankBracket);

  if (!database?.champions || !normalizedChampion) {
    return null;
  }

  const [, championEntry] = Object.entries(database.champions).find(([candidateName, candidateEntry]) => (
    normalizeMetaKey(candidateName) === normalizedChampion || normalizeMetaKey(candidateEntry?.slug) === normalizedChampion
  )) ?? [];
  const roleEntry = championEntry?.roles?.[role];

  if (!roleEntry || !Array.isArray(roleEntry.counters) || roleEntry.counters.length === 0) {
    return null;
  }

  const entryRank = normalizeRankBracketForCounterpicks(roleEntry.rankBracket || database.defaultRankBracket);

  return {
    globalWinRate: Number.isFinite(roleEntry.globalWinRate) ? roleEntry.globalWinRate : null,
    overallMatches: Number.isFinite(roleEntry.overallMatches) ? roleEntry.overallMatches : null,
    sourcePatch: roleEntry.patchWindow || database.defaultPatchWindow || null,
    sampleLabel: roleEntry.sampleLabel || `${entryRank}, Ranked Solo/Duo`,
    rankBracket: entryRank || normalizedRank,
    sourceUpdatedAt: roleEntry.sourceUpdatedAt || database.updatedAt || null,
    counters: roleEntry.counters.map((counter) => ({
      champion: counter.champion,
      matchupWinRate: counter.matchupWinRate,
      matches: counter.matches,
      delta1: counter.delta1,
      delta2: counter.delta2,
      targetChampionWinRate: counter.targetChampionWinRate,
      allChampsWinRateVsCounter: counter.allChampsWinRateVsCounter
    })).filter((counter) => (
      isNonEmptyString(counter.champion)
      && Number.isFinite(counter.matchupWinRate)
      && canChampionPlayMetaRole(counter.champion, role)
    ))
  };
};

const buildChampionMetaInsight = (championName, role, rankBracket) => {
  const patchTier = findSnapshotTier(championName, role);
  const displayChampion = findSnapshotChampionName(championName, role) ?? championName;
  const matchup = getSnapshotMatchup(displayChampion, role, rankBracket);

  if (!patchTier && !matchup) {
    return null;
  }

  return {
    champion: displayChampion,
    role,
    rankBracket,
    rankLabel: rankBracket === 'platinum-plus' ? 'Platinum+' : lolMetaSnapshot.rankLabel,
    patchTier,
    patch: lolMetaSnapshot.patch,
    matchupPatch: matchup?.sourcePatch ?? null,
    sampleLabel: matchup?.sampleLabel ?? lolMetaSnapshot.rankLabel,
    globalWinRate: Number.isFinite(matchup?.globalWinRate) ? matchup.globalWinRate : null,
    overallMatches: Number.isFinite(matchup?.overallMatches) ? matchup.overallMatches : null,
    counters: Array.isArray(matchup?.counters) ? matchup.counters : []
  };
};

const handleLolMetaChampionInsight = (res, requestUrl) => {
  const champion = requestUrl.searchParams.get('champion');
  const role = normalizeMetaRole(requestUrl.searchParams.get('role'));
  const rankBracket = isNonEmptyString(requestUrl.searchParams.get('rank')) ? requestUrl.searchParams.get('rank').trim() : lolMetaSnapshot.rankBracket;

  if (!isNonEmptyString(champion) || !role) {
    sendJson(res, 400, { ok: false, error: 'champion and role query parameters are required' });
    return;
  }

  sendJson(res, 200, {
    ok: true,
    snapshot: {
      patch: lolMetaSnapshot.patch,
      rankBracket: lolMetaSnapshot.rankBracket,
      rankLabel: lolMetaSnapshot.rankLabel,
      updatedAt: lolMetaSnapshot.updatedAt
    },
    insight: buildChampionMetaInsight(champion, role, rankBracket)
  });
};

const handleLolMetaTierList = (res, requestUrl) => {
  const role = normalizeMetaRole(requestUrl.searchParams.get('role'));
  const roles = role ? { [role]: lolMetaSnapshot.roles[role] } : lolMetaSnapshot.roles;

  if (role && !lolMetaSnapshot.roles[role]) {
    sendJson(res, 404, { ok: false, error: 'Unknown role' });
    return;
  }

  sendJson(res, 200, {
    ok: true,
    patch: lolMetaSnapshot.patch,
    rankBracket: lolMetaSnapshot.rankBracket,
    rankLabel: lolMetaSnapshot.rankLabel,
    updatedAt: lolMetaSnapshot.updatedAt,
    roles
  });
};

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

const riotPlatformHosts = {
  ru: 'ru.api.riotgames.com',
  euw: 'euw1.api.riotgames.com',
  eune: 'eun1.api.riotgames.com',
  tr: 'tr1.api.riotgames.com',
  na: 'na1.api.riotgames.com',
  br: 'br1.api.riotgames.com',
  la1: 'la1.api.riotgames.com',
  la2: 'la2.api.riotgames.com',
  kr: 'kr.api.riotgames.com',
  jp: 'jp1.api.riotgames.com'
};

const riotAccountHosts = {
  ru: 'europe.api.riotgames.com',
  euw: 'europe.api.riotgames.com',
  eune: 'europe.api.riotgames.com',
  tr: 'europe.api.riotgames.com',
  na: 'americas.api.riotgames.com',
  br: 'americas.api.riotgames.com',
  la1: 'americas.api.riotgames.com',
  la2: 'americas.api.riotgames.com',
  kr: 'asia.api.riotgames.com',
  jp: 'asia.api.riotgames.com'
};

const normalizeRiotRegion = (value) => {
  if (!isNonEmptyString(value)) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(riotPlatformHosts, normalized) ? normalized : null;
};

const fetchRiotJson = async ({ host, pathname }) => {
  const response = await fetch(`https://${host}${pathname}`, {
    headers: {
      'X-Riot-Token': RIOT_API_KEY
    }
  });

  if (!response.ok) {
    const responseText = await response.text();
    let responseBody = null;

    if (isNonEmptyString(responseText)) {
      try {
        responseBody = JSON.parse(responseText);
      } catch {
        responseBody = responseText.trim();
      }
    }

    const error = new Error(`Riot API request failed with status ${response.status}`);
    error.statusCode = response.status;
    error.riotBody = responseBody;
    error.riotHost = host;
    error.riotPathname = pathname;
    throw error;
  }

  return response.json();
};

const fetchChampionIdNameMap = async () => {
  if (championIdNameMapCache && championIdNameMapCacheExpiresAt > Date.now()) {
    return championIdNameMapCache;
  }

  const response = await fetch('https://ddragon.leagueoflegends.com/cdn/14.10.1/data/en_US/champion.json');
  if (!response.ok) {
    throw new Error(`Champion catalog request failed with status ${response.status}`);
  }

  const data = await response.json();
  const championEntries = Object.values(data?.data || {});
  const championIdNameMap = championEntries.reduce((accumulator, champion) => {
    if (champion?.key && champion?.name) {
      accumulator[String(champion.key)] = champion.name;
    }

    return accumulator;
  }, {});

  championIdNameMapCache = championIdNameMap;
  championIdNameMapCacheExpiresAt = Date.now() + (1000 * 60 * 60 * 6);
  return championIdNameMapCache;
};

const normalizeProfileRecentMatch = (match, puuid) => {
  const participants = Array.isArray(match?.info?.participants) ? match.info.participants : [];
  const player = participants.find((participant) => participant?.puuid === puuid);

  if (!player) {
    return null;
  }

  const durationSeconds = Number(match?.info?.gameDuration || 0);
  const totalCs = Number(player.totalMinionsKilled || 0) + Number(player.neutralMinionsKilled || 0);
  const items = [player.item0, player.item1, player.item2, player.item3, player.item4, player.item5, player.item6]
    .filter((itemId) => Number.isFinite(itemId) && itemId > 0);
  const primaryRuneStyle = Array.isArray(player.perks?.styles) ? player.perks.styles[0] : null;
  const secondaryRuneStyle = Array.isArray(player.perks?.styles) ? player.perks.styles[1] : null;
  const keystoneSelection = Array.isArray(primaryRuneStyle?.selections) ? primaryRuneStyle.selections[0] : null;

  return {
    matchId: typeof match?.metadata?.matchId === 'string' ? match.metadata.matchId : null,
    champion: player.championName || 'Unknown Champion',
    queueId: Number.isFinite(match?.info?.queueId) ? match.info.queueId : null,
    result: player.win ? 'Победа' : 'Поражение',
    kda: `${Number(player.kills || 0)} / ${Number(player.deaths || 0)} / ${Number(player.assists || 0)}`,
    cs: totalCs,
    duration: formatDuration(durationSeconds) || '0:00',
    goldEarned: Number.isFinite(player.goldEarned) ? player.goldEarned : 0,
    goldLabel: formatGold(Number(player.goldEarned || 0)) || '0 G',
    items,
    summonerSpells: [player.summoner1Id, player.summoner2Id]
      .filter((spellId) => Number.isFinite(spellId) && spellId > 0),
    runes: {
      keystoneId: Number.isFinite(keystoneSelection?.perk) ? keystoneSelection.perk : null,
      primaryStyleId: Number.isFinite(primaryRuneStyle?.style) ? primaryRuneStyle.style : null,
      secondaryStyleId: Number.isFinite(secondaryRuneStyle?.style) ? secondaryRuneStyle.style : null
    }
  };
};

const buildChampionPoolFromMatches = (matches, puuid) => {
  const championStats = new Map();

  matches.forEach((match) => {
    const participants = Array.isArray(match?.info?.participants) ? match.info.participants : [];
    const player = participants.find((participant) => participant?.puuid === puuid);

    if (!player || !isNonEmptyString(player.championName)) {
      return;
    }

    const durationSeconds = Number(match?.info?.gameDuration || 0);
    const totalCs = Number(player.totalMinionsKilled || 0) + Number(player.neutralMinionsKilled || 0);
    const championName = player.championName.trim();
    const current = championStats.get(championName) || {
      champion: championName,
      games: 0,
      wins: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      totalCs: 0,
      totalDurationSeconds: 0,
      totalGoldEarned: 0
    };

    current.games += 1;
    current.wins += player.win ? 1 : 0;
    current.kills += Number(player.kills || 0);
    current.deaths += Number(player.deaths || 0);
    current.assists += Number(player.assists || 0);
    current.totalCs += totalCs;
    current.totalDurationSeconds += Math.max(0, durationSeconds);
    current.totalGoldEarned += Number(player.goldEarned || 0);

    championStats.set(championName, current);
  });

  return Array.from(championStats.values())
    .map((entry) => {
      const csPerMinute = entry.totalDurationSeconds > 0
        ? entry.totalCs / (entry.totalDurationSeconds / 60)
        : 0;
      const avgGold = entry.games > 0 ? entry.totalGoldEarned / entry.games : 0;

      return {
        champion: entry.champion,
        games: entry.games,
        winRate: entry.games > 0 ? Number(((entry.wins / entry.games) * 100).toFixed(1)) : 0,
        kda: `${(entry.kills / entry.games).toFixed(1)} / ${(entry.deaths / entry.games).toFixed(1)} / ${(entry.assists / entry.games).toFixed(1)}`,
        csPerMinute: Number(csPerMinute.toFixed(1)),
        averageGoldEarned: Math.round(avgGold),
        averageGoldLabel: formatGold(avgGold) || '0 G'
      };
    })
    .sort((left, right) => {
      if (right.games !== left.games) {
        return right.games - left.games;
      }

      return right.winRate - left.winRate;
    })
    .slice(0, 5);
};

const buildProfileSummaryFromMatches = (matches, puuid) => {
  let games = 0;
  let wins = 0;
  let kills = 0;
  let deaths = 0;
  let assists = 0;
  let totalCs = 0;
  let totalDurationSeconds = 0;
  let totalGoldEarned = 0;

  matches.forEach((match) => {
    const participants = Array.isArray(match?.info?.participants) ? match.info.participants : [];
    const player = participants.find((participant) => participant?.puuid === puuid);

    if (!player) {
      return;
    }

    const durationSeconds = Number(match?.info?.gameDuration || 0);
    games += 1;
    wins += player.win ? 1 : 0;
    kills += Number(player.kills || 0);
    deaths += Number(player.deaths || 0);
    assists += Number(player.assists || 0);
    totalCs += Number(player.totalMinionsKilled || 0) + Number(player.neutralMinionsKilled || 0);
    totalDurationSeconds += Math.max(0, durationSeconds);
    totalGoldEarned += Number(player.goldEarned || 0);
  });

  const csPerMinute = totalDurationSeconds > 0 ? totalCs / (totalDurationSeconds / 60) : 0;
  const averageGold = games > 0 ? totalGoldEarned / games : 0;

  return {
    games,
    wins,
    losses: Math.max(0, games - wins),
    winRate: games > 0 ? Number(((wins / games) * 100).toFixed(1)) : 0,
    averageKda: games > 0
      ? `${(kills / games).toFixed(1)} / ${(deaths / games).toFixed(1)} / ${(assists / games).toFixed(1)}`
      : '0.0 / 0.0 / 0.0',
    averageCs: games > 0 ? Number((totalCs / games).toFixed(1)) : 0,
    csPerMinute: Number(csPerMinute.toFixed(1)),
    averageGoldEarned: Math.round(averageGold),
    averageGoldLabel: formatGold(averageGold) || '0 G'
  };
};

const normalizeChampionMastery = (entry, championIdNameMap) => ({
  championId: Number(entry?.championId || 0),
  champion: championIdNameMap[String(entry?.championId || '')] || `Champion ${entry?.championId || 'Unknown'}`,
  championLevel: Number(entry?.championLevel || 0),
  championPoints: Number(entry?.championPoints || 0),
  lastPlayTime: Number(entry?.lastPlayTime || 0)
});

const handleRiotProfileSearch = async (req, res, requestUrl) => {
  if (!RIOT_API_KEY) {
    sendJson(res, 503, {
      ok: false,
      error: 'Riot API ключ не настроен на локальном backend.'
    });
    return;
  }

  const region = normalizeRiotRegion(requestUrl.searchParams.get('region'));
  const riotId = requestUrl.searchParams.get('riotId')?.trim() || '';

  if (!region) {
    sendJson(res, 400, {
      ok: false,
      error: 'Некорректный регион поиска.'
    });
    return;
  }

  if (!riotId) {
    sendJson(res, 400, {
      ok: false,
      error: 'Нужно указать Riot ID в формате Name#TAG.'
    });
    return;
  }

  const riotIdSeparatorIndex = riotId.lastIndexOf('#');
  const gameName = riotIdSeparatorIndex > 0 ? riotId.slice(0, riotIdSeparatorIndex).trim() : '';
  const tagLine = riotIdSeparatorIndex > 0 ? riotId.slice(riotIdSeparatorIndex + 1).trim() : '';

  if (!gameName || !tagLine) {
    sendJson(res, 400, {
      ok: false,
      error: 'Riot ID должен быть в формате Name#TAG.'
    });
    return;
  }

  const accountHost = riotAccountHosts[region];
  const platformHost = riotPlatformHosts[region];
  const matchHost = riotAccountHosts[region];

  try {
    const account = await fetchRiotJson({
      host: accountHost,
      pathname: `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
    });

    const summoner = await fetchRiotJson({
      host: platformHost,
      pathname: `/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(account.puuid)}`
    });

    let recentMatches = [];
    let championMasteries = [];
    let championPool = [];
    let profileSummary = null;

    try {
      const matchIds = await fetchRiotJson({
        host: matchHost,
        pathname: `/lol/match/v5/matches/by-puuid/${encodeURIComponent(account.puuid)}/ids?start=0&count=5`
      });

      if (Array.isArray(matchIds) && matchIds.length > 0) {
        const matchDetails = await Promise.all(
          matchIds.map((matchId) => fetchRiotJson({
            host: matchHost,
            pathname: `/lol/match/v5/matches/${encodeURIComponent(matchId)}`
          }))
        );

        recentMatches = matchDetails
          .map((match) => normalizeProfileRecentMatch(match, account.puuid))
          .filter(Boolean);
        championPool = buildChampionPoolFromMatches(matchDetails, account.puuid);
        profileSummary = buildProfileSummaryFromMatches(matchDetails, account.puuid);
      }
    } catch (error) {
      console.warn('Failed to fetch Riot match history for profile search:', error);
    }

    try {
      const [masteryEntries, championIdNameMap] = await Promise.all([
        fetchRiotJson({
          host: platformHost,
          pathname: `/lol/champion-mastery/v4/champion-masteries/by-puuid/${encodeURIComponent(account.puuid)}/top?count=5`
        }),
        fetchChampionIdNameMap()
      ]);

      if (Array.isArray(masteryEntries)) {
        championMasteries = masteryEntries.map((entry) => normalizeChampionMastery(entry, championIdNameMap));
      }
    } catch (error) {
      console.warn('Failed to fetch Riot champion mastery for profile search:', error);
    }

    let rankedStats = [];

    try {
      rankedStats = await fetchRiotJson({
        host: platformHost,
        pathname: `/lol/league/v4/entries/by-puuid/${encodeURIComponent(summoner.puuid)}`
      });
    } catch (error) {
      if (error?.statusCode !== 404) {
        throw error;
      }
    }

    const soloRank = Array.isArray(rankedStats)
      ? rankedStats.find((item) => item?.queueType === 'RANKED_SOLO_5x5') || null
      : null;

    sendJson(res, 200, {
      ok: true,
      region,
      summoner: {
        ...summoner,
        name: account.gameName || summoner.name
      },
      riotId: {
        gameName: account.gameName || gameName,
        tagLine: account.tagLine || tagLine
      },
      rankedStats: soloRank,
      recentMatches,
      championMasteries,
      championPool,
      profileSummary
    });
  } catch (error) {
    const statusCode = error?.statusCode;
    const riotBody = error?.riotBody;
    const riotStatusMessage = typeof riotBody?.status?.message === 'string'
      ? riotBody.status.message
      : typeof riotBody === 'string'
        ? riotBody
        : null;
    const diagnostics = {
      upstreamStatus: Number.isFinite(statusCode) ? statusCode : null,
      upstreamMessage: riotStatusMessage,
      requestRegion: region,
      requestRiotId: `${gameName}#${tagLine}`,
      requestPath: error?.riotPathname || null,
      requestHost: error?.riotHost || null
    };

    if (statusCode === 404) {
      sendJson(res, 404, {
        ok: false,
        error: 'Игрок не найден.',
        diagnostics
      });
      return;
    }

    if (statusCode === 401) {
      sendJson(res, 502, {
        ok: false,
        error: 'Riot API отклонил запрос без валидной авторизации. Проверь, что backend читает актуальный RIOT_API_KEY без лишних символов.',
        diagnostics
      });
      return;
    }

    if (statusCode === 403) {
      sendJson(res, 502, {
        ok: false,
        error: 'Riot API отклонил ключ. Обычно это invalid или blocked API key на стороне Riot.',
        diagnostics
      });
      return;
    }

    if (statusCode === 429) {
      sendJson(res, 429, {
        ok: false,
        error: 'Превышен лимит запросов Riot API. Подождите минуту.',
        diagnostics
      });
      return;
    }

    const message = error instanceof Error ? error.message : 'Unknown Riot API error';
    sendJson(res, 502, {
      ok: false,
      error: message,
      diagnostics
    });
  }
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

  const requestUrl = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);

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
      riotApiConfigured: Boolean(RIOT_API_KEY),
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

  if (req.method === 'GET' && requestUrl.pathname === '/api/riot/profile-search') {
    await handleRiotProfileSearch(req, res, requestUrl);
    return;
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/lol/meta/champion-insight') {
    handleLolMetaChampionInsight(res, requestUrl);
    return;
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/lol/meta/tier-list') {
    handleLolMetaTierList(res, requestUrl);
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

  if (req.method === 'GET' && req.url === '/api/subscription/foundation-orchestrations') {
    sendJson(res, 200, {
      ok: true,
      ...getFoundationOrchestrationFixtureCatalog()
    });
    return;
  }

  if (req.method === 'GET' && req.url === '/api/subscription/foundation-sync-matrix') {
    sendJson(res, 200, {
      ok: true,
      ...getFoundationSyncMatrixCatalog()
    });
    return;
  }

  if (req.method === 'GET' && req.url === '/api/subscription/foundation-test-cases') {
    try {
      sendJson(res, 200, {
        ok: true,
        ...getFoundationTestCaseCatalog()
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to build foundation test case catalog';
      sendJson(res, 500, { ok: false, error: message });
    }
    return;
  }

  if (req.method === 'GET' && req.url === '/api/account-session/config') {
    sendJson(res, 200, {
      ok: true,
      ...getAccountSessionFoundationState()
    });
    return;
  }

  if (req.method === 'GET' && req.url === '/api/account-session/dev-state') {
    sendJson(res, 200, {
      ok: true,
      ...getEffectiveAccountSessionDevState()
    });
    return;
  }

  if (req.method === 'GET' && req.url === '/api/account-session/presets') {
    sendJson(res, 200, {
      ok: true,
      ...getAccountSessionScenarioFixtureCatalog()
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/api/account-session/dev-state') {
    try {
      const body = await readJsonBody(req);

      sendJson(res, 200, {
        ...applyAccountSessionScenarioFixture(body)
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid account session dev state payload';
      sendJson(res, 400, { ok: false, error: message });
    }
    return;
  }

  if (req.method === 'DELETE' && req.url === '/api/account-session/dev-state') {
    accountSessionDevState.authenticated = false;
    accountSessionDevState.sessionTokenReady = false;
    accountSessionDevState.accountId = null;
    accountSessionDevState.scenario = 'env-default';
    accountSessionDevState.updatedAt = new Date().toISOString();

    sendJson(res, 200, {
      ok: true,
      ...getEffectiveAccountSessionDevState()
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

  if (req.method === 'POST' && req.url === '/api/subscription/foundation-orchestration') {
    try {
      const body = await readJsonBody(req);
      const response = applyFoundationOrchestrationFixture(body);
      sendJson(res, response.ok === false ? 400 : 200, response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid foundation orchestration payload';
      sendJson(res, 400, { ok: false, error: message });
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/api/subscription/foundation-sync-matrix') {
    try {
      const body = await readJsonBody(req);
      const response = applyFoundationSyncMatrixFixture(body);
      sendJson(res, response.ok === false ? 400 : 200, response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid foundation sync matrix payload';
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
  console.log(`Riot API configured: ${RIOT_API_KEY ? 'yes' : 'no'}`);
  console.log(`Subscription provider: ${SUBSCRIPTION_PROVIDER}`);
  console.log(`Subscription store configured: ${SUBSCRIPTION_STORE_ID ? 'yes' : 'no'}`);
  console.log(`Premium plan configured: ${Number.isFinite(SUBSCRIPTION_PREMIUM_PLAN_ID) && SUBSCRIPTION_PREMIUM_PLAN_ID > 0 ? 'yes' : 'no'}`);
  console.log(`Subscription dev plan: ${SUBSCRIPTION_DEV_PLAN}`);
});
