/**
 * Indian notices write dates day-first, so 03/04/2026 is 3 April, never 4 March.
 * Returns an ISO yyyy-mm-dd date, or null when the text is not a real date.
 */
export function parseDateInput(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;

  let year: number;
  let month: number;
  let day: number;

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text);
  if (iso) {
    year = Number(iso[1]);
    month = Number(iso[2]);
    day = Number(iso[3]);
  } else {
    const indian = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/.exec(text);
    if (!indian) return null;
    day = Number(indian[1]);
    month = Number(indian[2]);
    year = Number(indian[3]);
  }

  if (year < 1900 || year > 2200) return null;

  // Round-trip check rejects 31 February instead of silently shifting into March.
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }

  const pad = (value: number) => String(value).padStart(2, '0');
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function toDateInput(isoDate: string | null): string {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.slice(0, 10).split('-');
  if (!year || !month || !day) return '';
  return `${day}/${month}/${year}`;
}
