import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.resolve(root, relativePath), 'utf8');
const walkFiles = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const entryPath = path.join(directory, entry.name);
  return entry.isDirectory() ? walkFiles(entryPath) : [entryPath];
});

const pagesWorkflow = read('.github/workflows/deploy-pages.yml');
const desktopWindow = read('src/screens/desktop/DesktopWindow.tsx');
const profileScreen = read('src/screens/profile/ProfileScreen.tsx');
const publicReviewMode = read('src/services/publicReviewMode.ts');
const aiReviewGateway = read('src/services/aiReviewGateway.ts');
const subscriptionDevTools = read('src/services/subscriptionDevTools.ts');
const lobbyInsights = read('src/services/gameData/lobbyInsights.ts');

assert.match(pagesWorkflow, /VITE_PUBLIC_REVIEW_MODE:\s*['"]true['"]/);
assert.match(publicReviewMode, /VITE_PUBLIC_REVIEW_MODE === 'true'/);
assert.match(publicReviewMode, /typeof overwolf === 'undefined'/);

assert.match(desktopWindow, /const publicReviewMode = isPublicReviewMode\(\);/);
assert.match(desktopWindow, /createReviewModeScenario\(\)/);
assert.match(desktopWindow, /publicScenarioBootstrapped\.current = true;/);
assert.match(desktopWindow, /loadReviewScenario\(reviewScenario\);/);
assert.match(desktopWindow, /data-public-review-banner="true"/);
assert.match(desktopWindow, /PUBLIC REVIEW MODE · SYNTHETIC DATA/);
assert.match(desktopWindow, /<ProfileScreen reviewMode=\{showDevPanel\} publicReviewMode=\{publicReviewMode\} \/>/);

assert.match(profileScreen, /const liveProfileSearchDisabled = publicReviewMode;/);
assert.match(profileScreen, /if \(liveProfileSearchDisabled\) \{\s*return;\s*\}/);
assert.match(profileScreen, /data-public-review-profile-search-disabled="true"/);
assert.match(profileScreen, /Live Riot ID search disabled on the static reviewer page\./);
assert.match(aiReviewGateway, /if \(isPublicReviewMode\(\)\) \{\s*return null;\s*\}/);
assert.match(subscriptionDevTools, /if \(isPublicReviewMode\(\)\) \{\s*return null;\s*\}/);
assert.match(lobbyInsights, /if \(isPublicReviewMode\(\)\) \{\s*return getStaticLobbyChampionInsight\(championName, role\);\s*\}/);

const clientSourceFiles = walkFiles(path.resolve(root, 'src')).filter((filePath) => /\.(?:ts|tsx)$/.test(filePath));
for (const filePath of clientSourceFiles) {
  const source = fs.readFileSync(filePath, 'utf8');
  assert.doesNotMatch(source, /X-Riot-Token/);
  assert.doesNotMatch(source, /RIOT_API_KEY/);
  assert.doesNotMatch(source, /VITE_RIOT(?:_|\b)/);
  assert.doesNotMatch(source, /https?:\/\/(?:[a-z0-9-]+\.)?api\.riotgames\.com/i);
}

console.log('Public review mode verification passed: Pages enables only the labelled synthetic review flow, bootstraps a demo lobby, disables static profile lookup, and ships no client Riot credentials or direct Riot API calls.');
