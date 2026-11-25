import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export interface RegistryEntry {
  department: string;
  state: string;
  domains: string[];
  payment_gateways: string[];
  /** Kept as source text; only used when it compiles and is not a placeholder. */
  ref_regex: string | null;
  helpline: string | null;
  portal_url: string | null;
  verified: boolean;
  last_verified: string | null;
}

const PLACEHOLDER = /^todo\b/i;

/** "TODO: confirm official domain" must never be read as a domain or a regex. */
function usable(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!text || PLACEHOLDER.test(text)) return null;
  return text;
}

/** The API runs from /api, tests from /api too; walk up to find the shared /data folder. */
export function findRegistryPath(start = process.cwd()): string | null {
  let directory = path.resolve(start);
  for (let depth = 0; depth < 5; depth += 1) {
    const candidate = path.join(directory, 'data', 'trusted_registry.json');
    if (existsSync(candidate)) return candidate;
    const parent = path.dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }
  return null;
}

/**
 * Reads the registry as-is. A missing or broken file yields an empty registry: the checker then
 * has no positive evidence at all, which must surface as `unsure`, not as an error or as `safe`.
 */
export function loadRegistry(filePath: string | null = findRegistryPath()): RegistryEntry[] {
  if (!filePath) return [];

  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return [];
  }
  const departments = (raw as { departments?: unknown } | null)?.departments;
  if (!Array.isArray(departments)) return [];

  return departments.flatMap((entry): RegistryEntry[] => {
    if (!entry || typeof entry !== 'object') return [];
    const record = entry as Record<string, unknown>;
    const department = usable(record.department);
    if (!department) return [];

    const domains = (Array.isArray(record.domains) ? record.domains : [])
      .map((value) => usable(value))
      .filter((value): value is string => value !== null && !value.includes('://'))
      .map((value) => value.toLowerCase());

    return [
      {
        department,
        state: usable(record.state) ?? '',
        domains,
        payment_gateways: (Array.isArray(record.payment_gateways) ? record.payment_gateways : [])
          .map((value) => usable(value))
          .filter((value): value is string => Boolean(value)),
        ref_regex: usable(record.ref_regex),
        helpline: usable(record.helpline),
        portal_url: usable(record.portal_url),
        // Anything other than an explicit true is false: the registry template ships verified=false.
        verified: record.verified === true,
        last_verified: usable(record.last_verified),
      },
    ];
  });
}

/** Matches on the printed department name, case- and spacing-insensitively. */
export function findEntryByDepartment(
  department: string | null,
  registry: RegistryEntry[],
): RegistryEntry | null {
  if (!department) return null;
  const wanted = normalizeName(department);
  return (
    registry.find((entry) => normalizeName(entry.department) === wanted) ??
    registry.find((entry) => normalizeName(entry.department).includes(wanted)) ??
    null
  );
}

export function normalizeName(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}
