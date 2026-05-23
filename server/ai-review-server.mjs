import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

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
const API_KEY = process.env.AI_PROVIDER_API_KEY || '';
const API_URL = process.env.AI_PROVIDER_URL || 'https://api.deepseek.com/chat/completions';
const MODEL = process.env.AI_PROVIDER_MODEL || 'deepseek-chat';

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

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

const requestProviderReview = async (payload) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: 'Ты выдаешь только безопасный, factual и coaching-oriented post-game review для Sensei GG. Нельзя придумывать детали вне payload.'
        },
        {
          role: 'user',
          content: buildPrompt(payload)
        }
      ]
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

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    sendJson(res, 404, { error: 'Not found' });
    return;
  }

  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    sendJson(res, 200, {
      ok: true,
      providerConfigured: Boolean(API_KEY),
      model: MODEL
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
    let review;

    if (API_KEY) {
      try {
        const providerReview = await requestProviderReview(payload);
        review = guardProviderReview(providerReview, fallbackReview);
      } catch (error) {
        console.warn('Provider response could not be normalized, fallback to local server review:', error);
        review = fallbackReview;
      }
    } else {
      review = fallbackReview;
    }

    sendJson(res, 200, {
      review,
      analysis: reviewToText(review),
      source: API_KEY ? 'provider' : 'local-server-fallback'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    sendJson(res, 500, { error: message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Sensei AI review server listening on http://${HOST}:${PORT}`);
  console.log(`Provider configured: ${API_KEY ? 'yes' : 'no, using local fallback'}`);
});
