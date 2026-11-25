import { Module } from '@nestjs/common';

import { ExplainController } from './explain.controller.js';
import { ExplainService } from './explain.service.js';
import { ReviewController } from './review.controller.js';

@Module({
  controllers: [ExplainController, ReviewController],
  providers: [ExplainService],
})
export class KbModule {}
