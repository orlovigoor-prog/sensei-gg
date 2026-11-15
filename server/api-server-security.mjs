const LOOPBACK_HOSTS = new Set(['127.0.0.1', '::1', 'localhost']);

export const DEFAULT_ALLOWED_ORIGINS = Object.freeze([
  'http://127.0.0.1:4173',
  'http://127.0.0.1:5173',
  'http://[::1]:4173',
  'http://[::1]:5173',
  'http://localhost:4173',
  'http://localhost:5173'
]);

export const MAX_JSON_BODY_BYTES = 64 * 1024;
export const MAX_RIOT_ID_LENGTH = 100;
export const PROFILE_SEARCH_CACHE_MS = 60 * 1000;
export const PROFILE_SEARCH_RATE_LIMIT = Object.freeze({
  maxRequests: 3,
  windowMs: 60 * 1000
});
export const RIOT_REQUEST_TIMEOUT_MS = 8 * 1000;

const normalizeLoopbackHost = (value) => String(value || '').trim().toLowerCase().replace(/^\[|\]$/g, '');

const normalizeHttpOrigin = (value) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null;
  }

  try {
    const parsed = new URL(value.trim());
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== value.trim()) {
      return null;
    }

    return parsed.origin;
  } catch {
    return null;
  }
};

export const isLoopbackHost = (host) => LOOPBACK_HOSTS.has(normalizeLoopbackHost(host));

export const createAllowedOrigins = (additionalOrigins = '') => {
  const configuredOrigins = typeof additionalOrigins === 'string'
    ? additionalOrigins.split(',').map((origin) => normalizeHttpOrigin(origin)).filter(Boolean)
    : [];

  return new Set([...DEFAULT_ALLOWED_ORIGINS, ...configuredOrigins]);
};

export const getAllowedCorsOrigin = (origin, allowedOrigins) => {
  const normalizedOrigin = normalizeHttpOrigin(origin);
  return normalizedOrigin && allowedOrigins.has(normalizedOrigin) ? normalizedOrigin : null;
};

export const isCrossSiteBrowserRequest = (fetchSite) => fetchSite === 'cross-site';

export const createSlidingWindowRateLimiter = ({ maxRequests, windowMs, now = Date.now }) => {
  const timestamps = [];

  return {
    consume() {
      const currentTime = now();
      const oldestAllowedTime = currentTime - windowMs;

      while (timestamps.length > 0 && timestamps[0] <= oldestAllowedTime) {
        timestamps.shift();
      }

      if (timestamps.length >= maxRequests) {
        return {
          allowed: false,
          retryAfterMs: Math.max(0, timestamps[0] + windowMs - currentTime)
        };
      }

      timestamps.push(currentTime);
      return { allowed: true, retryAfterMs: 0 };
    }
  };
};

export const createExpiringCache = ({ ttlMs, maxEntries = 100, now = Date.now }) => {
  const entries = new Map();

  return {
    get(key) {
      const entry = entries.get(key);
      if (!entry || entry.expiresAt <= now()) {
        entries.delete(key);
        return null;
      }

      return entry.value;
    },
    set(key, value) {
      if (entries.size >= maxEntries && !entries.has(key)) {
        entries.delete(entries.keys().next().value);
      }

      entries.set(key, {
        value,
        expiresAt: now() + ttlMs
      });
    }
  };
};
