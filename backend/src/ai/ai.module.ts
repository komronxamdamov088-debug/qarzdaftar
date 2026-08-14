import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { DebtsModule } from '../debts/debts.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [DatabaseModule, DebtsModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
