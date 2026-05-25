export const accountSessionScenarioFixtures = {
  'identity-anonymous': {
    authenticated: false,
    sessionTokenReady: false,
    accountId: null,
    scenario: 'identity-anonymous'
  },
  'identity-authenticated-no-token': {
    authenticated: true,
    sessionTokenReady: false,
    accountId: 'ow-dev-user-001',
    scenario: 'identity-authenticated-no-token'
  },
  'identity-session-ready': {
    authenticated: true,
    sessionTokenReady: true,
    accountId: 'ow-dev-user-001',
    scenario: 'identity-session-ready'
  },
  'identity-session-alt-account': {
    authenticated: true,
    sessionTokenReady: true,
    accountId: 'ow-dev-user-qa-002',
    scenario: 'identity-session-alt-account'
  }
};

export const foundationScenarioFixtures = {
  'free-baseline': {
    plan: 'free',
    progressionSyncReady: false,
    weeklyReportsSyncReady: false,
    accountLinkageSyncReady: false,
    identityAuthenticated: false,
    sessionTokenReady: false,
    accountId: null,
    scenario: 'free-baseline'
  },
  'premium-local-ready': {
    plan: 'premium',
    progressionSyncReady: true,
    weeklyReportsSyncReady: true,
    accountLinkageSyncReady: false,
    identityAuthenticated: false,
    sessionTokenReady: false,
    accountId: null,
    scenario: 'premium-local-ready'
  },
  'premium-account-linked': {
    plan: 'premium',
    progressionSyncReady: true,
    weeklyReportsSyncReady: true,
    accountLinkageSyncReady: true,
    identityAuthenticated: true,
    sessionTokenReady: true,
    accountId: 'ow-dev-user-001',
    scenario: 'premium-account-linked'
  },
  'premium-partial-sync': {
    plan: 'premium',
    progressionSyncReady: true,
    weeklyReportsSyncReady: false,
    accountLinkageSyncReady: true,
    identityAuthenticated: true,
    sessionTokenReady: true,
    accountId: 'ow-dev-user-001',
    scenario: 'premium-partial-sync'
  }
};

export const foundationOrchestrationFixtures = {
  'identity-session-ready-baseline': {
    foundationPreset: 'free-baseline',
    accountSessionPreset: 'identity-session-ready',
    scenario: 'identity-session-ready-baseline'
  },
  'premium-account-linked-ready': {
    foundationPreset: 'premium-account-linked',
    accountSessionPreset: 'identity-session-ready',
    scenario: 'premium-account-linked-ready'
  },
  'premium-partial-sync-ready': {
    foundationPreset: 'premium-partial-sync',
    accountSessionPreset: 'identity-session-ready',
    scenario: 'premium-partial-sync-ready'
  },
  'premium-alt-account-linked': {
    foundationPreset: 'premium-account-linked',
    accountSessionPreset: 'identity-session-alt-account',
    scenario: 'premium-alt-account-linked'
  },
  'account-linkage-dry-run': {
    foundationPreset: 'free-baseline',
    accountSessionPreset: 'identity-session-ready',
    scenario: 'account-linkage-dry-run',
    overrides: {
      accountLinkageSyncReady: true
    }
  },
  'persistence-readiness-dry-run': {
    foundationPreset: 'premium-local-ready',
    accountSessionPreset: 'identity-session-ready',
    scenario: 'persistence-readiness-dry-run',
    overrides: {
      accountLinkageSyncReady: true,
      progressionSyncReady: false,
      weeklyReportsSyncReady: false
    }
  },
  'identity-authenticated-token-pending': {
    foundationPreset: 'free-baseline',
    accountSessionPreset: 'identity-authenticated-no-token',
    scenario: 'identity-authenticated-token-pending',
    overrides: {
      accountLinkageSyncReady: false
    }
  }
};

