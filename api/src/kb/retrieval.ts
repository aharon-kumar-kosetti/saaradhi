import { cosine, embed, tokenize } from './embed.js';
import type { KbChunk, ScoredChunk } from './kb.types.js';

/** Hybrid retrieval: lexical overlap for exact words, hashed vectors for paraphrases. */
const LEXICAL_WEIGHT = 0.6;
const VECTOR_WEIGHT = 0.4;

interface Indexed {
  chunk: KbChunk;
  tokens: Set<string>;
  vector: Float32Array;
}

/**
 * Mirrors supabase `match_kb_chunks(query_embedding, query_text, ...)`: a hybrid of full-text and
 * vector similarity. Running it in-process means the app works with no database configured.
 */
export class Retriever {
  private readonly indexed: Indexed[];
  private readonly idf = new Map<string, number>();

  constructor(chunks: KbChunk[]) {
    this.indexed = chunks.map((chunk) => ({
      chunk,
      tokens: new Set(tokenize(`${chunk.content} ${chunk.topics.join(' ')}`)),
      vector: embed(`${chunk.content} ${chunk.topics.join(' ')}`),
    }));

    const total = this.indexed.length || 1;
    for (const entry of this.indexed) {
      for (const token of entry.tokens) {
        this.idf.set(token, (this.idf.get(token) ?? 0) + 1);
      }
    }
    // Rare words carry the signal; "the" in every chunk carries none.
    for (const [token, count] of this.idf) {
      this.idf.set(token, Math.log((total + 1) / (count + 0.5)));
    }
  }

  get size(): number {
    return this.indexed.length;
  }

  search(query: string, limit = 3): ScoredChunk[] {
    const queryTokens = [...new Set(tokenize(query))];
    if (queryTokens.length === 0 || this.indexed.length === 0) return [];

    const queryVector = embed(query);
    const totalIdf = queryTokens.reduce((sum, token) => sum + (this.idf.get(token) ?? 1), 0) || 1;

    const scored = this.indexed.map((entry) => {
      let matched = 0;
      for (const token of queryTokens) {
        if (entry.tokens.has(token)) matched += this.idf.get(token) ?? 1;
      }
      const lexical = matched / totalIdf;
      const vector = Math.max(0, cosine(queryVector, entry.vector));
      return {
        chunk: entry.chunk,
        lexical,
        vector,
        score: LEXICAL_WEIGHT * lexical + VECTOR_WEIGHT * vector,
      };
    });

    return scored.sort((a, b) => b.score - a.score).slice(0, limit);
  }
}
