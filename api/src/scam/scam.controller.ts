import { BadRequestException, Body, Controller, Get, Header, HttpCode, Post } from '@nestjs/common';

import type { ExtractionFields } from '../extraction/extraction.types.js';
import { ScamService } from './scam.service.js';

@Controller('scam')
export class ScamController {
  constructor(private readonly scam: ScamService) {}

  @Get('status')
  @Header('cache-control', 'no-store')
  status() {
    return this.scam.status();
  }

  @Post('check')
  @HttpCode(200)
  @Header('cache-control', 'no-store')
  async check(@Body() body: unknown) {
    const input = parseBody(body);
    return this.scam.check(input);
  }
}

function parseBody(body: unknown): { fields: ExtractionFields; warnings: string[] } {
  if (!body || typeof body !== 'object') {
    throw new BadRequestException({ code: 'invalid_body', message: 'Expected { fields }.' });
  }

  const { fields, warnings } = body as { fields?: unknown; warnings?: unknown };
  if (!fields || typeof fields !== 'object') {
    throw new BadRequestException({ code: 'invalid_body', message: 'fields is required.' });
  }

  const record = fields as Record<string, unknown>;
  const urls = Array.isArray(record.urls)
    ? record.urls.filter((url): url is string => typeof url === 'string').slice(0, 10)
    : [];

  return {
    fields: {
      department: typeof record.department === 'string' ? record.department : null,
      category: typeof record.category === 'string' ? (record.category as ExtractionFields['category']) : null,
      notice_type: typeof record.notice_type === 'string' ? record.notice_type : null,
      language: typeof record.language === 'string' ? (record.language as ExtractionFields['language']) : null,
      amount: typeof record.amount === 'number' ? record.amount : null,
      due_date: typeof record.due_date === 'string' ? record.due_date : null,
      reference_number: typeof record.reference_number === 'string' ? record.reference_number : null,
      urls,
      required_documents: [],
    },
    warnings: Array.isArray(warnings)
      ? warnings.filter((code): code is string => typeof code === 'string').slice(0, 10)
      : [],
  };
}
