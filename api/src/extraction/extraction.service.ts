import { Injectable } from '@nestjs/common';

import { buildDemoResult, demoNoticeIds } from './demo-notices.js';
import { ExtractionError, type ExtractionResult } from './extraction.types.js';
import { GeminiExtractor } from './gemini.extractor.js';
import { TextNoticeExtractor } from './text.extractor.js';

const MAX_BYTES = 8 * 1024 * 1024;

const SUPPORTED_FILE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
]);

export interface ExtractorStatus {
  /** True only when a Gemini key is present; the app uses this to explain demo mode. */
  configured: boolean;
  model: string | null;
  demoIds: string[];
}

@Injectable()
export class ExtractionService {
  private readonly text = new TextNoticeExtractor();
  private readonly apiKey = (process.env.GEMINI_API_KEY ?? '').trim();
  private readonly model = (process.env.GEMINI_MODEL ?? '').trim() || 'gemini-2.5-flash';

  status(): ExtractorStatus {
    return {
      configured: this.apiKey.length > 0,
      model: this.apiKey ? this.model : null,
      demoIds: demoNoticeIds(),
    };
  }

  async extractFile(input: {
    data: Buffer;
    mimeType: string;
    fileName: string;
  }): Promise<ExtractionResult> {
    if (input.data.byteLength === 0) throw new ExtractionError('unreadable');
    if (input.data.byteLength > MAX_BYTES) throw new ExtractionError('too_large');

    // Plain text is the offline path used by the accuracy harness and tests.
    if (input.mimeType === 'text/plain') {
      return this.text.extract(input.data.toString('utf8'));
    }

    if (!SUPPORTED_FILE_TYPES.has(input.mimeType)) throw new ExtractionError('unsupported_type');
    if (!this.apiKey) throw new ExtractionError('not_configured');

    return new GeminiExtractor(this.apiKey, this.model).extract(input.data, input.mimeType);
  }

  extractDemo(id: string): ExtractionResult {
    const result = buildDemoResult(id);
    if (!result) throw new ExtractionError('unreadable');
    return result;
  }
}
