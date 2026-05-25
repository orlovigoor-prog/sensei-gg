const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const includesAll = (source, expectedValues) => expectedValues.every((value) => Array.isArray(source) && source.includes(value));

const foundationAutomationPhaseByType = {
  fixture: 'fixture-baseline',
  'sync-matrix': 'sync-gates',
  orchestration: 'orchestration-integration'
};

const foundationStageOrder = {
  identity: 0,
  'session-token': 1,
  'account-linkage': 2,
  'premium-capabilities': 3,
  progression: 4,
  'weekly-reports': 5,
  complete: 6
};

export const foundationRepresentativeSelectionDescriptors = [
  {
    verificationRole: 'matrix-premium-fixture',
    bundleFamily: 'fixture',
    stage: 'complete',
    recommendedFor: ['premium-path-validation'],
    covers: ['ready-state-validation']
  },
  {
    verificationRole: 'matrix-session-gate',
    bundleFamily: 'sync-matrix',
    stage: 'session-token',
    recommendedFor: ['readiness-gate-regression'],
    covers: ['identity-gating']
  },
  {
    verificationRole: 'matrix-orchestration-readiness-gate',
    bundleFamily: 'orchestration',
    stage: 'premium-capabilities',
    recommendedFor: ['cross-layer-integration', 'free-path-validation'],
    covers: ['premium-readiness-gating']
  }
];

export const buildMatrixAssertions = (fixture) => {
  const plan = fixture?.plan === 'premium' ? 'premium' : 'free';
  const identityAuthenticated = fixture?.authenticated === true;
  const sessionTokenReady = fixture?.sessionTokenReady === true;
  const accountIdPresent = isNonEmptyString(fixture?.accountId);
  const accountLinkageSyncReady = fixture?.accountLinkageSyncReady === true;
  const progressionSyncReady = fixture?.progressionSyncReady === true;
  const weeklyReportsSyncReady = fixture?.weeklyReportsSyncReady === true;

  return {
    entitlements: {
      plan,
      hasFullAiReview: true,
      hasUnlimitedAiReviews: plan === 'premium',
      hasAiHistoryAccess: plan === 'premium',
      hasProgressionAccess: plan === 'premium',
      hasWeeklyReports: plan === 'premium'
    },
    purchaseAvailability: {
      canOpenPurchaseFlow: false,
      reason: 'premium-plan-not-configured',
      integrationReady: false
    },
    persistenceEligibility: {
      accountLinkageEligible: identityAuthenticated && sessionTokenReady && accountIdPresent,
      premiumPersistenceEligible: identityAuthenticated && sessionTokenReady && accountIdPresent && accountLinkageSyncReady,
      progressionSyncEligible: plan === 'premium' && identityAuthenticated && sessionTokenReady && accountIdPresent && accountLinkageSyncReady,
      weeklyReportsSyncEligible: plan === 'premium' && identityAuthenticated && sessionTokenReady && accountIdPresent && accountLinkageSyncReady
    },
    readinessGates: {
      identityAuthenticated,
      sessionTokenReady,
      accountIdPresent,
      accountLinkageSyncReady,
      progressionSyncReady,
      weeklyReportsSyncReady
    }
  };
};

const buildExpectedReadiness = (fixture) => ({
  identityAuthenticated: fixture?.authenticated === true,
  sessionTokenReady: fixture?.sessionTokenReady === true,
  accountIdPresent: isNonEmptyString(fixture?.accountId),
  accountLinkageSyncReady: fixture?.accountLinkageSyncReady === true,
  progressionSyncReady: fixture?.progressionSyncReady === true,
  weeklyReportsSyncReady: fixture?.weeklyReportsSyncReady === true
});

const buildFoundationStageMetadata = (fixture) => {
  const expectedReadiness = buildExpectedReadiness(fixture);
  const plan = fixture?.plan === 'premium' ? 'premium' : 'free';

  if (!expectedReadiness.identityAuthenticated) {
    return {
      stage: 'identity',
      expectedReadiness,
      blockingReason: 'overwolf-identity-missing'
    };
  }

  if (!expectedReadiness.sessionTokenReady) {
    return {
      stage: 'session-token',
      expectedReadiness,
      blockingReason: 'session-token-missing'
    };
  }

  if (!expectedReadiness.accountLinkageSyncReady) {
    return {
      stage: 'account-linkage',
      expectedReadiness,
      blockingReason: 'account-linkage-pending'
    };
  }

  if (plan !== 'premium') {
    return {
      stage: 'premium-capabilities',
      expectedReadiness,
      blockingReason: 'premium-capability-sync-pending'
    };
  }

  if (!expectedReadiness.progressionSyncReady && !expectedReadiness.weeklyReportsSyncReady) {
    return {
      stage: 'premium-capabilities',
      expectedReadiness,
      blockingReason: 'premium-capability-sync-pending'
    };
  }

  if (!expectedReadiness.weeklyReportsSyncReady) {
    return {
      stage: 'weekly-reports',
      expectedReadiness,
      blockingReason: 'weekly-reports-sync-pending'
    };
  }

  if (!expectedReadiness.progressionSyncReady) {
    return {
      stage: 'progression',
      expectedReadiness,
      blockingReason: 'progression-sync-pending'
    };
  }

  return {
    stage: 'complete',
    expectedReadiness,
    blockingReason: null
  };
};

