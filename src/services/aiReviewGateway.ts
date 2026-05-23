import { buildPostGameAnalysisPayload, generateStructuredPostGameAnalysis, type PostGameAnalysisContext } from './postGameAnalysis';
import type { StructuredAiReview } from '../store/gameSlice';

interface AiReviewResponse {
  review?: {
    strength?: string;
    risk?: string;
    nextFocus?: string;
    evidence?: string;
  };
  source?: StructuredAiReview['source'];
  analysis?: string;
  text?: string;
}

const toFullText = (review: Pick<StructuredAiReview, 'strength' | 'risk' | 'nextFocus' | 'evidence'>) => {
  return [review.strength, review.risk, review.nextFocus, review.evidence].filter(Boolean).join('\n');
};

const normalizeStructuredReview = (data: AiReviewResponse): StructuredAiReview | null => {
  const strength = data.review?.strength?.trim();
  const risk = data.review?.risk?.trim();
  const nextFocus = data.review?.nextFocus?.trim();
  const evidence = data.review?.evidence?.trim() || '';

  if (!strength || !risk || !nextFocus) {
    return null;
  }

  return {
    strength,
    risk,
    nextFocus,
    evidence,
    source: data.source === 'provider' || data.source === 'local-server-fallback' ? data.source : 'local-client-fallback',
    fullText: toFullText({ strength, risk, nextFocus, evidence })
  };
};

const getAiReviewEndpoint = () => {
  // @ts-ignore Vite env
  const endpoint = import.meta.env.VITE_AI_REVIEW_ENDPOINT;
  return typeof endpoint === 'string' && endpoint.trim().length > 0 ? endpoint.trim() : null;
};

const fetchWithTimeout = async (input: RequestInfo | URL, init: RequestInit, timeoutMs: number) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeoutId);
  }
};

export const requestPostGameAnalysis = async (context: PostGameAnalysisContext): Promise<StructuredAiReview> => {
  const endpoint = getAiReviewEndpoint();

  if (!endpoint) {
    return generateStructuredPostGameAnalysis(context);
  }

  try {
    const response = await fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mode: 'post-game-review',
        payload: buildPostGameAnalysisPayload(context)
      })
    }, 8000);

    if (!response.ok) {
      throw new Error(`AI review request failed with status ${response.status}`);
    }

    const data = await response.json() as AiReviewResponse;
    const structuredReview = normalizeStructuredReview(data);
    if (structuredReview) {
      return structuredReview;
    }

    const analysis = typeof data.analysis === 'string'
      ? data.analysis.trim()
      : typeof data.text === 'string'
        ? data.text.trim()
        : '';

    if (!analysis) {
      throw new Error('AI review response is empty');
    }

    return {
      ...generateStructuredPostGameAnalysis(context),
      source: data.source === 'provider' || data.source === 'local-server-fallback' ? data.source : 'local-client-fallback',
      fullText: analysis
    };
  } catch (error) {
    console.warn('AI review endpoint unavailable, fallback to local analysis', error);
    return generateStructuredPostGameAnalysis(context);
  }
};
