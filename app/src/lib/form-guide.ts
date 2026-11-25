import type { TKey } from '@/i18n/translations';
import type { ExtractionFieldName } from '@/types/extraction';

/**
 * Field-by-field guidance. The text says how to read and write a detail on a paper form;
 * it never states a fee, deadline or rule, because those come only from a cited KB chunk.
 */
export const FIELD_GUIDES: Record<
  Exclude<ExtractionFieldName, 'required_documents'>,
  { labelKey: TKey; guideKey: TKey }
> = {
  department: { labelKey: 'confirm.department', guideKey: 'guide.department' },
  category: { labelKey: 'confirm.category', guideKey: 'guide.category' },
  notice_type: { labelKey: 'guide.noticeTypeLabel', guideKey: 'guide.notice_type' },
  language: { labelKey: 'guide.languageLabel', guideKey: 'guide.language' },
  amount: { labelKey: 'confirm.amount', guideKey: 'guide.amount' },
  due_date: { labelKey: 'confirm.dueDate', guideKey: 'guide.due_date' },
  reference_number: { labelKey: 'confirm.reference', guideKey: 'guide.reference_number' },
  urls: { labelKey: 'confirm.urls', guideKey: 'guide.urls' },
};
