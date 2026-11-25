import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const NOTICES_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../data/notices',
);

export interface ExpectedNotice {
  file: string;
  is_real: boolean;
  language: string;
  category: string;
  department: string | null;
  notice_type: string | null;
  amount: number | null;
  due_date: string | null;
  reference_number: string | null;
  urls_on_notice: string[];
  expected_scam_label: string;
  expected_scam_reasons?: string[];
  required_documents: string[];
  notes?: string;
}

/** Every *.expected.json under /data/notices, so new notices are picked up automatically. */
export function expectedFiles(directory: string = NOTICES_DIR): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return expectedFiles(full);
    return entry.name.endsWith('.expected.json') ? [full] : [];
  });
}

/** The source file next to an expected file; photos and PDFs are found by stem. */
export function sourceFileFor(expectedPath: string, expected: ExpectedNotice): string | null {
  const directory = path.dirname(expectedPath);
  const name = path.basename(expected.file);
  const direct = path.join(directory, name);
  if (existsSync(direct)) return direct;

  const stem = name.replace(/\.[^.]+$/, '');
  for (const extension of ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'txt']) {
    const candidate = path.join(directory, `${stem}.${extension}`);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}
