const BASE_URL = process.env.FOUNDATION_VERIFY_BASE_URL || 'http://127.0.0.1:8787';
import { foundationRepresentativeSelectionDescriptors } from './foundation-test-case-catalog.mjs';

const fetchJson = async (path, init = {}) => {
  const response = await fetch(`${BASE_URL}${path}`, init);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage = data?.error || `Request failed: ${response.status} ${response.statusText}`;
    throw new Error(`${path}: ${errorMessage}`);
  }

  return data;
};

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const compareReadiness = (testCaseName, expectedReadiness, diagnosticsReadiness) => {
  const readinessMapping = {
    identityAuthenticated: diagnosticsReadiness?.identityAuthenticated,
    sessionTokenReady: diagnosticsReadiness?.sessionTokenReady,
    accountIdPresent: diagnosticsReadiness?.accountIdPresent,
    accountLinkageSyncReady: diagnosticsReadiness?.accountLinkageSyncReady,
    progressionSyncReady: diagnosticsReadiness?.progressionSyncReady,
    weeklyReportsSyncReady: diagnosticsReadiness?.weeklyReportsSyncReady
  };

  for (const [key, expectedValue] of Object.entries(expectedReadiness ?? {})) {
    if (readinessMapping[key] !== expectedValue) {
      throw new Error(`${testCaseName}: readiness mismatch for ${key}. expected=${expectedValue} actual=${readinessMapping[key]}`);
    }
  }
};

const applyTestCase = async (testCase) => {
  const endpoint = testCase?.apply?.endpoint;
  const method = testCase?.apply?.method || 'POST';
  const payload = testCase?.apply?.payload || {};

  assert(endpoint, `${testCase?.name}: missing apply endpoint`);

  return fetchJson(endpoint, {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
};

const resetFoundation = async () => {
  return fetchJson('/api/subscription/foundation-fixture', {
    method: 'DELETE'
  });
};

const pickRepresentativeCase = (testCases, descriptor) => {
  const testCase = testCases.find((entry) => entry?.verificationRole === descriptor.verificationRole);

  assert(
    testCase,
    `Missing representative test case for verificationRole=${descriptor.verificationRole}`
  );

  return testCase;
};

const main = async () => {
  const catalog = await fetchJson('/api/subscription/foundation-test-cases');
  const testCases = Array.isArray(catalog?.testCases) ? catalog.testCases : [];
  assert(testCases.length > 0, 'foundation-test-cases catalog is empty');

  const selectedCases = foundationRepresentativeSelectionDescriptors.map((descriptor) => pickRepresentativeCase(testCases, descriptor));

  const checked = [];

  for (const testCase of selectedCases) {
    const applyResult = await applyTestCase(testCase);
    assert(applyResult?.ok === true, `${testCase.name}: apply failed`);

    const diagnostics = await fetchJson('/api/subscription/foundation-diagnostics');
    compareReadiness(testCase.name, testCase.expectedReadiness, diagnostics?.readiness);

    checked.push({
      name: testCase.name,
      type: testCase.type,
      stage: testCase.stage
    });
  }

  const resetResult = await resetFoundation();
  assert(resetResult?.ok === true, 'foundation reset failed after matrix verification');
  assert(resetResult?.scenario === 'env-default', 'foundation reset should restore env-default after matrix verification');

  console.log(JSON.stringify({
    ok: true,
    baseUrl: BASE_URL,
    checked,
    resetScenario: resetResult.scenario
  }, null, 2));
};

main().catch(async (error) => {
  try {
    await resetFoundation();
  } catch {
    // best effort reset
  }

  console.error(JSON.stringify({
    ok: false,
    baseUrl: BASE_URL,
    error: error instanceof Error ? error.message : String(error)
  }, null, 2));

  process.exitCode = 1;
});
