import { BadRequestException, Body, Controller, Get, Header, HttpCode, Post } from '@nestjs/common';

import { isLanguage } from '../extraction/extraction.types.js';
import {
  enqueueReview,
  reviewCount,
  REVIEW_REASONS,
  type ReviewInput,
  type ReviewReason,
} from './review.store.js';

@Controller('review')
export class ReviewController {
  @Get('status')
  @Header('cache-control', 'no-store')
  status() {
    return { open: reviewCount() };
  }

  @Post()
  @HttpCode(201)
  @Header('cache-control', 'no-store')
  create(@Body() body: unknown) {
    return enqueueReview(parseBody(body));
  }
}

function parseBody(body: unknown): ReviewInput {
  if (!body || typeof body !== 'object') {
    throw new BadRequestException({ code: 'invalid_body', message: 'Expected a JSON body.' });
  }

  const record = body as Record<string, unknown>;
  if (record.consent !== true) {
    // Consent is a hard requirement: nothing is queued for a human without it.
    throw new BadRequestException({ code: 'consent_required', message: 'consent must be true.' });
  }
  if (typeof record.reason !== 'string' || !(REVIEW_REASONS as readonly string[]).includes(record.reason)) {
    throw new BadRequestException({ code: 'invalid_reason', message: 'Unknown review reason.' });
  }
  if (!isLanguage(record.language)) {
    throw new BadRequestException({ code: 'invalid_body', message: 'language must be te, hi or en.' });
  }

  const short = (value: unknown) => (typeof value === 'string' ? value.slice(0, 80) : null);

  return {
    reason: record.reason as ReviewReason,
    language: record.language,
    department: short(record.department),
    category: short(record.category),
    notice_type: short(record.notice_type),
  };
}
