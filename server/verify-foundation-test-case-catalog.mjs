import { buildFoundationTestCaseCatalog } from './foundation-test-case-catalog.mjs';
import {
  accountSessionScenarioFixtures,
  foundationScenarioFixtures,
  foundationOrchestrationFixtures,
  foundationSyncMatrixFixtures
} from './foundation-test-case-fixtures.mjs';

const catalog = buildFoundationTestCaseCatalog({
  foundationScenarioFixtures,
  foundationSyncMatrixFixtures,
  foundationOrchestrationFixtures,
  accountSessionScenarioFixtures
});

console.log(JSON.stringify({
  ok: true,
  testCaseCount: catalog.testCases.length,
  automationSequenceCount: Array.isArray(catalog.automationSequence) ? catalog.automationSequence.length : 0,
  notes: catalog.notes
}, null, 2));
