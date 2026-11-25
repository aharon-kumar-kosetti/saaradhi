import { Module } from '@nestjs/common';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ExtractionModule } from './extraction/extraction.module.js';
import { HealthController } from './health/health.controller.js';
import { KbModule } from './kb/kb.module.js';
import { ScamModule } from './scam/scam.module.js';

@Module({
  imports: [ExtractionModule, ScamModule, KbModule],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
