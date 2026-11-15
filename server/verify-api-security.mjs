import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  createAllowedOrigins,
  createExpiringCache,
  createSlidingWindowRateLimiter,
  getAllowedCorsOrigin,
  isLoopbackHost
} from './api-server-security.mjs';

const root = process.cwd();
const serverSourcePath = path.resolve(root, 'server/ai-review-server.mjs');
const serverSource = fs.readFileSync(serverSourcePath, 'utf8');

const walkFiles = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const entryPath = path.join(directory, entry.name);
  return entry.isDirectory() ? walkFiles(entryPath) : [entryPath];
});

assert.equal(isLoopbackHost('127.0.0.1'), true);
assert.equal(isLoopbackHost('::1'), true);
assert.equal(isLoopbackHost('localhost'), true);
assert.equal(isLoopbackHost('0.0.0.0'), false);
assert.equal(isLoopbackHost('192.168.1.10'), false);

const allowedOrigins = createAllowedOrigins('http://127.0.0.1:5174, https://sensei.example.test');
assert.equal(getAllowedCorsOrigin('http://127.0.0.1:5173', allowedOrigins), 'http://127.0.0.1:5173');
assert.equal(getAllowedCorsOrigin('https://sensei.example.test', allowedOrigins), 'https://sensei.example.test');
assert.equal(getAllowedCorsOrigin('https://evil.example.test', allowedOrigins), null);
assert.equal(getAllowedCorsOrigin('null', allowedOrigins), null);

let currentTime = 0;
const limiter = createSlidingWindowRateLimiter({ maxRequests: 2, windowMs: 1000, now: () => currentTime });
assert.equal(limiter.consume().allowed, true);
assert.equal(limiter.consume().allowed, true);
assert.deepEqual(limiter.consume(), { allowed: false, retryAfterMs: 1000 });
currentTime = 1000;
assert.equal(limiter.consume().allowed, true);

const cache = createExpiringCache({ ttlMs: 1000, now: () => currentTime });
cache.set('profile', { ok: true });
assert.deepEqual(cache.get('profile'), { ok: true });
currentTime = 2000;
assert.equal(cache.get('profile'), null);

assert.match(serverSource, /if \(!isLoopbackHost\(HOST\)\)/);
assert.match(serverSource, /applyRequestOriginPolicy\(req, res\)/);
assert.match(serverSource, /MAX_JSON_BODY_BYTES/);
assert.match(serverSource, /PayloadTooLargeError/);
assert.match(serverSource, /getRequestBodyErrorStatus\(error, 500\)/);
assert.match(serverSource, /profileSearchRateLimiter\.consume\(\)/);
assert.match(serverSource, /profileSearchCache\.get\(cacheKey\)/);
assert.match(serverSource, /ids\?start=0&count=3/);
assert.match(serverSource, /AbortController/);
assert.doesNotMatch(serverSource, /Access-Control-Allow-Origin['"]?\s*:\s*['"]\*/);
assert.doesNotMatch(serverSource, /requestHost|requestPath|upstreamMessage|riotBody/);

const clientSourceFiles = walkFiles(path.resolve(root, 'src')).filter((filePath) => /\.(?:ts|tsx)$/.test(filePath));
for (const filePath of clientSourceFiles) {
  const source = fs.readFileSync(filePath, 'utf8');
  assert.doesNotMatch(source, /X-Riot-Token/);
  assert.doesNotMatch(source, /RIOT_API_KEY/);
  assert.doesNotMatch(source, /VITE_RIOT(?:_|\b)/);
}

console.log('API security verification passed: loopback-only bind, strict CORS, bounded JSON, profile proxy controls, sanitized diagnostics, and no client Riot secret usage.');
