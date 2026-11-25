import { Controller, Get } from '@nestjs/common';

// Used by Render / uptime checks. Must stay dependency-free: no DB or AI calls here.
@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return { status: 'ok', service: 'saaradhi-api', version: '0.1.0' };
  }
}
