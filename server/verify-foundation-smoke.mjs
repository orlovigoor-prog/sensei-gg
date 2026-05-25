const BASE_URL = process.env.FOUNDATION_VERIFY_BASE_URL || 'http://127.0.0.1:8787';

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

const main = async () => {
  const testCaseCatalog = await fetchJson('/api/subscription/foundation-test-cases');
  assert(Array.isArray(testCaseCatalog?.testCases), 'foundation-test-cases must return testCases array');
  assert(testCaseCatalog.testCases.length > 0, 'foundation-test-cases must not be empty');

  const matrixCatalog = await fetchJson('/api/subscription/foundation-sync-matrix');
  assert(Array.isArray(matrixCatalog?.fixtures), 'foundation-sync-matrix must return fixtures array');

  const orchestrationApply = await fetchJson('/api/subscription/foundation-orchestration', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      orchestration: 'account-linkage-dry-run'
    })
  });

  assert(orchestrationApply?.ok === true, 'foundation-orchestration apply must succeed');
  assert(orchestrationApply?.scenario === 'account-linkage-dry-run', 'foundation-orchestration scenario mismatch');

  const diagnostics = await fetchJson('/api/subscription/foundation-diagnostics');
  assert(diagnostics?.readiness?.identityAuthenticated === true, 'foundation-diagnostics should report authenticated identity after orchestration apply');
  assert(diagnostics?.readiness?.accountLinkageSyncReady === true, 'foundation-diagnostics should report account linkage readiness after orchestration apply');

  const resetResult = await fetchJson('/api/subscription/foundation-fixture', {
    method: 'DELETE'
  });

  assert(resetResult?.ok === true, 'foundation-fixture reset must succeed');
  assert(resetResult?.scenario === 'env-default', 'foundation reset should restore env-default scenario');

  console.log(JSON.stringify({
    ok: true,
    baseUrl: BASE_URL,
    checked: [
      'foundation-test-cases',
      'foundation-sync-matrix',
      'foundation-orchestration apply',
      'foundation-diagnostics',
      'foundation-fixture reset'
    ]
  }, null, 2));
};

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    baseUrl: BASE_URL,
    error: error instanceof Error ? error.message : String(error)
  }, null, 2));

  process.exitCode = 1;
});
