import { Controller, Get } from '@nestjs/common'

import { HealthService } from './health.service.js'

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  getHealth() {
    return { status: 'ok' as const }
  }

  @Get('ready')
  getReadiness() {
    return this.health.getReadiness()
  }
}
