export interface WordPair {
  id: number;
  word1: string;
  word2: string;
  phoneme_type: string;
  target_sounds: string | null;
  dialect_filter: ContentDialect;
  difficulty_level: number;
}

export interface Category {
  phoneme_type: string;
  count: number;
}

export type Mode = 'LEARN' | 'PRACTICE' | 'CATEGORIES' | 'PROFILE';

export type ContentDialect = 'all' | 'uk_only' | 'us_only' | 'au_only';

export type TargetDialect = Exclude<ContentDialect, 'all'>;

export type Dialect = TargetDialect;

export type AudioDialect = 'en-US' | 'en-GB' | 'en-AU';

export type AudioVoice = 'default';

export type TargetWord = 1 | 2;

export interface PairProgress {
  pairId: number;
  category: string;
  dialect: Dialect;
  word1Attempts: number;
  word1Correct: number;
  word2Attempts: number;
  word2Correct: number;
  pairCompletions: number;
  exposureCount: number;
  recentIncorrectCount: number;
  successStreak: number;
  lastSeenAt: string;
  lastCorrectAt: string | null;
}

export interface ProgressStore {
  totalAttempts: number;
  totalCorrect: number;
  currentStreak: number;
  bestStreak: number;
  sessionsCount: number;
  completedPairIds: number[];
  lastPracticedAt: string | null;
  pairs: Record<string, PairProgress>;
}

export interface ProgressAttemptEvent {
  pairId: number;
  category: string;
  dialect: Dialect;
  targetWord: TargetWord;
  isCorrect: boolean;
  timestamp: string;
}

export interface CategoryProgressSummary {
  totalPairs: number;
  completedPairs: number;
  attemptedPairs: number;
  totalAttempts: number;
  totalCorrect: number;
  accuracy: number;
}

export interface WeakPairSummary {
  pair: WordPair;
  attempts: number;
  accuracy: number;
  weaknessScore: number;
}

export interface WeakCategorySummary {
  category: string;
  attempts: number;
  accuracy: number;
}

export interface ProfileSummary {
  totalAttempts: number;
  totalCorrect: number;
  accuracy: number;
  completedPairs: number;
  currentStreak: number;
  bestStreak: number;
  sessionsCount: number;
  weakPairs: WeakPairSummary[];
  weakCategories: WeakCategorySummary[];
  lastPracticedAt: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}
