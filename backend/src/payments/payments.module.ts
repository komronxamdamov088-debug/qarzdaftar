import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { DebtsModule } from '../debts/debts.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [DatabaseModule, DebtsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
