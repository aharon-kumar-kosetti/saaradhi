import {
  BadGatewayException,
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  NotFoundException,
  Param,
  PayloadTooLargeException,
  Post,
  ServiceUnavailableException,
  UnsupportedMediaTypeException,
  UnprocessableEntityException,
} from '@nestjs/common';

import { ExtractionService } from './extraction.service.js';
import { ExtractionError, type ExtractionErrorCode } from './extraction.types.js';

const MAX_BASE64_LENGTH = Math.ceil((8 * 1024 * 1024 * 4) / 3) + 64;

@Controller('extract')
export class ExtractionController {
  constructor(private readonly extraction: ExtractionService) {}

  @Get('status')
  @Header('cache-control', 'no-store')
  status() {
    return this.extraction.status();
  }

  @Get('demo')
  @Header('cache-control', 'no-store')
  demoList() {
    const { demoIds } = this.extraction.status();
    return {
      items: demoIds.map((id) => ({ id, result: this.extraction.extractDemo(id) })),
    };
  }

  @Post('demo/:id')
  @HttpCode(200)
  @Header('cache-control', 'no-store')
  demo(@Param('id') id: string) {
    if (!this.extraction.status().demoIds.includes(id)) {
      throw new NotFoundException({ code: 'unknown_demo', message: 'No such sample notice.' });
    }
    return this.extraction.extractDemo(id);
  }

  @Post()
  @HttpCode(200)
  @Header('cache-control', 'no-store')
  async extract(@Body() body: unknown) {
    const input = parseBody(body);
    try {
      const result = await this.extraction.extractFile(input);
      return result;
    } catch (error) {
      throw toHttpError(error);
    }
  }
}

function parseBody(body: unknown): { data: Buffer; mimeType: string; fileName: string } {
  if (!body || typeof body !== 'object') {
    throw new BadRequestException({ code: 'invalid_body', message: 'Expected a JSON body.' });
  }

  const { fileName, mimeType, dataBase64 } = body as Record<string, unknown>;
  if (typeof dataBase64 !== 'string' || dataBase64.length === 0) {
    throw new BadRequestException({ code: 'invalid_body', message: 'dataBase64 is required.' });
  }
  if (dataBase64.length > MAX_BASE64_LENGTH) {
    throw new PayloadTooLargeException({ code: 'too_large', message: 'File is larger than 8 MB.' });
  }
  if (typeof mimeType !== 'string' || !mimeType.trim()) {
    throw new BadRequestException({ code: 'invalid_body', message: 'mimeType is required.' });
  }

  const cleaned = dataBase64.replace(/^data:[^;]+;base64,/, '');
  const data = Buffer.from(cleaned, 'base64');
  if (data.byteLength === 0) {
    throw new BadRequestException({ code: 'invalid_body', message: 'dataBase64 is not valid base64.' });
  }

  return {
    data,
    mimeType: mimeType.trim().toLowerCase(),
    fileName: typeof fileName === 'string' ? fileName.slice(0, 200) : 'notice',
  };
}

function toHttpError(error: unknown): Error {
  if (!(error instanceof ExtractionError)) {
    return new BadGatewayException({ code: 'upstream_unavailable', message: 'Reading failed.' });
  }

  const message = MESSAGES[error.code];
  switch (error.code) {
    case 'not_configured':
      return new ServiceUnavailableException({ code: error.code, message });
    case 'too_large':
      return new PayloadTooLargeException({ code: error.code, message });
    case 'unsupported_type':
      return new UnsupportedMediaTypeException({ code: error.code, message });
    case 'unreadable':
    case 'invalid_response':
      return new UnprocessableEntityException({ code: error.code, message });
    case 'upstream_unavailable':
      return new BadGatewayException({ code: error.code, message });
  }
}

const MESSAGES: Record<ExtractionErrorCode, string> = {
  not_configured: 'Photo reading is not switched on yet.',
  unreadable: 'Nothing readable was found in this file.',
  too_large: 'File is larger than 8 MB.',
  unsupported_type: 'Use a photo or a PDF.',
  upstream_unavailable: 'The reader is busy. Try again.',
  invalid_response: 'The reader returned something unusable.',
};
