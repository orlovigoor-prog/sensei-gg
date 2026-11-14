const DEFAULT_RIOT_REALM = 'na';
const RIOT_REALMS_BASE_URL = 'https://ddragon.leagueoflegends.com/realms';

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

export const normalizeGamePatch = (value) => {
  const match = /^(\d+)\.(\d+)$/.exec(String(value || '').trim());

  return match ? `${Number.parseInt(match[1], 10)}.${Number.parseInt(match[2], 10)}` : null;
};

export const getGamePatchFromBuild = (value) => {
  const match = /^(\d+)\.(\d+)(?:\.\d+)?$/.exec(String(value || '').trim());

  return match ? `${Number.parseInt(match[1], 10)}.${Number.parseInt(match[2], 10)}` : null;
};

export const getRiotRealmUrl = (realm = DEFAULT_RIOT_REALM) => {
  const normalizedRealm = String(realm || DEFAULT_RIOT_REALM).trim().toLowerCase();

  if (!/^[a-z0-9]+$/.test(normalizedRealm)) {
    throw new Error(`Invalid Riot Data Dragon realm: ${realm}`);
  }

  return `${RIOT_REALMS_BASE_URL}/${normalizedRealm}.json`;
};

export const createCurrentGamePatch = ({ dataDragonVersion, realm = DEFAULT_RIOT_REALM, observedAt = new Date().toISOString() }) => {
  const gamePatch = getGamePatchFromBuild(dataDragonVersion);
  const realmUrl = getRiotRealmUrl(realm);

  if (!gamePatch || !isNonEmptyString(dataDragonVersion) || !Number.isFinite(Date.parse(observedAt))) {
    throw new Error('Riot Data Dragon realm response did not contain a valid game patch build.');
  }

  return {
    gamePatch,
    dataDragonVersion: dataDragonVersion.trim(),
    patchSource: {
      provider: 'riot-data-dragon-realm',
      realm: String(realm || DEFAULT_RIOT_REALM).trim().toLowerCase(),
      url: realmUrl,
      observedAt
    }
  };
};

export const fetchCurrentGamePatch = async ({ realm = DEFAULT_RIOT_REALM, timeoutMs = 10000, fetchImpl = fetch } = {}) => {
  if (typeof fetchImpl !== 'function') {
    throw new Error('A fetch implementation is required to resolve the current game patch.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(getRiotRealmUrl(realm), {
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Riot Data Dragon realm request failed with HTTP ${response.status}.`);
    }

    const payload = await response.json();
    return createCurrentGamePatch({
      dataDragonVersion: payload?.v,
      realm,
      observedAt: new Date().toISOString()
    });
  } finally {
    clearTimeout(timeout);
  }
};

export const hasCurrentPatchMetadata = (value, currentGamePatch) => {
  const expectedPatch = normalizeGamePatch(currentGamePatch?.gamePatch);
  const sourcePatch = normalizeGamePatch(value?.patch);
  const sourceBuildPatch = getGamePatchFromBuild(value?.patchBuild);
  const source = value?.patchSource;
  const expectedSource = currentGamePatch?.patchSource;

  return Boolean(
    expectedPatch
    && sourcePatch === expectedPatch
    && sourceBuildPatch === expectedPatch
    && source?.provider === 'riot-data-dragon-realm'
    && isNonEmptyString(source?.realm)
    && isNonEmptyString(source?.url)
    && Number.isFinite(Date.parse(source?.observedAt || ''))
    && source.realm === expectedSource?.realm
    && source.url === expectedSource?.url
  );
};

export const isCompleteCurrentPatchSnapshot = (value, currentGamePatch) => (
  hasCurrentPatchMetadata(value, currentGamePatch) && value?.coverage?.completeCoverage === true
);
