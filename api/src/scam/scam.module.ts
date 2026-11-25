import { Module } from '@nestjs/common';

import { ScamController } from './scam.controller.js';
import { ScamService } from './scam.service.js';

@Module({
  controllers: [ScamController],
  providers: [ScamService],
})
export class ScamModule {}
