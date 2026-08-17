import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { DebtsModule } from '../debts/debts.module';
import { ReceiptsModule } from '../receipts/receipts.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [DatabaseModule, DebtsModule, ReceiptsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
