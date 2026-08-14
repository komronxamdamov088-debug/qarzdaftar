import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Unauthenticated on purpose — this doubles as the health-check endpoint
  // Render (or any PaaS) pings to confirm the service is up.
  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
