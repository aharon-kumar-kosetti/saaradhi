import { describe, expect, it } from 'vitest';

import { embed, cosine, tokenize } from './embed.js';
import { loadCorpus } from './kb.store.js';
import { Retriever } from './retrieval.js';

const corpus = loadCorpus();
const retriever = new Retriever(corpus.chunks);

describe('KB corpus', () => {
  it('loads the seeded chunks', () => {
    expect(corpus.directory).not.toBeNull();
    expect(corpus.chunks.length).toBeGreaterThanOrEqual(6);
    expect(corpus.sources.every((source) => typeof source.title === 'string')).toBe(true);
  });
});

describe('embeddings', () => {
  it('tokenises Telugu and Hindi script', () => {
    expect(tokenize('విద్యుత్ బిల్లు')).toEqual(['విద్యుత్', 'బిల్లు']);
    expect(tokenize('बिजली बिल')).toEqual(['बिजली', 'बिल']);
  });

  it('is deterministic and unit length', () => {
    const a = embed('electricity bill payment');
    const b = embed('electricity bill payment');
    expect(Array.from(a)).toEqual(Array.from(b));
    expect(cosine(a, b)).toBeCloseTo(1, 5);
    expect(a.length).toBe(768);
  });

  it('scores related text above unrelated text', () => {
    const query = embed('electricity bill disconnection payment');
    const related = cosine(query, embed('an electricity bill notice asks for payment of arrears'));
    const unrelated = cosine(query, embed('property tax demand and ownership documents'));
    expect(related).toBeGreaterThan(unrelated);
  });
});

describe('Retriever', () => {
  it('returns the electricity chunk first for an electricity query', () => {
    const results = retriever.search('electricity bill disconnection service number');
    expect(results[0]?.chunk.id).toBe('eb-payment-channels');
  });

  it('returns the property tax chunk first for a property tax query', () => {
    const results = retriever.search('property tax demand ownership receipt');
    expect(results[0]?.chunk.source_id).toBe('municipal_property_tax_guide');
  });

  it('returns nothing for an empty query', () => {
    expect(retriever.search('   ')).toEqual([]);
  });
});