export const foundationSyncMatrixFixtures = {
  'identity-missing': {
    plan: 'free',
    authenticated: false,
    sessionTokenReady: false,
    accountId: null,
    accountLinkageSyncReady: false,
    progressionSyncReady: false,
    weeklyReportsSyncReady: false,
    scenario: 'identity-missing',
    stage: 'identity',
    expectedReadiness: {
      identityAuthenticated: false,
      sessionTokenReady: false,
      accountIdPresent: false,
      accountLinkageSyncReady: false,
      progressionSyncReady: false,
      weeklyReportsSyncReady: false
    },
    blockingReason: 'overwolf-identity-missing'
  },
  'identity-only': {
    plan: 'free',
    authenticated: true,
    sessionTokenReady: false,
    accountId: 'ow-dev-user-001',
    accountLinkageSyncReady: false,
    progressionSyncReady: false,
    weeklyReportsSyncReady: false,
    scenario: 'identity-only',
    stage: 'session-token',
    expectedReadiness: {
      identityAuthenticated: true,
      sessionTokenReady: false,
      accountIdPresent: true,
      accountLinkageSyncReady: false,
      progressionSyncReady: false,
      weeklyReportsSyncReady: false
    },
    blockingReason: 'session-token-missing'
  },
  'token-ready': {
    plan: 'free',
    authenticated: true,
    sessionTokenReady: true,
    accountId: 'ow-dev-user-001',
    accountLinkageSyncReady: false,
    progressionSyncReady: false,
    weeklyReportsSyncReady: false,
    scenario: 'token-ready',
    stage: 'account-linkage',
    expectedReadiness: {
      identityAuthenticated: true,
      sessionTokenReady: true,
      accountIdPresent: true,
      accountLinkageSyncReady: false,
      progressionSyncReady: false,
      weeklyReportsSyncReady: false
    },
    blockingReason: 'account-linkage-pending'
  },
  'linkage-ready': {
    plan: 'free',
    authenticated: true,
    sessionTokenReady: true,
    accountId: 'ow-dev-user-001',
    accountLinkageSyncReady: true,
    progressionSyncReady: false,
    weeklyReportsSyncReady: false,
    scenario: 'linkage-ready',
    stage: 'premium-capabilities',
    expectedReadiness: {
      identityAuthenticated: true,
      sessionTokenReady: true,
      accountIdPresent: true,
      accountLinkageSyncReady: true,
      progressionSyncReady: false,
      weeklyReportsSyncReady: false
    },
    blockingReason: 'premium-capability-sync-pending'
  },
  'progression-ready': {
    plan: 'premium',
    authenticated: true,
    sessionTokenReady: true,
    accountId: 'ow-dev-user-001',
    accountLinkageSyncReady: true,
    progressionSyncReady: true,
    weeklyReportsSyncReady: false,
    scenario: 'progression-ready',
    stage: 'weekly-reports',
    expectedReadiness: {
      identityAuthenticated: true,
      sessionTokenReady: true,
      accountIdPresent: true,
      accountLinkageSyncReady: true,
      progressionSyncReady: true,
      weeklyReportsSyncReady: false
    },
    blockingReason: 'weekly-reports-sync-pending'
  },
  'weekly-ready': {
    plan: 'premium',
    authenticated: true,
    sessionTokenReady: true,
    accountId: 'ow-dev-user-001',
    accountLinkageSyncReady: true,
    progressionSyncReady: false,
    weeklyReportsSyncReady: true,
    scenario: 'weekly-ready',
    stage: 'progression',
    expectedReadiness: {
      identityAuthenticated: true,
      sessionTokenReady: true,
      accountIdPresent: true,
      accountLinkageSyncReady: true,
      progressionSyncReady: false,
      weeklyReportsSyncReady: true
    },
    blockingReason: 'progression-sync-pending'
  },
  'full-sync-ready': {
    plan: 'premium',
    authenticated: true,
    sessionTokenReady: true,
    accountId: 'ow-dev-user-001',
    accountLinkageSyncReady: true,
    progressionSyncReady: true,
    weeklyReportsSyncReady: true,
    scenario: 'full-sync-ready',
    stage: 'complete',
    expectedReadiness: {
      identityAuthenticated: true,
      sessionTokenReady: true,
      accountIdPresent: true,
      accountLinkageSyncReady: true,
      progressionSyncReady: true,
      weeklyReportsSyncReady: true
    },
    blockingReason: null
  }
};
