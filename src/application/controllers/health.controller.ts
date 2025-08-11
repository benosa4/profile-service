import { Controller, Get } from '@midwayjs/decorator';

@Controller('/api/v1')
export class HealthController {
  @Get('/health')
  async health() {
    return { status: 'ok' };
    }
}
