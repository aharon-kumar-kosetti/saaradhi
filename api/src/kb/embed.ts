/**
 * Local stand-in for a real embedding model. It is deterministic, needs no key and keeps the
 * 768 dimensions of supabase kb_chunks.vector(768), so a hosted embedder can replace it without
 * touching the store or the ranking code.
 */
export const EMBEDDING_DIMENSIONS = 768;

/**
 * \p{M} matters as much as \p{L}: Telugu and Hindi vowel signs are combining marks, and splitting
 * on them would break every native word into single characters.
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{M}\p{N}]+/u)
    .filter((token) => token.length > 1);
}

/** FNV-1a, stable across runs and platforms (unlike any hash seeded at runtime). */
function hash(value: string): number {
  let result = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 0x01000193) >>> 0;
  }
  return result >>> 0;
}

export function embed(text: string): Float32Array {
  const vector = new Float32Array(EMBEDDING_DIMENSIONS);
  const tokens = tokenize(text);
  const features = [...tokens];
  for (let index = 0; index + 1 < tokens.length; index += 1) {
    features.push(`${tokens[index]} ${tokens[index + 1]}`);
  }

  for (const feature of features) {
    const position = hash(feature) % EMBEDDING_DIMENSIONS;
    // Signed hashing keeps unrelated collisions from inflating similarity.
    vector[position] += (hash(`sign:${feature}`) & 1) === 0 ? 1 : -1;
  }

  let norm = 0;
  for (const value of vector) norm += value * value;
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let index = 0; index < vector.length; index += 1) vector[index] /= norm;
  }
  return vector;
}

export function cosine(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  for (let index = 0; index < a.length; index += 1) dot += (a[index] ?? 0) * (b[index] ?? 0);
  return dot;
}
