import { Injectable } from '@nestjs/common';

import type { ExtractionFields, Language } from '../extraction/extraction.types.js';
import { findEntryByDepartment, loadRegistry } from '../scam/registry.js';
import { loadCorpus, type KbCorpus } from './kb.store.js';
import type { Citation, ExplainResult, ScoredChunk } from './kb.types.js';
import { Retriever } from './retrieval.js';

/** Below this, we say we do not know instead of stretching a weak match into an answer. */
const NO_ANSWER_BELOW = 0.18;
const MAX_CITATIONS = 3;
const MAX_ADVICE = 4;

/** Words that make a field searchable without sending any notice text anywhere. */
const CATEGORY_TERMS: Record<string, string> = {
  financial_utility: 'bill payment utility electricity water tax',
  health_insurance: 'insurance policy renewal health cover',
  community_service: 'government office certificate application',
  scam_fraud: 'fraud scam payment safety',
  other: '',
};

export interface ExplainInput {
  fields: ExtractionFields;
  language: Language;
}

@Injectable()
export class ExplainService {
  private corpus: KbCorpus | null = null;
  private retriever: Retriever | null = null;

  status() {
    const { sources, chunks, directory } = this.load();
    return {
      sources: sources.length,
      chunks: chunks.length,
      verified_sources: sources.filter((source) => source.last_verified !== null && !source.placeholder).length,
      placeholders: sources.filter((source) => source.placeholder).length,
      directory,
      // Hosted pgvector is not wired yet; this is the local equivalent.
      backend: 'local-hybrid',
    };
  }

  explain(input: ExplainInput): ExplainResult {
    const { sources, chunks } = this.load();
    const retriever = this.retrieve();

    const query = buildQuery(input.fields);
    const matches = retriever.search(query, MAX_CITATIONS);
    const strong = matches.filter((match) => match.score >= NO_ANSWER_BELOW);

    const helpline = this.helplineFor(input.fields.department);
    const noAnswer = chunks.length === 0 || strong.length === 0;

    if (noAnswer) {
      return {
        language: input.language,
        no_answer: true,
        advice: [],
        citations: [],
        helpline,
        placeholders_only: true,
        top_score: round(matches[0]?.score ?? 0),
        review_reason: 'no_kb_answer',
      };
    }

    const usedSources = new Map(sources.map((source) => [source.id, source]));
    const citations: Citation[] = strong.map((match) => {
      const source = usedSources.get(match.chunk.source_id);
      return {
        chunk_id: match.chunk.id,
        source_id: match.chunk.source_id,
        source_title: source?.title ?? match.chunk.source_id,
        last_verified: source?.last_verified ?? null,
        verified: Boolean(source?.last_verified) && source?.placeholder === false,
      };
    });

    return {
      language: input.language,
      no_answer: false,
      advice: collectAdvice(strong),
      citations,
      helpline,
      placeholders_only: citations.every((citation) => !citation.verified),
      top_score: round(strong[0]?.score ?? 0),
      review_reason: null,
    };
  }

  private load(): KbCorpus {
    if (!this.corpus) this.corpus = loadCorpus();
    return this.corpus;
  }

  private retrieve(): Retriever {
    if (!this.retriever) this.retriever = new Retriever(this.load().chunks);
    return this.retriever;
  }

  private helplineFor(department: string | null): string | null {
    const entry = findEntryByDepartment(department, loadRegistry());
    return entry?.helpline ?? null;
  }
}

function buildQuery(fields: ExtractionFields): string {
  return [
    fields.department ?? '',
    fields.category ? (CATEGORY_TERMS[fields.category] ?? '') : '',
    fields.notice_type?.replace(/_/g, ' ') ?? '',
    ...fields.required_documents,
  ]
    .join(' ')
    .trim();
}

function collectAdvice(matches: ScoredChunk[]): string[] {
  const seen = new Set<string>();
  for (const match of matches) {
    for (const code of match.chunk.advice) seen.add(code);
    if (seen.size >= MAX_ADVICE) break;
  }
  return [...seen].slice(0, MAX_ADVICE);
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
