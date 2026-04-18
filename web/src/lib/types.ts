export interface WordPair {
  id: number;
  word1: string;
  word2: string;
  phoneme_type: string;
  target_sounds: string | null;
  dialect_filter: string;
  difficulty_level: number;
}

export interface Category {
  phoneme_type: string;
  count: number;
}

export type Mode = 'LEARN' | 'PRACTICE';