const buildResolvedFoundationFixture = (fixture) => ({
  plan: fixture?.plan === 'premium' ? 'premium' : 'free',
  authenticated: fixture?.identityAuthenticated === true,
  sessionTokenReady: fixture?.sessionTokenReady === true,
  accountId: fixture?.accountId ?? null,
  accountLinkageSyncReady: fixture?.accountLinkageSyncReady === true,
  progressionSyncReady: fixture?.progressionSyncReady === true,
  weeklyReportsSyncReady: fixture?.weeklyReportsSyncReady === true
});

const buildFoundationCoverageMetadata = (type, stageMetadata, fixture) => {
  const plan = fixture?.plan === 'premium' ? 'premium' : 'free';
  const covers = [
    'subscription-foundation',
    'identity-session',
    'account-linkage'
  ];

  if (plan === 'premium') {
    covers.push('premium-entitlements');
  }

  if (fixture?.progressionSyncReady === true) {
    covers.push('progression-sync');
  }

  if (fixture?.weeklyReportsSyncReady === true) {
    covers.push('weekly-reports-sync');
  }

  if (stageMetadata.stage === 'identity' || stageMetadata.stage === 'session-token') {
    covers.push('identity-gating');
  }

  if (stageMetadata.stage === 'account-linkage') {
    covers.push('account-linkage-gating');
  }

  if (stageMetadata.stage === 'premium-capabilities' || stageMetadata.stage === 'weekly-reports' || stageMetadata.stage === 'progression') {
    covers.push('premium-readiness-gating');
  }

  if (stageMetadata.stage === 'complete') {
    covers.push('ready-state-validation');
  }

  const recommendedFor = [];

  if (type === 'fixture') {
    recommendedFor.push('baseline-smoke-tests', 'manual-dry-run');
  }

  if (type === 'sync-matrix') {
    recommendedFor.push('readiness-gate-regression', 'step-by-step-automation');
  }

  if (type === 'orchestration') {
    recommendedFor.push('cross-layer-integration', 'end-to-end-dry-run');
  }

  if (plan === 'premium') {
    recommendedFor.push('premium-path-validation');
  } else {
    recommendedFor.push('free-path-validation');
  }

  return {
    bundleFamily: type,
    covers,
    recommendedFor
  };
};

const buildFoundationVerificationRole = (name) => {
  const verificationRoleByCaseName = {
    'premium-account-linked': 'matrix-premium-fixture',
    'identity-only': 'matrix-session-gate',
    'account-linkage-dry-run': 'matrix-orchestration-readiness-gate'
  };

  return verificationRoleByCaseName[name] ?? null;
};

