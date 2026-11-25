import { BadRequestException, Body, Controller, Get, Header, HttpCode, Post } from '@nestjs/common';

import { isLanguage, type ExtractionFields, type Language } from '../extraction/extraction.types.js';
import { ExplainService } from './explain.service.js';

@Controller('explain')
export class ExplainController {
  constructor(private readonly explainer: ExplainService) {}

  @Get('status')
  @Header('cache-control', 'no-store')
  status() {
    return this.explainer.status();
  }

  @Post()
  @HttpCode(200)
  @Header('cache-control', 'no-store')
  explain(@Body() body: unknown) {
    return this.explainer.explain(parseBody(body));
  }
}

function parseBody(body: unknown): { fields: ExtractionFields; language: Language } {
  if (!body || typeof body !== 'object') {
    throw new BadRequestException({ code: 'invalid_body', message: 'Expected { fields, language }.' });
  }

  const { fields, language } = body as { fields?: unknown; language?: unknown };
  if (!fields || typeof fields !== 'object') {
    throw new BadRequestException({ code: 'invalid_body', message: 'fields is required.' });
  }
  if (!isLanguage(language)) {
    throw new BadRequestException({ code: 'invalid_body', message: 'language must be te, hi or en.' });
  }

  const record = fields as Record<string, unknown>;
  const list = (value: unknown) =>
    Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string').slice(0, 12) : [];

  return {
    language,
    fields: {
      department: typeof record.department === 'string' ? record.department : null,
      category: typeof record.category === 'string' ? (record.category as ExtractionFields['category']) : null,
      notice_type: typeof record.notice_type === 'string' ? record.notice_type : null,
      language: isLanguage(record.language) ? record.language : null,
      amount: typeof record.amount === 'number' ? record.amount : null,
      due_date: typeof record.due_date === 'string' ? record.due_date : null,
      reference_number: typeof record.reference_number === 'string' ? record.reference_number : null,
      urls: list(record.urls),
      required_documents: list(record.required_documents),
    },
  };
}
