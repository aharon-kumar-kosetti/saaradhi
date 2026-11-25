import type { Language } from '../extraction/extraction.types.js';

export interface KbSource {
  id: string;
  department: string;
  title: string;
  url: string | null;
  language: Language;
  /** Null means a human has not checked this source. Never invented by code. */
  last_verified: string | null;
  /** Seed content written to exercise the pipeline, not official guidance. */
  placeholder: boolean;
}

export interface KbChunk {
  id: string;
  source_id: string;
  /** English text used for retrieval only; the app never shows it. */
  content: string;
  topics: string[];
  /** Advice codes the app translates, so answers carry no free-form claims. */
  advice: string[];
}

export interface Citation {
  chunk_id: string;
  source_id: string;
  source_title: string;
  last_verified: string | null;
  verified: boolean;
}

export interface ExplainResult {
  language: Language;
  no_answer: boolean;
  advice: string[];
  citations: Citation[];
  /** Registry number when a human recorded one; null means we have none to show. */
  helpline: string | null;
  placeholders_only: boolean;
  top_score: number;
  /** Reason code for the review queue, when the user chooses to ask a reviewer. */
  review_reason: 'no_kb_answer' | null;
}

export interface ScoredChunk {
  chunk: KbChunk;
  lexical: number;
  vector: number;
  score: number;
}