const buildFoundationRelationshipMetadata = (name) => {
  const dependenciesByCaseName = {
    'identity-only': ['identity-missing'],
    'token-ready': ['identity-only'],
    'linkage-ready': ['token-ready'],
    'progression-ready': ['linkage-ready'],
    'weekly-ready': ['linkage-ready'],
    'full-sync-ready': ['progression-ready', 'weekly-ready'],
    'identity-session-ready-baseline': ['free-baseline'],
    'premium-account-linked-ready': ['premium-account-linked'],
    'premium-partial-sync-ready': ['premium-partial-sync'],
    'premium-alt-account-linked': ['premium-account-linked'],
    'account-linkage-dry-run': ['token-ready'],
    'persistence-readiness-dry-run': ['linkage-ready'],
    'identity-authenticated-token-pending': ['identity-only']
  };

  const supersedesByCaseName = {
    'identity-only': ['identity-missing'],
    'token-ready': ['identity-only'],
    'linkage-ready': ['token-ready'],
    'progression-ready': ['linkage-ready'],
    'weekly-ready': ['linkage-ready'],
    'full-sync-ready': ['progression-ready', 'weekly-ready'],
    'identity-session-ready-baseline': ['free-baseline', 'token-ready'],
    'premium-account-linked-ready': ['premium-account-linked', 'full-sync-ready'],
    'premium-partial-sync-ready': ['premium-partial-sync'],
    'premium-alt-account-linked': ['premium-account-linked-ready'],
    'account-linkage-dry-run': ['linkage-ready'],
    'persistence-readiness-dry-run': ['account-linkage-dry-run'],
    'identity-authenticated-token-pending': ['identity-only']
  };

  const equivalentToByCaseName = {
    'free-baseline': ['identity-missing'],
    'premium-local-ready': [],
    'premium-account-linked': ['premium-account-linked-ready', 'full-sync-ready'],
    'premium-partial-sync': ['premium-partial-sync-ready'],
    'identity-missing': ['free-baseline'],
    'token-ready': ['identity-session-ready-baseline'],
    'identity-session-ready-baseline': ['token-ready'],
    'premium-account-linked-ready': ['premium-account-linked', 'full-sync-ready'],
    'premium-partial-sync-ready': ['premium-partial-sync'],
    'full-sync-ready': ['premium-account-linked', 'premium-account-linked-ready']
  };

  return {
    dependencies: dependenciesByCaseName[name] ?? [],
    supersedes: supersedesByCaseName[name] ?? [],
    equivalentTo: equivalentToByCaseName[name] ?? []
  };
};

const validateFoundationTestCaseCatalog = (testCases) => {
  const caseNames = new Set(testCases.map((testCase) => testCase.name));

  for (const testCase of testCases) {
    for (const dependency of testCase.dependencies ?? []) {
      if (!caseNames.has(dependency)) {
        throw new Error(`Foundation test case "${testCase.name}" references missing dependency "${dependency}"`);
      }
    }

    for (const equivalentName of testCase.equivalentTo ?? []) {
      if (!caseNames.has(equivalentName)) {
        throw new Error(`Foundation test case "${testCase.name}" references missing equivalentTo target "${equivalentName}"`);
      }
    }

    for (const supersededName of testCase.supersedes ?? []) {
      if (!caseNames.has(supersededName)) {
        throw new Error(`Foundation test case "${testCase.name}" references missing supersedes target "${supersededName}"`);
      }
    }
  }

  const visiting = new Set();
  const visited = new Set();
  const testCasesByName = new Map(testCases.map((testCase) => [testCase.name, testCase]));

  const visit = (name, trail = []) => {
    if (visiting.has(name)) {
      throw new Error(`Foundation test case dependency cycle detected: ${[...trail, name].join(' -> ')}`);
    }

    if (visited.has(name)) {
      return;
    }

    visiting.add(name);
    const testCase = testCasesByName.get(name);

    for (const dependency of testCase?.dependencies ?? []) {
      visit(dependency, [...trail, name]);
    }

    visiting.delete(name);
    visited.add(name);
  };

  for (const testCase of testCases) {
    visit(testCase.name, []);
  }

  for (const testCase of testCases) {
    for (const equivalentName of testCase.equivalentTo ?? []) {
      const otherCase = testCasesByName.get(equivalentName);
      if (!otherCase?.equivalentTo?.includes(testCase.name)) {
        throw new Error(`Foundation test case equivalentTo must be symmetric: "${testCase.name}" -> "${equivalentName}"`);
      }
    }
  }

  for (const descriptor of foundationRepresentativeSelectionDescriptors) {
    const matches = testCases.filter((testCase) => testCase.verificationRole === descriptor.verificationRole);

    if (matches.length === 0) {
      throw new Error(
        `Foundation representative selection rule has no matches: verificationRole=${descriptor.verificationRole}`
      );
    }

    if (matches.length > 1) {
      throw new Error(
        `Foundation representative selection rule must match exactly one case: verificationRole=${descriptor.verificationRole}, matches=${matches.map((testCase) => testCase.name).join(', ')}`
      );
    }
  }
};

