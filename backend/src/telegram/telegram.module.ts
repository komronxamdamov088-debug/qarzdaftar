import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { TelegramService } from './telegram.service';

@Module({
  imports: [DatabaseModule],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
