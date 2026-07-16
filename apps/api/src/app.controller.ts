import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // TEMPORARY: Sentry wiring smoke test. Hit `GET /v1/debug-sentry` after
  // provisioning a SENTRY_DSN — the thrown error should surface in the
  // Sentry dashboard within a few seconds. Remove this route once verified.
  @Get('debug-sentry')
  debugSentry(): never {
    throw new Error('My first Sentry error!');
  }
}