const buildFoundationAutomationSequence = (testCases) => {
  const supersededCaseNames = new Set();

  for (const testCase of testCases) {
    for (const supersededName of testCase.supersedes ?? []) {
      supersededCaseNames.add(supersededName);
    }
  }

  const getEquivalentSkipReason = (testCase) => {
    const earlierEquivalentName = (testCase.equivalentTo ?? [])
      .filter((name) => typeof name === 'string' && name.localeCompare(testCase.name) < 0)
      .sort((left, right) => left.localeCompare(right))[0] ?? null;

    return earlierEquivalentName ? 'covered-by-equivalent-case' : null;
  };

  const buildSkipReason = (testCase) => {
    if (supersededCaseNames.has(testCase.name)) {
      return 'superseded-by-newer-case';
    }

    return getEquivalentSkipReason(testCase);
  };

  const getPhaseOrder = (testCase) => {
    switch (testCase.type) {
      case 'fixture':
        return 0;
      case 'sync-matrix':
        return 1;
      case 'orchestration':
        return 2;
      default:
        return 99;
    }
  };

  const getStageOrder = (testCase) => foundationStageOrder[testCase.stage] ?? 99;

  const compareTestCases = (left, right) => {
    const phaseDelta = getPhaseOrder(left) - getPhaseOrder(right);
    if (phaseDelta !== 0) {
      return phaseDelta;
    }

    const stageDelta = getStageOrder(left) - getStageOrder(right);
    if (stageDelta !== 0) {
      return stageDelta;
    }

    const leftRepresentative = left.verificationRole ? 0 : 1;
    const rightRepresentative = right.verificationRole ? 0 : 1;
    if (leftRepresentative !== rightRepresentative) {
      return leftRepresentative - rightRepresentative;
    }

    return left.name.localeCompare(right.name);
  };

  const remaining = new Map(testCases.map((testCase) => [testCase.name, testCase]));
  const resolved = new Set();
  const ordered = [];

  while (remaining.size > 0) {
    const nextCase = [...remaining.values()]
      .filter((testCase) => (testCase.dependencies ?? []).every((dependency) => resolved.has(dependency)))
      .sort(compareTestCases)[0] ?? null;

    if (!nextCase) {
      throw new Error('Foundation automation sequence cannot resolve dependencies');
    }

    ordered.push(nextCase);
    resolved.add(nextCase.name);
    remaining.delete(nextCase.name);
  }

  return ordered.map((testCase, index) => {
    const skipReason = buildSkipReason(testCase);

    return {
      order: index + 1,
      testCaseName: testCase.name,
      type: testCase.type,
      phase: foundationAutomationPhaseByType[testCase.type] ?? 'orchestration-integration',
      stage: testCase.stage,
      verificationRole: testCase.verificationRole ?? null,
      selectedByDefault: skipReason === null,
      skipReason,
      dependencies: testCase.dependencies ?? []
    };
  });
};

