import type { CompletedMatchSummary, StructuredAiReview } from '../store/gameSlice';
import { fetchAiHistoryFoundationConfig, type AiReviewHistoryFoundationConfigResponse } from './aiHistoryFoundation';

const AI_REVIEW_HISTORY_STORAGE_KEY = 'sensei_ai_review_history';
const MAX_AI_REVIEW_HISTORY_ENTRIES = 30;

export interface AiReviewHistoryEntry {
  id: string;
  createdAt: string;
  reviewMode: boolean;
  match: CompletedMatchSummary;
  review: StructuredAiReview;
}

interface AppendAiReviewHistoryEntryInput {
  match: CompletedMatchSummary;
  review: StructuredAiReview;
  reviewMode: boolean;
}

export const buildAiReviewHistoryEntry = ({ match, review, reviewMode }: AppendAiReviewHistoryEntryInput): AiReviewHistoryEntry => ({
  id: `${match.endedAt}-${review.source}-${match.championName}`,
  createdAt: new Date().toISOString(),
  reviewMode,
  match,
  review
});

const isValidCompletedMatchSummary = (value: unknown): value is CompletedMatchSummary => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as CompletedMatchSummary;
  return typeof candidate.championName === 'string' && typeof candidate.endedAt === 'string';
};

const isValidStructuredAiReview = (value: unknown): value is StructuredAiReview => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as StructuredAiReview;
  return typeof candidate.strength === 'string'
    && typeof candidate.risk === 'string'
    && typeof candidate.nextFocus === 'string'
    && typeof candidate.evidence === 'string'
    && typeof candidate.fullText === 'string';
};

export const getStoredAiReviewHistory = (): AiReviewHistoryEntry[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  const rawValue = window.localStorage.getItem(AI_REVIEW_HISTORY_STORAGE_KEY);
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((entry): entry is AiReviewHistoryEntry => {
      if (!entry || typeof entry !== 'object') {
        return false;
      }

      const candidate = entry as AiReviewHistoryEntry;
      return typeof candidate.id === 'string'
        && typeof candidate.createdAt === 'string'
        && typeof candidate.reviewMode === 'boolean'
        && isValidCompletedMatchSummary(candidate.match)
        && isValidStructuredAiReview(candidate.review);
    });
  } catch {
    return [];
  }
};

export const appendAiReviewHistoryEntry = ({ match, review, reviewMode }: AppendAiReviewHistoryEntryInput) => {
  if (typeof window === 'undefined') {
    return;
  }

  const nextEntry = buildAiReviewHistoryEntry({ match, review, reviewMode });

  const existingEntries = getStoredAiReviewHistory().filter((entry) => entry.id !== nextEntry.id);
  const nextEntries = [nextEntry, ...existingEntries].slice(0, MAX_AI_REVIEW_HISTORY_ENTRIES);
  window.localStorage.setItem(AI_REVIEW_HISTORY_STORAGE_KEY, JSON.stringify(nextEntries));
};

export const fetchAiReviewHistoryFoundationConfig = async (): Promise<AiReviewHistoryFoundationConfigResponse | null> => {
  return fetchAiHistoryFoundationConfig();
};

export const clearAiReviewHistory = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(AI_REVIEW_HISTORY_STORAGE_KEY);
};
