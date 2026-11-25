import { hostOf } from './domain.js';

const MAX_HOPS = 3;
const TIMEOUT_MS = 3000;

export interface HopResult {
  location: string | null;
}

/** Injectable so tests never touch the network. */
export type HopFetcher = (url: string) => Promise<HopResult>;

export const fetchLocation: HopFetcher = async (url) => {
  const response = await fetch(url, {
    method: 'GET',
    redirect: 'manual',
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { 'user-agent': 'SaaradhiLinkCheck/1.0' },
  });
  return { location: response.headers.get('location') };
};

/**
 * Follows a shortened link only until it leaves a shortener, and never fetches the destination
 * itself: the body at the other end is attacker-controlled and irrelevant to us.
 */
export async function expandShortLink(
  raw: string,
  shortenerCheck: (host: string) => boolean,
  fetcher: HopFetcher = fetchLocation,
): Promise<string | null> {
  let current = raw.trim();
  if (!current) return null;
  if (!/^https?:\/\//i.test(current)) current = `https://${current}`;

  for (let hop = 0; hop < MAX_HOPS; hop += 1) {
    const host = hostOf(current);
    if (!host) return null;
    if (!shortenerCheck(host)) return hop === 0 ? null : current;

    const { location } = await fetcher(current).catch(() => ({ location: null }));
    if (!location) return null;

    try {
      current = new URL(location, current).toString();
    } catch {
      return null;
    }
  }

  return current;
}