export const buildFoundationTestCaseCatalog = ({
  foundationScenarioFixtures,
  foundationSyncMatrixFixtures,
  foundationOrchestrationFixtures,
  accountSessionScenarioFixtures
}) => {
  const fixtureTestCases = Object.entries(foundationScenarioFixtures).map(([name, value]) => {
    const resolvedFixture = buildResolvedFoundationFixture(value);
    const stageMetadata = buildFoundationStageMetadata(resolvedFixture);
    const coverageMetadata = buildFoundationCoverageMetadata('fixture', stageMetadata, resolvedFixture);
    const relationshipMetadata = buildFoundationRelationshipMetadata(name);

    return {
      name,
      type: 'fixture',
      apply: {
        endpoint: '/api/subscription/foundation-fixture',
        method: 'POST',
        payload: {
          preset: name
        }
      },
      reset: {
        endpoint: '/api/subscription/foundation-fixture',
        method: 'DELETE'
      },
      label: `Foundation fixture: ${name}`,
      scenario: value.scenario,
      verificationRole: buildFoundationVerificationRole(name),
      bundleFamily: coverageMetadata.bundleFamily,
      covers: coverageMetadata.covers,
      recommendedFor: coverageMetadata.recommendedFor,
      dependencies: relationshipMetadata.dependencies,
      supersedes: relationshipMetadata.supersedes,
      equivalentTo: relationshipMetadata.equivalentTo,
      stage: stageMetadata.stage,
      blockingReason: stageMetadata.blockingReason,
      expectedReadiness: stageMetadata.expectedReadiness,
      testAssertions: buildMatrixAssertions(resolvedFixture),
      recommendedValidationSequence: [
        'POST target test case endpoint',
        'GET /api/subscription/foundation-diagnostics',
        'Compare readiness with expectedReadiness',
        'Compare testAssertions with runtime expectations',
        'DELETE /api/subscription/foundation-fixture to reset baseline'
      ]
    };
  });

  const syncMatrixTestCases = Object.entries(foundationSyncMatrixFixtures).map(([name, value]) => {
    const coverageMetadata = buildFoundationCoverageMetadata('sync-matrix', value, value);
    const relationshipMetadata = buildFoundationRelationshipMetadata(name);

    return {
      name,
      type: 'sync-matrix',
      apply: {
        endpoint: '/api/subscription/foundation-sync-matrix',
        method: 'POST',
        payload: {
          matrix: name
        }
      },
      reset: {
        endpoint: '/api/subscription/foundation-fixture',
        method: 'DELETE'
      },
      label: `Foundation sync matrix: ${name}`,
      scenario: value.scenario,
      verificationRole: buildFoundationVerificationRole(name),
      bundleFamily: coverageMetadata.bundleFamily,
      covers: coverageMetadata.covers,
      recommendedFor: coverageMetadata.recommendedFor,
      dependencies: relationshipMetadata.dependencies,
      supersedes: relationshipMetadata.supersedes,
      equivalentTo: relationshipMetadata.equivalentTo,
      stage: value.stage,
      blockingReason: value.blockingReason,
      expectedReadiness: value.expectedReadiness,
      testAssertions: buildMatrixAssertions(value),
      recommendedValidationSequence: [
        'POST target test case endpoint',
        'GET /api/subscription/foundation-diagnostics',
        'Compare readiness with expectedReadiness',
        'Compare testAssertions with runtime expectations',
        'DELETE /api/subscription/foundation-fixture to reset baseline'
      ]
    };
  });

  const orchestrationTestCases = Object.entries(foundationOrchestrationFixtures).map(([name, value]) => {
    const foundationFixture = foundationScenarioFixtures[value.foundationPreset] ?? null;
    const accountSessionFixture = accountSessionScenarioFixtures[value.accountSessionPreset] ?? null;
    const resolvedFixture = {
      plan: foundationFixture?.plan === 'premium' ? 'premium' : 'free',
      authenticated: accountSessionFixture?.authenticated === true,
      sessionTokenReady: accountSessionFixture?.sessionTokenReady === true,
      accountId: accountSessionFixture?.accountId ?? null,
      accountLinkageSyncReady: value.overrides?.accountLinkageSyncReady ?? foundationFixture?.accountLinkageSyncReady ?? false,
      progressionSyncReady: value.overrides?.progressionSyncReady ?? foundationFixture?.progressionSyncReady ?? false,
      weeklyReportsSyncReady: value.overrides?.weeklyReportsSyncReady ?? foundationFixture?.weeklyReportsSyncReady ?? false
    };
    const stageMetadata = buildFoundationStageMetadata(resolvedFixture);
    const coverageMetadata = buildFoundationCoverageMetadata('orchestration', stageMetadata, resolvedFixture);
    const relationshipMetadata = buildFoundationRelationshipMetadata(name);

    return {
      name,
      type: 'orchestration',
      apply: {
        endpoint: '/api/subscription/foundation-orchestration',
        method: 'POST',
        payload: {
          orchestration: name
        }
      },
      reset: {
        endpoint: '/api/subscription/foundation-fixture',
        method: 'DELETE'
      },
      label: `Foundation orchestration: ${name}`,
      scenario: value.scenario,
      verificationRole: buildFoundationVerificationRole(name),
      bundleFamily: coverageMetadata.bundleFamily,
      covers: coverageMetadata.covers,
      recommendedFor: coverageMetadata.recommendedFor,
      dependencies: relationshipMetadata.dependencies,
      supersedes: relationshipMetadata.supersedes,
      equivalentTo: relationshipMetadata.equivalentTo,
      stage: stageMetadata.stage,
      blockingReason: stageMetadata.blockingReason,
      expectedReadiness: stageMetadata.expectedReadiness,
      testAssertions: buildMatrixAssertions(resolvedFixture),
      recommendedValidationSequence: [
        'POST target test case endpoint',
        'GET /api/subscription/foundation-diagnostics',
        'Compare readiness with expectedReadiness',
        'Compare testAssertions with runtime expectations',
        'DELETE /api/subscription/foundation-fixture to reset baseline'
      ]
    };
  });

  const testCases = [...fixtureTestCases, ...syncMatrixTestCases, ...orchestrationTestCases];
  validateFoundationTestCaseCatalog(testCases);
  const automationSequence = buildFoundationAutomationSequence(testCases);

  return {
    testCases,
    automationSequence,
    notes: [
      'Foundation test cases are the source of truth for local dry-run and automated subscription foundation checks.',
      'Each test case defines how to apply the state, what to validate, and how to reset back to baseline.',
      'The catalog includes fixture, sync-matrix, and orchestration bundles for future automated Overwolf subscription tests.',
      'automationSequence provides a deterministic execution order and default-selection policy for future no-UI automation runs.'
    ]
  };
};
