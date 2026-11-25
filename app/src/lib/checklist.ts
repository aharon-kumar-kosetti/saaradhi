/** A packed-documents list the user can change; nothing here is submitted anywhere. */
export interface ChecklistItem {
  id: string;
  /** The wording from the notice, or what the user typed. Never translated: it is a document name. */
  label: string;
  done: boolean;
}

function itemId(label: string): string {
  return `doc:${label.trim().toLowerCase()}`;
}

/** Starts from the documents the notice asked for; the user adds or removes from there. */
export function defaultChecklist(documents: string[]): ChecklistItem[] {
  const seen = new Set<string>();
  const items: ChecklistItem[] = [];
  for (const document of documents) {
    const label = document.trim();
    if (!label) continue;
    const id = itemId(label);
    if (seen.has(id)) continue;
    seen.add(id);
    items.push({ id, label, done: false });
  }
  return items;
}

export function isChecklistItem(value: unknown): value is ChecklistItem {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<ChecklistItem>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.label === 'string' &&
    typeof candidate.done === 'boolean'
  );
}

export function toggleChecklistItem(items: ChecklistItem[], id: string): ChecklistItem[] {
  return items.map((item) => (item.id === id ? { ...item, done: !item.done } : item));
}

export function addChecklistItem(items: ChecklistItem[], label: string): ChecklistItem[] {
  const trimmed = label.trim();
  if (!trimmed) return items;
  const id = itemId(trimmed);
  if (items.some((item) => item.id === id)) return items;
  return [...items, { id, label: trimmed, done: false }];
}

export function removeChecklistItem(items: ChecklistItem[], id: string): ChecklistItem[] {
  return items.filter((item) => item.id !== id);
}
