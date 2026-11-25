import { Module } from '@nestjs/common';

import { ExtractionController } from './extraction.controller.js';
import { ExtractionService } from './extraction.service.js';

@Module({
  controllers: [ExtractionController],
  providers: [ExtractionService],
})
export class ExtractionModule {}
